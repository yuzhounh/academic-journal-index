import assert from "node:assert/strict";
import test from "node:test";
import Papa from "papaparse";
import { triggerCsvDownload } from "../src/lib/csv-download";

test("CSV download retains Unicode, hash marks, quoted/newline cells and filename", async t => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "document");
  let captured: Blob | undefined, clicked = false, removed = false, revoked = false;
  const link = { href: "", download: "", click() {
    assert.equal(this.href, "blob:fixture"); assert.equal(this.download, "原文件名.csv"); clicked = true;
  } };
  Object.defineProperty(globalThis, "document", { configurable: true, value: {
    createElement: () => link, body: { appendChild() {}, removeChild() { removed = true; } },
  } });
  t.after(() => { if (original) Object.defineProperty(globalThis, "document", original); else Reflect.deleteProperty(globalThis, "document"); });
  t.mock.method(URL, "createObjectURL", value => { assert.ok(value instanceof Blob); captured = value; return "blob:fixture"; });
  t.mock.method(URL, "revokeObjectURL", value => { assert.equal(value, "blob:fixture"); assert.ok(clicked); revoked = true; });
  const rows = [["Title", "Description"], ["中文#Journal", 'quote " and\nnew line']];
  // This is the former data-URI bug: encodeURI leaves a fragment outside the payload.
  assert.ok(new URL("data:text/csv," + encodeURI(Papa.unparse(rows))).hash);
  triggerCsvDownload(rows, "原文件名.csv");
  assert.ok(captured && clicked && removed && revoked);
  const csv = await captured.text();
  assert.deepEqual(Papa.parse<string[]>(csv).data, rows);
});
