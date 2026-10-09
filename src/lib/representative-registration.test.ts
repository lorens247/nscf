import assert from "node:assert/strict";
import test from "node:test";
import { createRegistrationCode, hashRegistrationCode, photoContentType } from "./representative-registration";

test("codes are random, normalized and reject malformed inputs", () => {
  const code = createRegistrationCode();
  assert.match(code, /^[A-HJ-NP-Z2-9]{10}$/);
  assert.notEqual(createRegistrationCode(), code);
  assert.ok(hashRegistrationCode("ABCDEF012345ABCDEF012345"));
  const batch = new Set(Array.from({ length: 100 }, createRegistrationCode));
  assert.equal(batch.size, 100);
  assert.equal(hashRegistrationCode(` ${code.toLowerCase().match(/.{5}/g)!.join("-")} `), hashRegistrationCode(code));
  for (const invalid of ["", "admin123", "A".repeat(9), "0".repeat(10), "Z".repeat(24)]) assert.equal(hashRegistrationCode(invalid), null);
});

test("uploads accept supported image signatures and reject HTML or SVG", () => {
  assert.equal(photoContentType(Buffer.from([255, 216, 255, 224])), "image/jpeg");
  assert.equal(photoContentType(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), "image/png");
  assert.equal(photoContentType(Buffer.from("RIFF0000WEBP")), "image/webp");
  for (const invalid of ["<svg></svg>", "<html></html>", "", "GIF89a"]) assert.equal(photoContentType(Buffer.from(invalid)), null);
});
