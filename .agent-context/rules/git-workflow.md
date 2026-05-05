# Git Workflow — Clean History, Atomic Commits

> Your git log is a changelog. If it reads like gibberish, your team is lost.

## Commit Message Format: Conventional Commits (Enforced)

```
<type>(<scope>): <description>

[optional body — explain WHY, not WHAT]
[optional footer — Breaking changes, issue references]
```

### Types (Strict Set)
| Type | When | Example |
|------|------|---------|
| `feat` | New feature | `feat(auth): add JWT refresh token rotation` |
| `fix` | Bug fix | `fix(payment): handle race condition in checkout` |
| `refactor` | Code restructuring (no behavior change) | `refactor(user): extract validation to separate service` |
| `docs` | Documentation only | `docs(api): add OpenAPI schema for /orders endpoint` |
| `test` | Adding/fixing tests | `test(cart): add edge case for empty cart discount` |
| `chore` | Build, CI, config, dependencies | `chore(deps): upgrade prisma to 5.x` |
| `perf` | Performance improvement | `perf(search): add index on users.email column` |
| `style` | Formatting, semicolons (no logic change) | `style: apply prettier formatting` |
| `ci` | CI/CD changes | `ci: add Node 20 to test matrix` |

### Rules
1. **Type is mandatory.** No commits without a type prefix.
2. **Scope is required for module or feature changes.** Use the module/feature name.
3. **Description is imperative mood.** "add", not "added" or "adds".
4. **Max 72 characters** for the subject line.
5. **Body explains WHY,** not what. The diff shows what.

### ❌ BANNED Commit Messages
```
fix bug
updates
WIP
asdf
misc changes
working now
final fix
fix fix fix
```

---

## Branching Model

### Main Branches
| Branch | Purpose | Merge Strategy |
|--------|---------|---------------|
| `main` | Production-ready code | Merge commit or squash |
| `develop` | Integration branch (if using GitFlow) | Merge commit |

### Feature Branches
```
Pattern: <type>/<ticket-id>-<short-description>

Examples:
  feat/AUTH-123-jwt-refresh
  fix/PAY-456-checkout-race-condition
  refactor/USER-789-extract-validation
  chore/INFRA-101-upgrade-node-20
```

### Rules
1. Branch from `main` (or `develop` if using GitFlow)
2. Keep branches short-lived (max 2-3 days)
3. Rebase on `main` before creating PR — don't merge main into your branch
4. Delete branch after merge

---

## Pull Request Standards

### PR Size
| Size | Lines Changed | Verdict |
|------|--------------|---------|
| Small | 1-100 | ✅ Ideal — easy to review |
| Medium | 100-300 | ⚠️ Acceptable — split if possible |
| Large | 300-500 | 🔶 Needs justification |
| Massive | 500+ | ❌ MUST be split into smaller PRs |

**Rule:** If a PR touches more than 5 files across different modules, it's doing too much. Split it.

### PR Description Template
```markdown
## What
Brief description of what this PR does.

## Why
Why this change is needed. Link to issue/ticket.

## How
High-level approach. Mention any non-obvious design decisions.

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests (if applicable)
- [ ] Manual testing steps

## Screenshots (if UI change)
Before | After
```

### PR Review Rules
1. Every PR needs at least 1 approval
2. Author resolves all comments before merge
3. CI must pass (lint, test, build)
4. No `// TODO` without a linked issue
5. No `console.log` debugging statements in production code

---

## Commit Atomicity

### Rule: Each Commit Must Be a Complete, Working Unit

```
❌ BANNED sequence:
1. feat(user): add user model          ← compiles? maybe
2. fix: fix import                     ← fixing previous commit
3. feat(user): add user service        ← compiles? probably
4. fix: fix typo                       ← fixing previous commit
5. feat(user): add user controller     ← finally works together

✅ REQUIRED:
1. feat(user): add user registration module
   → Model, Service, Controller, Tests — all in one complete, working commit
   → Or split into logical chunks that each compile and pass tests independently
```

**Rule:** Every commit on `main` should compile, pass lint, and pass tests. Use interactive rebase (`git rebase -i`) to squash fix-up commits before merging.

---

## .gitignore Standards

### MUST Ignore
```
# Dependencies
node_modules/
vendor/
venv/
__pycache__/
.gradle/
target/

# Environment
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/settings.json
*.swp
*.swo
.DS_Store
Thumbs.db

# Build output
dist/
build/
out/
*.min.js
*.min.css

# Logs
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db
```

### MUST Commit
```
.env.example           # Template with placeholder values
.editorconfig          # Consistent formatting across IDEs
.prettierrc            # Formatter config
.eslintrc.*            # Linter config
tsconfig.json          # TypeScript config
docker-compose.yml     # Dev environment
Makefile / Taskfile    # Standard commands
```

---

## The Git Health Check

Before pushing:
- [ ] All commits follow Conventional Commits format
- [ ] No fixup commits (squash them)
- [ ] Branch is rebased on latest main
- [ ] CI passes locally (lint, test, build)
- [ ] No secrets in any commit (check with `git log -p | grep -i "password\|secret\|key"`)
- [ ] No merge commits in feature branch (rebase instead)
