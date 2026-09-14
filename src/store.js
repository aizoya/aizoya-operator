import fs from 'node:fs';
import path from 'node:path';

const EMPTY = { schema_version: 1, tenants: {} };
const clone = (v) => structuredClone(v);

export class JsonStateStore {
  constructor(filePath) { this.filePath = filePath; }
  load() {
    if (!fs.existsSync(this.filePath)) return clone(EMPTY);
    return JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
  }
  save(state) {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    const tmp = `${this.filePath}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
    fs.renameSync(tmp, this.filePath);
  }
  readTenant(tenantId) {
    const state = this.load();
    return clone(state.tenants[tenantId] ?? { workflows: {}, receipts: {}, idempotency: {}, audit: [] });
  }
  writeTenant(tenantId, tenantState) {
    const state = this.load();
    state.tenants[tenantId] = clone(tenantState);
    this.save(state);
  }
}
