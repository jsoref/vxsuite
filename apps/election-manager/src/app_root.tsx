import { strict as assert } from 'assert';
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { RouteComponentProps } from 'react-router-dom';
import 'normalize.css';
import { sha256 } from 'js-sha256';
import {
  Logger,
  LogSource,
  LogEventId,
  LogDispositionStandardTypes,
} from '@votingworks/logging';
import {
  ElectionDefinition,
  parseElection,
  safeParseElection,
  FullElectionExternalTally,
  ExternalTallySourceType,
  Provider,
  CardDataTypes,
} from '@votingworks/types';

import {
  Storage,
  throwIllegalValue,
  usbstick,
  Printer,
  Card,
  Hardware,
} from '@votingworks/utils';
import {
  useSmartcard,
  useUsbDrive,
  useUserSession,
  useHardware,
} from '@votingworks/ui';
import {
  computeFullElectionTally,
  getEmptyFullElectionTally,
} from './lib/votecounting';

import { AppContext } from './contexts/app_context';

import {
  CastVoteRecordFiles,
  SaveCastVoteRecordFiles,
} from './utils/cast_vote_record_files';

import { ElectionManager } from './components/election_manager';
import {
  SaveElection,
  PrintedBallot,
  Iso8601Timestamp,
  CastVoteRecordLists,
  ExportableTallies,
  ResultsFileType,
  MachineConfig,
} from './config/types';
import { getExportableTallies } from './utils/exportable_tallies';
import {
  convertExternalTalliesToStorageString,
  convertStorageStringToExternalTallies,
} from './utils/external_tallies';

export interface AppStorage {
  electionDefinition?: ElectionDefinition;
  cvrFiles?: string;
  isOfficialResults?: boolean;
  printedBallots?: PrintedBallot[];
  configuredAt?: Iso8601Timestamp;
  externalVoteTallies?: string;
}

export interface Props extends RouteComponentProps {
  storage: Storage;
  printer: Printer;
  hardware: Hardware;
  card: Card;
  machineConfigProvider: Provider<MachineConfig>;
}

export const electionDefinitionStorageKey = 'electionDefinition';
export const cvrsStorageKey = 'cvrFiles';
export const isOfficialResultsKey = 'isOfficialResults';
export const printedBallotsStorageKey = 'printedBallots';
export const configuredAtStorageKey = 'configuredAt';
export const externalVoteTalliesFileStorageKey = 'externalVoteTallies';

const VALID_USERS: CardDataTypes[] = ['admin'];

export function AppRoot({
  storage,
  printer,
  card,
  hardware,
  machineConfigProvider,
}: Props): JSX.Element {
  const logger = useMemo(
    () => new Logger(LogSource.VxAdminApp, window.kiosk),
    []
  );

  const printBallotRef = useRef<HTMLDivElement>(null);

  const { hasCardReaderAttached } = useHardware({ hardware, logger });

  const getElectionDefinition = useCallback(async (): Promise<
    ElectionDefinition | undefined
  > => {
    // TODO: validate this with zod schema
    const electionDefinition = (await storage.get(
      electionDefinitionStorageKey
    )) as ElectionDefinition | undefined;

    if (electionDefinition) {
      const { electionData, electionHash } = electionDefinition;
      assert.equal(sha256(electionData), electionHash);
      return electionDefinition;
    }
  }, [storage]);

  const getCvrFiles = useCallback(
    async (): Promise<string | undefined> =>
      // TODO: validate this with zod schema
      (await storage.get(cvrsStorageKey)) as string | undefined,
    [storage]
  );
  const getExternalElectionTallies = useCallback(
    async (): Promise<string | undefined> =>
      // TODO: validate this with zod schema
      (await storage.get(externalVoteTalliesFileStorageKey)) as
        | string
        | undefined,
    [storage]
  );
  const getIsOfficialResults = useCallback(
    async (): Promise<boolean | undefined> =>
      // TODO: validate this with zod schema
      (await storage.get(isOfficialResultsKey)) as boolean | undefined,
    [storage]
  );

  const [
    electionDefinition,
    setElectionDefinition,
  ] = useState<ElectionDefinition>();
  const [configuredAt, setConfiguredAt] = useState<Iso8601Timestamp>('');

  const [castVoteRecordFiles, setCastVoteRecordFiles] = useState(
    CastVoteRecordFiles.empty
  );
  const [isTabulationRunning, setIsTabulationRunning] = useState(false);
  const [isOfficialResults, setIsOfficialResults] = useState(false);
  const [machineConfig, setMachineConfig] = useState<MachineConfig>({
    machineId: '0000',
    bypassAuthentication: false,
    codeVersion: '',
  });

  const smartcard = useSmartcard({ card, hasCardReaderAttached });
  const {
    currentUserSession,
    attemptToAuthenticateAdminUser,
    lockMachine,
    bootstrapAuthenticatedAdminSession,
  } = useUserSession({
    smartcard,
    electionDefinition,
    persistAuthentication: true,
    logger,
    bypassAuthentication: machineConfig.bypassAuthentication,
    validUserTypes: VALID_USERS,
  });

  async function saveIsOfficialResults() {
    setIsOfficialResults(true);
    await storage.set(isOfficialResultsKey, true);
    await logger.log(
      LogEventId.SaveToStorage,
      currentUserSession?.type ?? 'unknown',
      {
        message: 'isOfficialResults flag saved to storage.',
        disposition: 'success',
      }
    );
  }

  const [fullElectionTally, setFullElectionTally] = useState(
    getEmptyFullElectionTally()
  );

  const [
    fullElectionExternalTallies,
    setFullElectionExternalTallies,
  ] = useState<FullElectionExternalTally[]>([]);

  // Handle Machine Config
  useEffect(() => {
    void (async () => {
      try {
        const newMachineConfig = await machineConfigProvider.get();
        setMachineConfig(newMachineConfig);
      } catch {
        // Do nothing if machineConfig fails. Default values will be used.
      }
    })();
  }, [machineConfigProvider]);

  const usbDrive = useUsbDrive({ logger });
  const displayUsbStatus = usbDrive.status ?? usbstick.UsbDriveStatus.absent;
  const [printedBallots, setPrintedBallots] = useState<
    PrintedBallot[] | undefined
  >(undefined);

  const getPrintedBallots = useCallback(async (): Promise<PrintedBallot[]> => {
    // TODO: validate this with zod schema
    return (
      ((await storage.get(printedBallotsStorageKey)) as
        | PrintedBallot[]
        | undefined) || []
    );
  }, [storage]);

  async function savePrintedBallots(printedBallotsToStore: PrintedBallot[]) {
    await storage.set(printedBallotsStorageKey, printedBallotsToStore);
    await logger.log(
      LogEventId.SaveToStorage,
      currentUserSession?.type ?? 'unknown',
      {
        message: 'Printed ballot information saved to storage.',
        disposition: 'success',
      }
    );
  }

  async function addPrintedBallot(printedBallot: PrintedBallot) {
    const ballots = await getPrintedBallots();
    ballots.push(printedBallot);
    await savePrintedBallots(ballots);
    setPrintedBallots(ballots);
  }

  useEffect(() => {
    void (async () => {
      if (!printedBallots) {
        setPrintedBallots(await getPrintedBallots());
      }
    })();
  }, [getPrintedBallots, printedBallots]);

  useEffect(() => {
    void (async () => {
      if (!electionDefinition) {
        const storageElectionDefinition = await getElectionDefinition();
        if (storageElectionDefinition) {
          const configuredAtTime = // TODO: validate this with zod schema
            ((await storage.get(configuredAtStorageKey)) as
              | string
              | undefined) || '';
          setElectionDefinition(storageElectionDefinition);
          setConfiguredAt(configuredAtTime);
          await logger.log(LogEventId.LoadFromStorage, 'system', {
            message:
              'Election definition automatically loaded into application from storage.',
            disposition: 'success',
            electionHash: storageElectionDefinition.electionHash,
            electionConfiguredAt: configuredAtTime,
          });
        }

        if (castVoteRecordFiles === CastVoteRecordFiles.empty) {
          const storageCvrFiles = await getCvrFiles();
          if (storageCvrFiles) {
            const cvrs = CastVoteRecordFiles.import(storageCvrFiles);
            const newIsOfficialResults =
              (await getIsOfficialResults()) || false;
            setCastVoteRecordFiles(cvrs);
            setIsOfficialResults(newIsOfficialResults);
            await logger.log(LogEventId.LoadFromStorage, 'system', {
              message:
                'Cast vote records automatically loaded into application from local storage.',
              disposition: 'success',
              numberOfCvrs: cvrs.fileList.length,
              isOfficialResults: newIsOfficialResults,
            });
          }
        }

        if (
          fullElectionExternalTallies.length === 0 &&
          storageElectionDefinition
        ) {
          const storageExternalTalliesJson = await getExternalElectionTallies();
          if (storageExternalTalliesJson) {
            const importedData = convertStorageStringToExternalTallies(
              storageExternalTalliesJson
            );
            setFullElectionExternalTallies(importedData);
            await logger.log(LogEventId.LoadFromStorage, 'system', {
              message:
                'External file format vote tally data automatically loaded into application from local storage.',
              disposition: 'success',
              importedTallyFileNames: importedData
                .map((d) => d.inputSourceName)
                .join(', '),
            });
          }
        }
      }
    })();
  }, [
    castVoteRecordFiles,
    electionDefinition,
    fullElectionExternalTallies.length,
    getCvrFiles,
    getElectionDefinition,
    getExternalElectionTallies,
    getIsOfficialResults,
    storage,
    logger,
  ]);

  const computeVoteCounts = useCallback(
    (castVoteRecords: CastVoteRecordLists) => {
      assert(electionDefinition);
      setIsTabulationRunning(true);
      const fullTally = computeFullElectionTally(
        electionDefinition.election,
        castVoteRecords
      );
      setFullElectionTally(fullTally);
      setIsTabulationRunning(false);
    },
    [setFullElectionTally, electionDefinition]
  );

  useEffect(() => {
    if (electionDefinition) {
      computeVoteCounts(castVoteRecordFiles.castVoteRecords);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computeVoteCounts, castVoteRecordFiles]);

  async function saveExternalTallies(
    externalTallies: FullElectionExternalTally[]
  ) {
    setFullElectionExternalTallies(externalTallies);
    if (externalTallies.length > 0) {
      await storage.set(
        externalVoteTalliesFileStorageKey,
        convertExternalTalliesToStorageString(externalTallies)
      );
      await logger.log(
        LogEventId.SaveToStorage,
        currentUserSession?.type ?? 'unknown',
        {
          message:
            'Imported tally data from external file formats saved to storage.',
          disposition: 'success',
        }
      );
    } else {
      await storage.remove(externalVoteTalliesFileStorageKey);
      await logger.log(
        LogEventId.SaveToStorage,
        currentUserSession?.type ?? 'unknown',
        {
          message: 'Imported tally data from external file cleared in storage.',
          disposition: 'success',
        }
      );
    }
  }

  const saveCastVoteRecordFiles: SaveCastVoteRecordFiles = async (
    newCvrFiles = CastVoteRecordFiles.empty
  ) => {
    setCastVoteRecordFiles(newCvrFiles);
    if (newCvrFiles === CastVoteRecordFiles.empty) {
      setIsOfficialResults(false);
    }

    if (newCvrFiles === CastVoteRecordFiles.empty) {
      await storage.remove(cvrsStorageKey);
      await storage.remove(isOfficialResultsKey);
      await logger.log(
        LogEventId.SaveToStorage,
        currentUserSession?.type ?? 'unknown',
        {
          message:
            'Cast vote records and isOfficialResults flag cleared from storage.',
          disposition: 'success',
        }
      );
      setIsOfficialResults(false);
    } else {
      await storage.set(cvrsStorageKey, newCvrFiles.export());
      await logger.log(
        LogEventId.SaveToStorage,
        currentUserSession?.type ?? 'unknown',
        {
          message: 'Cast vote records saved to storage.',
          disposition: 'success',
        }
      );
    }
  };

  const saveElection: SaveElection = useCallback(
    async (electionJson) => {
      const previousElection = electionDefinition;
      if (previousElection) {
        void logger.log(LogEventId.ElectionUnconfigured, 'admin', {
          disposition: LogDispositionStandardTypes.Success,
          previousElectionHash: previousElection.electionHash,
        });
      }
      // we set a new election definition, reset everything
      await storage.clear();
      await logger.log(
        LogEventId.SaveToStorage,
        currentUserSession?.type ?? 'unknown',
        {
          message:
            'All current data in storage, including election definition, cast vote records, tallies, and printed ballot information cleared.',
          disposition: 'success',
        }
      );
      setIsOfficialResults(false);
      setCastVoteRecordFiles(CastVoteRecordFiles.empty);
      setFullElectionExternalTallies([]);
      setPrintedBallots([]);
      setElectionDefinition(undefined);

      if (electionJson) {
        const electionData = electionJson;
        const electionHash = sha256(electionData);
        const election = safeParseElection(electionData).unsafeUnwrap();
        // Temporarily bootstrap an authenticated user session. This will be removed
        // once we have a full story for how to bootstrap the auth process.
        bootstrapAuthenticatedAdminSession();

        setElectionDefinition({
          electionData,
          electionHash,
          election,
        });

        const newConfiguredAt = new Date().toISOString();
        setConfiguredAt(newConfiguredAt);

        await storage.set(configuredAtStorageKey, newConfiguredAt);
        await storage.set(electionDefinitionStorageKey, {
          election,
          electionData,
          electionHash,
        });
        await logger.log(
          LogEventId.ElectionConfigured,
          currentUserSession?.type ?? 'unknown',
          {
            disposition: LogDispositionStandardTypes.Success,
            newElectionHash: electionHash,
          }
        );
        await logger.log(
          LogEventId.SaveToStorage,
          currentUserSession?.type ?? 'unknown',
          {
            message: 'Election definition saved in storage.',
            disposition: 'success',
          }
        );
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      electionDefinition,
      storage,
      setIsOfficialResults,
      setCastVoteRecordFiles,
      setPrintedBallots,
      setElectionDefinition,
      parseElection,
      setElectionDefinition,
      setConfiguredAt,
    ]
  );

  function generateExportableTallies(): ExportableTallies {
    assert(electionDefinition);
    return getExportableTallies(
      fullElectionTally,
      fullElectionExternalTallies,
      electionDefinition.election
    );
  }

  async function resetFiles(fileType: ResultsFileType) {
    switch (fileType) {
      case ResultsFileType.CastVoteRecord:
        await saveCastVoteRecordFiles();
        break;
      case ResultsFileType.SEMS: {
        const newFiles = fullElectionExternalTallies.filter(
          (tally) => tally.source !== ExternalTallySourceType.SEMS
        );
        await saveExternalTallies(newFiles);
        break;
      }
      case ResultsFileType.Manual: {
        const newFiles = fullElectionExternalTallies.filter(
          (tally) => tally.source !== ExternalTallySourceType.Manual
        );
        await saveExternalTallies(newFiles);
        break;
      }
      case ResultsFileType.All:
        await saveCastVoteRecordFiles();
        await saveExternalTallies([]);
        break;
      default:
        throwIllegalValue(fileType);
    }
  }

  return (
    <AppContext.Provider
      value={{
        castVoteRecordFiles,
        electionDefinition,
        configuredAt,
        isOfficialResults,
        printer,
        printBallotRef,
        saveCastVoteRecordFiles,
        saveElection,
        saveIsOfficialResults,
        setCastVoteRecordFiles,
        resetFiles,
        usbDriveStatus: displayUsbStatus,
        usbDriveEject: usbDrive.eject,
        printedBallots: printedBallots || [],
        addPrintedBallot,
        fullElectionTally,
        setFullElectionTally,
        fullElectionExternalTallies,
        saveExternalTallies,
        isTabulationRunning,
        setIsTabulationRunning,
        generateExportableTallies,
        currentUserSession,
        attemptToAuthenticateAdminUser,
        lockMachine,
        machineConfig,
        hasCardReaderAttached,
        logger,
      }}
    >
      <ElectionManager />
      <div ref={printBallotRef} />
    </AppContext.Provider>
  );
}
