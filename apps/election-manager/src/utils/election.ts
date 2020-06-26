import { Election, BallotStyle } from '@votingworks/ballot-encoder'
import dashify from 'dashify'
import { DEFAULT_LOCALE, LANGUAGES } from '../config/globals'

export const getContests = ({
  ballotStyle,
  election,
}: {
  ballotStyle: BallotStyle
  election: Election
}) =>
  election.contests.filter(
    (c) =>
      ballotStyle.districts.includes(c.districtId) &&
      ballotStyle.partyId === c.partyId
  )

export const getPrecinctById = ({
  election,
  precinctId,
}: {
  election: Election
  precinctId: string
}) => election.precincts.find((p) => p.id === precinctId)

export const getBallotStyle = ({
  ballotStyleId,
  election,
}: {
  ballotStyleId: string
  election: Election
}) => election.ballotStyles.find((bs) => bs.id === ballotStyleId) as BallotStyle

export const getPartyFullNameFromBallotStyle = ({
  ballotStyleId,
  election,
}: {
  ballotStyleId: string
  election: Election
}): string => {
  const { partyId } = getBallotStyle({ ballotStyleId, election })
  const party = election.parties.find((p) => p.id === partyId)
  return party?.fullName || ''
}

interface BallotStyleData {
  ballotStyleId: string
  contestIds: string[]
  precinctId: string
}

const sortOptions = {
  ignorePunctuation: true,
  numeric: true,
}

export const getBallotStylesData = (election: Election) =>
  election.ballotStyles
    .map((ballotStyle) => ({
      ballotStyleId: ballotStyle.id,
      precinctIds: ballotStyle.precincts,
      contestIds: election.contests
        .filter((c) => ballotStyle.districts.includes(c.districtId))
        .map((c) => c.id),
    }))
    .sort((a, b) =>
      a.ballotStyleId.localeCompare(b.ballotStyleId, undefined, sortOptions)
    )

export const getBallotStylesDataByStyle = (election: Election) =>
  getBallotStylesData(election).reduce<BallotStyleData[]>(
    (accumulator, currentValue) =>
      accumulator.concat(
        currentValue.precinctIds.map((precinctId) => ({
          ...currentValue,
          precinctId,
        }))
      ),
    []
  )

export const getBallotStylesDataByPrecinct = (election: Election) =>
  [...getBallotStylesDataByStyle(election)].sort((a, b) => {
    const nameA = election.precincts.find((p) => p.id === a.precinctId)!.name
    const nameB = election.precincts.find((p) => p.id === b.precinctId)!.name
    return nameA.localeCompare(nameB, undefined, sortOptions)
  })

export const getLanguageByLocaleCode = (localeCode: string) =>
  LANGUAGES[localeCode.split('-')[0]]

export const getHumanBallotLanguageFormat = (localeCode: string) =>
  localeCode === DEFAULT_LOCALE
    ? getLanguageByLocaleCode(DEFAULT_LOCALE)
    : `${getLanguageByLocaleCode(DEFAULT_LOCALE)}/${getLanguageByLocaleCode(
        localeCode
      )}`

export const getBallotFileName = ({
  ballotStyleId,
  election,
  electionHash,
  precinctId,
  localeCode,
}: {
  ballotStyleId: string
  election: Election
  electionHash: string
  precinctId: string
  localeCode: string
}) => {
  const precinctName = getPrecinctById({
    election,
    precinctId,
  })!.name

  const locales =
    localeCode === DEFAULT_LOCALE
      ? DEFAULT_LOCALE
      : `${DEFAULT_LOCALE}-${localeCode}`

  return `election-${electionHash.slice(0, 10)}-precinct-${dashify(
    precinctName
  )}-id-${precinctId}-style-${ballotStyleId}-locale-${locales}.pdf`
}
