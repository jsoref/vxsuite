/* Generated by res-to-ts. DO NOT EDIT */
/* eslint-disable */
/* istanbul ignore file */

import { Buffer } from 'buffer';
import { mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, sep } from 'path';

/**
 * Data of data/electionMinimalExhaustiveSample/precinctScannerCardTallies/pollsOpenSinglePrecinct.json encoded as base64.
 *
 * SHA-256 hash of file data: 61caefbc45257c0202400a10fd8292adc64a7cdba03d825ce8eba2492fc5ea17
 */
const resourceDataBase64 = 'ewogICJ0YWxseU1hY2hpbmVUeXBlIjogInByZWNpbmN0X3NjYW5uZXIiLAogICJ0b3RhbEJhbGxvdHNTY2FubmVkIjogMCwKICAiaXNMaXZlTW9kZSI6IGZhbHNlLAogICJwb2xsc1RyYW5zaXRpb24iOiAib3Blbl9wb2xscyIsCiAgIm1hY2hpbmVJZCI6ICIwMDAwIiwKICAidGltZVNhdmVkIjogMTY2NTYxNzU1Mzg1MSwKICAidGltZVBvbGxzVHJhbnNpdGlvbmVkIjogMTY2NTYxNzU1Mzg1MSwKICAicHJlY2luY3RTZWxlY3Rpb24iOiB7CiAgICAia2luZCI6ICJTaW5nbGVQcmVjaW5jdCIsCiAgICAicHJlY2luY3RJZCI6ICJwcmVjaW5jdC0xIgogIH0sCiAgImJhbGxvdENvdW50cyI6IHsKICAgICIwLHByZWNpbmN0LTEiOiBbMCwgMF0sCiAgICAiMSxwcmVjaW5jdC0xIjogWzAsIDBdLAogICAgIjAsX19BTExfUFJFQ0lOQ1RTIjogWzAsIDBdLAogICAgIjEsX19BTExfUFJFQ0lOQ1RTIjogWzAsIDBdCiAgfSwKICAidGFsbGllc0J5UHJlY2luY3QiOiB7CiAgICAicHJlY2luY3QtMSI6IFsKICAgICAgWzAsIDAsIDAsIDAsIDAsIDAsIDBdLAogICAgICBbMCwgMCwgMCwgMCwgMCwgMF0sCiAgICAgIFswLCAwLCAwLCAwLCAwLCAwLCAwLCAwXSwKICAgICAgWzAsIDAsIDAsIDAsIDAsIDAsIDAsIDBdLAogICAgICBbMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMF0sCiAgICAgIFswLCAwLCAwLCAwLCAwXQogICAgXQogIH0sCiAgInRhbGx5IjogWwogICAgWzAsIDAsIDAsIDAsIDAsIDAsIDBdLAogICAgWzAsIDAsIDAsIDAsIDAsIDBdLAogICAgWzAsIDAsIDAsIDAsIDAsIDAsIDAsIDBdLAogICAgWzAsIDAsIDAsIDAsIDAsIDAsIDAsIDBdLAogICAgWzAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDBdLAogICAgWzAsIDAsIDAsIDAsIDBdCiAgXQp9Cg==';

/**
 * MIME type of data/electionMinimalExhaustiveSample/precinctScannerCardTallies/pollsOpenSinglePrecinct.json.
 */
export const mimeType = 'application/json';

/**
 * Path to a file containing this file's contents.
 *
 * SHA-256 hash of file data: 61caefbc45257c0202400a10fd8292adc64a7cdba03d825ce8eba2492fc5ea17
 */
export function asFilePath(): string {
  const directoryPath = mkdtempSync(tmpdir() + sep);
  const filePath = join(directoryPath, 'pollsOpenSinglePrecinct.json');
  writeFileSync(filePath, asBuffer());
  return filePath;
}

/**
 * Convert to a `data:` URL of data/electionMinimalExhaustiveSample/precinctScannerCardTallies/pollsOpenSinglePrecinct.json, suitable for embedding in HTML.
 *
 * SHA-256 hash of file data: 61caefbc45257c0202400a10fd8292adc64a7cdba03d825ce8eba2492fc5ea17
 */
export function asDataUrl(): string {
  return `data:${mimeType};base64,${resourceDataBase64}`;
}

/**
 * Raw data of data/electionMinimalExhaustiveSample/precinctScannerCardTallies/pollsOpenSinglePrecinct.json.
 *
 * SHA-256 hash of file data: 61caefbc45257c0202400a10fd8292adc64a7cdba03d825ce8eba2492fc5ea17
 */
export function asBuffer(): Buffer {
  return Buffer.from(resourceDataBase64, 'base64');
}

/**
 * Text content of data/electionMinimalExhaustiveSample/precinctScannerCardTallies/pollsOpenSinglePrecinct.json.
 *
 * SHA-256 hash of file data: 61caefbc45257c0202400a10fd8292adc64a7cdba03d825ce8eba2492fc5ea17
 */
export function asText(): string {
  return asBuffer().toString('utf-8');
}