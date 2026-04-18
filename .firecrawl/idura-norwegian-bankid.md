Close search

Tip: You can also use keyboard shortcut '/' or 'ctrl+k' to access search

Navigation

1. [Verify](https://docs.idura.app/verify/)
2. [eIDs](https://docs.idura.app/verify/e-ids/)
3. Norwegian BankID

Table of contents

Close navigation![Close navigation](<Base64-Image-Removed>)

ProductWelcomeVerifySignatures

- [Getting Started](https://docs.idura.app/verify/getting-started/)
  - [Set up the Dashboard](https://docs.idura.app/verify/getting-started/dashboard-setup/)
  - [Create test users](https://docs.idura.app/verify/getting-started/test-users/)
  - [Choose your integration](https://docs.idura.app/verify/getting-started/choose-your-integration/)
  - [Get ready for production](https://docs.idura.app/verify/getting-started/production/)
- [eIDs](https://docs.idura.app/verify/e-ids/)
  - [FrejaID](https://docs.idura.app/verify/e-ids/frejaid/)
  - [Swedish BankID](https://docs.idura.app/verify/e-ids/swedish-bankid/)
  - [German Personalausweis](https://docs.idura.app/verify/e-ids/german-personalausweis/)
  - [Norwegian BankID](https://docs.idura.app/verify/e-ids/norwegian-bankid/)
  - [United Kingdom OneID](https://docs.idura.app/verify/e-ids/united-kingdom-oneid/)
  - [Vipps MobilePay](https://docs.idura.app/verify/e-ids/vipps-mobilepay/)
  - [Danish MitID](https://docs.idura.app/verify/e-ids/danish-mitid/)
  - [Danish MitID Erhverv](https://docs.idura.app/verify/e-ids/danish-mitid-erhverv/)
  - [Finnish Trust Network](https://docs.idura.app/verify/e-ids/finnish-trust-network/)
  - [Dutch iDIN](https://docs.idura.app/verify/e-ids/dutch-idin/)
- [Guides & Tools](https://docs.idura.app/verify/guides/)
  - [Age Verification](https://docs.idura.app/verify/guides/age-verification/)
  - [Authorize URL builder](https://docs.idura.app/verify/guides/authorize-url-builder/)
  - [Caller Authentication with CIBA](https://docs.idura.app/verify/guides/caller-authentication/)
  - [OpenID Connect Visualizer](https://docs.idura.app/verify/guides/oidc-visualizer/)
  - [Single Sign-on](https://docs.idura.app/verify/guides/sso/)
  - [Work with metadata](https://docs.idura.app/verify/guides/work-with-metadata/)
  - [App switching](https://docs.idura.app/verify/guides/appswitch/)
  - [Choose language](https://docs.idura.app/verify/guides/choose-language/)
  - [Custom styling](https://docs.idura.app/verify/guides/custom-styling/)
  - [Prefilled input fields](https://docs.idura.app/verify/guides/prefilled-fields/)
  - [Private key JWT authentication](https://docs.idura.app/verify/guides/privatekey-jwt/)
  - [Pushed Authorization Requests (PAR)](https://docs.idura.app/verify/guides/pushed-authorization-requests/)
  - [Telemetry & observability](https://docs.idura.app/verify/guides/telemetry/)
- [Integrations](https://docs.idura.app/verify/integrations/)
  - [ASP.NET Core 3.1](https://docs.idura.app/verify/integrations/aspnet-core-v3/)
  - [ASP.NET Core 6.0](https://docs.idura.app/verify/integrations/aspnet-core-v6/)
  - [Node.js (Express)](https://docs.idura.app/verify/integrations/nodejs-express/)
  - [React](https://docs.idura.app/verify/integrations/react/)
  - [Vue.js](https://docs.idura.app/verify/integrations/vuejs/)
  - [JavaScript](https://docs.idura.app/verify/integrations/javascript/)
  - [Kotlin (Android)](https://docs.idura.app/verify/integrations/kotlin/)
  - [Expo (React Native)](https://docs.idura.app/verify/integrations/react-native-expo/)
  - [Swift (iOS)](https://docs.idura.app/verify/integrations/swift/)
  - [Wordpress](https://docs.idura.app/verify/integrations/wordpress/)
  - [Auth0](https://docs.idura.app/verify/integrations/auth0/)
  - [AWS Cognito](https://docs.idura.app/verify/integrations/aws-cognito/)
  - [Okta](https://docs.idura.app/verify/integrations/okta/)
  - [OneLogin](https://docs.idura.app/verify/integrations/onelogin/)
  - [PingFederate](https://docs.idura.app/verify/integrations/pingfederate/)
  - [Firebase Authentication with Identity Platform](https://docs.idura.app/verify/integrations/firebase/)
  - [PHP](https://docs.idura.app/verify/integrations/php/)
- [How it works](https://docs.idura.app/verify/how-it-works/)
  - [Idura Verify Overview](https://docs.idura.app/verify/how-it-works/overview/)
  - [Core concepts](https://docs.idura.app/verify/how-it-works/core-concepts/)
  - [Using OpenID Connect](https://docs.idura.app/verify/how-it-works/oidc-intro/)
  - [OpenID Connect best security practices](https://docs.idura.app/verify/how-it-works/best-security-practices/)
- [Reference](https://docs.idura.app/verify/reference/)
  - [JWT payloads per eID type](https://docs.idura.app/verify/reference/token-contents/)
  - [Rate limiting](https://docs.idura.app/verify/reference/rate-limiting/)
  - [Glossary](https://docs.idura.app/verify/reference/glossary/)
  - [Errors](https://docs.idura.app/verify/reference/errors/)
  - [Samples](https://docs.idura.app/verify/reference/samples/)

Close table of contents![Close table of contents](<Base64-Image-Removed>)

##### On this page

- [JWT/Token examples](https://docs.idura.app/verify/e-ids/norwegian-bankid/#jwttoken-examples)
- [Kodebrikke authenticators](https://docs.idura.app/verify/e-ids/norwegian-bankid/#kodebrikke-authenticators)
- [Biometric authenticator (BankID app)](https://docs.idura.app/verify/e-ids/norwegian-bankid/#biometric-authenticator-bankid-app)
- [Test users](https://docs.idura.app/verify/e-ids/norwegian-bankid/#test-users)
- [Creating netcentric test users](https://docs.idura.app/verify/e-ids/norwegian-bankid/#creating-netcentric-test-users)
- [Renewing netcentric test users](https://docs.idura.app/verify/e-ids/norwegian-bankid/#renewing-netcentric-test-users)
- [Testing BankID Biometric](https://docs.idura.app/verify/e-ids/norwegian-bankid/#testing-bankid-biometric)
- [Data and consent for Norwegian BankID](https://docs.idura.app/verify/e-ids/norwegian-bankid/#data-and-consent-for-norwegian-bankid)
- [Available data / scopes](https://docs.idura.app/verify/e-ids/norwegian-bankid/#available-data--scopes)
- [Consent model](https://docs.idura.app/verify/e-ids/norwegian-bankid/#consent-model)
- [Forced and optional consent](https://docs.idura.app/verify/e-ids/norwegian-bankid/#forced-and-optional-consent)
- [Configuration](https://docs.idura.app/verify/e-ids/norwegian-bankid/#configuration)
- [BankID Biometrics assurance level](https://docs.idura.app/verify/e-ids/norwegian-bankid/#bankid-biometrics-assurance-level)
- [Modifying user flows](https://docs.idura.app/verify/e-ids/norwegian-bankid/#modifying-user-flows)
- [Ordering Norwegian BankID](https://docs.idura.app/verify/e-ids/norwegian-bankid/#ordering-norwegian-bankid)
- [Ordering the client credentials](https://docs.idura.app/verify/e-ids/norwegian-bankid/#ordering-the-client-credentials)
- [Next steps](https://docs.idura.app/verify/e-ids/norwegian-bankid/#next-steps)

ProductWelcomeVerifySignatures

- [Getting Started](https://docs.idura.app/verify/getting-started/)
  - [Set up the Dashboard](https://docs.idura.app/verify/getting-started/dashboard-setup/)
  - [Create test users](https://docs.idura.app/verify/getting-started/test-users/)
  - [Choose your integration](https://docs.idura.app/verify/getting-started/choose-your-integration/)
  - [Get ready for production](https://docs.idura.app/verify/getting-started/production/)
- [eIDs](https://docs.idura.app/verify/e-ids/)
  - [FrejaID](https://docs.idura.app/verify/e-ids/frejaid/)
  - [Swedish BankID](https://docs.idura.app/verify/e-ids/swedish-bankid/)
  - [German Personalausweis](https://docs.idura.app/verify/e-ids/german-personalausweis/)
  - [Norwegian BankID](https://docs.idura.app/verify/e-ids/norwegian-bankid/)
  - [United Kingdom OneID](https://docs.idura.app/verify/e-ids/united-kingdom-oneid/)
  - [Vipps MobilePay](https://docs.idura.app/verify/e-ids/vipps-mobilepay/)
  - [Danish MitID](https://docs.idura.app/verify/e-ids/danish-mitid/)
  - [Danish MitID Erhverv](https://docs.idura.app/verify/e-ids/danish-mitid-erhverv/)
  - [Finnish Trust Network](https://docs.idura.app/verify/e-ids/finnish-trust-network/)
  - [Dutch iDIN](https://docs.idura.app/verify/e-ids/dutch-idin/)
- [Guides & Tools](https://docs.idura.app/verify/guides/)
  - [Age Verification](https://docs.idura.app/verify/guides/age-verification/)
  - [Authorize URL builder](https://docs.idura.app/verify/guides/authorize-url-builder/)
  - [Caller Authentication with CIBA](https://docs.idura.app/verify/guides/caller-authentication/)
  - [OpenID Connect Visualizer](https://docs.idura.app/verify/guides/oidc-visualizer/)
  - [Single Sign-on](https://docs.idura.app/verify/guides/sso/)
  - [Work with metadata](https://docs.idura.app/verify/guides/work-with-metadata/)
  - [App switching](https://docs.idura.app/verify/guides/appswitch/)
  - [Choose language](https://docs.idura.app/verify/guides/choose-language/)
  - [Custom styling](https://docs.idura.app/verify/guides/custom-styling/)
  - [Prefilled input fields](https://docs.idura.app/verify/guides/prefilled-fields/)
  - [Private key JWT authentication](https://docs.idura.app/verify/guides/privatekey-jwt/)
  - [Pushed Authorization Requests (PAR)](https://docs.idura.app/verify/guides/pushed-authorization-requests/)
  - [Telemetry & observability](https://docs.idura.app/verify/guides/telemetry/)
- [Integrations](https://docs.idura.app/verify/integrations/)
  - [ASP.NET Core 3.1](https://docs.idura.app/verify/integrations/aspnet-core-v3/)
  - [ASP.NET Core 6.0](https://docs.idura.app/verify/integrations/aspnet-core-v6/)
  - [Node.js (Express)](https://docs.idura.app/verify/integrations/nodejs-express/)
  - [React](https://docs.idura.app/verify/integrations/react/)
  - [Vue.js](https://docs.idura.app/verify/integrations/vuejs/)
  - [JavaScript](https://docs.idura.app/verify/integrations/javascript/)
  - [Kotlin (Android)](https://docs.idura.app/verify/integrations/kotlin/)
  - [Expo (React Native)](https://docs.idura.app/verify/integrations/react-native-expo/)
  - [Swift (iOS)](https://docs.idura.app/verify/integrations/swift/)
  - [Wordpress](https://docs.idura.app/verify/integrations/wordpress/)
  - [Auth0](https://docs.idura.app/verify/integrations/auth0/)
  - [AWS Cognito](https://docs.idura.app/verify/integrations/aws-cognito/)
  - [Okta](https://docs.idura.app/verify/integrations/okta/)
  - [OneLogin](https://docs.idura.app/verify/integrations/onelogin/)
  - [PingFederate](https://docs.idura.app/verify/integrations/pingfederate/)
  - [Firebase Authentication with Identity Platform](https://docs.idura.app/verify/integrations/firebase/)
  - [PHP](https://docs.idura.app/verify/integrations/php/)
- [How it works](https://docs.idura.app/verify/how-it-works/)
  - [Idura Verify Overview](https://docs.idura.app/verify/how-it-works/overview/)
  - [Core concepts](https://docs.idura.app/verify/how-it-works/core-concepts/)
  - [Using OpenID Connect](https://docs.idura.app/verify/how-it-works/oidc-intro/)
  - [OpenID Connect best security practices](https://docs.idura.app/verify/how-it-works/best-security-practices/)
- [Reference](https://docs.idura.app/verify/reference/)
  - [JWT payloads per eID type](https://docs.idura.app/verify/reference/token-contents/)
  - [Rate limiting](https://docs.idura.app/verify/reference/rate-limiting/)
  - [Glossary](https://docs.idura.app/verify/reference/glossary/)
  - [Errors](https://docs.idura.app/verify/reference/errors/)
  - [Samples](https://docs.idura.app/verify/reference/samples/)

![Close icon](<Base64-Image-Removed>)

## We changed our name from Criipto to Idura

You will still see @criipto packages and default imports in our SDKs and code samples. This is expected and fully supported.

Read the full story in our announcement: [We are now Idura](https://www.idura.eu/blog/we-are-now-idura).

## [​](https://docs.idura.app/verify/e-ids/norwegian-bankid/\#jwttoken-examples) JWT/Token examples

### [​](https://docs.idura.app/verify/e-ids/norwegian-bankid/\#kodebrikke-authenticators) Kodebrikke authenticators

Triggered with `acr_values=urn:grn:authn:no:bankid:high` (or `acr_values=urn:grn:authn:no:bankid`)

The level of assurance for these authenticators are: High

{

"identityscheme": "nobankid-oidc",

Overall eID used to authenticate

"nameidentifier": "ee9b1bb905a6458e9f3b9d068f1a3765",

Legacy format of 'sub'

"sub": "{ee9b1bb9-05a6-458e-9f3b-9d068f1a3765}",

Persistent pseudonym. Uniquely identifies an eID user (per Idura Verify tenant)

"uniqueuserid": "9578-6000-4-351726",

Identifies the legal person corresponding to the login (just like the socialno does, but is not considered to be sensitive)

"certissuer": "CN=BankID - TestBank1 - Bank CA 3,OU=123456789,O=TestBank1 AS,C=NO;OrginatorId=9980;OriginatorName=BINAS;OriginatorId=9980",

"certsubject": "CN=Larsen\\\, Mikkel,O=TestBank1 AS,C=NO,SERIALNUMBER=9578-6000-4-351726",

"birthdate": "1946-03-27",

"socialno": "27034698436",

Social security number

"family\_name": "Larsen",

[An OpenID Connect standard claim](https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims)

"given\_name": "Mikkel",

[An OpenID Connect standard claim](https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims)

"name": "Mikkel Larsen",

"country": "NO"

}

The `uniqueUserId` identifies the legal person corresponding to the login, and is not considered sensitive.

### [​](https://docs.idura.app/verify/e-ids/norwegian-bankid/\#biometric-authenticator-bankid-app) Biometric authenticator (BankID app)

Triggered with `acr_values=urn:grn:authn:no:bankid:substantial`

The level of assurance for this authenticator is: Substantial

Note that there is no `certsubject` returned when using Biometrics.

{

"identityscheme": "nobankid-oidc",

Overall eID used to authenticate

"authenticationtype": "urn:grn:authn:no:bankid:substantial",

acr\_values used to authenticate

"nameidentifier": "cde37629c67b4318988ca0b378931e7d",

Legacy format of 'sub'

"sub": "{cde37629-c67b-4318-988c-a0b378931e7d}",

Persistent pseudonym. Uniquely identifies an eID user (per Idura Verify tenant)

"uniqueuserid": "9578-6000-4-476957",

Identifies the legal person corresponding to the login (just like the socialno does, but is not considered to be sensitive)

"certissuer": "CN=BankID - TestBank1 - Bank CA 3,OU=123456789,O=TestBank1 AS,C=NO;OrginatorId=9980;OriginatorName=BINAS;OriginatorId=9980",

"birthdate": "1941-08-16",

"dateofbirth": "1941-08-16",

"emailaddress": "mikkel@idura.com",

"email": "mikkel@idura.com",

"mobilephone": "90724328",

"phone\_number": "90724328",

"socialno": "16084138758",

Social security number

"family\_name": "Larsen",

[An OpenID Connect standard claim](https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims)

"surname": "Larsen",

"given\_name": "Mikkel",

[An OpenID Connect standard claim](https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims)

"givenname": "Mikkel",

"name": "Mikkel Larsen",

"country": "NO"

}

## [​](https://docs.idura.app/verify/e-ids/norwegian-bankid/\#test-users) Test users

### [​](https://docs.idura.app/verify/e-ids/norwegian-bankid/\#creating-netcentric-test-users) Creating netcentric test users

Test users are created through the web page at [https://ra-preprod.bankidnorge.no/#/search/endUser](https://ra-preprod.bankidnorge.no/#/search/endUser).

1. Go to the ["TEST NUMBER GENERATOR"](https://ra-preprod.bankidnorge.no/#/generate) to generate a random, valid SSN.
_If you want to test [BankID Biometric](https://docs.idura.app/verify/e-ids/norwegian-bankid/#testing-bankid-biometric), please make sure that the "Synthetic" checkbox is unchecked before generating a new number. BankID Biometric app does not currently support synthetic SSN numbers, so you won't be able to use them for testing._
2. It now says "Could not find any bankIDs for ...".
3. Fill out the first name, last name, and BankID friendly name.
4. Ensure that `BankID app` is enabled in the "HA services" section, if you want to use BankID Biometric.
5. Click "Order" to initiate the process.
6. Click the pencil icon and add a phone number and an email that you want to associate with the test user.
_You can use any values that match the correct email and phone number formats (note that the number of digits will differ per country). Random values are acceptable as you'll be able to access the one-time codes via URLs, as shown in steps 5 and 11 of the [Testing BankID Biometric section](https://docs.idura.app/verify/e-ids/norwegian-bankid/#testing-bankid-biometric)._
7. Once the process is complete, you will have a test user. User name is the generated SSN, one time password (OTP) is always "otp", and password is always "qwer1234".

It can take up to 1 hour before a newly created test user is activated.

You can test it out at [our authentication demo site](https://verify-login.azurewebsites.net/), which is a small sample hosted by Idura.

### [​](https://docs.idura.app/verify/e-ids/norwegian-bankid/\#renewing-netcentric-test-users) Renewing netcentric test users

If you run into issues with test users created earlier (e.g. errors when entering the one time password), your test user certificate might have expired.

![BankID test user error](https://docs.idura.app/static/dd86462b80a955ae224d8be4e30d506c/e5715/no-bank-id-error.png)

This can be fixed by ordering a new netcentric BankID:

- Find your test user by entering its Personal ID Number number at [https://ra-preprod.bankidnorge.no/#/search/endUser](https://ra-preprod.bankidnorge.no/#/search/endUser)
- Fill in the form to order the new netcentric BankID, choosing BankID TestBank in HA Services, and click "Order"

![Order new BankID](https://docs.idura.app/static/f83eea65fd97da2a28249ab74c9234d5/e5715/no-bank-id-order-new-bankid.png)

### [​](https://docs.idura.app/verify/e-ids/norwegian-bankid/\#testing-bankid-biometric) Testing BankID Biometric

Start by creating a netcentric test user as described [above](https://docs.idura.app/verify/e-ids/norwegian-bankid/#creating-netcentric-test-users).

You will then need to install the test version of the BankID App. Contact our [support team](mailto:orders@idura.eu) to get access to the `iOS` (distributed via `TestFlight`) or `Android` version of the test app. In your request, please provide the email address linked to your Apple ID (for `iOS`) or your Google account for the Play Store (for `Android`) used for testing. Our team will get back to you with confirmation and download links for the test app.

The app must be activated before first use:

01. Press the **Get started** button
02. Enter the birth number (SSN) for the test user you created and press the **Next** button
03. Enter the phone number you associated to the test user and press the **Next** button
04. Open the following page and enter the birth number for the test number in the NNIN field to get your your SMS one-time code: https://toba-preprod.bankidapis.no/test/events
    _Note: The page might need to be refreshed several times, and if multiple activations are done in a short period, old SMS codes may be shown. Only the newest activation code will at any point be valid_
05. Type the one-time code that is shown on the website into the app and press the **Next** button
06. Check the **Accept terms** box and press the **Approve** button
07. On the **Choose activation method** screen, press **Other alternatives**, then press **Activation codes**
08. Press the **Send code words** button in the "Is this your email?" screen
09. Open the following page and enter the birth number for the test number in the NNIN field to get your your email code words: https://toba-preprod.bankidapis.no/test/events
10. Type the code words that are shown on the website into the app and press the **Next** button
11. Press the **Next** button in the "Log in using BankID to complete the activation" screen
12. Wait until BankID client has loaded in the browser. Pick **BankID app** in the method list if it is not already preselected.
13. Type "qwer1234" as personal password and click the _Next_ button
14. A progress bar will appear and when finished you will be activated
15. Enable biometrics (which will take you through a flow where you must agree to the terms and conditions)
16. Run your first biometrics-based login to sign the biometrics terms

## [​](https://docs.idura.app/verify/e-ids/norwegian-bankid/\#data-and-consent-for-norwegian-bankid) Data and consent for Norwegian BankID

### [​](https://docs.idura.app/verify/e-ids/norwegian-bankid/\#available-data--scopes) Available data / scopes

Basic user information, full name, and date of birth are always made available. Additional data may be requested and is released with explicit user consent only.

For applications configured to use a `dynamic``scope` strategy, the following `scope` tokens can be supplied: `ssn`.

| **Data type** | **Released** | **Verified** | **scope** | **login\_hint** |
| --- | --- | --- | --- | --- |
| Full name | Always | Yes |  |  |
| Date of birth | Always | Yes |  |  |
| SSN ("fødselsnummer" in Norwegian) | User consent | Yes | `ssn` | `scope:ssn` |

#### Example (partial) authorize request with scopes

```
https://YOUR_SUBDOMAIN.idura.broker/oauth2/authorize?scope=openid ssn&...
```

Alternatively, you can send them in the `login_hint`

```
https://YOUR_SUBDOMAIN.idura.broker/oauth2/authorize?...&login_hint=scope:ssn&...
```

which can be a useful if you are working with technology that does not let you control the `scope` value.

Access to the SSN is governed by Norwegian law, as described in the [Ordering Norwegian BankID](https://docs.idura.app/eid-specifics/order-no-bankid) guide.

The unverified data are supplied by end-users and not verified by Bidbax (operator of BankID) or the Norwegian banks.

### [​](https://docs.idura.app/verify/e-ids/norwegian-bankid/\#consent-model) Consent model

End-users must explicitly grant consent to releasing the data to you.

The consent model is enforced by Bidbax, and they also provide the consent and data collection dialogs.

If you choose the consent model **Already granted**, you are responsible for obtaining consent from your end-users before they go through the login flow.

### [​](https://docs.idura.app/verify/e-ids/norwegian-bankid/\#forced-and-optional-consent) Forced and optional consent

If you request SSN, it will be treated as a required value. End users will not be allowed to complete a login until they have explicitly given their consent to release SSN.

All other additional data are treated as optional values. A login may complete even if the user does not consent to release the requested data.

Consent to SSN will be stored by Idura for 1 year for your tenant, after which the user must provide explicit SSN consent again.

Idura _does not_ store the SSN itself, just the fact that the user has granted your tenant access to it.

You can add a "forget-me" link on your website if you want to let users revoke the consent again. Use a normal authorize request as target, but add a **prompt=consent\_revoke** query parameter to the request. Idura will then run a login flow (to be able to recognize the end user), and delete the granted consent.

You can learn more about authorize requests in [our authorize URL builder.](https://docs.idura.app/verify/guides/authorize-url-builder/?prompt=consent_revoke)

### [​](https://docs.idura.app/verify/e-ids/norwegian-bankid/\#configuration) Configuration

You can tweak core operational parameters and configure access to the optional user data on the [Norwegian BankID](https://dashboard.idura.app/providers/NO_BANKID) eID provider page of the Idura Dashboard.

## [​](https://docs.idura.app/verify/e-ids/norwegian-bankid/\#bankid-biometrics-assurance-level) BankID Biometrics assurance level

BankID Biometrics assurance level is “Substantial”.

[Learn more about assurance levels](https://ec.europa.eu/digital-building-blocks/wikis/display/DIGITAL/eIDAS+Levels+of+Assurance).

If you can only use assurance level “High” in your login flow, you must explicitly specify the [login\_hint=BID](https://docs.idura.app/verify/e-ids/norwegian-bankid/#modifying-user-flows) in your authorize requests to Idura Verify. _Please note that using `login_hint=BID` will disable biometrics in the BankID app._

## [​](https://docs.idura.app/verify/e-ids/norwegian-bankid/\#modifying-user-flows) Modifying user flows

By default, the user flow is controlled by the user-defined settings of the BankID app: no additional configurations required. If necessary, you can adjust the user flow by adding a `login_hint` to the [authorize URL](https://docs.idura.app/verify/guides/authorize-url-builder/).

The table below provides a list of options for using `login_hint` with Norwegian BankID, and the resulting user flows. Check [our guide on prefilled fields](https://docs.idura.app/verify/guides/prefilled-fields/) to learn more.

| Parameter name | Description |
| --- | --- |
| `login_hint=BID` | The user will be redirected to the BankID app, with biometrics disabled. The user will be<br>queried for userID(i.e. national identity number) in the first dialogue. |
| `login_hint=BID:[SSN]`, where `[SSN]` has the format `DDMMYYXXXXX` | The user will be redirected to the BankID app (with biometrics disabled) along with a<br>pre-selected userID. The userID dialogue is omitted in this case. |
| `login_hint=BIS` | The user will be redirected to the BankID app. The user will be queried for userID in the<br>first dialogue. This option does not disable biometrics. |
| `login_hint=BIS:[SSN]`, where `[SSN]` has the format `DDMMYYXXXXX` | The user will be redirected to the BankID app with a pre-selected userID. This option does<br>not disable biometrics. |
| no `login_hint` provided | The default settings of the BankID app on the user's device will determine the flow (whether<br>biometrics are enabled or disabled). |

## [​](https://docs.idura.app/verify/e-ids/norwegian-bankid/\#ordering-norwegian-bankid) Ordering Norwegian BankID

To start accepting real users with Norwegian BankID, you must first request your _client credentials_ from Bidbax. The credentials consists of a _client id_ and a _client secret_.

**Prerequisites for ordering**

In order to apply for the BankID client credentials for a company you must meet the basic requirements:

- Your company must be a customer of a Norwegian Bank. Most banks in Norway are part of the BankID network.
- The person that will sign the contract must be in possession of one of these personal eIDs: Norwegian BankID, Swedish BankID, or Danish MitID.
- You must have completed step 4 in the [Get ready for production](https://docs.idura.app/verify/guides/production) guide. You will need the production domain to complete the order for your client credentials.

_The [BankID OIDC Biometrics](https://docs.idura.app/verify/e-ids/norwegian-bankid/#bankid-biometrics-assurance-level) option is **always** included in the basis agreement._

### [​](https://docs.idura.app/verify/e-ids/norwegian-bankid/\#ordering-the-client-credentials) Ordering the client credentials

To order production credentials please send a request to

[orders@idura.eu](mailto:orders@idura.eu?subject=NO%20BankID%20for%20...)

with answers to these questions:

01. A short description of what your application does and why it needs BankID.
02. Your company: _Name, organisation number, and address_.
03. General contact person at your company for BankID related communication: _Name, mobile phone, and email_.
04. Authorized signatory(ies) listed in the business registry who are authorized to sign for the company: _Name, mobile phone and email_.
05. Your company’s Norwegian bank: _Name, organisation number, and address_.
06. Contact person with authorization to receive the client credentials and client secret: _Name, mobile phone, and email_.
07. Contact person with authorization to block/revoke the use of BankID: _Name, mobile phone, and email_.
08. The display name to appear in the login app. E.g. the name of your company or your specific service (see the image below).
09. Your **Idura production domain** as set up in step 4 of the [Getting ready for production](https://docs.idura.app/verify/guides/production) guide.
10. If you need access to social security numbers (“fødselsnummer”), please provide a thorough explanation of why and reference the Norwegian law and a paragraph that grants you the right to receive them. **If an SSN is needed, the reference to the Norwegian Law and paragraph is mandatory.**
11. If you are not a Norwegian company - you must enclose a company certificate from the official business registry of the country of incoporation.
12. Finally - Let us know which products are you going to use: (Authentication, Signatures, Caller Authentication/CIBA)

![BankID login](https://docs.idura.app/static/34d74dd2c6933482be965ff73e5bd191/cd039/no-bankid-central.png)

### [​](https://docs.idura.app/verify/e-ids/norwegian-bankid/\#next-steps) Next steps

After Idura has received the above information, we order the client credentials from your bank by filling out an online agreement, which is then sent to the appointed persons at your company for signing. Idura will also sign the agreement.

When all signatures are in place the signed agreement is sent to your bank for further processing and eventual issuance of your client credentials. The whole process typically takes 7-10 business days.

Once you have received credentials, they must be entered into the Idura dashboard to configure your NO BankID integration. This is done under [eID providers > NO BankID](https://dashboard.idura.app/providers/NO_BANKID).

![Close icon](<Base64-Image-Removed>)

## We changed our name from Criipto to Idura

You will still see @criipto packages and default imports in our SDKs and code samples. This is expected and fully supported.

Read the full story in our announcement: [We are now Idura](https://www.idura.eu/blog/we-are-now-idura).

##### On this page

- [JWT/Token examples](https://docs.idura.app/verify/e-ids/norwegian-bankid/#jwttoken-examples)
- [Kodebrikke authenticators](https://docs.idura.app/verify/e-ids/norwegian-bankid/#kodebrikke-authenticators)
- [Biometric authenticator (BankID app)](https://docs.idura.app/verify/e-ids/norwegian-bankid/#biometric-authenticator-bankid-app)
- [Test users](https://docs.idura.app/verify/e-ids/norwegian-bankid/#test-users)
- [Creating netcentric test users](https://docs.idura.app/verify/e-ids/norwegian-bankid/#creating-netcentric-test-users)
- [Renewing netcentric test users](https://docs.idura.app/verify/e-ids/norwegian-bankid/#renewing-netcentric-test-users)
- [Testing BankID Biometric](https://docs.idura.app/verify/e-ids/norwegian-bankid/#testing-bankid-biometric)
- [Data and consent for Norwegian BankID](https://docs.idura.app/verify/e-ids/norwegian-bankid/#data-and-consent-for-norwegian-bankid)
- [Available data / scopes](https://docs.idura.app/verify/e-ids/norwegian-bankid/#available-data--scopes)
- [Consent model](https://docs.idura.app/verify/e-ids/norwegian-bankid/#consent-model)
- [Forced and optional consent](https://docs.idura.app/verify/e-ids/norwegian-bankid/#forced-and-optional-consent)
- [Configuration](https://docs.idura.app/verify/e-ids/norwegian-bankid/#configuration)
- [BankID Biometrics assurance level](https://docs.idura.app/verify/e-ids/norwegian-bankid/#bankid-biometrics-assurance-level)
- [Modifying user flows](https://docs.idura.app/verify/e-ids/norwegian-bankid/#modifying-user-flows)
- [Ordering Norwegian BankID](https://docs.idura.app/verify/e-ids/norwegian-bankid/#ordering-norwegian-bankid)
- [Ordering the client credentials](https://docs.idura.app/verify/e-ids/norwegian-bankid/#ordering-the-client-credentials)
- [Next steps](https://docs.idura.app/verify/e-ids/norwegian-bankid/#next-steps)