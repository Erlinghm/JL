# Problem: BankID biometrics may need forced step-up

BankID with biometrics can perform internal risk-based step-up, but a product
may need to force stronger authentication based on its own risk assessment.

## Context

The BankID developer note describes forcing step-up with `acr_values`. This is
reference material for future BankID integration work, not proof that the repo
already implements the flow.

## Risk

If the wrong `acr_values` are used:

- The user may not be forced to BankID High when required.
- Authentication can fail after biometrics if the requested assurance is not
  satisfied.
- The product can pay based on the first successful authentication method in the
  requested array.

## Source documents

- `.firecrawl/bankid-biometrics-forcing-step-up.md`
