import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { run, type RunnerEnv } from "../src/runner.js";
import { track } from "../src/track.js";
import { detect } from "../src/detect.js";
import { toMarkdown, toSummary } from "../src/format.js";

const here = fileURLToPath(new URL(".", import.meta.url));
const FIXTURES = `${here}/../fixtures/mixed`;

function envWithInputs(inputs: Record<string, string>): RunnerEnv {
  return {
    inputs,
    readFile: (p) => readFileSync(p, "utf8"),
    readDir: (p) => readdirSync(p),
    isFile: (p) => statSync(p).isFile(),
    write: () => undefined
  };
}

describe("runner.run", () => {
  it("exits 1 when fail-on-drift set and drift detected", async () => {
    const r = await run(envWithInputs({ dir: FIXTURES, fail_on_drift: "true", comment_on_pr: "false" }));
    expect(r.exitCode).toBe(1);
    expect(r.report.buckets.some((b) => b.hasDrift)).toBe(true);
    expect(r.commentPosted).toBe(false);
  });

  it("exits 0 when fail-on-drift is false even with drift", async () => {
    const r = await run(envWithInputs({ dir: FIXTURES, fail_on_drift: "false", comment_on_pr: "false" }));
    expect(r.exitCode).toBe(0);
  });

  it("rejects when dir input is missing", async () => {
    await expect(run({ inputs: {} })).rejects.toThrow(/dir/);
  });

  it("posts a PR comment in pull_request context", async () => {
    const calls: Array<{ body: string }> = [];
    const env: RunnerEnv = {
      inputs: { dir: FIXTURES, comment_on_pr: "auto", github_token: "ghs_test", fail_on_drift: "false" },
      GITHUB_EVENT_NAME: "pull_request",
      GITHUB_REPOSITORY: "mizcausevic-dev/test",
      GITHUB_EVENT_PATH: `${here}/event.json`,
      readFile: (p) => (p.endsWith("event.json") ? JSON.stringify({ number: 42 }) : readFileSync(p, "utf8")),
      readDir: (p) => readdirSync(p),
      isFile: (p) => statSync(p).isFile(),
      postComment: async (args) => { calls.push({ body: args.body }); },
      write: () => undefined
    };
    const r = await run(env);
    expect(r.commentPosted).toBe(true);
    expect(calls[0].body).toContain("Suite spec-version tracker");
  });

  it("skips PR comment when token is missing", async () => {
    const env: RunnerEnv = {
      inputs: { dir: FIXTURES, comment_on_pr: "true", fail_on_drift: "false" },
      GITHUB_REPOSITORY: "x/y",
      GITHUB_EVENT_PATH: "/event.json",
      readFile: (p) => (p.endsWith("event.json") ? "{}" : readFileSync(p, "utf8")),
      readDir: (p) => readdirSync(p),
      isFile: (p) => statSync(p).isFile(),
      write: () => undefined
    };
    const r = await run(env);
    expect(r.commentPosted).toBe(false);
    expect(r.reason).toBe("no github-token provided");
  });

  it("skips PR comment when GITHUB_EVENT_PATH missing", async () => {
    const env: RunnerEnv = {
      inputs: { dir: FIXTURES, comment_on_pr: "true", github_token: "ghs", fail_on_drift: "false" },
      GITHUB_REPOSITORY: "x/y",
      readFile: (p) => readFileSync(p, "utf8"),
      readDir: (p) => readdirSync(p),
      isFile: (p) => statSync(p).isFile(),
      write: () => undefined
    };
    const r = await run(env);
    expect(r.commentPosted).toBe(false);
    expect(r.reason).toBe("no GITHUB_EVENT_PATH");
  });

  it("skips PR comment when event has no PR number", async () => {
    const env: RunnerEnv = {
      inputs: { dir: FIXTURES, comment_on_pr: "true", github_token: "ghs", fail_on_drift: "false" },
      GITHUB_REPOSITORY: "x/y",
      GITHUB_EVENT_PATH: "/event.json",
      readFile: (p) => (p.endsWith("event.json") ? "{}" : readFileSync(p, "utf8")),
      readDir: (p) => readdirSync(p),
      isFile: (p) => statSync(p).isFile(),
      write: () => undefined
    };
    const r = await run(env);
    expect(r.commentPosted).toBe(false);
    expect(r.reason).toBe("no PR number in event payload");
  });

  it("does not comment on non-PR events with comment_on_pr=auto", async () => {
    const env: RunnerEnv = {
      inputs: { dir: FIXTURES, comment_on_pr: "auto", github_token: "ghs", fail_on_drift: "false" },
      GITHUB_EVENT_NAME: "push",
      readFile: (p) => readFileSync(p, "utf8"),
      readDir: (p) => readdirSync(p),
      isFile: (p) => statSync(p).isFile(),
      write: () => undefined
    };
    const r = await run(env);
    expect(r.commentPosted).toBe(false);
  });
});

describe("unit coverage for track/detect/format", () => {
  it("detect routes high-confidence on versioned docs", () => {
    expect(detect({ agent_card_version: "0.1" }).protocol).toBe("agent-cards-spec");
    expect(detect({ tool_card_version: "0.1" }).protocol).toBe("mcp-tool-card-spec");
    expect(detect(null).protocol).toBe("unknown");
  });

  it("track returns drift detection on the mixed corpus", () => {
    const files = readdirSync(FIXTURES).filter((e) => e.endsWith(".json")).map((e) => ({
      path: `fixtures/mixed/${e}`,
      doc: JSON.parse(readFileSync(`${FIXTURES}/${e}`, "utf8"))
    }));
    const r = track(files, { now: "2026-05-27T00:00:00Z" });
    expect(r.files).toBe(9);
    expect(r.buckets.some((b) => b.hasDrift)).toBe(true);
  });

  it("toMarkdown + toSummary render", () => {
    const files = readdirSync(FIXTURES).filter((e) => e.endsWith(".json")).map((e) => ({
      path: `fixtures/mixed/${e}`,
      doc: JSON.parse(readFileSync(`${FIXTURES}/${e}`, "utf8"))
    }));
    const r = track(files, { now: "2026-05-27T00:00:00Z" });
    expect(toMarkdown(r)).toContain("Suite spec-version tracker");
    expect(toSummary(r)).toContain("files");
  });
});
