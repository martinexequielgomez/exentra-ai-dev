#!/usr/bin/env node
// Merges the exentra-ai-dev config into an existing OpenCode config.
//
//   node scripts/merge-config.mjs <existing> <harness> <out>
//
// Policy, in order of importance:
//   1. Never weaken a rule the user already had. Harness denies and asks are
//      appended after the user rules, so the last matching rule wins and the
//      stricter outcome survives.
//   2. Harness broad allows come first, so a user deny still overrides them.
//   3. Harness keys win for compaction, tool_output, experimental and agents.
//   4. model and default_agent are set only when the user did not choose one.
//   5. Anything else the user had is preserved untouched.

import { readFileSync, writeFileSync } from "node:fs";

function stripJsonc(text) {
  let out = "";
  let i = 0;
  let inString = false;
  let quote = "";
  while (i < text.length) {
    const ch = text[i];
    const next = text[i + 1];

    if (inString) {
      out += ch;
      if (ch === "\\") {
        out += next ?? "";
        i += 2;
        continue;
      }
      if (ch === quote) {
        inString = false;
      }
      i += 1;
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = true;
      quote = ch;
      out += ch;
      i += 1;
      continue;
    }

    if (ch === "/" && next === "/") {
      while (i < text.length && text[i] !== "\n") {
        i += 1;
      }
      continue;
    }

    if (ch === "/" && next === "*") {
      i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) {
        i += 1;
      }
      i += 2;
      continue;
    }

    out += ch;
    i += 1;
  }

  // Remove trailing commas before a closing brace or bracket.
  return out.replace(/,(\s*[}\]])/g, "$1");
}

function readConfig(path) {
  const raw = readFileSync(path, "utf8").replace(/^\uFEFF/, "");
  const text = stripJsonc(raw).trim();
  if (text === "") {
    return {};
  }
  return JSON.parse(text);
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function mergeObjects(base, override) {
  const result = isPlainObject(base) ? clone(base) : {};
  for (const [key, value] of Object.entries(override ?? {})) {
    if (isPlainObject(value) && isPlainObject(result[key])) {
      result[key] = mergeObjects(result[key], value);
    } else {
      result[key] = clone(value);
    }
  }
  return result;
}

function ruleKey(rule) {
  return `${rule.action}\u0000${rule.resource}\u0000${rule.effect}`;
}

function mergePermissions(userRules, harnessRules) {
  const user = Array.isArray(userRules) ? userRules : [];
  const harness = Array.isArray(harnessRules) ? harnessRules : [];

  const broadAllows = harness.filter((rule) => rule.effect === "allow");
  const restrictive = harness.filter((rule) => rule.effect !== "allow");

  const seen = new Set();
  const merged = [];
  for (const rule of [...broadAllows, ...user, ...restrictive]) {
    const key = ruleKey(rule);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    merged.push(rule);
  }
  return merged;
}

const [, , existingPath, harnessPath, outPath] = process.argv;

if (!existingPath || !harnessPath || !outPath) {
  console.error("usage: merge-config.mjs <existing> <harness> <out>");
  process.exit(2);
}

let existing;
try {
  existing = readConfig(existingPath);
} catch (error) {
  console.error(`cannot parse ${existingPath}: ${error.message}`);
  process.exit(1);
}

let harness;
try {
  harness = readConfig(harnessPath);
} catch (error) {
  console.error(`cannot parse ${harnessPath}: ${error.message}`);
  process.exit(1);
}

const merged = clone(existing);

if (!merged.model && harness.model) {
  merged.model = harness.model;
}
if (!merged.default_agent && harness.default_agent) {
  merged.default_agent = harness.default_agent;
}

merged.permissions = mergePermissions(merged.permissions, harness.permissions);

if (harness.agents) {
  merged.agents = mergeObjects(merged.agents, harness.agents);
}

if (harness.mcp?.servers) {
  merged.mcp = merged.mcp ?? {};
  merged.mcp.servers = mergeObjects(merged.mcp.servers, harness.mcp.servers);
}

for (const key of ["compaction", "tool_output", "experimental"]) {
  if (harness[key]) {
    merged[key] = mergeObjects(merged[key], harness[key]);
  }
}

writeFileSync(outPath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
console.log(`merged config written to ${outPath}`);
