import { typedAs } from '@votingworks/utils';
import { mockOf } from '@votingworks/test-utils';
import { convertElectionDefinition } from '@votingworks/ballot-interpreter-nh';
import { err, ok, safeParseElection } from '@votingworks/types';
import { electionMinimalExhaustiveSample } from '@votingworks/fixtures';
import { NhConverterClient } from './nh_converter_client';
import { VxFiles } from './types';
import { pdfToImages } from '../../utils/pdf_to_images';
import { readBlobAsString } from '../blob';

jest.mock('@votingworks/ballot-interpreter-nh');
jest.mock('../../utils/pdf_to_images');

function makePdfToImagesMockReturnValue({
  pageCount = 2,
}: { pageCount?: number } = {}): ReturnType<typeof pdfToImages> {
  let pageNumber = 0;

  return {
    [Symbol.asyncIterator]() {
      return this;
    },

    async next() {
      if (pageNumber >= pageCount) {
        return { value: undefined, done: true };
      }

      pageNumber += 1;
      return {
        value: {
          pageNumber,
          pageCount,
          page: {
            data: Uint8ClampedArray.of(0, 0, 0, 0),
            width: 1,
            height: 1,
          },
        },
        done: false,
      };
    },

    async return() {
      return { value: undefined, done: true };
    },

    async throw(error: Error) {
      throw error;
    },
  };
}

test('display name', () => {
  expect(new NhConverterClient().getDisplayName()).toBe('NH');
});

test('initial files', async () => {
  const client = new NhConverterClient();
  const files = await client.getFiles();

  expect(files).toEqual(
    typedAs<VxFiles>({
      inputFiles: [
        {
          name: 'NH Card Definition (XML)',
          accept: 'application/xml',
        },
        {
          name: 'NH Card Ballot (PDF)',
          accept: 'application/pdf',
        },
      ],
      outputFiles: [
        {
          name: 'VX Election Definition',
        },
      ],
    })
  );
});

test('reset', async () => {
  const client = new NhConverterClient();

  await client.setInputFile(
    'NH Card Definition (XML)',
    new File([], 'file.xml')
  );
  await client.setInputFile('NH Card Ballot (PDF)', new File([], 'file.pdf'));

  expect((await client.getFiles()).inputFiles).toEqual(
    typedAs<VxFiles['inputFiles']>([
      {
        name: 'NH Card Definition (XML)',
        accept: 'application/xml',
        path: expect.any(String),
      },
      {
        name: 'NH Card Ballot (PDF)',
        accept: 'application/pdf',
        path: expect.any(String),
      },
    ])
  );

  await client.reset();

  expect((await client.getFiles()).inputFiles).toEqual(
    typedAs<VxFiles['inputFiles']>([
      { name: 'NH Card Definition (XML)', accept: 'application/xml' },
      { name: 'NH Card Ballot (PDF)', accept: 'application/pdf' },
    ])
  );
});

test('unknown files', async () => {
  const client = new NhConverterClient();

  await expect(
    client.setInputFile('unknown', new File([], 'file.pdf'))
  ).rejects.toThrow('input file "unknown" not found');

  await expect(client.getOutputFile('unknown')).rejects.toThrow(
    'output file "unknown" not found'
  );
});

test('process without card definition', async () => {
  const client = new NhConverterClient();

  await expect(client.process()).rejects.toThrow(
    'input file "NH Card Definition (XML)" not found'
  );
});

test('process without card ballot', async () => {
  const client = new NhConverterClient();

  await client.setInputFile(
    'NH Card Definition (XML)',
    new File([], 'definition.xml')
  );
  await expect(client.process()).rejects.toThrow(
    'input file "NH Card Ballot (PDF)" not found'
  );
});

test('conversion fails', async () => {
  const client = new NhConverterClient();

  mockOf(convertElectionDefinition).mockReturnValue(
    err(new Error('ElectionID is required'))
  );
  mockOf(pdfToImages).mockReturnValue(makePdfToImagesMockReturnValue());

  await client.setInputFile(
    'NH Card Definition (XML)',
    new File(['NOT XML'], 'definition.xml')
  );
  await client.setInputFile(
    'NH Card Ballot (PDF)',
    new File(['%PDF'], 'ballot.pdf')
  );

  await expect(client.process()).rejects.toThrow('ElectionID is required');
});

test('too many PDF pages', async () => {
  const client = new NhConverterClient();

  mockOf(pdfToImages).mockReturnValue(
    makePdfToImagesMockReturnValue({ pageCount: 3 })
  );

  await client.setInputFile(
    'NH Card Definition (XML)',
    new File([], 'definition.xml')
  );
  await client.setInputFile('NH Card Ballot (PDF)', new File([], 'ballot.pdf'));

  await expect(client.process()).rejects.toThrow(
    'Expected exactly 2 pages in NH card ballot, but got 3'
  );
});

test('process success', async () => {
  const client = new NhConverterClient();

  mockOf(convertElectionDefinition).mockReturnValue(
    ok(electionMinimalExhaustiveSample)
  );
  mockOf(pdfToImages).mockReturnValue(makePdfToImagesMockReturnValue());

  await client.setInputFile(
    'NH Card Definition (XML)',
    new File([`<election id="123" />`], 'definition.xml')
  );
  await client.setInputFile(
    'NH Card Ballot (PDF)',
    new File(['%PDF'], 'ballot.pdf')
  );

  await client.process();
  const electionBlob = await client.getOutputFile('VX Election Definition');
  expect(
    safeParseElection(await readBlobAsString(electionBlob)).unsafeUnwrap()
  ).toEqual(electionMinimalExhaustiveSample);

  expect(await client.getFiles()).toEqual(
    typedAs<VxFiles>({
      inputFiles: [
        {
          name: 'NH Card Definition (XML)',
          accept: 'application/xml',
          path: expect.any(String),
        },
        {
          name: 'NH Card Ballot (PDF)',
          accept: 'application/pdf',
          path: expect.any(String),
        },
      ],
      outputFiles: [
        {
          name: 'VX Election Definition',
          path: expect.any(String),
        },
      ],
    })
  );
});