# MortgageBroker App (OpenAI Apps SDK + MCP + Prisma)

This repo contains the MortgageBroker connector showcased in the OpenAI **Apps SDK** docs. It ships with:

- A Vite/React widget that follows the [Apps SDK quickstart](https://developers.openai.com/apps-sdk/quickstart) pattern (`window.openai.callTool` + iframe-safe HTML bundle).
- A TypeScript MCP server built per the ["Set up your server"](https://developers.openai.com/apps-sdk/build/mcp-server) guide, exposing the widget as a `ui://` resource and MCP tools for ChatGPT.
- Deployment notes that mirror the [Apps SDK deploy guide](https://developers.openai.com/apps-sdk/deploy).

## Features
- In-app advisor that answers questions using the `knowledgebase/` PDFs (URLA guide, DU checklist, mortgage textbook) plus curated best practices
- Mortgage calculator tool surfaced during the advisor flow (calls the MCP tool so ChatGPT can reason about the results)
- Lead capture (full name, email, phone) with explicit consent before handing off to the secure application portal
- Purpose/intake step for program preferences, followed by one-click New American Funding handoff with UTM attribution
- Brand palette from your logo (primary `#6CE3CF`, bg `#081827`, accents `#2F6E94`, `#539FA7`) with Terms/Privacy links baked into the UI
- Prisma/Postgres models for Leads & Intakes (falls back to in-memory storage if `DATABASE_URL` isn’t set)

## Quick start
1. **Prereqs**
   - Node.js 20+
   - PostgreSQL URL in `.env` (set `DATABASE_URL=postgres://...`).
2. **Install & generate Prisma**
   ```bash
   npm install
   npx prisma generate --schema=infra/prisma/schema.prisma
   ```
3. **Preview the widget locally** (renders outside ChatGPT for quick styling):
   ```bash
   npm run dev
   # open http://localhost:5173
   ```
4. **Build the iframe bundle** (required before the MCP server starts; re-run after UI changes):
   ```bash
   npm run build
   ```
5. **Start the MCP server for ChatGPT developer mode**
   ```bash
   npm run mcp:dev
   # reads PORT from .env (defaults to 2091 if unset)
   ```
6. **Connect from ChatGPT**
   - Enable *Developer Mode → Apps & Connectors*.
   - Make sure `NGROK_API_KEY` in `.env` is set (copied from `ngrok.com`). This lets you manage tunnels via the CLI.
   - Run `ngrok http $PORT` (use the same port from step 5) and copy the `https://…/mcp` URL.
   - In Settings → Connectors click **Create**, paste the tunnel URL, and upload `appsdk/app.json`.
   - Add the connector to a chat and watch tool streaming logs in your terminal.

> Tip: keep `npm run dev` (for design tweaks), `npm run build` (to refresh `dist/widget`), and `npm run mcp:dev` in separate terminals for the tightest loop. If another process is already using your MCP port, just change `PORT=` in `.env`, restart `npm run mcp:dev`, and relaunch your ngrok tunnel on the new port.

## Environment
- `DATABASE_URL` (Postgres) powers lead/intake persistence. If unset the server falls back to encrypted in-memory arrays for demos.
- Add your own notification providers (`SENDGRID_KEY`, `TWILIO_*`, etc.) when you extend the tools.

## Compliance
- No SSN/DoB collected in-app. Handoff to NAF official domain for application.
- Consent required for lead storage; Terms/Privacy links shown.
- Robots/ToS respectful fetching (if you later enable scraping).

## Structure
```
mortgagebroker-app/
├─ appsdk/            # app manifest consumed by ChatGPT
├─ src/               # React widget + Vite entrypoints
├─ dist/widget/       # build artifacts that get embedded in the MCP resource
├─ mcp-server/        # MCP server (Node + @modelcontextprotocol/sdk)
├─ infra/prisma/      # Prisma schema for leads & intakes
└─ public/            # static assets (favicon / logo)
```

## Compliance & security highlights
- No SSN, DOB, or document uploads flow through ChatGPT. The MCP tools only store marketing-safe metadata and the component immediately hands borrowers to `apply.newamericanfunding.com`.
- TCPA consent is enforced in both the UI and the MCP tool schema. Requests without consent throw, surfacing clear toasts in the iframe and structured errors to ChatGPT.
- The MCP server exposes a single `/mcp` endpoint (CORS + OPTIONS handled) as recommended in the build guide, and logs errors for each tool invocation.
- Widget resources declare `openai/widgetCSP` and `openai/widgetDomain` so only trusted origins are reachable inside ChatGPT’s sandbox.
- Knowledge responses cite the source PDF title+snippet so mortgage pros can audit the advice easily.

## Deploy
Follow the [official deploy guide](https://developers.openai.com/apps-sdk/deploy): containerize the MCP server, serve `/mcp` over HTTPS (Fly.io, Render, Cloud Run, etc.), and update `appsdk/app.json → servers.mortgagebroker-mcp.transport.url` with the production hostname. Keep `dist/widget` in the image (or mount it via object storage), run health checks on `/`, and refresh the connector after each release.
