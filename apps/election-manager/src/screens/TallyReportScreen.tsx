import React, { useContext } from 'react'
import styled from 'styled-components'

import { useParams } from 'react-router-dom'
import find from '../utils/find'
import saveAsPDF from '../utils/saveAsPDF'

import {
  PrecinctReportScreenProps,
  ScannerReportScreenProps,
  PartyReportScreenProps,
  VotingMethodReportScreenProps,
  VotingMethod,
} from '../config/types'
import AppContext from '../contexts/AppContext'

import PrintButton from '../components/PrintButton'
import Button from '../components/Button'
import HorizontalRule from '../components/HorizontalRule'
import ContestTally from '../components/ContestTally'
import NavigationScreen from '../components/NavigationScreen'
import Prose from '../components/Prose'
import LinkButton from '../components/LinkButton'
import TallyReportMetadata from '../components/TallyReportMetadata'

import routerPaths from '../routerPaths'
import { filterTalliesByParams } from '../lib/votecounting'
import LogoMark from '../components/LogoMark'
import { filterExternalTalliesByParams } from '../utils/semsTallies'
import { getLabelForVotingMethod } from '../utils/votingMethod'

const TallyHeader = styled.div`
  page-break-before: always;
  h1 + p {
    margin-top: -1.5em;
  }
`
const TallyReportScreen: React.FC = () => {
  const {
    precinctId: precinctIdFromProps,
  } = useParams<PrecinctReportScreenProps>()
  const { scannerId } = useParams<ScannerReportScreenProps>()
  const { partyId: partyIdFromProps } = useParams<PartyReportScreenProps>()
  const {
    votingMethod: votingMethodFromProps,
  } = useParams<VotingMethodReportScreenProps>()
  const votingMethod = votingMethodFromProps as VotingMethod
  const {
    electionDefinition,
    isOfficialResults,
    fullElectionTally,
    fullElectionExternalTally,
    isTabulationRunning,
  } = useContext(AppContext)

  if (isTabulationRunning) {
    return (
      <NavigationScreen mainChildCenter>
        <Prose textCenter>
          <h1>Building Tabulation Report...</h1>
          <p>This may take a few seconds.</p>
        </Prose>
      </NavigationScreen>
    )
  }

  const { election } = electionDefinition!
  const statusPrefix = isOfficialResults ? 'Official' : 'Unofficial'

  const ballotStylePartyIds =
    partyIdFromProps !== undefined
      ? [partyIdFromProps]
      : Array.from(new Set(election.ballotStyles.map((bs) => bs.partyId)))

  const precinctIds =
    precinctIdFromProps === 'all'
      ? election.precincts.map((p) => p.id)
      : [precinctIdFromProps]

  const precinctName =
    (precinctIdFromProps &&
      precinctIdFromProps !== 'all' &&
      find(election.precincts, (p) => p.id === precinctIdFromProps).name) ||
    undefined

  let fileSuffix = precinctName
  const reportDisplayTitle = () => {
    if (precinctName) {
      return `${statusPrefix} Precinct Tally Report for ${precinctName}`
    }
    if (scannerId) {
      fileSuffix = `scanner-${scannerId}`
      return `${statusPrefix} Scanner Tally Report for Scanner ${scannerId}`
    }
    if (precinctIdFromProps === 'all') {
      fileSuffix = 'all-precincts'
      return `${statusPrefix} ${election.title} Tally Reports for All Precincts`
    }
    if (partyIdFromProps) {
      const party = election.parties.find((p) => p.id === partyIdFromProps)!
      fileSuffix = party.fullName
      return `${statusPrefix} Tally Report for ${party.fullName}`
    }
    if (votingMethod) {
      const label = getLabelForVotingMethod(votingMethod)
      fileSuffix = `${label}-ballots`
      return `${statusPrefix} ${label} Ballot Tally Report`
    }
    return `${statusPrefix} ${election.title} Tally Report`
  }

  const handleSaveAsPDF = async () => {
    const succeeded = await saveAsPDF('tabulation-report', election, fileSuffix)
    if (!succeeded) {
      // eslint-disable-next-line no-alert
      window.alert(
        'Could not save PDF, it can only be saved to a USB device. (Or if "Cancel" was selected, ignore this message.)'
      )
    }
  }

  const generatedAtTime = new Date()
  const singlePrecinctId = precinctIds.length === 1 ? precinctIds[0] : undefined
  const outerTallyReport = filterTalliesByParams(fullElectionTally!, election, {
    precinctId: singlePrecinctId,
    scannerId,
    partyId: partyIdFromProps,
    votingMethod,
  })
  const outerExternalTallyReport = filterExternalTalliesByParams(
    fullElectionExternalTally,
    election,
    {
      precinctId: singlePrecinctId,
      scannerId,
      partyId: partyIdFromProps,
      votingMethod,
    }
  )

  const ballotCountsByVotingMethod = votingMethod
    ? undefined
    : outerTallyReport.ballotCountsByVotingMethod

  return (
    <React.Fragment>
      <NavigationScreen>
        <Prose className="no-print">
          <h1>{reportDisplayTitle()}</h1>
          <TallyReportMetadata
            generatedAtTime={generatedAtTime}
            election={election}
            internalBallotCount={outerTallyReport.numberOfBallotsCounted}
            externalBallotCount={
              outerExternalTallyReport?.numberOfBallotsCounted
            }
            ballotCountsByVotingMethod={ballotCountsByVotingMethod}
          />
          <p>
            <PrintButton primary>Print {statusPrefix} Tally Report</PrintButton>
          </p>
          {window.kiosk && (
            <p>
              <Button onPress={handleSaveAsPDF}>
                Save {statusPrefix} Tally Report as PDF
              </Button>
            </p>
          )}
          <p>
            <LinkButton small to={routerPaths.tally}>
              Back to Tally Index
            </LinkButton>
          </p>
        </Prose>
      </NavigationScreen>
      <div className="print-only">
        <LogoMark />
        {ballotStylePartyIds.map((partyId) =>
          precinctIds.map((precinctId) => {
            const party = election.parties.find((p) => p.id === partyId)
            const electionTitle = party
              ? `${party.fullName} ${election.title}`
              : election.title

            const tallyForReport = filterTalliesByParams(
              fullElectionTally!,
              election,
              { precinctId, scannerId, partyId, votingMethod }
            )
            const externalTallyForReport = filterExternalTalliesByParams(
              fullElectionExternalTally,
              election,
              { precinctId, partyId }
            )

            if (precinctId) {
              const precinctName = find(
                election.precincts,
                (p) => p.id === precinctId
              ).name
              return (
                <React.Fragment key={`${partyId}-${precinctId}`}>
                  <TallyHeader key={precinctId}>
                    <Prose maxWidth={false}>
                      <h1>
                        {statusPrefix} Precinct Tally Report for: {precinctName}
                      </h1>
                      <h2>{electionTitle}</h2>
                      <TallyReportMetadata
                        generatedAtTime={generatedAtTime}
                        election={election}
                        internalBallotCount={
                          tallyForReport.numberOfBallotsCounted
                        }
                        externalBallotCount={
                          externalTallyForReport?.numberOfBallotsCounted
                        }
                        ballotCountsByVotingMethod={
                          tallyForReport.ballotCountsByVotingMethod
                        }
                      />
                    </Prose>
                  </TallyHeader>
                  <HorizontalRule />
                  <h2>Contest Tallies</h2>
                  <ContestTally
                    election={election}
                    electionTally={tallyForReport}
                    externalTally={externalTallyForReport}
                    precinctId={precinctId}
                  />
                </React.Fragment>
              )
            }

            if (scannerId) {
              return (
                <React.Fragment key={`${partyId}-${scannerId}`}>
                  <TallyHeader key={scannerId}>
                    <Prose maxWidth={false}>
                      <h1>
                        {statusPrefix} Scanner Tally Report for Scanner{' '}
                        {scannerId}
                      </h1>
                      <h2>{electionTitle}</h2>
                      <TallyReportMetadata
                        generatedAtTime={generatedAtTime}
                        election={election}
                        internalBallotCount={
                          tallyForReport?.numberOfBallotsCounted ?? 0
                        }
                        ballotCountsByVotingMethod={
                          tallyForReport.ballotCountsByVotingMethod
                        }
                      />
                    </Prose>
                  </TallyHeader>
                  <HorizontalRule />
                  <h2>Contest Tallies</h2>
                  <ContestTally
                    election={election}
                    electionTally={tallyForReport}
                  />
                </React.Fragment>
              )
            }

            if (votingMethod) {
              const label = getLabelForVotingMethod(votingMethod)
              return (
                <React.Fragment key={`${partyId}-${votingMethod}`}>
                  <TallyHeader key={scannerId}>
                    <Prose maxWidth={false}>
                      <h1>
                        {statusPrefix} {label} Ballot Tally Report
                      </h1>
                      <h2>{electionTitle}</h2>
                      <TallyReportMetadata
                        generatedAtTime={generatedAtTime}
                        election={election}
                        internalBallotCount={
                          tallyForReport?.numberOfBallotsCounted ?? 0
                        }
                      />
                    </Prose>
                  </TallyHeader>
                  <HorizontalRule />
                  <h2>Contest Tallies</h2>
                  <ContestTally
                    election={election}
                    electionTally={tallyForReport}
                  />
                </React.Fragment>
              )
            }

            return (
              <React.Fragment key={partyId || 'none'}>
                <TallyHeader>
                  <Prose maxWidth={false}>
                    <h1>
                      {statusPrefix} {electionTitle} Tally Report
                    </h1>
                    <TallyReportMetadata
                      generatedAtTime={generatedAtTime}
                      election={election}
                      internalBallotCount={
                        tallyForReport.numberOfBallotsCounted
                      }
                      externalBallotCount={
                        externalTallyForReport?.numberOfBallotsCounted
                      }
                      ballotCountsByVotingMethod={
                        tallyForReport.ballotCountsByVotingMethod
                      }
                    />
                  </Prose>
                </TallyHeader>
                <h2>Contest Tallies</h2>
                <HorizontalRule />
                <div data-testid="tally-report-contents">
                  <ContestTally
                    election={election}
                    electionTally={tallyForReport}
                    externalTally={externalTallyForReport}
                  />
                </div>
              </React.Fragment>
            )
          })
        )}
      </div>
    </React.Fragment>
  )
}

export default TallyReportScreen
