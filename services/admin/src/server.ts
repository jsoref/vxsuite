import { Admin } from '@votingworks/api';
import { LogEventId, Logger, LogSource } from '@votingworks/logging';
import {
  BallotPageLayout,
  CandidateContest,
  getBallotStyle,
  getContests,
  Id,
  InlineBallotImage,
  Rect,
  safeParse,
  safeParseNumber,
} from '@votingworks/types';
import { zip } from '@votingworks/utils';
import express, { Application } from 'express';
import { readFileSync } from 'fs';
import multer from 'multer';
import { basename } from 'path';
import { ADMIN_WORKSPACE, PORT } from './globals';
import { Store } from './store';
import { createWorkspace, Workspace } from './util/workspace';

type NoParams = never;

const CVR_FILE_ATTACHMENT_NAME = 'cvrFile';
const MAX_UPLOAD_FILE_SIZE = 2 * 1000 * 1024 * 1024; // 2GB

/**
 * Builds an express application.
 */
export function buildApp({ store }: { store: Store }): Application {
  const app: Application = express();
  const upload = multer({
    storage: multer.diskStorage({}),
    limits: { fileSize: MAX_UPLOAD_FILE_SIZE },
  });

  app.use(express.raw());
  app.use(express.json({ limit: '50mb', type: 'application/json' }));
  app.use(express.urlencoded({ extended: false }));

  app.get<NoParams>('/admin/elections', (_request, response) => {
    response.json(store.getElections());
  });

  app.post<NoParams, Admin.PostElectionResponse, Admin.PostElectionRequest>(
    '/admin/elections',
    (request, response) => {
      const parseResult = safeParse(
        Admin.PostElectionRequestSchema,
        request.body
      );

      if (parseResult.isErr()) {
        response.status(400).json({
          status: 'error',
          errors: [
            { type: 'ValidationError', message: parseResult.err().message },
          ],
        });
        return;
      }

      const electionDefinition = parseResult.ok();
      const electionId = store.addElection(electionDefinition.electionData);
      response.json({ status: 'ok', id: electionId });
    }
  );

  app.delete<{ electionId: Id }>(
    '/admin/elections/:electionId',
    (request, response) => {
      store.deleteElection(request.params.electionId);
      response.json({ status: 'ok' });
    }
  );

  app.post<
    { electionId: Id },
    Admin.PostCvrFileResponse,
    Admin.PostCvrFileRequest
  >(
    '/admin/elections/:electionId/cvr-files',
    upload.fields([{ name: CVR_FILE_ATTACHMENT_NAME, maxCount: 1 }]),
    (request, response) => {
      const { electionId } = request.params;
      /* istanbul ignore next */
      const file = !Array.isArray(request.files)
        ? request.files?.[CVR_FILE_ATTACHMENT_NAME]?.[0]
        : undefined;

      if (!file) {
        response.status(400).json({
          status: 'error',
          errors: [
            {
              type: 'invalid-value',
              message: `expected file field to be named "${CVR_FILE_ATTACHMENT_NAME}"`,
            },
          ],
        });
        return;
      }

      const parseQueryResult = safeParse(
        Admin.PostCvrFileQueryParamsSchema,
        request.query
      );

      if (parseQueryResult.isErr()) {
        response.status(400).json({
          status: 'error',
          errors: [
            {
              type: 'ValidationError',
              message: parseQueryResult.err().message,
            },
          ],
        });
        return;
      }

      const { analyzeOnly } = parseQueryResult.ok();
      const filename = basename(file.originalname);
      const cvrFile = readFileSync(file.path, 'utf8');
      const result = store.addCastVoteRecordFile({
        electionId,
        filename,
        cvrFile,
        analyzeOnly,
      });

      if (result.isErr()) {
        response.status(400).json({
          status: 'error',
          errors: [
            {
              type: result.err().kind,
              message: JSON.stringify(result.err()),
            },
          ],
        });
        return;
      }

      const { id, wasExistingFile, newlyAdded, alreadyPresent } = result.ok();
      const body: Admin.PostCvrFileResponse = {
        status: 'ok',
        id,
        wasExistingFile,
        newlyAdded,
        alreadyPresent,
      };

      response.json(body);
    }
  );

  app.delete<
    { electionId: Id },
    Admin.DeleteCvrFileResponse,
    Admin.DeleteCvrFileRequest
  >('/admin/elections/:electionId/cvr-files', (request, response) => {
    const { electionId } = request.params;
    store.deleteCastVoteRecordFiles(electionId);
    response.json({ status: 'ok' });
  });

  app.get<{ electionId: Id }, Admin.GetWriteInsResponse>(
    '/admin/elections/:electionId/write-ins',
    (request, response) => {
      const parseQueryResult = safeParse(
        Admin.GetWriteInsQueryParamsSchema,
        request.query
      );

      if (parseQueryResult.isErr()) {
        response.status(400).json({
          status: 'error',
          errors: [
            {
              type: 'ValidationError',
              message: parseQueryResult.err().message,
            },
          ],
        });
        return;
      }

      const { contestId, status, limit } = parseQueryResult.ok();
      const { electionId } = request.params;
      response.json(
        store.getWriteInRecords({
          electionId,
          contestId,
          status,
          limit,
        })
      );
    }
  );

  app.put<
    { writeInId: Id },
    Admin.PutWriteInTranscriptionResponse,
    Admin.PutWriteInTranscriptionRequest
  >('/admin/write-ins/:writeInId/transcription', (request, response) => {
    const { writeInId } = request.params;
    const parseResult = safeParse(
      Admin.PutWriteInTranscriptionRequestSchema,
      request.body
    );

    if (parseResult.isErr()) {
      response.status(400).json({
        status: 'error',
        errors: [
          {
            type: 'ValidationError',
            message: parseResult.err().message,
          },
        ],
      });
      return;
    }

    store.transcribeWriteIn(writeInId, parseResult.ok().value);
    response.json({ status: 'ok' });
  });

  app.get<
    { electionId: Id },
    Admin.GetWriteInAdjudicationsResponse,
    Admin.GetWriteInAdjudicationsRequest,
    Admin.GetWriteInAdjudicationsQueryParams
  >(
    '/admin/elections/:electionId/write-in-adjudications',
    (request, response) => {
      const parseQueryResult = safeParse(
        Admin.GetWriteInAdjudicationsQueryParamsSchema,
        request.query
      );

      if (parseQueryResult.isErr()) {
        response.status(400).json({
          status: 'error',
          errors: [
            {
              type: 'ValidationError',
              message: parseQueryResult.err().message,
            },
          ],
        });
        return;
      }

      const { electionId } = request.params;
      const { contestId } = parseQueryResult.ok();

      const writeInAdjudications = store.getWriteInAdjudicationRecords({
        electionId,
        contestId,
      });

      response.json(writeInAdjudications);
    }
  );

  app.post<
    { electionId: Id },
    Admin.PostWriteInAdjudicationResponse,
    Admin.PostWriteInAdjudicationRequest
  >(
    '/admin/elections/:electionId/write-in-adjudications',
    (request, response) => {
      const { electionId } = request.params;
      const parseResult = safeParse(
        Admin.PostWriteInAdjudicationRequestSchema,
        request.body
      );

      if (parseResult.isErr()) {
        response.status(400).json({
          status: 'error',
          errors: [
            {
              type: 'ValidationError',
              message: parseResult.err().message,
            },
          ],
        });
        return;
      }

      const {
        contestId,
        transcribedValue,
        adjudicatedValue,
        adjudicatedOptionId,
      } = parseResult.ok();

      const id = store.createWriteInAdjudication({
        electionId,
        contestId,
        transcribedValue,
        adjudicatedValue,
        adjudicatedOptionId,
      });

      response.json({ status: 'ok', id });
    }
  );

  app.put<
    { writeInAdjudicationId: Id },
    Admin.PutWriteInAdjudicationResponse,
    Admin.PutWriteInAdjudicationRequest
  >(
    '/admin/write-in-adjudications/:writeInAdjudicationId',
    (request, response) => {
      const { writeInAdjudicationId } = request.params;
      const parseResult = safeParse(
        Admin.PutWriteInAdjudicationRequestSchema,
        request.body
      );

      if (parseResult.isErr()) {
        response.status(400).json({
          status: 'error',
          errors: [
            {
              type: 'ValidationError',
              message: parseResult.err().message,
            },
          ],
        });
        return;
      }

      store.updateWriteInAdjudication(writeInAdjudicationId, parseResult.ok());
      response.json({ status: 'ok' });
    }
  );

  app.delete<
    { writeInAdjudicationId: Id },
    Admin.DeleteWriteInAdjudicationResponse,
    Admin.DeleteWriteInAdjudicationRequest
  >(
    '/admin/write-in-adjudications/:writeInAdjudicationId',
    (request, response) => {
      const { writeInAdjudicationId } = request.params;
      store.deleteWriteInAdjudication(writeInAdjudicationId);
      response.json({ status: 'ok' });
    }
  );

  app.get<
    { electionId: Id },
    Admin.GetWriteInSummaryResponse,
    Admin.GetWriteInSummaryRequest,
    Admin.GetWriteInSummaryQueryParams
  >('/admin/elections/:electionId/write-in-summary', (request, response) => {
    const { electionId } = request.params;
    const parseQueryResult = safeParse(
      Admin.GetWriteInSummaryQueryParamsSchema,
      request.query
    );

    if (parseQueryResult.isErr()) {
      response.status(400).json({
        status: 'error',
        errors: [
          {
            type: 'ValidationError',
            message: parseQueryResult.err().message,
          },
        ],
      });
      return;
    }

    const { contestId, status } = parseQueryResult.ok();
    response.json(
      store.getWriteInAdjudicationSummary({
        electionId,
        contestId,
        status,
      })
    );
  });

  app.get<
    Admin.GetWriteInAdjudicationTableUrlParams,
    Admin.GetWriteInAdjudicationTableResponse,
    Admin.GetWriteInAdjudicationTableRequest
  >(
    '/admin/elections/:electionId/contests/:contestId/write-in-adjudication-table',
    (request, response) => {
      const { electionId, contestId } = request.params;
      const electionRecord = store.getElection(electionId);

      if (!electionRecord) {
        return response.status(404).end();
      }

      const contest = electionRecord.electionDefinition.election.contests.find(
        (c): c is CandidateContest =>
          c.type === 'candidate' && c.id === contestId
      );

      if (!contest) {
        return response.status(404).end();
      }

      const writeInSummaries = store
        .getWriteInAdjudicationSummary({
          electionId,
          contestId,
        })
        .filter(
          (s): s is Admin.WriteInSummaryEntryNonPending =>
            s.status !== 'pending'
        );

      const table = Admin.Views.writeInAdjudicationTable.render(
        contest,
        writeInSummaries
      );

      response.json({ status: 'ok', table });
    }
  );

  /* istanbul ignore next */
  app.get<
    { writeInId: Id },
    Admin.GetWriteInImageResponse,
    Admin.GetWriteInImageRequest
  >('/admin/write-in-image/:writeInId', (request, response) => {
    const { writeInId } = request.params;

    const castVoteRecordData = store.getCastVoteRecordForWriteIn(writeInId);
    if (!castVoteRecordData) {
      response.status(400).json({
        status: 'error',
        errors: [
          {
            type: 'invalid-value',
            message: `invalid write in Id`,
          },
        ],
      });
      return;
    }
    const { contestId, optionId, electionId, cvr } = castVoteRecordData;

    const electionRecord = store.getElection(electionId);
    if (!electionRecord) {
      response.status(400).json({
        status: 'error',
        errors: [
          {
            type: 'invalid-value',
            message: `invalid election Id`,
          },
        ],
      });
      return;
    }
    const { election } = electionRecord.electionDefinition;

    try {
      const ballotStyle = getBallotStyle({
        ballotStyleId: cvr._ballotStyleId,
        election,
      });
      if (cvr._layouts === undefined || cvr._ballotImages === undefined) {
        response.json([]); // The CVR does not have ballot images.
        return;
      }
      if (!ballotStyle) {
        throw new Error('unexpected types');
      }
      const allContestIdsForBallotStyle = getContests({
        ballotStyle,
        election,
      }).map((c) => c.id);
      const [layouts, ballotImages] = [...zip(cvr._layouts, cvr._ballotImages)]
        .sort(([a], [b]) => a.metadata.pageNumber - b.metadata.pageNumber)
        .reduce<[BallotPageLayout[], InlineBallotImage[]]>(
          ([layoutsAcc, ballotImagesAcc], [layout, ballotImage]) => [
            [...layoutsAcc, layout],
            [...ballotImagesAcc, ballotImage],
          ],
          [[], []]
        );
      let contestIdx = allContestIdsForBallotStyle.indexOf(contestId);
      let currentLayoutOptionIdx = 0;
      let currentLayout = layouts[currentLayoutOptionIdx];
      while (currentLayout && contestIdx >= currentLayout.contests.length) {
        currentLayoutOptionIdx += 1;
        currentLayout = layouts[currentLayoutOptionIdx];
        if (!currentLayout) {
          throw new Error('unexpected types');
        }
        contestIdx -= currentLayout.contests.length;
      }
      currentLayout = layouts[currentLayoutOptionIdx];
      if (!currentLayout) {
        throw new Error('unexpected types');
      }
      const contestLayout =
        layouts[currentLayoutOptionIdx]?.contests[contestIdx];

      // Options are laid out from the bottom up, so we reverse write-ins to get the correct bounds
      const writeInOptions = contestLayout?.options
        .filter((option) => option.definition?.id.startsWith('write-in'))
        .reverse();

      const writeInOptionIndex = safeParseNumber(
        optionId.slice('write-in-'.length)
      );
      if (
        writeInOptionIndex.isErr() ||
        writeInOptions === undefined ||
        contestLayout === undefined
      ) {
        throw new Error('unexpected types');
      }
      const writeInLayout = writeInOptions[writeInOptionIndex.ok()];
      const currentBallotImage = ballotImages[currentLayoutOptionIdx];
      if (writeInLayout === undefined || currentBallotImage === undefined) {
        throw new Error('unexpected types');
      }
      const writeInBounds = writeInLayout.bounds;
      const contestBounds = contestLayout.bounds;
      const fullBallotBounds: Rect = {
        ...currentLayout.pageSize,
        x: 0,
        y: 0,
      };
      response.json([
        {
          image: currentBallotImage.normalized,
          ballotCoordinates: fullBallotBounds,
          contestCoordinates: contestBounds,
          writeInCoordinates: writeInBounds,
        },
      ]);
    } catch (error: unknown) {
      response.status(400).json({
        status: 'error',
        errors: [
          {
            type: 'unexpected-error',
            message:
              error instanceof Error ? error.message : 'unexpected error',
          },
        ],
      });
    }
  });

  return app;
}

/**
 * Options for starting the admin service.
 */
export interface StartOptions {
  app: Application;
  logger: Logger;
  port: number | string;
  workspace: Workspace;
}

/**
 * Starts the server with all the default options.
 */
export async function start({
  app,
  logger = new Logger(LogSource.VxAdminService),
  port = PORT,
  workspace,
}: Partial<StartOptions>): Promise<void> {
  let resolvedWorkspace = workspace;

  if (workspace) {
    resolvedWorkspace = workspace;
  } else {
    const workspacePath = ADMIN_WORKSPACE;
    if (!workspacePath) {
      await logger.log(LogEventId.AdminServiceConfigurationMessage, 'system', {
        message:
          'workspace path could not be determined; pass a workspace or run with ADMIN_WORKSPACE',
        disposition: 'failure',
      });
      throw new Error(
        'workspace path could not be determined; pass a workspace or run with ADMIN_WORKSPACE'
      );
    }
    /* istanbul ignore next */
    resolvedWorkspace = createWorkspace(workspacePath);
  }

  /* istanbul ignore next */
  const resolvedApp = app ?? buildApp({ store: resolvedWorkspace.store });

  resolvedApp.listen(port, async () => {
    await logger.log(LogEventId.ApplicationStartup, 'system', {
      message: `Admin Service running at http://localhost:${port}/`,
      disposition: 'success',
    });
  });
}
