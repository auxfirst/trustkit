#!/usr/bin/env node
/**
 * aux-audit — score an agent product against the 10 AUX Heuristics.
 *
 *   aux-audit run ./spec.yaml
 *   aux-audit run ./spec.yaml --format sarif --out audit.sarif --fail-on high
 *
 * Exit codes:
 *   0  audit ran, nothing at or above --fail-on
 *   1  audit ran, findings at or above --fail-on
 *   2  the spec is invalid or the invocation is wrong (nothing was graded)
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { audit, shouldFail } from "./score.js";
import { loadEvidence, SpecError } from "./spec.js";
import { loadConfig } from "./config.js";
import { toJson } from "./report/json.js";
import { toMarkdown } from "./report/markdown.js";
import { toSarif } from "./report/sarif.js";
import { SEVERITY_ORDER, type Severity } from "./types.js";

const VERSION = "0.2.0";
const FORMATS = new Set(["md", "markdown", "json", "sarif"]);
const SEVERITIES = new Set(["low", "medium", "high", "critical"]);

const USAGE = `aux-audit ${VERSION} — score an agent product against the 10 AUX Heuristics

USAGE
  aux-audit run <spec.yaml> [options]

OPTIONS
  --config <path>     audit.config.yaml (ignore list, severity overrides, fail_on)
  --format <fmt>      md (default) | json | sarif
  --out <path>        write the report here instead of stdout
  --summary <path>    additionally write the Markdown scorecard here
                      (use with --format sarif to get a PR comment body)
  --fail-on <sev>     exit 1 on findings at or above: low | medium | high | critical

VERSIONS
  Both agent-spec formats are read, detected from the document rather than the
  filename. v1.0 scores per-action authority and its enforcing mechanisms; v0.1.0
  scores the older single autonomy label. Scores are not comparable across them.
  -h, --help          show this help
  -v, --version       print the version

EXIT CODES
  0  clean          1  findings at or above --fail-on          2  invalid spec or usage

The audit grades the spec, not the running product. It can prove a mechanism was
never declared; it cannot prove a declared one works.

Docs: https://github.com/auxfirst/trustkit/tree/main/packages/aux-audit
`;

interface Args {
  command?: string;
  spec?: string;
  config?: string;
  format: string;
  out?: string;
  summary?: string;
  failOn?: Severity;
  help: boolean;
  version: boolean;
}

class UsageError extends Error {}

function parseArgs(argv: string[]): Args {
  const args: Args = { format: "md", help: false, version: false };
  const positional: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    const takeValue = (name: string): string => {
      const value = argv[++i];
      if (value === undefined || value.startsWith("--")) {
        throw new UsageError(`${name} needs a value`);
      }
      return value;
    };
    switch (arg) {
      case "-h":
      case "--help":
        args.help = true;
        break;
      case "-v":
      case "--version":
        args.version = true;
        break;
      case "--config":
        args.config = takeValue("--config");
        break;
      case "--out":
        args.out = takeValue("--out");
        break;
      case "--summary":
        args.summary = takeValue("--summary");
        break;
      case "--format": {
        const value = takeValue("--format");
        if (!FORMATS.has(value)) {
          throw new UsageError(
            `--format must be md, json, or sarif (got: ${value})`,
          );
        }
        args.format = value === "markdown" ? "md" : value;
        break;
      }
      case "--fail-on": {
        const value = takeValue("--fail-on");
        if (!SEVERITIES.has(value)) {
          throw new UsageError(
            `--fail-on must be low, medium, high, or critical (got: ${value})`,
          );
        }
        args.failOn = value as Severity;
        break;
      }
      default:
        if (arg.startsWith("-")) throw new UsageError(`unknown option: ${arg}`);
        positional.push(arg);
    }
  }

  args.command = positional[0];
  args.spec = positional[1];
  return args;
}

function write(path: string, contents: string): void {
  mkdirSync(dirname(resolve(path)), { recursive: true });
  writeFileSync(path, contents);
}

function main(argv: string[]): number {
  let args: Args;
  try {
    args = parseArgs(argv);
  } catch (error) {
    process.stderr.write(`aux-audit: ${(error as Error).message}\n\n${USAGE}`);
    return 2;
  }

  if (args.version) {
    process.stdout.write(`${VERSION}\n`);
    return 0;
  }
  if (args.help || args.command === undefined) {
    process.stdout.write(USAGE);
    return args.command === undefined && !args.help ? 2 : 0;
  }
  if (args.command !== "run") {
    process.stderr.write(`aux-audit: unknown command: ${args.command}\n\n${USAGE}`);
    return 2;
  }
  if (args.spec === undefined) {
    process.stderr.write(`aux-audit: run needs a spec path\n\n${USAGE}`);
    return 2;
  }

  let config;
  try {
    config = args.config ? loadConfig(args.config) : {};
  } catch (error) {
    process.stderr.write(`aux-audit: ${(error as Error).message}\n`);
    return 2;
  }

  let report;
  try {
    const evidence = loadEvidence(args.spec);
    report = audit(evidence, {
      ignore: config.ignore,
      severityOverrides: config.severity_overrides,
      toolVersion: VERSION,
    });
  } catch (error) {
    if (error instanceof SpecError) {
      process.stderr.write(`aux-audit: ${error.message}\n`);
      return 2;
    }
    throw error;
  }

  const specPath = relative(process.cwd(), resolve(args.spec)) || args.spec;
  const rendered =
    args.format === "json"
      ? toJson(report)
      : args.format === "sarif"
        ? toSarif(report, specPath)
        : toMarkdown(report);

  if (args.out) write(args.out, rendered);
  else process.stdout.write(rendered);

  if (args.summary) write(args.summary, toMarkdown(report));

  const failOn = args.failOn ?? config.fail_on;
  if (failOn && shouldFail(report, failOn)) {
    const blocking = report.issues.filter(
      (issue) => SEVERITY_ORDER[issue.severity] >= SEVERITY_ORDER[failOn],
    ).length;
    process.stderr.write(
      `aux-audit: ${blocking} finding(s) at or above ${failOn} — failing the build\n`,
    );
    return 1;
  }
  return 0;
}

process.exitCode = main(process.argv.slice(2));
