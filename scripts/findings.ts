/**
 * What `check:laws --json` and `check:flow --json` write and `pr:report` reads.
 * `schemaVersion` is bumped on a breaking change to either shape; this is its only home.
 */
export const SCHEMA_VERSION = 1

/** The first line of the PR comment: `pr:comment` finds its own comment by it. */
export const MARKER = '<!-- protos-report -->'

/** A blocking finding that belongs to no screen report: a `flow.ts` problem, a flow played in a browser, a check that did not run. */
export interface Finding {
  /** The rule id the message is about. */
  rule: string
  file: string
  line?: number
  message: string
}
