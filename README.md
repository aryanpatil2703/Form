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

## Live API smoke test

To test the complete path through the local backend and the real SelectHub Relay, first set `SELECTHUB_MOCK=false` in `.env` or `.env.local`, then restart `npm run dev`. This creates a real test lead and generates a new server-side `scorecard_id`:

**PowerShell / Windows** (`curl.exe` avoids PowerShell's `curl` alias). Writing the JSON to a temporary file avoids Windows native-command quote handling:

```powershell
@'
{"campaignSlug":"HRIS","email":"selecthub-api-test@example.com","first_name":"API","last_name":"Test","industry":"Technology","industry_other":"Software","function":"IT","title":"API Test Contact","company_name":"SelectHub API Test","company_size":"1 - 49","address":"123 Test Street","address_2":"","city":"Pune","state":"Maharashtra","zip":"411001","country":"India","phone_number":"+919999999999"}
'@ | Set-Content -NoNewline "$env:TEMP\selecthub-test-payload.json"
curl.exe -i -X POST http://localhost:3000/api/selecthub -H "Content-Type: application/json" --data-binary "@$env:TEMP\selecthub-test-payload.json"
```

**Bash**:

```bash
payload='{"campaignSlug":"HRIS","email":"selecthub-api-test@example.com","first_name":"API","last_name":"Test","industry":"Technology","industry_other":"Software","function":"IT","title":"API Test Contact","company_name":"SelectHub API Test","company_size":"1 - 49","address":"123 Test Street","address_2":"","city":"Pune","state":"Maharashtra","zip":"411001","country":"India","phone_number":"+919999999999"}'
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
| Street address | `address` |
| Address 2 | `address_2` |
| City | `city` |
| State | `state` |
| Zip / postal code | `zip` |
| Country | `country` |
| Phone | `phone_number` |

Company size values are exactly: `1 - 49`, `50 - 99`, `100 - 499`, `500 - 999`, `1000 - 4999`, `5000 - 9999`, `10000 - 19999`, and `20000+`.

## Hidden campaign fields

The server adds `lead_source=SAGA-PPL`, `campaign=asset_request`, `category=HR Management Software`, `asset_type=Selection Guide`, `contract_po_number=SAGA-HR-Global`, `campaign_name=SAGA HRIS Systems ADP VS BattleCard 26`, the configured `page_url`, and `user_journey=HRIS BattleCard, ADP vs BambooHR vs Workday vs Rippling PPL`. It also adds the detected client IP when available and generates `scorecard_id` with Node's cryptographically secure `randomUUID()` for every submission. Client-supplied metadata is rejected and is never forwarded.

## Production SelectHub setup

The production server's public outbound IP must be provided to SelectHub and whitelisted. Requests from non-whitelisted systems may be rejected before processing. Local development may not work against the production Relay until the development machine/server IP is whitelisted. Production must use the deployed server's outbound public IP. The supplied campaign files did not contain a scorecard ID; the implementation therefore generates one per submission and does not invent or reuse a configured value.

## Checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```
