import React, { useCallback, useEffect, useReducer } from 'react';
import 'normalize.css';
import makeDebug from 'debug';

import {
  OptionalElectionDefinition,
  Provider,
  PrecinctId,
  ElectionDefinition,
} from '@votingworks/types';
import {
  useCancelablePromise,
  useUsbDrive,
  SetupCardReaderPage,
  useDevices,
  RebootFromUsbButton,
  RebootToBiosButton,
  Button,
  UnlockMachineScreen,
  useInsertedSmartcardAuth,
  isSuperadminAuth,
  isAdminAuth,
  isPollworkerAuth,
  useLock,
} from '@votingworks/ui';
import {
  throwIllegalValue,
  Card,
  Hardware,
  Storage,
  usbstick,
  Printer,
  assert,
} from '@votingworks/utils';
import { Logger } from '@votingworks/logging';

import { UnconfiguredElectionScreen } from './screens/unconfigured_election_screen';
import { LoadingConfigurationScreen } from './screens/loading_configuration_screen';
import { MachineConfig } from './config/types';

import * as config from './api/config';
import * as scanner from './api/scan';

import { usePrecinctScannerStatus } from './hooks/use_precinct_scanner_status';
import { AdminScreen } from './screens/admin_screen';
import { InvalidCardScreen } from './screens/invalid_card_screen';
import { PollsClosedScreen } from './screens/polls_closed_screen';
import { PollWorkerScreen } from './screens/poll_worker_screen';
import { InsertBallotScreen } from './screens/insert_ballot_screen';
import { ScanErrorScreen } from './screens/scan_error_screen';
import { ScanSuccessScreen } from './screens/scan_success_screen';
import { ScanWarningScreen } from './screens/scan_warning_screen';
import { ScanProcessingScreen } from './screens/scan_processing_screen';
import { AppContext } from './contexts/app_context';
import { SetupPowerPage } from './screens/setup_power_page';
import { CardErrorScreen } from './screens/card_error_screen';
import { SetupScannerScreen } from './screens/setup_scanner_screen';
import { ScreenMainCenterChild, CenteredLargeProse } from './components/layout';
import { InsertUsbScreen } from './screens/insert_usb_screen';
import { ScanReturnedBallotScreen } from './screens/scan_returned_ballot_screen';
import { ScanJamScreen } from './screens/scan_jam_screen';
import { ScanBusyScreen } from './screens/scan_busy_screen';

const debug = makeDebug('precinct-scanner:app-root');

export interface AppStorage {
  state?: Partial<State>;
}

export const stateStorageKey = 'state';

export interface Props {
  hardware: Hardware;
  card: Card;
  storage: Storage;
  printer: Printer;
  machineConfig: Provider<MachineConfig>;
  logger: Logger;
}

interface HardwareState {
  machineConfig: Readonly<MachineConfig>;
}

interface ScannerConfigState {
  isScannerConfigLoaded: boolean;
  electionDefinition?: ElectionDefinition;
  currentPrecinctId?: PrecinctId;
  isTestMode: boolean;
}

interface FrontendState {
  isPollsOpen: boolean;
  initializedFromStorage: boolean;
}

export interface State
  extends HardwareState,
    ScannerConfigState,
    FrontendState {}

const initialHardwareState: Readonly<HardwareState> = {
  machineConfig: {
    machineId: '0000',
    codeVersion: 'dev',
  },
};

const initialScannerConfigState: Readonly<ScannerConfigState> = {
  isScannerConfigLoaded: false,
  electionDefinition: undefined,
  isTestMode: false,
  currentPrecinctId: undefined,
};

const initialAppState: Readonly<FrontendState> = {
  isPollsOpen: false,
  initializedFromStorage: false,
};

const initialState: Readonly<State> = {
  ...initialHardwareState,
  ...initialScannerConfigState,
  ...initialAppState,
};

// Sets State.
type AppAction =
  | { type: 'initializeAppState'; isPollsOpen: boolean }
  | { type: 'resetPollsToClosed' }
  | {
      type: 'updateElectionDefinition';
      electionDefinition: OptionalElectionDefinition;
    }
  | {
      type: 'refreshConfigFromScanner';
      electionDefinition?: ElectionDefinition;
      isTestMode: boolean;
      currentPrecinctId?: PrecinctId;
    }
  | { type: 'updatePrecinctId'; precinctId?: PrecinctId }
  | { type: 'togglePollsOpen' }
  | { type: 'setMachineConfig'; machineConfig: MachineConfig };

function appReducer(state: State, action: AppAction): State {
  debug(
    '%cReducer "%s"',
    'color: green',
    action.type,
    { ...action, electionDefinition: undefined },
    {
      ...state,
      electionDefinition: undefined,
    }
  );
  switch (action.type) {
    case 'initializeAppState':
      return {
        ...state,
        isPollsOpen: action.isPollsOpen,
        initializedFromStorage: true,
      };
    case 'updateElectionDefinition':
      return {
        ...state,
        electionDefinition: action.electionDefinition,
        isPollsOpen: false,
      };
    case 'resetPollsToClosed':
      return {
        ...state,
        isPollsOpen: false,
      };
    case 'refreshConfigFromScanner': {
      return {
        ...state,
        electionDefinition: action.electionDefinition,
        currentPrecinctId: action.currentPrecinctId,
        isTestMode: action.isTestMode,
        isScannerConfigLoaded: true,
      };
    }
    case 'updatePrecinctId':
      return {
        ...state,
        currentPrecinctId: action.precinctId,
        isPollsOpen: false,
      };
    case 'togglePollsOpen':
      return {
        ...state,
        isPollsOpen: !state.isPollsOpen,
      };
    case 'setMachineConfig':
      return {
        ...state,
        machineConfig:
          action.machineConfig ?? initialHardwareState.machineConfig,
      };
    default:
      throwIllegalValue(action);
  }
}

export function AppRoot({
  hardware,
  card,
  printer,
  storage,
  machineConfig: machineConfigProvider,
  logger,
}: Props): JSX.Element | null {
  const [appState, dispatchAppState] = useReducer(appReducer, initialState);
  const {
    electionDefinition,
    isScannerConfigLoaded,
    isTestMode,
    currentPrecinctId,
    isPollsOpen,
    initializedFromStorage,
    machineConfig,
  } = appState;

  const usbDrive = useUsbDrive({ logger });
  const usbDriveDisplayStatus =
    usbDrive.status ?? usbstick.UsbDriveStatus.absent;

  const {
    cardReader,
    computer,
    printer: printerInfo,
    precinctScanner,
  } = useDevices({
    hardware,
    logger,
  });
  const auth = useInsertedSmartcardAuth({
    allowedUserRoles: ['superadmin', 'admin', 'pollworker'],
    cardApi: card,
    scope: { electionDefinition },
    logger,
  });

  const makeCancelable = useCancelablePromise();

  const refreshConfig = useCallback(async () => {
    const newElectionDefinition = await makeCancelable(
      config.getElectionDefinition()
    );
    const newIsTestMode = await makeCancelable(config.getTestMode());
    const newCurrentPrecinctId = await makeCancelable(
      config.getCurrentPrecinctId()
    );
    dispatchAppState({
      type: 'refreshConfigFromScanner',
      electionDefinition: newElectionDefinition,
      isTestMode: newIsTestMode,
      currentPrecinctId: newCurrentPrecinctId,
    });
  }, [makeCancelable]);

  // Handle Machine Config
  useEffect(() => {
    async function setMachineConfig() {
      try {
        const newMachineConfig = await machineConfigProvider.get();
        dispatchAppState({
          type: 'setMachineConfig',
          machineConfig: newMachineConfig,
        });
      } catch {
        // Do nothing if machineConfig fails. Default values will be used.
      }
    }
    void setMachineConfig();
  }, [machineConfigProvider]);

  // Initialize app state
  useEffect(() => {
    async function initializeScanner() {
      try {
        await refreshConfig();
      } catch (e) {
        debug('failed to initialize:', e);
        window.setTimeout(initializeScanner, 1000);
      }
    }

    async function updateStateFromStorage() {
      const storedAppState: Partial<State> =
        ((await storage.get(stateStorageKey)) as Partial<State> | undefined) ||
        {};
      const { isPollsOpen: storedIsPollsOpen = initialAppState.isPollsOpen } =
        storedAppState;
      dispatchAppState({
        type: 'initializeAppState',
        isPollsOpen: storedIsPollsOpen,
      });
    }

    void initializeScanner();
    void updateStateFromStorage();
  }, [refreshConfig, storage]);

  useEffect(() => {
    async function storeAppState() {
      // only store app state if we've first initialized from the stored state
      if (initializedFromStorage) {
        await storage.set(stateStorageKey, {
          isPollsOpen,
        });
      }
    }

    void storeAppState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPollsOpen, initializedFromStorage]);

  const togglePollsOpen = useCallback(() => {
    dispatchAppState({ type: 'togglePollsOpen' });
  }, []);

  const toggleTestMode = useCallback(async () => {
    await config.setTestMode(!isTestMode);
    dispatchAppState({ type: 'resetPollsToClosed' });
    await refreshConfig();
  }, [refreshConfig, isTestMode]);

  const unconfigureServer = useCallback(async () => {
    try {
      await config.setElection(undefined);
      dispatchAppState({ type: 'resetPollsToClosed' });
      await refreshConfig();
    } catch (error) {
      debug('failed unconfigureServer()', error);
    }
  }, [refreshConfig]);

  async function updatePrecinctId(precinctId: PrecinctId) {
    dispatchAppState({ type: 'updatePrecinctId', precinctId });
    await config.setCurrentPrecinctId(precinctId);
  }

  const scannerStatus = usePrecinctScannerStatus();

  // The scan service waits to receive a command to scan or accept a ballot. The
  // frontend controls when this happens so that ensure we're only scanning when
  // we're in voter mode.
  const voterMode = auth.status === 'logged_out' && auth.reason === 'no_card';
  const scannerCommandLock = useLock();
  useEffect(() => {
    async function automaticallyScanAndAcceptBallots() {
      if (!(voterMode && isPollsOpen)) return;
      if (!scannerCommandLock.lock()) return;
      try {
        if (scannerStatus?.state === 'ready_to_scan') {
          await scanner.scanBallot();
        } else if (scannerStatus?.state === 'ready_to_accept') {
          await scanner.acceptBallot();
        }
      } finally {
        scannerCommandLock.unlock();
      }
    }
    void automaticallyScanAndAcceptBallots();
  });

  if (!cardReader) {
    return <SetupCardReaderPage />;
  }

  if (auth.status === 'logged_out' && auth.reason === 'card_error') {
    return <CardErrorScreen />;
  }

  if (computer.batteryIsLow && !computer.batteryIsCharging) {
    return <SetupPowerPage />;
  }

  if (isSuperadminAuth(auth)) {
    return (
      <ScreenMainCenterChild infoBar>
        <CenteredLargeProse>
          <RebootFromUsbButton
            usbDriveStatus={usbDriveDisplayStatus}
            logger={logger}
          />
          <br />
          <br />
          <RebootToBiosButton logger={logger} />
          <br />
          <br />
          <Button onPress={() => window.kiosk?.quit()}>Reset</Button>
        </CenteredLargeProse>
      </ScreenMainCenterChild>
    );
  }

  if (!precinctScanner) {
    return (
      <SetupScannerScreen batteryIsCharging={computer.batteryIsCharging} />
    );
  }

  if (!isScannerConfigLoaded) {
    return <LoadingConfigurationScreen />;
  }

  if (!electionDefinition) {
    return (
      <UnconfiguredElectionScreen
        usbDriveStatus={usbDriveDisplayStatus}
        refreshConfig={refreshConfig}
      />
    );
  }

  if (auth.status === 'checking_passcode') {
    return <UnlockMachineScreen auth={auth} />;
  }

  // Wait until we load scanner status for the first time
  if (!scannerStatus) return null;

  if (isAdminAuth(auth)) {
    return (
      <AppContext.Provider
        value={{
          electionDefinition,
          currentPrecinctId,
          machineConfig,
          auth,
        }}
      >
        <AdminScreen
          updateAppPrecinctId={updatePrecinctId}
          scannerStatus={scannerStatus}
          isTestMode={isTestMode}
          toggleLiveMode={toggleTestMode}
          unconfigure={unconfigureServer}
          usbDrive={usbDrive}
        />
      </AppContext.Provider>
    );
  }

  if (window.kiosk && usbDrive.status !== usbstick.UsbDriveStatus.mounted) {
    return <InsertUsbScreen />;
  }

  if (isPollworkerAuth(auth)) {
    return (
      <AppContext.Provider
        value={{
          electionDefinition,
          currentPrecinctId,
          machineConfig,
          auth,
        }}
      >
        <PollWorkerScreen
          scannedBallotCount={scannerStatus.ballotsCounted}
          isPollsOpen={isPollsOpen}
          togglePollsOpen={togglePollsOpen}
          printer={printer}
          hasPrinterAttached={!!printerInfo}
          isLiveMode={!isTestMode}
          usbDrive={usbDrive}
        />
      </AppContext.Provider>
    );
  }

  if (auth.status === 'logged_out' && auth.reason !== 'no_card') {
    return <InvalidCardScreen />;
  }

  // When no card is inserted, we're in "voter" mode
  assert(auth.status === 'logged_out' && auth.reason === 'no_card');

  if (!isPollsOpen) {
    return (
      <PollsClosedScreen
        isLiveMode={!isTestMode}
        showNoChargerWarning={!computer.batteryIsCharging}
      />
    );
  }

  assert(scannerStatus.state !== 'unconfigured');
  assert(scannerStatus.state !== 'calibrating');
  assert(scannerStatus.state !== 'calibrated');
  const voterScreen = (() => {
    switch (scannerStatus.state) {
      case 'connecting':
        return null;
      case 'disconnected':
        return (
          <SetupScannerScreen batteryIsCharging={computer.batteryIsCharging} />
        );
      case 'no_paper':
        return (
          <InsertBallotScreen
            isLiveMode={!isTestMode}
            scannedBallotCount={scannerStatus.ballotsCounted}
            showNoChargerWarning={!computer.batteryIsCharging}
          />
        );
      case 'ready_to_scan':
      case 'scanning':
      case 'ready_to_accept':
      case 'accepting':
        // TODO if you review a ballot and choose to accept it, then we show
        // this same scan processing screen, which is a little weird since we're
        // not checking their ballot for errors anymore, we've already done that
        return <ScanProcessingScreen />;
      case 'accepted':
        return (
          <ScanSuccessScreen
            scannedBallotCount={scannerStatus.ballotsCounted}
          />
        );
      case 'needs_review':
        assert(
          scannerStatus.interpretation?.type === 'INTERPRETATION_NEEDS_REVIEW'
        );
        return (
          <ScanWarningScreen
            adjudicationReasonInfo={scannerStatus.interpretation.reasons}
          />
        );
      case 'returning':
      case 'returned':
        return <ScanReturnedBallotScreen />;
      case 'rejecting':
      case 'rejected':
        return (
          <ScanErrorScreen
            error={
              scannerStatus.interpretation?.type === 'INTERPRETATION_INVALID'
                ? scannerStatus.interpretation.reason
                : scannerStatus.error
            }
            isTestMode={isTestMode}
          />
        );
      case 'jammed':
        return <ScanJamScreen />;
      case 'both_sides_have_paper':
        return <ScanBusyScreen />;
      case 'error':
        return (
          <ScanErrorScreen
            error={scannerStatus.error}
            isTestMode={isTestMode}
          />
        );
      /* istanbul ignore next - compile time check for completeness */
      default:
        throwIllegalValue(scannerStatus.state);
    }
  })();
  return (
    <AppContext.Provider
      value={{
        electionDefinition,
        currentPrecinctId,
        machineConfig,
        auth,
      }}
    >
      {voterScreen}
    </AppContext.Provider>
  );
}
