# Use-Case-Discovery

A public web app for running a **Copilot Studio Use Case Discovery workshop**. Attendees share ideas for agents and upvote other people's ideas without signing in. Facilitators score each idea against weighted criteria to find the most promising ones to build.

## Features

- **Share an idea**: a four-step form covering the idea title, problem, desired outcome, current process, frequency, number of people affected, data sources, department, what the agent should be able to do, and who will use it. Name is optional, and no email is collected.
- **Automatic platform qualification**: each idea is instantly matched to **M365 Agent Builder** or **Copilot Studio**, with a confidence level, build complexity and the reasons behind the match.
- **Browse & vote**: search, filter by department or platform, sort by newest or most votes, and give one upvote per idea from each browser.
- **Leaderboard**: a top-3 podium and a live ranking that refreshes every 15 seconds.
- **QR code page**: for putting the link on workshop slides (`/qr`).
- **Facilitator area** (`/admin`): unlocked with a passcode. Facilitators score ideas, review the platform qualification, hide spam or off-topic ideas, and export everything to a CSV file for Excel.
- **Protection**: spam-trap field, rate limiting, input checks, CSV formula-injection protection, strict security headers.

## Platform qualification

The rules are in [api/src/lib/qualification.ts](api/src/lib/qualification.ts) and each one is explained in the reasons shown with the result. They use the attendee's answers about capabilities and audience, plus keywords in the idea text.

| Leans to **M365 Agent Builder** | Leans to **Copilot Studio** |
| --- | --- |
| Answering questions from documents or knowledge (SharePoint, policies, FAQs) | Taking actions in other systems (create, update, submit) |
| Drafting or summarising content | Multi-step processes or approvals |
| Just me or my team | Running automatically on a schedule or event |
| Small user groups | Business system integration (ServiceNow, SAP, Dynamics 365, Dataverse...) |
| No integrations or automation needed | External customers or partners, or very large audiences |

The confidence level depends on how clear the difference is between the two sides. The build complexity depends on how many Copilot Studio signals the idea has.

## Scoring

Facilitators rate each idea from 1 to 5 on the criteria below. Effort and Risk are reversed, so a low rating scores higher.

| Criterion | Weight |
| --- | --- |
| Business Value | 30% |
| Feasibility | 25% |
| Data Availability | 20% |
| Effort (reversed) | 15% |
| Risk (reversed) | 10% |

- **Facilitator score** (0–100): the weighted score, averaged across all facilitators who scored the idea.
- **Vote score** (0–100): the idea's votes ÷ the highest vote count of any idea × 100.
- **Final score** = 85% facilitator score + 15% vote score. Ideas nobody has scored yet appear after scored ideas.

To change the weights, edit [api/src/lib/scoring.ts](api/src/lib/scoring.ts).

## Architecture

- `app/`: React, Vite, TypeScript and Fluent UI v9, hosted on Azure Static Web Apps.
- `api/`: Azure Functions (Node 20, TypeScript, v4 programming model), deployed as the Static Web App's built-in (managed) API.
- Storage: Azure Table Storage, with the tables `Ideas`, `Votes`, `Scores` and `RateLimits`.

Admin API routes use `/api/manage/*`, because Azure Functions reserves `/admin`.

## Run locally

You need Node 20+, [Azure Functions Core Tools v4](https://learn.microsoft.com/azure/azure-functions/functions-run-local) and [Azurite](https://learn.microsoft.com/azure/storage/common/storage-use-azurite) (the local storage emulator).

```bash
# 1. Storage emulator
npx azurite --silent --location .azurite

# 2. API (new terminal)
cd api
cp local.settings.sample.json local.settings.json   # then edit the secrets
npm install
npm start                                           # http://localhost:7071

# 3. Frontend (new terminal)
cd app
npm install
npm run dev                                         # http://localhost:5173 (proxies /api to :7071)
```

Run the API tests with `cd api && npm test`.

## Deploy to Azure

1. Create a **Storage account** (General purpose v2).
2. Create a **Static Web App** (Free or Standard tier) linked to this GitHub repo, with these build settings:
   - App location: `app`
   - API location: `api`
   - Output location: `dist`

   Azure adds the `AZURE_STATIC_WEB_APPS_API_TOKEN` secret to the repo. The workflow in [.github/workflows/azure-static-web-apps.yml](.github/workflows/azure-static-web-apps.yml) builds, tests and deploys on every push to `master`.
3. In the Static Web App, open **Settings → Environment variables** and add:

   | Name | Value |
   | --- | --- |
   | `STORAGE_CONNECTION_STRING` | Connection string of the storage account |
   | `ADMIN_PASSCODE` | Passcode shared with facilitators |
   | `TOKEN_SECRET` | Random string of 32+ characters |
   | `HASH_SALT` | A different random string |
   | `WORKSHOP_ID` | Optional. Keeps each workshop's data separate (default `default`) |

4. Share the `https://<name>.azurestaticapps.net` URL, or put the `/qr` page on screen. Attendees don't need to sign in.

## Notes

- Votes are counted once per browser, not once per network connection, so attendees on shared venue Wi-Fi can all vote. Rate limits apply both per connection and per browser.
- To run a new workshop with fresh data, change `WORKSHOP_ID`. The old data stays in storage.
