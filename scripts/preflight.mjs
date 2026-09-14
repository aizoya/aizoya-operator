import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { TOOL_DEFINITIONS } from '../src/tools.js';

const fail = (message) => {
  console.error(`PRECHECK FAIL: ${message}`);
  process.exitCode = 1;
};

const pass = (message) => console.log(`PRECHECK PASS: ${message}`);

const requiredFiles = [
  'README.md',
  'LICENSE',
  'docs/ARCHITECTURE.md',
  'docs/AWS_BEDROCK_PLAN.md',
  'docs/MCP_TOOLS.md',
  'docs/PRODUCT_CHARTER.md',
  'docs/VERIFIED_ACTION_RECEIPT.md',
  'fixtures/lbk-saturday.json',
  'src/server.js',
  'src/mcp.js',
  'src/tools.js',
  'test/mcp.test.js',
  'test/server.test.js',
  'test/workflow.test.js',
  'test/reliability.test.js',
  'web/index.html',
  'web/app.js',
  'web/styles.css'
];

const major = Number(process.versions.node.split('.')[0]);
if (major < 22) fail(`Node 22+ required; found ${process.version}`);
else pass(`Node runtime ${process.version}`);

for (const path of requiredFiles) {
  try {
    await access(path, constants.R_OK);
    pass(`required file ${path}`);
  } catch {
    fail(`missing/unreadable required file ${path}`);
  }
}

const expectedTools = [
  'get_shift_brief',
  'capture_commitment',
  'reconcile_inventory',
  'build_purchase_plan',
  'approve_action',
  'handoff_task',
  'verify_closeout',
  'get_action_receipt'
];
const actualTools = TOOL_DEFINITIONS.map(({ name }) => name);
if (JSON.stringify(actualTools) !== JSON.stringify(expectedTools)) {
  fail(`MCP tool inventory drift: ${actualTools.join(', ')}`);
} else {
  pass('exact eight-tool MCP inventory');
}

if (!process.exitCode) {
  console.log('PRECHECK COMPLETE: public release package is locally ready for npm test and judge demo startup.');
}
