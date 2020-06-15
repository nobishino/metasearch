import confluence from "./confluence";
import drive from "./drive";
import dropbox from "./dropbox";
import figma from "./figma";
import github from "./github";
import hound from "./hound";
import jenkins from "./jenkins";
import jira from "./jira";
import pagerduty from "./pagerduty";
import pingboard from "./pingboard";
import slack from "./slack";
import talentlms from "./talentlms";
import zoom from "./zoom";

/** Replaces all `"` with `\"`. */
export const escapeQuotes = (s: string) => s.replace(/"/g, '\\"');

/**
 * Wraps a function so that it returns the last invocation's cached result if
 * called multiple times during a cooldown period of N hours. The wrapped
 * function is also called immediately upon creation to precache its result.
 *
 * The wrapped function must be parameterless since the cached result would be
 * not just stale but also incorrect in the case that different parameter
 * values were provided to the current call and the cached call.
 */
export const rateLimit = <R, F extends () => R>(
  fn: F,
  intervalHours: number,
): F => {
  let lastRunAt = -Infinity;
  let lastResult: any;
  const rateLimitedFn = ((() => {
    const now = Date.now();
    if (now < lastRunAt + intervalHours * 60 * 60 * 1000) {
      return lastResult;
    }
    lastRunAt = now;
    lastResult = fn();
    return lastResult;
  }) as unknown) as F;
  rateLimitedFn();
  return rateLimitedFn;
};

const engines: Engine[] = [
  confluence,
  drive,
  dropbox,
  figma,
  github,
  hound,
  jenkins,
  jira,
  pagerduty,
  pingboard,
  slack,
  talentlms,
  zoom,
];
export default engines;
