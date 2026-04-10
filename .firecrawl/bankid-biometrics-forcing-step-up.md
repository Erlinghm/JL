[Skip to content](https://developer.bankid.no/bankid-with-biometrics/advanced-topics/forcing-step-up/#supported-acr_values)

# Forcing step-up using `acr_values` [¶](https://developer.bankid.no/bankid-with-biometrics/advanced-topics/forcing-step-up/\#forcing-step-up-using-acr_values "Permanent link")

Any BankID with biometrics authentication might end up requiring [_step-up_](https://developer.bankid.no/bankid-with-biometrics/introduction/#step-up) for an authentication based on BankID with biometrics' _internal_ risk assessment.
The assessment criteria we use are opaque for security reasons.
If you have your own risk assessment strategy, prefer not to depend on our internal risk assessment, or wish to manage risk on demand, you might consider forcing a step-up.

You can force step-up in BankID with biometrics using the [`acr_values` parameter](https://openid.net/specs/openid-connect-core-1_0.html#rfc.section.3.1.2.1).
This is formally defined in the [permissions endpoint specification](https://developer.bankid.no/bankid-with-biometrics/apis/permissions.external.yaml).

Note

Forcing step-up is a feature which requires creating permissions [upfront](https://developer.bankid.no/bankid-with-biometrics/getting-started/#authorization-code-flow-with-upfront-permissions).

When using `acr_values`, you will be billed according to the first successful authentication method in the `acr_values` array.

Warning

Forcing step-up requires you to pass `urn:bankid:bis` towards BankID OIDC in the [authorize request](https://developer.bankid.no/bankid-oidc-provider/api/authorize/), regardless of what `acr_values` you want to select via the permissions API.

This is done to route your request to the appropriate identity provider which supports the permissions API.

## Supported `acr_values` [¶](https://developer.bankid.no/bankid-with-biometrics/advanced-topics/forcing-step-up/\#supported-acr_values "Permanent link")

The `acr_values` parameter takes an array of strings and currently supports two values:

- `urn:bankid:bis` \- Biometric authentication using WebAuthn
- `urn:bankid:bih` \- Authentication using BankID High.

Refer to the [OpenID configuration document's](https://app.bankid.no/.well-known/openid-configuration)`acr_values_supported` property for the latest list of supported `acr_values`.

## Configurations and behaviors [¶](https://developer.bankid.no/bankid-with-biometrics/advanced-topics/forcing-step-up/\#configurations-and-behaviors "Permanent link")

### General behaviour [¶](https://developer.bankid.no/bankid-with-biometrics/advanced-topics/forcing-step-up/\#general-behaviour "Permanent link")

We will always present a biometrics prompt before other authentication methods, regardless of `acr_values`.
This is done to provide a consistent user experience.
Depending upon the requested `acr_values`, the authentication can still fail after performing biometrics if the provided `acr_values` requirements are not met.

Below we describe specific behaviour of `acr_values` combinations.

### `["urn:bankid:bih"]` [¶](https://developer.bankid.no/bankid-with-biometrics/advanced-topics/forcing-step-up/\#urnbankidbih "Permanent link")

This configuration forces the user to complete the authentication with a step-up to BankID High.
If the user can not complete the step-up, the authentication will fail.

This is the recommended way of forcing step-up.

### `["urn:bankid:bis"]` [¶](https://developer.bankid.no/bankid-with-biometrics/advanced-topics/forcing-step-up/\#urnbankidbis "Permanent link")

This configuration is the default configuration for BankID with biometrics, meaning that if you do not supply any `acr_values`, we will default to `urn:bankid:bis`.

In this configuration we will attempt biometrics first and fall back to BankID High if the user did not have BankID with biometrics activated or biometrics failed.

### `["urn:bankid:bih", "urn:bankid:bis"]` [¶](https://developer.bankid.no/bankid-with-biometrics/advanced-topics/forcing-step-up/\#urnbankidbih-urnbankidbis "Permanent link")

This configuration forces the user to complete the authentication with a step-up to BankID High.
If the user can not complete the step-up, the authentication will fail.

We do not currently support falling back to biometrics after failing a BankID high, but we might implement this at some point in the future.
Future scenarios where this could be useful would be if BankID High is down, or the user does not have a BankID High.

### `["urn:bankid:bis", "urn:bankid:bih"]` [¶](https://developer.bankid.no/bankid-with-biometrics/advanced-topics/forcing-step-up/\#urnbankidbis-urnbankidbih "Permanent link")

This configuration is not recommended, as it provides no value over `["urn:bankid:bis"]`.

## Why use BankID with biometrics when you know you'll want step-up? [¶](https://developer.bankid.no/bankid-with-biometrics/advanced-topics/forcing-step-up/\#why-use-bankid-with-biometrics-when-you-know-youll-want-step-up "Permanent link")

Considering stepping up using BankID with biometrics currently uses BankID High behind the scenes, you might wonder why you would want BankID with biometrics with step-up _instead_ of going directly to using BankID High. Here are a couple of reasons why forcing step-up in BankID with biometrics is advantageous over using BankID High directly.

### Context [¶](https://developer.bankid.no/bankid-with-biometrics/advanced-topics/forcing-step-up/\#context "Permanent link")

The user is guaranteed to see and approve the authentication context to complete the authentication. This context has greater capabilities when using BankID with biometrics than in BankID High.

### Consistent user experience [¶](https://developer.bankid.no/bankid-with-biometrics/advanced-topics/forcing-step-up/\#consistent-user-experience "Permanent link")

While we try to keep the BankID High and the BankID with biometrics flow as similar as possible from a user perspective, there are significant differences.
One such difference is the richness of the authentication context.
If your users are accustomed to seeing the rich context from BankID with biometrics, using BankID with biometrics with step-up should provide a more consistent user experience.

### CIBA [¶](https://developer.bankid.no/bankid-with-biometrics/advanced-topics/forcing-step-up/\#ciba "Permanent link")

BankID High does not support a CIBA flow.
If you need a CIBA capabilities, and would like to reduce risk above what is provided internally by BankID with biometrics, CIBA w/ step-up can be a good option.

## Implementing [¶](https://developer.bankid.no/bankid-with-biometrics/advanced-topics/forcing-step-up/\#implementing "Permanent link")

In the [Authorization Code with upfront permissions](https://developer.bankid.no/bankid-with-biometrics/flows/code-flow-for-payments/) or [CIBA](https://developer.bankid.no/bankid-with-biometrics/flows/ciba/) flows, `acr_values` can be included in the request body when registering the permission via the [permissions endpoint](https://developer.bankid.no/bankid-with-biometrics/apis/permissions.external.yaml).

### Returned `acr` claim in the ID Token [¶](https://developer.bankid.no/bankid-with-biometrics/advanced-topics/forcing-step-up/\#returned-acr-claim-in-the-id-token "Permanent link")

The resulting `acr` is returned in the ID token as a claim.