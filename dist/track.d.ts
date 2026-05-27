import type { FleetVersionReport, TrackOptions } from "./types.js";
/**
 * Track spec-version distribution across a list of pre-loaded documents.
 *
 * For each (protocol, version) pair, accumulate the file count and the
 * referencing paths. Flag findings for version drift (≥ 2 versions for the
 * same protocol), low-confidence routings, and unknown documents.
 */
export declare function track(files: Array<{
    path: string;
    doc: unknown;
}>, opts?: TrackOptions): FleetVersionReport;
