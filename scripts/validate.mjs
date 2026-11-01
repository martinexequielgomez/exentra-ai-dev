#!/usr/bin/env node
// Validates the exentra-ai-dev repository.
//
//   node scripts/validate.mjs
//
// Exits 1 when anything is wrong. No dependencies: this must run on a clean
// checkout in CI on Windows and Linux.

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, basename, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const errors = [];
const warnings = [];

const fail = (file, message) => errors.push(`${file}: ${message}`);
const warn = (file, message) => warnings.push(`${file}: ${message}`);

const MODEL_PATTERN = /^[^/#\s]+\/[^#\s]+(?:#[^#\s]+)?$/;
const COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

const AGENT_MODES = new Set(["primary", "subagent", "all"]);
const EFFECTS = new Set(["allow", "deny", "ask"]);

// Two vocabularies, verified against OpenCode v2:
//   - the project `permissions` ruleset keys the shell tool as "shell";
//   - agent frontmatter `permission` keys it as "bash".
// Using the wrong one fails silently, so the validator rejects it.
const RULESET_ACTIONS = new Set([
  "*",
  "read",
  "edit",
  "glob",
  "grep",
  "list",
  "shell",
  "task",
  "external_directory",
  "todowrite",
  "question",
  "webfetch",
  "websearch",
  "lsp",
  "doom_loop",
  "skill",
]);

const AGENT_PERMISSION_ACTIONS = new Set([
  "read",
  "edit",
  "glob",
  "grep",
  "list",
  "bash",
  "task",
  "external_directory",
  "todowrite",
  "question",
  "webfetch",
  "websearch",
  "lsp",
  "doom_loop",
  "skill",
]);

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function read(path) {
  return readFileSync(path, "utf8");
}

function rel(path) {
  return relative(ROOT, path).replace(/\\/g, "/");
}

function walk(dir) {
  if (!existsSync(dir)) {
    return [];
  }
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".git") {
      continue;
    }
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

function checkEncoding(path) {
  const name = rel(path);
  const bytes = readFileSync(path);
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    fail(name, "file starts with a UTF-8 BOM");
  }
  const text = bytes.toString("utf8");
  if (text.includes("\r\n")) {
    fail(name, "contains CRLF line endings; the repository uses LF");
  }
}

function splitFrontmatter(path) {
  const text = read(path);
  const name = rel(path);
  if (!text.startsWith("---\n")) {
    fail(name, "missing frontmatter block (must start with ---)");
    return { data: null, body: text };
  }
  const end = text.indexOf("\n---\n", 3);
  if (end === -1) {
    fail(name, "frontmatter block is not closed with ---");
    return { data: null, body: text };
  }
  const raw = text.slice(4, end + 1);
  const body = text.slice(end + 5);
  if (/^\t/m.test(raw)) {
    fail(name, "frontmatter uses a tab for indentation");
  }
  return { data: parseYaml(raw, name), body };
}

function unquote(value) {
  const trimmed = value.trim();
  if (trimmed.length >= 2) {
    const first = trimmed[0];
    const last = trimmed[trimmed.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return trimmed.slice(1, -1);
    }
  }
  return trimmed;
}

// Minimal indentation-based parser for the frontmatter subset this repository
// uses: nested maps, scalar values, and inline scalar arrays.
function parseYaml(raw, file) {
  const root = {};
  const stack = [{ indent: -1, value: root }];
  const lines = raw.split("\n");

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim() === "" || line.trim().startsWith("#")) {
      continue;
    }
    const indent = line.length - line.trimStart().length;
    const content = line.trim();

    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }
    const parent = stack[stack.length - 1].value;

    if (content.startsWith("- ")) {
      fail(file, `unsupported list item at line ${index + 1} of the frontmatter`);
      continue;
    }

    const separator = content.indexOf(":");
    if (separator === -1) {
      fail(file, `frontmatter line ${index + 1} is not a key: value pair`);
      continue;
    }

    const key = content.slice(0, separator).trim();
    const rest = content.slice(separator + 1).trim();

    if (rest === "") {
      const child = {};
      parent[key] = child;
      stack.push({ indent, value: child });
      continue;
    }

    if (rest.startsWith("[") && rest.endsWith("]")) {
      parent[key] = rest
        .slice(1, -1)
        .split(",")
        .map((item) => unquote(item))
        .filter((item) => item !== "");
      continue;
    }

    parent[key] = unquote(rest);
  }

  return root;
}

function checkFences(path) {
  const name = rel(path);
  const text = read(path);
  const lines = text.split("\n");
  let open = false;
  let openLine = 0;
  let count = 0;

  lines.forEach((line, index) => {
    if (!/^\s{0,3}```/.test(line)) {
      return;
    }
    count += 1;
    if (!open) {
      open = true;
      openLine = index + 1;
    } else {
      open = false;
    }
  });

  if (count % 2 !== 0 || open) {
    fail(name, `unbalanced code fence (last opened at line ${openLine})`);
  }
}

function checkModel(file, value) {
  if (typeof value !== "string" || !MODEL_PATTERN.test(value)) {
    fail(file, `invalid model id "${value}"; expected provider/model`);
  }
}

// ---------------------------------------------------------------------------
// encoding and fences for every tracked file
// ---------------------------------------------------------------------------

const textFiles = walk(ROOT).filter((path) =>
  /\.(md|mjs|ps1|jsonc|json|yml|yaml|txt)$/.test(path),
);

for (const path of textFiles) {
  checkEncoding(path);
}

for (const path of textFiles.filter((path) => path.endsWith(".md"))) {
  checkFences(path);
}

// ---------------------------------------------------------------------------
// agents
// ---------------------------------------------------------------------------

const agentsDir = join(ROOT, "agents");
const agentFiles = existsSync(agentsDir)
  ? readdirSync(agentsDir).filter((entry) => entry.endsWith(".md"))
  : [];

const agentNames = new Set(agentFiles.map((entry) => basename(entry, ".md")));

for (const entry of agentFiles) {
  const path = join(agentsDir, entry);
  const name = rel(path);
  const { data, body } = splitFrontmatter(path);
  if (!data) {
    continue;
  }

  if (!data.description) {
    fail(name, "missing description");
  }
  if (!data.mode) {
    fail(name, "missing mode");
  } else if (!AGENT_MODES.has(data.mode)) {
    fail(name, `invalid mode "${data.mode}"; expected primary, subagent, or all`);
  }
  if (!data.model) {
    fail(name, "missing model");
  } else {
    checkModel(name, data.model);
  }
  if (data.steps !== undefined) {
    const steps = Number(data.steps);
    if (!Number.isInteger(steps) || steps <= 0) {
      fail(name, `steps must be a positive integer, got "${data.steps}"`);
    }
  }
  if (data.color !== undefined && !COLOR_PATTERN.test(data.color)) {
    fail(name, `invalid color "${data.color}"; expected #RRGGBB`);
  }
  if (data.permissions !== undefined) {
    fail(name, 'use "permission" (object), not "permissions"; agent files use AgentConfig');
  }
  if (data.permission !== undefined) {
    if (typeof data.permission === "string") {
      if (!EFFECTS.has(data.permission)) {
        fail(name, `invalid permission "${data.permission}"`);
      }
    } else if (typeof data.permission === "object") {
      for (const [action, rule] of Object.entries(data.permission)) {
        if (!AGENT_PERMISSION_ACTIONS.has(action)) {
          fail(
            name,
            `unknown permission action "${action}"; agent frontmatter uses tool names such as bash or edit, never shell`,
          );
        }
        if (typeof rule === "string") {
          if (!EFFECTS.has(rule)) {
            fail(name, `permission ${action} has invalid effect "${rule}"`);
          }
        } else if (typeof rule === "object") {
          for (const [pattern, effect] of Object.entries(rule)) {
            if (!EFFECTS.has(effect)) {
              fail(name, `permission ${action}["${pattern}"] has invalid effect "${effect}"`);
            }
          }
        } else {
          fail(name, `permission ${action} must be a string or an object`);
        }
      }
    } else {
      fail(name, "permission must be a string or an object");
    }
  }
  if (body.trim() === "") {
    fail(name, "empty prompt body");
  }
}

// ---------------------------------------------------------------------------
// commands
// ---------------------------------------------------------------------------

const commandsDir = join(ROOT, "commands");
const commandFiles = existsSync(commandsDir)
  ? readdirSync(commandsDir).filter((entry) => entry.endsWith(".md"))
  : [];

for (const entry of commandFiles) {
  const path = join(commandsDir, entry);
  const name = rel(path);
  const { data, body } = splitFrontmatter(path);
  if (!data) {
    continue;
  }
  if (!data.description) {
    fail(name, "missing description");
  }
  if (body.trim() === "") {
    fail(name, "empty command body");
  }
  if (data.model !== undefined) {
    checkModel(name, data.model);
  }
  if (data.agent !== undefined && !agentNames.has(data.agent)) {
    fail(name, `references unknown agent "${data.agent}"`);
  }
}

// ---------------------------------------------------------------------------
// skills
// ---------------------------------------------------------------------------

const skillsDir = join(ROOT, "skills");
const skillDirs = existsSync(skillsDir)
  ? readdirSync(skillsDir).filter((entry) => statSync(join(skillsDir, entry)).isDirectory())
  : [];

if (skillDirs.length === 0) {
  fail("skills", "no skill directories found");
}

for (const dir of skillDirs) {
  const path = join(skillsDir, dir, "SKILL.md");
  const name = rel(path);
  if (!existsSync(path)) {
    fail(name, "missing SKILL.md");
    continue;
  }
  const { data, body } = splitFrontmatter(path);
  if (!data) {
    continue;
  }
  if (data.name !== dir) {
    fail(name, `frontmatter name "${data.name}" does not match directory "${dir}"`);
  }
  if (!data.description) {
    fail(name, "missing description");
  } else if (!/^Trigger:/.test(data.description)) {
    fail(name, 'description must start with "Trigger:" so the agent knows when to load it');
  }
  if (body.trim() === "") {
    fail(name, "empty skill body");
  }
}

// ---------------------------------------------------------------------------
// contexts
// ---------------------------------------------------------------------------

const contextsDir = join(ROOT, "contexts");
const contextFiles = existsSync(contextsDir)
  ? readdirSync(contextsDir).filter((entry) => entry.endsWith(".md"))
  : [];

if (contextFiles.length === 0) {
  fail("contexts", "no context files found");
}

const contextNames = new Set(contextFiles.map((entry) => basename(entry, ".md")));

for (const entry of contextFiles) {
  const path = join(contextsDir, entry);
  const name = rel(path);
  const text = read(path);
  if (!text.startsWith("## Stack: ")) {
    fail(name, 'context must start with a "## Stack: <name>" heading');
  }
  if (text.trim().split("\n").length < 5) {
    warn(name, "context is very short");
  }
}

// ---------------------------------------------------------------------------
// opencode.jsonc
// ---------------------------------------------------------------------------

const configPath = join(ROOT, "opencode.jsonc");
if (!existsSync(configPath)) {
  fail("opencode.jsonc", "missing");
} else {
  const name = "opencode.jsonc";
  let config = null;
  try {
    config = JSON.parse(stripJsonc(read(configPath)));
  } catch (error) {
    fail(name, `invalid JSON after removing comments: ${error.message}`);
  }

  if (config) {
    if (!config.model) {
      fail(name, "missing model");
    } else {
      checkModel(name, config.model);
    }
    if (!config.default_agent) {
      fail(name, "missing default_agent");
    } else if (!agentNames.has(config.default_agent)) {
      fail(name, `default_agent "${config.default_agent}" has no agent file`);
    }

    if (!Array.isArray(config.permissions)) {
      fail(name, 'permissions must be an array of {action, resource, effect}');
    } else {
      const seen = new Set();
      for (const rule of config.permissions) {
        if (!rule || typeof rule !== "object") {
          fail(name, "permission rule must be an object");
          continue;
        }
        if (typeof rule.action !== "string" || typeof rule.resource !== "string") {
          fail(name, "permission rule needs string action and resource");
        }
        if (!EFFECTS.has(rule.effect)) {
          fail(name, `permission rule has invalid effect "${rule.effect}"`);
        }
        if (!RULESET_ACTIONS.has(rule.action)) {
          fail(
            name,
            `permission rule has unknown action "${rule.action}"; the project ruleset keys the shell tool as shell, never bash`,
          );
        }
        // Verified against OpenCode v2: a `**/` prefix does not match a file in
        // the project root, so `**/.env` leaves `.env` readable. `*` already
        // matches across path separators, which is what the built-in rules use.
        if (
          (rule.action === "read" || rule.action === "edit") &&
          typeof rule.resource === "string" &&
          rule.resource.includes("**/")
        ) {
          fail(
            name,
            `permission rule for ${rule.action} uses "${rule.resource}"; a **/ prefix silently misses root files, use "*.env" style patterns`,
          );
        }
        const key = `${rule.action}\u0000${rule.resource}`;
        if (seen.has(key)) {
          warn(name, `duplicate permission rule for ${rule.action} ${rule.resource}`);
        }
        seen.add(key);
      }

      // The secrets these rules must actually block. If a refactor drops one,
      // the harness silently stops protecting it.
      const requiredDenies = [
        ["read", "*.env"],
        ["read", "*.env.*"],
        ["read", "*.pem"],
        ["read", "*.key"],
        ["read", "*.ssh/*"],
        ["edit", "*.env"],
        ["edit", "*.pem"],
        ["edit", "*.key"],
      ];
      for (const [action, resource] of requiredDenies) {
        const present = config.permissions.some(
          (rule) => rule.action === action && rule.resource === resource && rule.effect === "deny",
        );
        if (!present) {
          fail(name, `missing required deny rule: ${action} "${resource}"`);
        }
      }
    }

    for (const [agentName, agent] of Object.entries(config.agents ?? {})) {
      if (agent.model !== undefined) {
        checkModel(`${name} agents.${agentName}`, agent.model);
      }
    }

    if (!config.mcp || !config.mcp.servers) {
      warn(name, "no mcp.servers configured");
    }
  }
}

function stripJsonc(text) {
  let out = "";
  let i = 0;
  let inString = false;
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
      if (ch === '"') {
        inString = false;
      }
      i += 1;
      continue;
    }
    if (ch === '"') {
      inString = true;
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
  return out.replace(/,(\s*[}\]])/g, "$1");
}

// ---------------------------------------------------------------------------
// repository wiring
// ---------------------------------------------------------------------------

const readmePath = join(ROOT, "README.md");
if (!existsSync(readmePath)) {
  fail("README.md", "missing");
} else {
  const readme = read(readmePath);
  for (const entry of commandFiles) {
    const command = "/" + basename(entry, ".md");
    if (!readme.includes("`" + command + "`")) {
      warn("README.md", `command ${command} is not listed`);
    }
  }
  for (const name of contextNames) {
    if (!readme.includes("`" + name + "`")) {
      warn("README.md", `context ${name} is not listed`);
    }
  }
  for (const name of agentNames) {
    if (!readme.includes("`" + name + "`")) {
      warn("README.md", `agent ${name} is not listed`);
    }
  }
}

for (const script of ["install.ps1", "doctor.ps1", "merge-config.mjs", "validate.mjs"]) {
  if (!existsSync(join(ROOT, "scripts", script))) {
    fail("scripts", `missing ${script}`);
  }
}

for (const doc of ["SECURITY.md", "DESIGN.md", "TOKENS.md"]) {
  if (!existsSync(join(ROOT, "docs", doc))) {
    fail("docs", `missing ${doc}`);
  }
}

// ---------------------------------------------------------------------------
// report
// ---------------------------------------------------------------------------

const filesChecked = textFiles.length;
for (const message of warnings) {
  console.log(`WARN  ${message}`);
}
for (const message of errors) {
  console.log(`FAIL  ${message}`);
}

console.log("");
console.log(
  `${filesChecked} files checked, ${agentFiles.length} agents, ${commandFiles.length} commands, ` +
    `${skillDirs.length} skills, ${contextFiles.length} contexts`,
);
console.log(`${errors.length} error(s), ${warnings.length} warning(s)`);

process.exit(errors.length === 0 ? 0 : 1);
