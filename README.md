# SelectHub lead capture form

A Next.js App Router form that sends an explicitly whitelisted lead payload through `/api/selecthub` to the SelectHub Relay API. The browser never calls SelectHub directly.

## Setup

```bash
npm install
copy .env.example .env.local
npm run dev
```

Environment variables:

- `SELECTHUB_RELAY_URL`: defaults to `https://prod-relay.herokuapp.com/api/relay`.
- `SELECTHUB_SCORECARD_ID`: retained for compatibility with the supplied configuration, but intentionally unused. Each submission receives a new server-generated UUID.
- `SELECTHUB_MOCK`: set to `true` for local development to avoid sending test leads; it is ignored in production.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET`: required for protected admin access. Store these as Vercel environment variables, never in source control.
- `MONGODB_URI` and `MONGODB_DB`: required in production for durable submission records. Use a MongoDB Atlas connection string and database name.

## Platform administration

Open `/admin/login` to access the protected control room. The single-admin account is configured through `ADMIN_EMAIL` and `ADMIN_PASSWORD`; successful login creates an expiring, HTTP-only signed session cookie. Campaign management and submission APIs require that session. Campaign hidden fields are configured per campaign, so each campaign can use its own `lead_source`, `campaign`, `category`, `asset_type`, `contract_po_number`, `campaign_name`, `page_url`, and `user_journey` values.

The control room's Submission records section shows the submission date/time, campaign, status, generated `scorecard_id`, lead fields, hidden SelectHub fields, and delivery errors. In production, configure MongoDB Atlas because Vercel's filesystem is not durable. The local JSON store is intended only for local development.

## Live API smoke test

To test the complete path through the local backend and the real SelectHub Relay, first set `SELECTHUB_MOCK=false` in `.env` or `.env.local`, then restart `npm run dev`. This creates a real test lead and generates a new server-side `scorecard_id`:

**PowerShell / Windows** (`curl.exe` avoids PowerShell's `curl` alias). Writing the JSON to a temporary file avoids Windows native-command quote handling:

```powershell
@'
{"campaignSlug":"HRIS","email":"selecthub-api-test@example.com","first_name":"API","last_name":"Test","industry":"Technology","industry_other":"Software","function":"IT","title":"API Test Contact","company_name":"SelectHub API Test","company_size":"1 - 49","implementation_timeline":"0 - 6 months","address":"123 Test Street","address_2":"","city":"Pune","state":"Maharashtra","zip":"411001","country":"India","phone_number":"+919999999999"}
'@ | Set-Content -NoNewline "$env:TEMP\selecthub-test-payload.json"
curl.exe -i -X POST http://localhost:3000/api/selecthub -H "Content-Type: application/json" --data-binary "@$env:TEMP\selecthub-test-payload.json"
```

**Bash**:

```bash
payload='{"campaignSlug":"HRIS","email":"selecthub-api-test@example.com","first_name":"API","last_name":"Test","industry":"Technology","industry_other":"Software","function":"IT","title":"API Test Contact","company_name":"SelectHub API Test","company_size":"1 - 49","implementation_timeline":"0 - 6 months","address":"123 Test Street","address_2":"","city":"Pune","state":"Maharashtra","zip":"411001","country":"India","phone_number":"+919999999999"}'
curl -i -X POST http://localhost:3000/api/selecthub \
	-H 'Content-Type: application/json' \
	--data-raw "$payload"
```

The Bash command above also works in Git Bash. Do not use the PowerShell here-string (`@' ... '@`), `Set-Content`, or PowerShell backticks in Git Bash.

Expected response from the internal API:

```json
{"success":true,"message":"Lead submitted successfully."}
```

Also confirm the development server logs show `SelectHub submission successful`. A successful response means the Relay returned HTTP 2xx; verify the lead and generated scorecard in SelectHub as the final confirmation. If the request fails, check that the server's public outbound IP is whitelisted by SelectHub. Do not run this against production with personal data.

## Form and mapping

| Application label | SelectHub key |
| --- | --- |
| Email address | `email` |
| First name | `first_name` |
| Last name | `last_name` |
| Industry | `industry` |
| Sub industry | `industry_other` |
| Function | `function` |
| Position | `title` |
| Company | `company_name` |
| Company size | `company_size` |
| Software implementation timeline | `implementation_timeline` |
| Street address | `address` |
| Address 2 | `address_2` |
| City | `city` |
| State | `state` |
| Zip / postal code | `zip` |
| Country | `country` |
| Phone | `phone_number` |

Implementation timeline values are exactly: `0 - 6 months`, `7 - 12 months`, `More than 12 months`, and `Not decided yet`.

For campaigns with a `competitors` list, an exact company-name match is suppressed case-insensitively and is not saved or sent to SelectHub. The ERP campaign suppresses Oracle, Ceridian, Epicor, UKG, Zoho, Paycom, Paycor, ADP, SAP, Cornerstone, Workday, Infor, and Gartner. Names such as `Oracle Consulting` are not exact matches and remain eligible.

## ERP campaign

The `/ERP` campaign uses the **SAGA Top 20 ERP Comparison Oracle VS BattleCard 26** configuration and landing page URL. Its server-controlled hidden values include `lead_source=SAGA-PPL`, `category=ERP Software`, `category_slug=erp-software`, `survey_slug=`, `campaign=free_custom_scorecard`, `campaign_name=SAGA Top 20 ERP Comparison Oracle VS BattleCard 26`, `asset_type=Analyst Report`, `team=CM`, `contract_po_number=SAGA-ERP-Global`, `user_journey=Top 20 ERP Systems Comparison BattleCard, Oracle ERP vs Best ALT PPL`, and the configured ERP `page_url`. The required form question is sent as `timeframe_to_decision` with the selected timeframe value.

Its competitor list is: Acumatica, IQMS, Plex, NetSuite, Epicor, Infor, IFS, Sage, Oracle, SAP, Microsoft, SYSPRO, and Gartner.

Company size values are exactly: `1 - 49`, `50 - 99`, `100 - 499`, `500 - 999`, `1000 - 4999`, `5000 - 9999`, `10000 - 19999`, and `20000+`.

## Hidden campaign fields

The server adds `lead_source=SAGA-PPL`, `campaign=asset_request`, `category=HR Management Software`, `asset_type=Selection Guide`, `contract_po_number=SAGA-HR-Global`, `campaign_name=SAGA HRIS Systems ADP VS BattleCard 26`, the configured `page_url`, and `user_journey=HRIS BattleCard, ADP vs BambooHR vs Workday vs Rippling PPL`. It also adds the detected client IP when available and generates `scorecard_id` with Node's cryptographically secure `randomUUID()` for every submission. Client-supplied metadata is rejected and is never forwarded.

## Production SelectHub setup

The production server's public outbound IP must be provided to SelectHub and whitelisted. Requests from non-whitelisted systems may be rejected before processing. Local development may not work against the production Relay until the development machine/server IP is whitelisted. Production must use the deployed server's outbound public IP. The supplied campaign files did not contain a scorecard ID; the implementation therefore generates one per submission and does not invent or reuse a configured value.

### Vercel deployment checklist

In Vercel Project Settings, add `SELECTHUB_RELAY_URL` and set `SELECTHUB_MOCK` to `false` for the Production environment, then redeploy. Ask SelectHub to whitelist the outbound IP used by the Vercel deployment. Vercel serverless functions do not generally provide one fixed outbound IP on standard plans; if SelectHub requires a fixed IP, route the request through a provider with a static egress IP or use a Vercel plan/configuration that provides fixed outbound IPs. A `502` from `/api/selecthub` means the internal API was reached but the Relay request failed; inspect Vercel Function Logs for the logged Relay HTTP status.

## AWS deployment with a static IP

For SelectHub IP whitelisting, deploy the container on an Ubuntu EC2 instance with an AWS Elastic IP and use MongoDB Atlas for durable submission records. The Elastic IP is the stable outbound address sent to SelectHub. Add that Elastic IP to the MongoDB Atlas IP access list as well. Follow the complete guide in [`deploy/aws/README.md`](deploy/aws/README.md). Do not use the Vercel deployment and AWS static-IP deployment for the same production form unless you whitelist both egress addresses.

## Checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```
