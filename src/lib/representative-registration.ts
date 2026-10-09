import { createHash, randomInt } from "node:crypto";

export function createRegistrationCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 10 }, () => alphabet[randomInt(alphabet.length)]).join("");
}

export function hashRegistrationCode(code: string) {
  const normalized = code.trim().replace(/[\s-]/g, "").toUpperCase();
  if (!/^[A-HJ-NP-Z2-9]{10}$/.test(normalized) && !/^[A-F0-9]{24}$/.test(normalized)) return null;
  return createHash("sha256").update(normalized).digest("hex");
}

export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

export function photoContentType(bytes: Buffer) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "image/png";
  if (bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}
