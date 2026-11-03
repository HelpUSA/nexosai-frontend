# B1 — remediation experiment and risk decision (2026-11-03)

This is an **isolated experiment**, not a dependency lockfile change intended for release.

## Baseline evidence
At consolidated candidate PR #21 HEAD `dfaea155fe7b8f1afd988ab05e4705e0ea5a7625`, `package-lock.json` resolves:
- `node_modules/@typescript-eslint/typescript-estree/node_modules/minimatch` at **10.2.5** (requested by `@typescript-eslint/typescript-estree` as `^10.2.2`).
- `node_modules/minimatch` at **3.1.5** used by ESLint-related tooling.
- Previous audit report described 16 moderate dev-only findings. This count is a **snapshot, not a permanent risk classification**; re-audit at the actual intended candidate HEAD.

## Safe experiment
Workflow `g3c-b1-minimatch-probe.yml` uses a disposable GitHub runner and injects a **scoped** `minimatch: 11.0.4` override beneath `@typescript-eslint/typescript-estree` into the runner's ephemeral `package.json`; regenerates `package-lock.json` in the runner; attempts deterministic `npm ci`, full `npm audit`, production-only audit, Prisma generation, build and selected unit tests.

Why scoped? A global major-version override could disrupt eslint's other `minimatch` consumers that explicitly use `^3.1.5`. Even scoped overrides across a major version can break runtime semantics; successful install/build is necessary but insufficient for acceptance.

## Acceptance decision
- **Do not declare B1 closed** based on this probe alone.
- Compare baseline and experimental advisories at the same calendar date, inspect *all* remaining paths, run full lint/build/tests and review behavioral compatibility.
- If proven compatible, create a separate Draft lockfile remediation PR using a reproducibly regenerated package-lock and complete test evidence.
- If incompatible, investigate upstream patched `@typescript-eslint` or ESLint releases, pin safe direct dev dependencies and propose a time-boxed risk acceptance as a last resort.
- Only the authorized Master SuperAdmin (or designated risk owner) can accept residual risk. Record advisory list, reachability, environment, compensating controls, expiry/review date, owner and signature. The assistant must **not** accept B1 risk.

## Separation of concerns
B1 is independent of B2 Neon inventory, B3 real OAuth/HTTPS, and B4 authorization. This experiment uses no production services, secrets or databases. Its CI status should be interpreted as a probe, not as overall G3C readiness.


## Empirical results on 2026-11-03 (GitHub Actions)

1. **Scoped override, runner-only**: [Run 41660454260](https://github.com/HelpUSA/nexosai-frontend/actions/runs/41660454260) SUCCESS, with npm ci, Next build, 15 selected tests and strict production audit. Full development audit still reported **15 moderate**, 0 high/critical, even though `@typescript-eslint/typescript-estree/node_modules/minimatch` resolved to 11.0.4. Global `node_modules/minimatch` remained 3.1.5. Therefore scoped remediation is **insufficient to close B1**.
2. **Global override, runner-only**: [Run 41660843249](https://github.com/HelpUSA/nexosai-frontend/actions/runs/41660843249) FAILED after audit returned **0 vulnerabilities**, Next build succeeded and 15 selected unit tests passed. ESLint runtime crashed with `TypeError: (0 , brace_expansion_1.expand) is not a function` in `@eslint/config-array`. Therefore **DO NOT APPLY GLOBAL minimatch 11.0.4 OVERRIDE** to candidate or release. Zero findings on npm audit does not compensate for broken tooling.
3. The tests ran on disposable CI and did **not** commit a modified manifest/lockfile. Parent candidate PR #21 and production are unchanged.

**B1 decision: still OPEN.** Preferred next action is to identify compatible upstream dependency updates or safe patches supported by affected package maintainers, while separately tracking residual dev-only risk and asking an authorized owner to decide if no compatible remediation exists.
