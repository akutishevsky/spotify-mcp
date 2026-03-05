
Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Use `bunx <package> <command>` instead of `npx <package> <command>`
- Bun automatically loads .env, so don't use dotenv.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Testing

Use `bun test` to run tests.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## Frontend

Use HTML imports with `Bun.serve()`. Don't use `vite`. HTML imports fully support React, CSS, Tailwind.

Server:

```ts#index.ts
import index from "./index.html"

Bun.serve({
  routes: {
    "/": index,
    "/api/users/:id": {
      GET: (req) => {
        return new Response(JSON.stringify({ id: req.params.id }));
      },
    },
  },
  // optional websocket support
  websocket: {
    open: (ws) => {
      ws.send("Hello, world!");
    },
    message: (ws, message) => {
      ws.send(message);
    },
    close: (ws) => {
      // handle close
    }
  },
  development: {
    hmr: true,
    console: true,
  }
})
```

HTML files can import .tsx, .jsx or .js files directly and Bun's bundler will transpile & bundle automatically. `<link>` tags can point to stylesheets and Bun's CSS bundler will bundle.

```html#index.html
<html>
  <body>
    <h1>Hello, world!</h1>
    <script type="module" src="./frontend.tsx"></script>
  </body>
</html>
```

With the following `frontend.tsx`:

```tsx#frontend.tsx
import React from "react";
import { createRoot } from "react-dom/client";

// import .css files directly and it works
import './index.css';

const root = createRoot(document.body);

export default function Frontend() {
  return <h1>Hello, world!</h1>;
}

root.render(<Frontend />);
```

Then, run index.ts

```sh
bun --hot ./index.ts
```

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.mdx`.

# Claude Code Operating Instructions

## Core Philosophy

Default to **parallel execution** and **web-verified information**. Sequential execution and offline assumptions are fallback modes, not defaults. When in doubt: parallelize, then search.

---

## 1. Parallelization Protocol

### Default Behavior: Parallel-First

**Before starting any multi-step task:**
1. Decompose the full task into atomic subtasks
2. Build a dependency graph — identify which subtasks have no prerequisite outputs
3. Dispatch ALL dependency-free subtasks simultaneously using parallel tool calls
4. Only after their completion, dispatch the next wave of now-unblocked subtasks
5. Repeat until task is complete

**Rule:** If two tasks do not share an input/output dependency, they MUST run in parallel. Sequential execution of independent tasks is a performance violation.

### Parallel Tool Call Patterns

Prefer batching tool calls in a single response turn rather than sequential turns:

```
# CORRECT — dispatch independent reads simultaneously
- Read file A
- Read file B
- Search web for library version
(all in one turn)

# WRONG — needless sequencing
- Read file A → wait → Read file B → wait → Search web
```

### Sub-Agent Parallelization (Task Tool)

When using the `Task` tool to spawn sub-agents:
- Spawn all independent sub-agents in a single dispatch batch
- Maximum **5 concurrent sub-agents** at any time to avoid context exhaustion
- Each sub-agent must have a clearly scoped, non-overlapping responsibility
- Define explicit output contracts for each agent before spawning
- After all agents complete, explicitly synthesize their outputs — do not present raw agent outputs as the final answer

### TodoWrite Protocol

When managing complex tasks with `TodoWrite`:
- Mark tasks as `in_progress` before starting a parallel batch
- Track each parallel thread separately
- Never mark a parent task `completed` until all parallel children resolve
- Flag dependency chains explicitly in todo descriptions

### When Sequential Execution Is Permitted

Sequential execution is only justified when:
- Task B requires Task A's output as direct input
- Tasks write to the same file or resource (race condition risk)
- A previous parallel batch returned an error that changes downstream logic
- User explicitly requests step-by-step confirmation

In all other cases: **parallelize**.

---

## 2. Web Search Mandate

### Search-First Triggers

**Always perform a web search before proceeding** when the task involves any of the following:

| Category | Examples |
|---|---|
| Library / framework versions | "What's the latest stable version of X?" |
| API behavior and signatures | Any external SDK, REST API, or CLI tool |
| Security advisories | CVEs, deprecated patterns, breaking changes |
| Best practices | Architecture patterns, language idioms updated post-2024 |
| Configuration options | Tool flags, environment variables, cloud service settings |
| Error messages | Unfamiliar stack traces, runtime errors |
| Compatibility questions | Node/Python/Rust version support, browser APIs |
| Pricing or limits | Cloud service quotas, rate limits, SLA details |

### Search Behavior Rules

1. **Search before assuming.** Do not rely on training knowledge for anything that changes over time. External information has a shelf life; always verify.

2. **Prefer official sources.** When web results conflict, prioritize: official docs > GitHub releases > well-known technical blogs > forums.

3. **Deduplicate within session.** If you have already searched for a query in this session and the result was unambiguous, do not re-search the same query. Cache the result mentally and reference it.

4. **Surface what you found.** When you use web search to inform a decision, briefly state the source and key fact. Do not silently use search results without attribution.

5. **Parallelize searches.** When multiple independent facts need to be looked up, dispatch all web searches simultaneously, not sequentially.

6. **Do not search for:** Internal project details, proprietary architecture, code that exists in the repository (read the file instead), or subjective style decisions.

### When Web Search Results Conflict with the Codebase

If web search returns guidance that contradicts patterns already established in the repo:
1. Note the conflict explicitly
2. Present both the current repo pattern and the web-sourced alternative
3. Do not silently override existing code with web-sourced patterns without user confirmation

---

## 3. Session Start Checklist

At the beginning of every new task or session, run the following in parallel:

- [ ] Read `CLAUDE.md` (this file) to confirm operating rules are loaded
- [ ] Identify the task's scope and decompose into subtasks
- [ ] Flag any subtasks that require web verification
- [ ] Check for existing relevant files in the repo before searching externally
- [ ] Dispatch first parallel batch

---

## 4. Quality and Safety Rules

- **No unverified version pinning.** Never write a dependency version (`package.json`, `pyproject.toml`, `Cargo.toml`, etc.) without confirming via web search that it is current and non-deprecated.
- **No silent failures in parallel batches.** If one parallel subtask fails, halt dependent tasks immediately and report the failure before proceeding.
- **Conflict resolution in parallel file edits.** If two parallel sub-agents are asked to modify the same file, serialize those specific edits. All other work continues in parallel.
- **Do not hallucinate tool flags or API parameters.** If unsure whether a CLI flag exists, search first.

---

## 5. Communication Standards

- When executing a parallel batch, briefly state what is running in parallel and why
- When web search informs a decision, cite source and date if available
- When sequential execution is chosen over parallel, briefly state the dependency that forced it
- Keep explanations concise — action over narration
