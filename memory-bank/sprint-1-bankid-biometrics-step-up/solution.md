# Solution: Request the right `acr_values` for the risk level

Use `acr_values` through the BankID permissions flow when the integration needs
explicit assurance behavior.

## Key values

- `urn:bankid:bis`: Biometric authentication using WebAuthn.
- `urn:bankid:bih`: BankID High authentication.

## Recommended forced step-up

For forced step-up, request:

```json
["urn:bankid:bih"]
```

This forces the user to complete authentication with BankID High. If the user
cannot complete the step-up, authentication fails.

## Important caveats

- Forcing step-up requires upfront permissions.
- The authorize request must include `urn:bankid:bis` toward BankID OIDC so the
  request routes to the identity provider that supports the permissions API.
- BankID presents a biometrics prompt before other methods, even when the
  requested result requires BankID High.
- `["urn:bankid:bis", "urn:bankid:bih"]` is not recommended because it adds no
  value over the default biometric-first behavior.
