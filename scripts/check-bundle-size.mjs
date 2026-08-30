import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The bundle is on the critical path of every cold start, so it gets a ceiling
 * rather than a number someone reads once in a pull request and forgets. Raise
 * the budget deliberately, in a commit that says what was added and why.
 */
const BUDGET_KB = 4600;

const bundleDirectory = join(process.argv[2] ?? '/tmp/expo-export', '_expo/static/js/ios');

const bundles = readdirSync(bundleDirectory).filter((name) => name.endsWith('.hbc'));

if (bundles.length === 0) {
  console.error(`No iOS bundle found in ${bundleDirectory}`);
  process.exit(1);
}

const totalKb = Math.round(
  bundles.reduce((total, name) => total + statSync(join(bundleDirectory, name)).size, 0) / 1024,
);

const verdict = totalKb <= BUDGET_KB ? 'within' : 'over';
console.log(`iOS bundle: ${totalKb} KB — ${verdict} the ${BUDGET_KB} KB budget.`);

if (totalKb > BUDGET_KB) {
  console.error(
    `Bundle grew ${totalKb - BUDGET_KB} KB past the budget. Raise BUDGET_KB deliberately if the growth is wanted.`,
  );
  process.exit(1);
}
