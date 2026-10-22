import { readFile } from 'node:fs/promises';
import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { TOOL_DEFINITIONS } from '../src/tools.js';

const fail = (message) => {
  console.error(`PRECHECK FAIL: ${message}`);
  process.exitCode = 1;
};

const pass = (message) => console.log(`PRECHECK PASS: ${message}`);

const requiredFiles = [
  'AGENTS.md',
  'README.md',
  'aizoya.project.json',
  'docs/ARCHITECTURE.md',
  'docs/MCP_TOOLS.md',
  'docs/READINESS.md',
  'docs/VERIFIED_ACTION_RECEIPT.md',
  'fixtures/lbk-saturday.json',
  'src/server.js',
  'src/mcp.js',
  'src/tools.js',
  'test/mcp.test.js',
  'test/server.test.js',
  'test/workflow.test.js',
  'test/reliability.test.js'
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

let project;
try {
  project = JSON.parse(await readFile('aizoya.project.json', 'utf8'));
} catch (error) {
  fail(`aizoya.project.json parse failed: ${error.message}`);
}

if (project) {
  const controls = project.controls ?? {};
  if (project.repository?.visibility !== 'public' || project.source_snapshot !== true) fail('expected public source snapshot declaration');
  else pass('public synthetic source snapshot');
  if (project.repository?.working_branch !== 'main') fail('unexpected release branch declaration');
  else pass('source-release branch declaration main');
  for (const [key, expected] of [
    ['synthetic_data_only', true],
    ['deployment_enabled', false],
    ['automatic_publication_enabled', false],
    ['production_enabled', false]
  ]) {
    if (controls[key] !== expected) fail(`control ${key} must be ${expected}`);
    else pass(`control ${key}=${expected}`);
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
  console.log('PRECHECK COMPLETE: source prerequisites checked; run tests before local demo startup. Not production readiness.');
}
