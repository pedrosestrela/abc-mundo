// Scans frontend/src/i18n/index.js for any object key that appears more
// than once at the same nesting level within a single language's
// `translation` object -- the same class of bug as the prior duplicated
// `nav` key regression. Works via a small hand-rolled tokenizer (brace
// depth + string/comment skipping) rather than a full JS parser, since we
// need to catch duplicates BEFORE they get silently deduped by normal JS
// object-literal semantics (which is exactly what makes this bug class
// silent in the first place).
import fs from "node:fs";

const path = new URL("./src/i18n/index.js", import.meta.url);
const src = fs.readFileSync(path, "utf8");

let i = 0;
const n = src.length;
const stack = []; // { keys: Map<string,count>, path: string[] }
let problems = [];

function isIdentStart(c) {
  return /[A-Za-z_$]/.test(c);
}
function isIdentPart(c) {
  return /[A-Za-z0-9_$]/.test(c);
}

function skipString(quote) {
  let s = "";
  i++; // opening quote
  while (i < n && src[i] !== quote) {
    if (src[i] === "\\") {
      s += src[i] + src[i + 1];
      i += 2;
      continue;
    }
    s += src[i];
    i++;
  }
  i++; // closing quote
  return s;
}

function skipTemplate() {
  let depth = 0;
  i++; // opening backtick
  while (i < n) {
    if (src[i] === "\\") {
      i += 2;
      continue;
    }
    if (src[i] === "`" && depth === 0) {
      i++;
      break;
    }
    if (src[i] === "$" && src[i + 1] === "{") {
      depth++;
      i += 2;
      continue;
    }
    if (src[i] === "}" && depth > 0) {
      depth--;
      i++;
      continue;
    }
    i++;
  }
}

while (i < n) {
  const c = src[i];

  // Comments
  if (c === "/" && src[i + 1] === "/") {
    while (i < n && src[i] !== "\n") i++;
    continue;
  }
  if (c === "/" && src[i + 1] === "*") {
    i += 2;
    while (i < n && !(src[i] === "*" && src[i + 1] === "/")) i++;
    i += 2;
    continue;
  }
  // Strings
  if (c === '"' || c === "'") {
    skipString(c);
    continue;
  }
  if (c === "`") {
    skipTemplate();
    continue;
  }

  // Object open: push a new key-tracking scope
  if (c === "{") {
    stack.push({ keys: new Map(), path: stack.length ? stack[stack.length - 1].curPath || [] : [] });
    i++;
    continue;
  }
  if (c === "}") {
    const frame = stack.pop();
    if (frame) {
      for (const [key, count] of frame.keys) {
        if (count > 1) {
          problems.push(`${frame.pathLabel || "(root)"}.${key} appears ${count} times`);
        }
      }
    }
    i++;
    continue;
  }
  // Array open/close: just skip balancing so we don't misparse depth for
  // arrays of strings (their contents aren't key:value pairs at our depth).
  if (c === "[") {
    let depth = 1;
    i++;
    while (i < n && depth > 0) {
      if (src[i] === '"' || src[i] === "'") {
        skipString(src[i]);
        continue;
      }
      if (src[i] === "`") {
        skipTemplate();
        continue;
      }
      if (src[i] === "{") {
        // nested object inside array -- push/pop scope so nested key
        // duplication is still caught, but don't confuse with outer keys.
        let objDepth = 0;
        do {
          if (src[i] === '"' || src[i] === "'") {
            skipString(src[i]);
            continue;
          }
          if (src[i] === "`") {
            skipTemplate();
            continue;
          }
          if (src[i] === "{") objDepth++;
          if (src[i] === "}") objDepth--;
          i++;
        } while (i < n && objDepth > 0);
        continue;
      }
      if (src[i] === "[") depth++;
      if (src[i] === "]") depth--;
      i++;
    }
    continue;
  }

  // Identifier or quoted key followed by ':' -> record as key of current
  // top-of-stack frame.
  if (isIdentStart(c)) {
    let start = i;
    while (i < n && isIdentPart(src[i])) i++;
    const ident = src.slice(start, i);
    let j = i;
    while (j < n && /\s/.test(src[j])) j++;
    if (src[j] === ":") {
      const frame = stack[stack.length - 1];
      if (frame) {
        frame.keys.set(ident, (frame.keys.get(ident) || 0) + 1);
        if (!frame.pathLabel) {
          frame.pathLabel = (frame.parentLabel ? frame.parentLabel + "." : "") + ident;
        }
        // Tag the label used when THIS key's value object is pushed.
        frame.lastKey = ident;
      }
    }
    continue;
  }

  i++;
}

// The pathLabel bookkeeping above is best-effort (first key seen names the
// frame); good enough to locate duplicates without a full parser. Refine
// labels using a second lightweight pass isn't necessary for flagging.

if (problems.length) {
  console.log("DUPLICATE i18n KEYS FOUND (same nesting level):");
  for (const p of [...new Set(problems)]) console.log("  " + p);
  process.exitCode = 1;
} else {
  console.log("No duplicate i18n keys found at any nesting level.");
}
