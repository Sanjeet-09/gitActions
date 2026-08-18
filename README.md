# SGPA Calculator — a CI/CD demonstration

[![CI](https://github.com/USERNAME/sgpa-calculator/actions/workflows/ci.yml/badge.svg)](https://github.com/USERNAME/sgpa-calculator/actions/workflows/ci.yml)
[![Deploy](https://github.com/USERNAME/sgpa-calculator/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/USERNAME/sgpa-calculator/actions/workflows/deploy-pages.yml)

A Student Result & SGPA Calculator, built as the demonstration project for an
MCA Semester 3 DevOps presentation on **GitHub Actions**.

**Live site:** https://USERNAME.github.io/sgpa-calculator/

> Replace `USERNAME` above with your GitHub username after you create the repo —
> the badges and link will then work.

---

## Why this project exists

The application is deliberately simple so that attention stays on the
**pipeline**. The pipeline is not simple — it uses the same techniques a
production team would: staged gates, matrix builds, dependency caching, build
artifacts, branch protection, environment approvals, OIDC deployment and
container publishing.

The one clever bit in the app itself: the deployed page displays the **commit it
was built from**, injected at build time from the environment variables GitHub
Actions provides. That is what lets an audience *see* that the live site changed.

---

## Quick start

```bash
npm ci          # install (exact, from the lockfile)
npm test        # 21 unit tests
npm run lint    # ESLint
npm run build   # emit dist/
npm start       # serve dist/ at http://localhost:3000
```

One command for everything CI does:

```bash
npm run ci
```

**Requires Node 18+.** No runtime dependencies; ESLint is the only devDependency.

### Verified locally on Node v22.20.0

```
npm run lint          → clean, 0 problems
npm test              → 21 tests, 21 pass, 0 fail
npm run test:coverage → 100% lines / 100% branches / 100% functions on src/
npm run build         → 5 files emitted to dist/
```

---

## Project layout

```
.
├── .github/
│   ├── workflows/
│   │   ├── ci.yml               ← lint → 6-job test matrix → build → gate
│   │   ├── deploy-pages.yml     ← auto-deploy to GitHub Pages after CI passes
│   │   ├── manual-release.yml   ← workflow_dispatch inputs + approval gate
│   │   ├── docker-publish.yml   ← build + push image to ghcr.io
│   │   └── pr-hello.yml         ← the minimal "hello world" workflow
│   ├── dependabot.yml
│   └── pull_request_template.md
├── src/grades.js                ← all business logic (runs in Node AND the browser)
├── test/grades.test.js          ← 21 tests, node:test — zero test dependencies
├── public/                      ← the web UI
├── scripts/
│   ├── build.js                 ← copies public/ → dist/, stamps build provenance
│   └── serve.js                 ← zero-dependency static server
├── Dockerfile                   ← multi-stage build
└── eslint.config.js
```

**`src/grades.js` is imported by both the tests and the browser.** Same file,
same logic, no duplication — which is why 100% test coverage on it means the
deployed page is covered too.

---

## The workflows

### `ci.yml` — Continuous Integration

Runs on every push to `main`/`develop`, every PR to `main`, and on demand.

```
lint ──► test (6 jobs in parallel) ──► build ──► ci-passed
~20s          ~40s each                 ~15s      gate
```

| Job | What it does |
|---|---|
| `lint` | ESLint. Cheapest gate, runs first. |
| `test` | Matrix: {ubuntu, windows} × {Node 18, 20, 22}. `fail-fast: false`. Coverage on ubuntu/20 only. |
| `build` | Produces `dist/`, uploads it as an artifact |
| `ci-passed` | Aggregating gate — **the single required status check** |

The `ci-passed` pattern means branch protection references one job name, so the
matrix can change without editing the protection rule.

### `deploy-pages.yml` — Continuous Deployment

Triggered by `workflow_run` when **CI** completes on `main`, guarded by
`conclusion == 'success'` so a failed CI never deploys. Publishes via OIDC —
**no stored deployment credentials.**

**One-time setup:** Settings → Pages → Source: **GitHub Actions**

### `manual-release.yml` — Continuous Delivery

`workflow_dispatch` with typed inputs (environment choice, semver tag, dry-run
toggle). Targets a protected environment, so it **pauses for a human approval**.
Demonstrates secret masking without exposing anything real.

### `docker-publish.yml` — containers

Multi-stage Docker build pushed to `ghcr.io`, authenticated with the automatic
`GITHUB_TOKEN`. No registry password stored anywhere.

### `pr-hello.yml` — the teaching example

Twenty lines. Comments on new PRs. Shows the event → runner → step mechanism
with nothing else in the way. Note it has **no `actions/checkout`** — it only
calls the API, never touches the files.

---

## Repository setup

| Step | Where |
|---|---|
| Enable Pages | Settings → Pages → Source: **GitHub Actions** |
| Branch protection | Settings → Branches → require `CI passed` + 1 approval |
| Approval gate | Settings → Environments → `production` → required reviewers |
| Demo secret | Settings → Secrets → `DEPLOY_TOKEN` (any dummy string) |

Full instructions: [`../05-demo-runbook/01-setup-before-class.md`](../05-demo-runbook/01-setup-before-class.md)

---

## Things worth pointing out during the presentation

| Where | Why it matters |
|---|---|
| `ci.yml` — `permissions: contents: read` | Least privilege by default |
| `ci.yml` — `fail-fast: false` | Diagnostic value: how *many* platforms broke |
| `ci.yml` — `ci-passed` job | One stable required check regardless of matrix size |
| `deploy-pages.yml` — `conclusion == 'success'` | Without it, `workflow_run` deploys failed builds |
| `deploy-pages.yml` — `cancel-in-progress: false` | Never interrupt a deployment (opposite of CI) |
| `pr-hello.yml` — no checkout | Not every job needs the repo |
| `test/grades.test.js` — the hard-coded `39`/`40` tests | A test derived from the constant it protects can't detect a change to it |
| `scripts/build.js` | Reads `GITHUB_SHA` etc. — this is what stamps the live page |
| `Dockerfile` | Multi-stage; runs as `USER node`, not root |
