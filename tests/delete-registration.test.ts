import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { deleteRegistration } from "../src/lib/admin-data";
import type { CurrentUser } from "../src/lib/auth";

const admin: CurrentUser = { id: 1, username: "admin", displayName: "Admin", role: "admin", managerId: null };
const manager: CurrentUser = { id: 2, username: "manager", displayName: "Manager", role: "manager", managerId: 1 };
const db = globalThis as typeof globalThis & { pgPool?: { query: (sql: string, params: unknown[]) => Promise<{ rowCount: number }> } };

afterEach(() => {
  delete db.pgPool;
});

test("manager cannot delete, even when calling the data function directly", async () => {
  db.pgPool = { query: async () => { throw new Error("Database must not be called"); } };
  assert.equal(await deleteRegistration(manager, 42), false);
});

test("admin deletes only the requested registration", async () => {
  let call: { sql: string; params: unknown[] } | undefined;
  db.pgPool = {
    query: async (sql, params) => {
      call = { sql, params };
      return { rowCount: 1 };
    },
  };
  assert.equal(await deleteRegistration(admin, 42), true);
  assert.deepEqual(call, { sql: "DELETE FROM registrations WHERE id = $1", params: [42] });
});

test("admin gets a failure result when the registration no longer exists", async () => {
  db.pgPool = { query: async () => ({ rowCount: 0 }) };
  assert.equal(await deleteRegistration(admin, 42), false);
});
