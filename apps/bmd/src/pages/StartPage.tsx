import React, { useContext } from 'react'

import { Election } from '../config/types'

import BallotContext from '../contexts/ballotContext'

import LinkButton from '../components/LinkButton'
import Main, { MainChild } from '../components/Main'
import Prose from '../components/Prose'
import Seal from '../components/Seal'
import Text from '../components/Text'

const StartPage = () => {
  const { ballotStyleId, election: e, precinctId } = useContext(BallotContext)
  const election = e as Election
  const { title, state, county, date, seal, sealURL } = election
  const precinct = election.precincts.find(p => p.id === precinctId)
  const precinctName = precinct ? precinct.name : precinctId

  return (
    <Main>
      <MainChild center>
        <Seal seal={seal} sealURL={sealURL} />
        <Prose textCenter>
          <h1 aria-label={`${title}.`}>{title}</h1>
          <p aria-hidden="true">
            {date}
            <br />
            {county.name}, {state}
          </p>
          <hr />
          <h2>
            Precinct: {precinctName}
            <br />
            Ballot Style: {ballotStyleId}
          </h2>
          <Text narrow>
            <br />
            Do not remove card until
            <br /> official ballot is printed.
          </Text>
          <p>
            <br />
            <LinkButton
              primary
              to="/instructions/"
              id="next"
              aria-label="Select Next to Get Started."
            >
              Get Started
            </LinkButton>
          </p>
        </Prose>
      </MainChild>
    </Main>
  )
}

export default StartPage
