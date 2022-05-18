import { renderHook } from '@testing-library/react-hooks';
import { Scan } from '@votingworks/api';
import { sleep } from '@votingworks/utils';
import fetchMock, { MockResponseFunction } from 'fetch-mock';
import { advanceTimersAndPromises } from '@votingworks/test-utils';
import { usePrecinctScanner } from './use_precinct_scanner';

const scanStatusWaitingForPaperResponse: Scan.GetScanStatusResponse = {
  adjudication: { adjudicated: 0, remaining: 0 },
  canUnconfigure: false,
  batches: [],
  scanner: Scan.ScannerStatus.WaitingForPaper,
};

const scanStatusReadyToScanResponse: Scan.GetScanStatusResponse = {
  adjudication: { adjudicated: 0, remaining: 0 },
  canUnconfigure: false,
  batches: [],
  scanner: Scan.ScannerStatus.ReadyToScan,
};

beforeEach(() => {
  jest.useFakeTimers();
});

test('initial state', () => {
  const { result } = renderHook(() => usePrecinctScanner());
  expect(result.current).toBeUndefined();
});

test('updates from /scan/status', async () => {
  const { result } = renderHook(() => usePrecinctScanner());

  // first update
  fetchMock.getOnce('/scan/status', {
    body: scanStatusWaitingForPaperResponse,
  });
  await advanceTimersAndPromises(1);
  expect(result.current?.status.scannerState).toBe(
    Scan.ScannerStatus.WaitingForPaper
  );

  // second update
  fetchMock.getOnce(
    '/scan/status',
    { body: scanStatusReadyToScanResponse },
    { overwriteRoutes: false }
  );
  await advanceTimersAndPromises(1);
  expect(result.current?.status.scannerState).toBe(
    Scan.ScannerStatus.ReadyToScan
  );
});

test('disabling', async () => {
  const { result } = renderHook(() => usePrecinctScanner(false));

  fetchMock.getOnce('/scan/status', {
    body: scanStatusWaitingForPaperResponse,
  });
  await advanceTimersAndPromises(100);

  expect(result.current).toBeUndefined();
});

test('issues one status check at a time', async () => {
  const statusEndpoint = jest.fn<
    ReturnType<MockResponseFunction>,
    Parameters<MockResponseFunction>
  >(async () => {
    await sleep(5);
    return new Response(JSON.stringify(scanStatusWaitingForPaperResponse), {
      headers: { 'Content-Type': 'application/json' },
    });
  });

  const { result } = renderHook(() => usePrecinctScanner());

  fetchMock.get('/scan/status', statusEndpoint);
  expect(result.current).toBeUndefined();

  await advanceTimersAndPromises(6);
  expect(result.current).toEqual({
    status: expect.objectContaining({
      scannerState: Scan.ScannerStatus.WaitingForPaper,
    }),
  });

  await advanceTimersAndPromises(6);
  expect(statusEndpoint.mock.calls.length).toEqual(2);
});
