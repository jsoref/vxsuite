import {
  BallotIdSchema,
  safeParseElection,
  unsafeParse,
} from '@votingworks/types';
import * as fs from 'fs';
import yargs from 'yargs/yargs';
import { generateCvrs } from '../../generate_cvrs';

/**
 * Script to generate a cast vote record file for a given election.
 * Run from the command-line with:
 *
 * ./bin/generate-sample-cvr-file -h
 *
 * To see more information and all possible arguments.
 */

interface GenerateCvrFileArguments {
  electionPath?: string;
  outputPath?: string;
  numBallots?: number;
  scannerNames?: Array<string | number>;
  liveBallots?: boolean;
  help?: boolean;
  [x: string]: unknown;
}

interface IO {
  stdin: NodeJS.ReadableStream;
  stdout: NodeJS.WritableStream;
  stderr: NodeJS.WritableStream;
}

export function main(argv: readonly string[], { stdout, stderr }: IO): number {
  let exitCode: number | undefined;
  const optionParser = yargs()
    .strict()
    .exitProcess(false)
    .options({
      electionPath: {
        type: 'string',
        alias: 'e',
        description: 'Path to the input election definition',
      },
      outputPath: {
        type: 'string',
        alias: 'o',
        description: 'Path to write output file to',
      },
      numBallots: {
        type: 'number',
        description: 'Number of ballots to include in the output.',
      },
      liveBallots: {
        type: 'boolean',
        default: false,
        description:
          'Create live mode ballots when specified, by default test mode ballots are created.',
      },
      scannerNames: {
        type: 'array',
        description: 'Creates ballots for each scanner name specified.',
      },
    })
    .alias('-h', '--help')
    .help(false)
    .version(false)
    .fail((msg, err) => {
      if (err) {
        stderr.write(`${err}\n`);
      }
      exitCode = 1;
    });

  if (typeof exitCode !== 'undefined') {
    return exitCode;
  }

  const args: GenerateCvrFileArguments = optionParser.parse(argv.slice(2));

  if (args.help) {
    optionParser.showHelp((out) => {
      stdout.write(out);
      stdout.write('\n');
    });
    return 0;
  }

  if (!args.electionPath) {
    stderr.write('Missing election path\n');
    return 1;
  }

  const outputPath = args.outputPath ?? 'output.jsonl';
  const { numBallots } = args;
  const testMode = !(args.liveBallots ?? false);
  const scannerNames = (args.scannerNames ?? ['scanner']).map((s) => `${s}`);

  const electionRawData = fs.readFileSync(args.electionPath, 'utf8');
  const election = safeParseElection(electionRawData).unsafeUnwrap();

  const castVoteRecords = [...generateCvrs(election, scannerNames, testMode)];

  // Modify results to match the desired number of ballots
  if (numBallots !== undefined && numBallots < castVoteRecords.length) {
    stderr.write(
      `WARNING: At least ${castVoteRecords.length} are suggested to be generated for maximum coverage of ballot metadata options and possible contest votes.\n`
    );
    // Remove random entries from the CVR list until the desired number of ballots is reach
    while (numBallots < castVoteRecords.length) {
      const i = Math.floor(Math.random() * castVoteRecords.length);
      castVoteRecords.splice(i, 1);
    }
  }

  let ballotId = castVoteRecords.length;
  // Duplicate random ballots until the desired number of ballots is reached.
  while (numBallots !== undefined && numBallots > castVoteRecords.length) {
    const i = Math.floor(Math.random() * castVoteRecords.length);
    castVoteRecords.push({
      ...castVoteRecords[i],
      _ballotId: unsafeParse(BallotIdSchema, `id-${ballotId}`),
    });
    ballotId += 1;
  }

  const stream = fs.createWriteStream(outputPath);
  for (const record of castVoteRecords) {
    stream.write(`${JSON.stringify(record)}\n`);
  }
  stream.end();

  stdout.write(
    `Wrote ${castVoteRecords.length} cast vote records to ${outputPath}\n`
  );

  return 0;
}
