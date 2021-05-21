import React from 'react'
import { Prose } from '@votingworks/ui'
import { Absolute } from '../components/Absolute'
import { CircleCheck } from '../components/Graphics'
import { Bar } from '../components/Bar'
import { CenteredLargeProse, CenteredScreen } from '../components/Layout'
import * as format from '../utils/format'

interface Props {
  scannedBallotCount: number
}

const ScanSuccessScreen: React.FC<Props> = ({ scannedBallotCount }) => {
  return (
    <CenteredScreen>
      <CircleCheck />
      <CenteredLargeProse>
        <h1>Your ballot was counted!</h1>
        <p>Thank you for voting.</p>
      </CenteredLargeProse>
      <Absolute top left>
        <Bar>
          <Prose>
            <p>
              Ballots Scanned:{' '}
              <strong data-testid="ballot-count">
                {format.count(scannedBallotCount)}
              </strong>
            </p>
          </Prose>
        </Bar>
      </Absolute>
    </CenteredScreen>
  )
}

export default ScanSuccessScreen
