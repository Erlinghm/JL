# Memory bank

This folder captures reusable problems and solutions extracted from the
repository Markdown files. It is meant for Pasha, Claude, and Codex to quickly
recover decisions that have already been made.

Each entry follows this shape:

- `problem.md` describes the issue, context, symptoms, and source documents.
- `solution.md` describes the fix, verification, and cautions for future work.

## Entries

- `sprint-1-postgres-prisma-migration`: Migrating the app from SQLite-style
  assumptions to Supabase PostgreSQL through Prisma.
- `sprint-1-railway-supabase-connection`: Connecting Railway production to the
  Supabase database.
- `sprint-1-railway-deploy-troubleshooting`: Diagnosing common Railway
  deployment and database connection failures.
- `sprint-1-auth-admin-boundary`: Preserving the intended Supabase auth and
  local admin authorization boundary.
- `sprint-1-farm-model-legacy-adapter`: Keeping normalized Prisma data
  compatible with the legacy auction-shaped UI.
- `sprint-1-migration-tree-sync`: Keeping Prisma and Supabase migration trees
  aligned.
- `sprint-1-graphify-orientation`: Using Graphify output to avoid wasteful repo
  walks and stale architecture assumptions.
- `sprint-1-bankid-app-support`: BankID app activation and user-support notes.
- `sprint-1-bankid-biometrics-step-up`: BankID biometrics step-up behavior and
  `acr_values` choices.
- `sprint-1-idura-norwegian-bankid`: Idura Norwegian BankID claims, assurance
  levels, and production-readiness notes.
- `sprint-1-agricultural-design-system`: Visual design rules for the
  agricultural marketplace UI.

## Source coverage

The entries were extracted from these project Markdown sources:

- `CLAUDE.md`
- `DEV_CHECKLIST.md`
- `HANDOFF_SUMMARY.md`
- `QUICK_RAILWAY_SETUP.md`
- `RAILWAY_SETUP.md`
- `RAILWAY_SUPABASE_HANDOFF.md`
- `README.md`
- `DESIGN.md`
- `comprehensive_design_guidelines_design.md`
- `.firecrawl/bankid-code-unit-or-app.md`
- `.firecrawl/bankid-biometrics-forcing-step-up.md`
- `.firecrawl/bankid-help-app.md`
- `.firecrawl/idura-norwegian-bankid.md`
- `graphify-out/GRAPH_REPORT.md`

The `.agents/skills/**` Markdown files are external agent skill/reference
material. They were not copied into this memory bank because they do not
describe resolved problems in this repository.

## Security note

Some source documents contain live-looking connection strings. This memory bank
intentionally redacts secrets and records only the operational shape of the
solution. Retrieve real credentials from the deployment or secret-management
system, not from copied documentation.
