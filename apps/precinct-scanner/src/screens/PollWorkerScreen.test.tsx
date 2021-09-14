import {
  act,
  screen,
  render,
  waitForElementToBeRemoved,
} from '@testing-library/react'
import { electionSampleDefinition } from '@votingworks/fixtures'
import { fakeKiosk } from '@votingworks/test-utils'
import { NullPrinter } from '@votingworks/utils'
import MockDate from 'mockdate'
import React from 'react'
import AppContext from '../contexts/AppContext'
import PollWorkerScreen from './PollWorkerScreen'

MockDate.set('2020-10-31T00:00:00.000Z')

beforeEach(() => {
  window.location.href = '/'
})

afterEach(() => {
  window.kiosk = undefined
})

test('shows security code', async () => {
  const mockKiosk = fakeKiosk()
  window.kiosk = mockKiosk
  mockKiosk.totp.get.mockResolvedValue({
    timestamp: '2020-10-31T01:01:01.001Z',
    code: '123456',
  })

  await act(async () => {
    render(
      <AppContext.Provider
        value={{
          electionDefinition: electionSampleDefinition,
          machineConfig: { machineId: '0000', codeVersion: 'TEST' },
        }}
      >
        <PollWorkerScreen
          scannedBallotCount={0}
          isPollsOpen={false}
          togglePollsOpen={jest.fn()}
          getCVRsFromExport={jest.fn().mockResolvedValue([])}
          saveTallyToCard={jest.fn()}
          isLiveMode
          hasPrinterAttached={false}
          printer={new NullPrinter()}
        />
      </AppContext.Provider>
    )
  })

  screen.getByText('Security Code: 123·456')
})

test('shows dashes when no totp', async () => {
  const mockKiosk = fakeKiosk()
  window.kiosk = mockKiosk
  mockKiosk.totp.get.mockResolvedValue(undefined)

  await act(async () => {
    render(
      <AppContext.Provider
        value={{
          electionDefinition: electionSampleDefinition,
          machineConfig: { machineId: '0000', codeVersion: 'TEST' },
        }}
      >
        <PollWorkerScreen
          scannedBallotCount={0}
          isPollsOpen={false}
          togglePollsOpen={jest.fn()}
          getCVRsFromExport={jest.fn().mockResolvedValue([])}
          saveTallyToCard={jest.fn()}
          isLiveMode
          hasPrinterAttached={false}
          printer={new NullPrinter()}
        />
      </AppContext.Provider>
    )
  })

  screen.getByText('Security Code: ---·---')
})