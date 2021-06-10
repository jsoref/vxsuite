import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react'

import { MemoryStorage, MemoryCard, MemoryHardware } from '@votingworks/utils'
import App from '../App'

import {
  advanceTimers,
  advanceTimersAndPromises,
  getNewVoterCard,
} from '../../test/helpers/smartcards'

import {
  contest0,
  contest0candidate0,
  contest0candidate1,
  contest1candidate0,
  setElectionInStorage,
  setStateInStorage,
} from '../../test/helpers/election'

import { getActiveElement, handleGamepadButtonDown } from './gamepad'
import { fakeMachineConfigProvider } from '../../test/helpers/fakeMachineConfig'

beforeEach(() => {
  window.location.href = '/'
})

it('gamepad controls work', async () => {
  jest.useFakeTimers()

  const card = new MemoryCard()
  const hardware = await MemoryHardware.buildStandard()
  const storage = new MemoryStorage()
  const machineConfig = fakeMachineConfigProvider()

  setElectionInStorage(storage)
  setStateInStorage(storage)

  const { getByText } = render(
    <App
      card={card}
      hardware={hardware}
      storage={storage}
      machineConfig={machineConfig}
    />
  )
  await advanceTimersAndPromises()

  card.insertCard(getNewVoterCard())
  advanceTimers()
  await waitFor(() => getByText(/Center Springfield/))

  // Go to First Contest
  handleGamepadButtonDown('DPadRight')
  advanceTimers()

  // First Contest Page
  getByText(contest0.title)

  // Confirm first contest only has 1 seat
  expect(contest0.seats).toEqual(1)

  // Test navigation by gamepad
  handleGamepadButtonDown('DPadDown')
  expect(getActiveElement().dataset.choice).toEqual(contest0candidate0.id)
  handleGamepadButtonDown('DPadDown')
  expect(getActiveElement().dataset.choice).toEqual(contest0candidate1.id)
  handleGamepadButtonDown('DPadUp')
  expect(getActiveElement().dataset.choice).toEqual(contest0candidate0.id)

  // test the edge case of rolling over
  handleGamepadButtonDown('DPadUp')
  expect(document.activeElement!.textContent).toEqual('Back')
  handleGamepadButtonDown('DPadDown')
  expect(getActiveElement().dataset.choice).toEqual(contest0candidate0.id)

  handleGamepadButtonDown('DPadRight')
  advanceTimers()
  // go up first without focus, then down once, should be same as down once.
  handleGamepadButtonDown('DPadUp')
  handleGamepadButtonDown('DPadDown')
  expect(getActiveElement().dataset.choice).toEqual(contest1candidate0.id)
  handleGamepadButtonDown('DPadLeft')
  advanceTimers()
  // B is same as down
  handleGamepadButtonDown('B')
  expect(getActiveElement().dataset.choice).toEqual(contest0candidate0.id)

  // select and unselect
  handleGamepadButtonDown('A')
  expect(getActiveElement().dataset.selected).toBe('true')
  handleGamepadButtonDown('A')
  expect(getActiveElement().dataset.selected).toBe('false')

  // Confirm 'Okay' is only active element on page. Modal is "true" modal.
  fireEvent.click(getByText(contest0candidate0.name))
  fireEvent.click(getByText(contest0candidate1.name))
  handleGamepadButtonDown('DPadDown') // selects Okay button
  handleGamepadButtonDown('DPadDown') // Okay button should still be selected
  handleGamepadButtonDown('DPadDown') // Okay button should still be selected
  expect(getActiveElement().textContent).toBe('Okay')
})
