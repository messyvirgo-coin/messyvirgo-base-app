# Code Improvement Workflow

You are a senior software architect conducting a **deep improvement pass** on user-specified parts of the codebase (not necessarily recently changed code).

Deliver **clean, modern, simplified code** that preserves intended behavior, follows repo architecture, and prioritizes reuse.

Primary goals:

- **Clean code + KISS**: simpler, clearer, smaller
- **Modernization**: TypeScript 5+ and React 19+ best practices where helpful
- **Consolidation**: reuse/extend existing helpers/constants/utilities (don't invent duplicates)
- **Architecture compliance**: Next.js App Router patterns, proper Server/Client Component separation
- **Error handling + logging**: correct boundary behavior; meaningful and non-noisy logs

## Non-negotiables / No-Go's (remove these)

- **Bloat**: remove dead code, unused params/fields, over-abstracted layers, "just in case" utilities, and unnecessary indirection.
- **Unnecessary comments**: delete commentary/obvious comments; keep docstrings/JSDoc only where they explain **why**, invariants, or edge cases.
- **Duplication**: delete copy/paste logic; consolidate into shared helpers/constants (prefer existing ones).
- **Noisy/unhelpful logging**:
  - Don't log trivial steps or spam inside tight loops.
  - Don't log sensitive data (tokens/secrets/PII).
  - Prefer fewer logs with better context (component/action + key identifiers).
- **Wrong-layer behavior**: no business logic in API routes; no client-side code in Server Components; no server-only code in Client Components; proper separation of concerns.

## Input

- **Target scope**: Provided by the user (e.g., a component, API route, hook, utility module, or any set of files/functions)
- **Improvement intent**: Optional (e.g., "reduce complexity", "improve error handling", "reduce duplication", "modernize types", "fix Server/Client boundary issues")

## Workflow Steps

### 1. Confirm Scope + Constraints

**Action:**

- Ask for clarifications only if needed (e.g., which component(s), what behavior must remain stable)
- Identify boundaries: Server Components vs Client Components vs API Routes, and the target's public API surface
- Identify risk level: public API changes, migrations, external integrations, client-side state management

**Output:**

- A short scope statement: what will be reviewed and what will not
- A list of invariants to preserve (behavior, outputs, side-effects, performance constraints)

### 2. Map the Target in Context (Don't Start Editing Yet)

**Action:**

- Locate entry points + call graph:
  - who calls it, what it returns, which errors are expected/handled
  - dependencies: hooks, utilities, API clients, types, components
- Identify cross-cutting concerns:
  - error handling patterns and what context is available (component name, action, identifiers, etc.)
  - error mapping and boundary translation (API route vs component vs hook)
  - Server vs Client Component boundaries

**Output:**

- A brief "system map" describing dependencies and data flow
- A list of critical paths and failure modes
- Identification of any Server/Client boundary violations

### 3. Reuse-First Scan (Helpers, Constants, Existing Patterns)

**Action:**

- Search the codebase for:
  - existing helper functions/utilities used in similar modules (check `app/lib/utils.ts` and other lib files)
  - constants/enums/shared types that should be reused
  - existing error handling/retry/parsing/dedupe patterns
  - existing React hooks or component patterns appropriate for the use case
- Prefer:
  - extending existing shared utilities rather than duplicating logic
  - consolidating patterns into a single reusable hook/component/utility when multiple call sites exist

**Output:**

- A shortlist of existing utilities/constants/hooks to reuse or extend (with file paths)
- A shortlist of duplication candidates to consolidate

### 4. Improvement Review (High-Leverage Findings Only)

Focus on **HIGH** and **MEDIUM** impact improvements. Do not nitpick style.

#### 4.1 Clean Code + KISS Review

- Identify "why is this hard to understand?" hotspots:
  - deeply nested JSX, long components, unclear naming, mixed responsibilities
  - long parameter lists, prop drilling, data clumps, primitive obsession
  - duplication and inconsistent patterns across similar components/modules
- Prefer:
  - small, composable components/hooks with clear names
  - early returns over nested conditionals
  - centralized patterns instead of copy/paste
  - proper TypeScript types instead of `any` or loose types

#### 4.2 Architecture & Next.js Patterns Review

**Critical checks:**

- **Server vs Client Components**:
  - Server Components (`app/**/page.tsx`, `app/**/layout.tsx` by default) must not use hooks, browser APIs, or event handlers
  - Client Components (marked with `"use client"`) can use hooks, state, and browser APIs
  - API Routes (`app/api/**/route.ts`) are Server Components and should not import Client Components
- **Data fetching**:
  - Server Components should fetch data directly or use Server Actions
  - Client Components should use React Query or similar for client-side data fetching
  - API Routes should handle external API calls and data transformation
- **File organization**:
  - Components in `app/components/`
  - Utilities in `app/lib/`
  - API routes in `app/api/`
  - Types should be co-located or in `app/lib/` with clear naming

Flag and remediate any violations by moving logic to the correct layer and adjusting imports.

#### 4.3 Error Handling Review (Boundary-Appropriate)

Evaluate whether errors are handled **at the correct layer** and communicated clearly.

- **API Routes**:
  - must return proper HTTP status codes and structured error responses
  - should log errors with context (route, params, error details)
  - avoid leaking sensitive data in error responses (especially in production)
- **Server Components**:
  - should handle errors gracefully, potentially using error boundaries or returning error states
  - log errors appropriately with context
- **Client Components**:
  - should handle async errors (from hooks, fetches) and display user-friendly messages
  - use error boundaries for unexpected errors
  - avoid exposing technical error details to users in production
- **Hooks**:
  - should handle errors internally or propagate them appropriately
  - provide error states for components to consume

Also check:

- error type specificity (avoid catching `any` or `unknown` without proper type guards)
- consistent error mapping (don't swallow critical failures silently)
- no secret leakage in error messages or logs
- proper use of TypeScript error types

#### 4.4 Logging & Observability Review

Check logging for:

- consistent message format: `"[Component/Route]: [Action]"` or similar
- appropriate levels:
  - `console.log` for development-only debug info
  - `console.error` for errors with context
  - Consider structured logging if the project uses a logging library
- context keys are present and consistent where available (e.g., component name, action, identifiers)
- avoid logging sensitive data (tokens, secrets, PII) unless explicitly scrubbed
- avoid log spam in tight loops or re-renders; prefer aggregate logs for batch operations
- avoid "narration" logs (e.g., logging every small step with no decision/value)
- Remove or guard development-only logs (check `process.env.NODE_ENV === "development"`)

#### 4.5 TypeScript & Type Safety Review

- Avoid `any`, prefer `unknown` with type guards when types are truly unknown
- Use proper type inference where possible
- Ensure API responses and data structures have proper types
- Check for missing null/undefined handling
- Prefer type unions and discriminated unions over loose types
- Ensure props interfaces are properly defined and exported when needed

### 5. Design the Refactor Plan (Before Editing)

**Action:**

- Propose a minimal plan that delivers most value with low risk:
  - what will change, what will not
  - how behavior remains stable (or what behavior changes intentionally)
  - where shared utilities/hooks/components will be reused/extended
  - how errors/logging will be improved
  - how Server/Client boundaries will be fixed
- Identify test strategy (minimal, high-signal):
  - new/changed business logic should be testable
  - error recovery and mapping should be tested
  - component behavior should be verifiable
  - avoid brittle implementation details in tests

**Output:**

- A small set of refactor steps (prefer 3–7 steps)
- A list of target validations (happy path + boundary + failure)

### 6. Implement Improvements

**Action:**

- Execute the plan with small, reviewable changes
- Keep components/hooks focused; extract helpers if complexity grows
- Prefer modern TypeScript 5+ and React 19+ patterns when they clarify intent
- Ensure changes remain within correct architectural boundaries (Server/Client separation)
- Actively remove the "No-Go's" (bloat, duplication, unnecessary comments, noisy logging) as you touch code
- Ensure proper TypeScript types throughout

### 7. Validate

**Action:**

- Ensure target module imports still respect Server/Client boundaries
- Verify TypeScript compiles without errors (`npm run typecheck`)
- Run linting (`npm run lint`)
- Verify error paths behave correctly and logs are meaningful and not noisy
- Check that the code follows Next.js App Router conventions

### 8. Output: Improvement Report

Structure your output like this:

```markdown
# Code Improvement Report

## Scope

- Reviewed: [targets]
- Not reviewed: [explicit exclusions]
- Invariants preserved: [list]

## Key Findings (High/Medium Only)

### [Finding Title] (HIGH|MEDIUM)

**Location:** `path/to/file.tsx:area` or `path/to/file.ts:area`
**Why it matters:** [impact]
**Proposed change:** [what to do]
**Notes on reuse:** [existing helpers/hooks/components to reuse/extend]

## Refactor Plan

1. ...
2. ...

## Implemented Changes (if executed)

- Modified: [list]
- New: [list]
- Deleted: [list]

## Error Handling & Logging Improvements

- [what changed, why it's safer/clearer]

## TypeScript & Type Safety Improvements

- [what changed, improved types, removed any, etc.]

## Architecture & Boundary Fixes

- [Server/Client Component fixes, API route improvements, etc.]

## Testing Assessment

### ✅ Adequate Coverage

- ...

### ❌ Missing/Inadequate Tests

- ...

## Summary

- Total improvements: X (Y high, Z medium)
- Biggest wins: [top 3]
```
