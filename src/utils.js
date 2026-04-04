import { randomUUID } from "node:crypto";

export function makeId(prefix = "id") {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

export function slugify(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function splitLines(value) {
  return String(value ?? "")
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => entry.replace(/^[-*]\s+/, "").trim());
}

export function nowIso() {
  return new Date().toISOString();
}

export function average(numbers) {
  if (!numbers.length) {
    return 0;
  }

  const total = numbers.reduce((sum, value) => sum + value, 0);
  return Math.round(total / numbers.length);
}
