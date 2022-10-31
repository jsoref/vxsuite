/* Generated by res-to-ts. DO NOT EDIT */
/* eslint-disable */
/* istanbul ignore file */

import { Buffer } from 'buffer';
import { mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, sep } from 'path';

/**
 * Data of data/electionMinimalExhaustiveSample/precinctScannerCardTallies/pollsClosedSinglePrecinct.json encoded as base64.
 *
 * SHA-256 hash of file data: 91fb12409b9a6fac9cc8949231b356931e4438fb91ad623553344379b28b62b7
 */
const resourceDataBase64 = 'ewogICJ0YWxseU1hY2hpbmVUeXBlIjogInByZWNpbmN0X3NjYW5uZXIiLAogICJ0b3RhbEJhbGxvdHNTY2FubmVkIjogMCwKICAiaXNMaXZlTW9kZSI6IGZhbHNlLAogICJpc1BvbGxzT3BlbiI6IGZhbHNlLAogICJtYWNoaW5lSWQiOiAiMDAwMCIsCiAgInRpbWVTYXZlZCI6IDE2NjU2MTc2MjkzNzksCiAgInRpbWVQb2xsc1RvZ2dsZWQiOiAxNjY1NjE3NjI5Mzc5LAogICJwcmVjaW5jdFNlbGVjdGlvbiI6IHsKICAgICJraW5kIjogIlNpbmdsZVByZWNpbmN0IiwKICAgICJwcmVjaW5jdElkIjogInByZWNpbmN0LTEiCiAgfSwKICAiYmFsbG90Q291bnRzIjogewogICAgIjAscHJlY2luY3QtMSI6IFswLCAwXSwKICAgICIxLHByZWNpbmN0LTEiOiBbMCwgMF0sCiAgICAiMCxfX0FMTF9QUkVDSU5DVFMiOiBbMCwgMF0sCiAgICAiMSxfX0FMTF9QUkVDSU5DVFMiOiBbMCwgMF0KICB9LAogICJ0YWxsaWVzQnlQcmVjaW5jdCI6IHsKICAgICJwcmVjaW5jdC0xIjogWwogICAgICBbMCwgMCwgMCwgMCwgMCwgMCwgMF0sCiAgICAgIFswLCAwLCAwLCAwLCAwLCAwXSwKICAgICAgWzAsIDAsIDAsIDAsIDAsIDAsIDAsIDBdLAogICAgICBbMCwgMCwgMCwgMCwgMCwgMCwgMCwgMF0sCiAgICAgIFswLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwXSwKICAgICAgWzAsIDAsIDAsIDAsIDBdCiAgICBdCiAgfSwKICAidGFsbHkiOiBbCiAgICBbMCwgMCwgMCwgMCwgMCwgMCwgMF0sCiAgICBbMCwgMCwgMCwgMCwgMCwgMF0sCiAgICBbMCwgMCwgMCwgMCwgMCwgMCwgMCwgMF0sCiAgICBbMCwgMCwgMCwgMCwgMCwgMCwgMCwgMF0sCiAgICBbMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMF0sCiAgICBbMCwgMCwgMCwgMCwgMF0KICBdCn0K';

/**
 * MIME type of data/electionMinimalExhaustiveSample/precinctScannerCardTallies/pollsClosedSinglePrecinct.json.
 */
export const mimeType = 'application/json';

/**
 * Path to a file containing this file's contents.
 *
 * SHA-256 hash of file data: 91fb12409b9a6fac9cc8949231b356931e4438fb91ad623553344379b28b62b7
 */
export function asFilePath(): string {
  const directoryPath = mkdtempSync(tmpdir() + sep);
  const filePath = join(directoryPath, 'pollsClosedSinglePrecinct.json');
  writeFileSync(filePath, asBuffer());
  return filePath;
}

/**
 * Convert to a `data:` URL of data/electionMinimalExhaustiveSample/precinctScannerCardTallies/pollsClosedSinglePrecinct.json, suitable for embedding in HTML.
 *
 * SHA-256 hash of file data: 91fb12409b9a6fac9cc8949231b356931e4438fb91ad623553344379b28b62b7
 */
export function asDataUrl(): string {
  return `data:${mimeType};base64,${resourceDataBase64}`;
}

/**
 * Raw data of data/electionMinimalExhaustiveSample/precinctScannerCardTallies/pollsClosedSinglePrecinct.json.
 *
 * SHA-256 hash of file data: 91fb12409b9a6fac9cc8949231b356931e4438fb91ad623553344379b28b62b7
 */
export function asBuffer(): Buffer {
  return Buffer.from(resourceDataBase64, 'base64');
}

/**
 * Text content of data/electionMinimalExhaustiveSample/precinctScannerCardTallies/pollsClosedSinglePrecinct.json.
 *
 * SHA-256 hash of file data: 91fb12409b9a6fac9cc8949231b356931e4438fb91ad623553344379b28b62b7
 */
export function asText(): string {
  return asBuffer().toString('utf-8');
}