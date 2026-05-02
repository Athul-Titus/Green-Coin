# Contributing to GreenCoin

Thanks for your interest in contributing! Here's how to get started.

---

## Development Setup

1. Fork the repository and clone your fork
2. Follow the [STARTUP.md](STARTUP.md) guide to set up the project locally
3. Create a new branch for your feature or fix

---

## Branch Naming

Use descriptive branch names with a prefix:

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feat/` | New feature | `feat/leaderboard-page` |
| `fix/` | Bug fix | `fix/login-rate-limit` |
| `docs/` | Documentation | `docs/api-reference` |
| `refactor/` | Code refactoring | `refactor/auth-middleware` |
| `perf/` | Performance improvement | `perf/redis-caching` |

---

## Code Style

### Python (Backend)
- Follow **PEP 8** conventions
- Use **type hints** for function signatures
- Keep functions focused and under 50 lines where possible
- Add docstrings to public functions and classes
- Use `logging` instead of `print()` statements

### TypeScript (Frontend)
- Use **functional components** with hooks
- Use **TypeScript** types/interfaces (no `any` unless necessary)
- Keep components focused — one component per file
- Use CSS classes from the design system, not inline styles for layout

---

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
type(scope): short description

Optional longer description explaining the change.
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

**Examples**:
```
feat(auth): add rate limiting to login endpoint
fix(credits): correct balance calculation for sold credits
docs(readme): add API endpoint reference table
perf(models): add database indexes on frequently queried columns
```

---

## Pull Request Process

1. **Create a branch** from `main` following the naming convention above
2. **Make your changes** with clear, focused commits
3. **Test locally** — ensure the backend starts, frontend builds, and your feature works
4. **Update documentation** if your change affects the API or setup process
5. **Open a PR** with a clear description of what changed and why
6. **Wait for review** — respond to any feedback

### PR Checklist
- [ ] Code follows the style guide
- [ ] All existing features still work
- [ ] New features have been tested manually
- [ ] Documentation updated (if applicable)
- [ ] No secrets or API keys committed

---

## Security

If you discover a security vulnerability, please **do not** open a public issue. Instead, email the maintainer directly.

**Never commit**:
- API keys or tokens
- Database credentials
- `.env` files
- Private keys

---

## Questions?

Open a [GitHub Discussion](https://github.com/Athul-Titus/Green-Coin/discussions) or reach out to the maintainers.
