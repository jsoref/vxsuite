import React, { useContext, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { Button, UsbControllerButton } from '@votingworks/ui';
import { AppContext } from '../contexts/app_context';

import { routerPaths } from '../router_paths';
import { Screen } from './screen';
import { Main, MainChild } from './main';
import { Navigation } from './navigation';
import { LinkButton } from './link_button';
import { StatusFooter } from './status_footer';
import { ExportLogsModal } from './export_logs_modal';

interface Props {
  children: React.ReactNode;
  mainChildCenter?: boolean;
  mainChildFlex?: boolean;
}

export function NavigationScreen({
  children,
  mainChildCenter = false,
  mainChildFlex = false,
}: Props): JSX.Element {
  const location = useLocation();
  function isActiveSection(path: string) {
    return new RegExp(`^${path}`).test(location.pathname)
      ? 'active-section'
      : '';
  }

  const {
    electionDefinition,
    usbDriveEject,
    usbDriveStatus,
    lockMachine,
    machineConfig,
    currentUserSession,
  } = useContext(AppContext);
  const [isExportingLogs, setIsExportingLogs] = useState(false);
  const election = electionDefinition?.election;
  const currentUser = currentUserSession?.type ?? 'unknown';

  return (
    <Screen>
      <Navigation
        primaryNav={
          election && (
            <React.Fragment>
              <LinkButton
                to={routerPaths.electionDefinition}
                className={isActiveSection(routerPaths.electionDefinition)}
              >
                Definition
              </LinkButton>
              <LinkButton
                to={routerPaths.smartcards}
                className={isActiveSection(routerPaths.smartcards)}
              >
                Cards
              </LinkButton>
              <LinkButton
                to={routerPaths.ballotsList}
                className={isActiveSection(routerPaths.ballotsList)}
              >
                Ballots
              </LinkButton>
              <LinkButton
                small
                to={routerPaths.tally}
                className={isActiveSection(routerPaths.tally)}
              >
                Tally
              </LinkButton>
            </React.Fragment>
          )
        }
        secondaryNav={
          <React.Fragment>
            <Button small onPress={() => setIsExportingLogs(true)}>
              Export Logs
            </Button>
            {!machineConfig.bypassAuthentication && (
              <Button small onPress={lockMachine}>
                Lock Machine
              </Button>
            )}
            <UsbControllerButton
              usbDriveEject={() => usbDriveEject(currentUser)}
              usbDriveStatus={usbDriveStatus}
            />
          </React.Fragment>
        }
      />
      <Main padded>
        <MainChild center={mainChildCenter} flexContainer={mainChildFlex}>
          {children}
        </MainChild>
      </Main>
      <StatusFooter />
      {isExportingLogs && (
        <ExportLogsModal onClose={() => setIsExportingLogs(false)} />
      )}
    </Screen>
  );
}
