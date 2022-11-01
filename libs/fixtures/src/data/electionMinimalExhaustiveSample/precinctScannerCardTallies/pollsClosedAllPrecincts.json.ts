/* Generated by res-to-ts. DO NOT EDIT */
/* eslint-disable */
/* istanbul ignore file */

import { Buffer } from 'buffer';
import { mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, sep } from 'path';

/**
 * Data of data/electionMinimalExhaustiveSample/precinctScannerCardTallies/pollsClosedAllPrecincts.json encoded as base64.
 *
 * SHA-256 hash of file data: a270fd6a45ddd884470e2fdff523963a192da0901d2956344d8f93363536a0d4
 */
const resourceDataBase64 = 'ewogICJ0YWxseU1hY2hpbmVUeXBlIjogInByZWNpbmN0X3NjYW5uZXIiLAogICJ0b3RhbEJhbGxvdHNTY2FubmVkIjogMCwKICAiaXNMaXZlTW9kZSI6IGZhbHNlLAogICJwb2xsc1RyYW5zaXRpb24iOiAiY2xvc2VfcG9sbHMiLAogICJtYWNoaW5lSWQiOiAiMDAwMCIsCiAgInRpbWVTYXZlZCI6IDE2NjU2MTYwNjk3NjksCiAgInRpbWVQb2xsc1RyYW5zaXRpb25lZCI6IDE2NjU2MTYwNjk3NjksCiAgInByZWNpbmN0U2VsZWN0aW9uIjogewogICAgImtpbmQiOiAiQWxsUHJlY2luY3RzIgogIH0sCiAgImJhbGxvdENvdW50cyI6IHsKICAgICIwLHByZWNpbmN0LTEiOiBbMCwgMF0sCiAgICAiMCxwcmVjaW5jdC0yIjogWzAsIDBdLAogICAgIjEscHJlY2luY3QtMSI6IFswLCAwXSwKICAgICIxLHByZWNpbmN0LTIiOiBbMCwgMF0sCiAgICAiMCxfX0FMTF9QUkVDSU5DVFMiOiBbMCwgMF0sCiAgICAiMSxfX0FMTF9QUkVDSU5DVFMiOiBbMCwgMF0KICB9LAogICJ0YWxsaWVzQnlQcmVjaW5jdCI6IHsKICAgICJwcmVjaW5jdC0xIjogWwogICAgICBbMCwgMCwgMCwgMCwgMCwgMCwgMF0sCiAgICAgIFswLCAwLCAwLCAwLCAwLCAwXSwKICAgICAgWzAsIDAsIDAsIDAsIDAsIDAsIDAsIDBdLAogICAgICBbMCwgMCwgMCwgMCwgMCwgMCwgMCwgMF0sCiAgICAgIFswLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwXSwKICAgICAgWzAsIDAsIDAsIDAsIDBdCiAgICBdLAogICAgInByZWNpbmN0LTIiOiBbCiAgICAgIFswLCAwLCAwLCAwLCAwLCAwLCAwXSwKICAgICAgWzAsIDAsIDAsIDAsIDAsIDBdLAogICAgICBbMCwgMCwgMCwgMCwgMCwgMCwgMCwgMF0sCiAgICAgIFswLCAwLCAwLCAwLCAwLCAwLCAwLCAwXSwKICAgICAgWzAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDBdLAogICAgICBbMCwgMCwgMCwgMCwgMF0KICAgIF0KICB9LAogICJ0YWxseSI6IFsKICAgIFswLCAwLCAwLCAwLCAwLCAwLCAwXSwKICAgIFswLCAwLCAwLCAwLCAwLCAwXSwKICAgIFswLCAwLCAwLCAwLCAwLCAwLCAwLCAwXSwKICAgIFswLCAwLCAwLCAwLCAwLCAwLCAwLCAwXSwKICAgIFswLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwXSwKICAgIFswLCAwLCAwLCAwLCAwXQogIF0KfQo=';

/**
 * MIME type of data/electionMinimalExhaustiveSample/precinctScannerCardTallies/pollsClosedAllPrecincts.json.
 */
export const mimeType = 'application/json';

/**
 * Path to a file containing this file's contents.
 *
 * SHA-256 hash of file data: a270fd6a45ddd884470e2fdff523963a192da0901d2956344d8f93363536a0d4
 */
export function asFilePath(): string {
  const directoryPath = mkdtempSync(tmpdir() + sep);
  const filePath = join(directoryPath, 'pollsClosedAllPrecincts.json');
  writeFileSync(filePath, asBuffer());
  return filePath;
}

/**
 * Convert to a `data:` URL of data/electionMinimalExhaustiveSample/precinctScannerCardTallies/pollsClosedAllPrecincts.json, suitable for embedding in HTML.
 *
 * SHA-256 hash of file data: a270fd6a45ddd884470e2fdff523963a192da0901d2956344d8f93363536a0d4
 */
export function asDataUrl(): string {
  return `data:${mimeType};base64,${resourceDataBase64}`;
}

/**
 * Raw data of data/electionMinimalExhaustiveSample/precinctScannerCardTallies/pollsClosedAllPrecincts.json.
 *
 * SHA-256 hash of file data: a270fd6a45ddd884470e2fdff523963a192da0901d2956344d8f93363536a0d4
 */
export function asBuffer(): Buffer {
  return Buffer.from(resourceDataBase64, 'base64');
}

/**
 * Text content of data/electionMinimalExhaustiveSample/precinctScannerCardTallies/pollsClosedAllPrecincts.json.
 *
 * SHA-256 hash of file data: a270fd6a45ddd884470e2fdff523963a192da0901d2956344d8f93363536a0d4
 */
export function asText(): string {
  return asBuffer().toString('utf-8');
}