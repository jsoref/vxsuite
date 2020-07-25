import { render } from '@testing-library/react'
import { mocked } from 'ts-jest/utils'
import React from 'react'

import fakeKiosk from '../../test/helpers/fakeKiosk'
import { isAvailable } from '../lib/usbstick'
import USBController from './USBController'

jest.mock('../lib/usbstick')

beforeAll(() => {
  window.kiosk = fakeKiosk()
  jest.useFakeTimers()
})

afterAll(() => {
  jest.useRealTimers()
  delete window.kiosk
})

test('shows nothing if no kiosk', () => {
  const { container } = render(<USBController />)

  expect(container.firstChild).toMatchInlineSnapshot(`null`)
})

test('shows something if kiosk', () => {
  mocked(isAvailable).mockReturnValue(true)
  const { container } = render(<USBController />)

  expect(container.firstChild!.firstChild).toMatchInlineSnapshot(`No USB`)
})
