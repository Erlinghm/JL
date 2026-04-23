# Solution: Use Idura's Norwegian BankID reference as the integration baseline

For a future Idura Verify integration, use the documented Norwegian BankID
claim and assurance behavior as the baseline.

## Useful implementation notes

- Code-unit BankID authenticators use high assurance.
- Biometric BankID app authentication uses substantial assurance.
- `uniqueuserid` identifies the legal person and is described as not sensitive
  in the source notes.
- `socialno` is sensitive and must be handled as personal data.
- Biometric responses can omit certificate subject information.
- Idura still uses some `@criipto` package names and imports after the rename.

## Cautions

- Treat identity claims as personal data unless the integration policy says
  otherwise.
- Avoid storing `socialno` unless the product requirement and legal basis are
  explicit.
- Confirm current Idura documentation before production implementation because
  this memory bank is extracted from local scraped notes.
