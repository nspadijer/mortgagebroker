# MortgageBroker MCP - ChatGPT Integration

Production-ready Model Context Protocol (MCP) server that integrates with ChatGPT to provide mortgage pre-qualification assistance with **real-time Federal Reserve economic data**.

This repo contains the MortgageBroker connector built with:

- A Vite/React widget that follows the [Apps SDK quickstart](https://developers.openai.com/apps-sdk/quickstart) pattern (`window.openai.callTool` + iframe-safe HTML bundle)
- A TypeScript MCP server built per the ["Set up your server"](https://developers.openai.com/apps-sdk/build/mcp-server) guide, exposing the widget as a `ui://` resource and MCP tools for ChatGPT
- **FRED API integration** providing 24 real-time economic indicators from the Federal Reserve
- Complete deployment configuration for Render.com with automated Prisma generation

## Features

### Core Functionality
- **Real-time Mortgage Rates** - Live data from Federal Reserve Economic Data (FRED) API with priority over knowledge base
- **Interactive Pre-Qualification Widget** - React-based UI integrated with ChatGPT
- **Lead Capture & Management** - PostgreSQL database with Prisma ORM, automated email notifications
- **Mortgage Calculator** - Real-time payment calculations exposed as MCP tool
- **Knowledge Base** - Comprehensive mortgage Q&A system with FRED data priority
- **TCPA Compliance** - Consent management for lead collection
- **Secure Handoff** - Direct integration with New American Funding portal with UTM attribution

### FRED API Integration (NEW)
- **24 Economic Indicators** including:
  - Mortgage rates (30Y, 15Y, 5/1 ARM)
  - Federal funds rate
  - Housing market data (median prices, housing starts, sales, inventory)
  - Economic indicators (CPI, unemployment, GDP, consumer sentiment)
- **Priority-based data sourcing**: FRED API checked first, knowledge base as supplementary context
- Real-time data updated daily from Federal Reserve Bank of St. Louis

### Technical Features
- Brand palette from logo (primary `#6CE3CF`, bg `#081827`, accents `#2F6E94`, `#539FA7`)
- Prisma/Postgres models for Leads & Intakes (falls back to in-memory storage if `DATABASE_URL` isn't set)
- Email notifications with intake data (loan purpose, occupancy, property type, pricing)
- Production-ready deployment with `render.yaml` and comprehensive documentation

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

## Environment Variables

### Required
- `DATABASE_URL` - PostgreSQL connection string (falls back to in-memory if unset)
- `FRED_API_KEY` - Federal Reserve Economic Data API key ([Get one here](https://fred.stlouisfed.org/docs/api/api_key.html))
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` - Email server configuration
- `LEAD_EMAIL_TO` - Recipient email for lead notifications

### Optional
- `NODE_ENV` - Set to `production` for deployment
- `PORT` - Server port (default: 4100, Render default: 10000)
- `HOST` - Bind address (default: 127.0.0.1, Render: 0.0.0.0)
- `NGROK_API_KEY`, `NGROK_AUTHTOKEN` - For local development tunneling

See `.env.example` for complete list and configuration details.

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

## Deploy to Production

### Quick Deploy to Render.com (Recommended)

This repo includes `render.yaml` for one-click deployment:

1. Connect your GitHub repo to Render
2. Render auto-detects `render.yaml` configuration
3. Set environment variables in Render dashboard
4. Deploy and get your HTTPS endpoint

**Build Command** (automated in render.yaml):
```bash
npm install && npx prisma generate --schema=infra/prisma/schema.prisma && npm run build && npm run mcp:compile
```

**Start Command**:
```bash
node dist/mcp-server/server.js
```

For complete deployment instructions, troubleshooting, and production checklist, see **[DEPLOYMENT.md](DEPLOYMENT.md)**.

### Other Platforms

Follow the [official deploy guide](https://developers.openai.com/apps-sdk/deploy): containerize the MCP server, serve `/mcp` over HTTPS (Fly.io, Cloud Run, Railway, etc.), and update `appsdk/app.json → servers.mortgagebroker-mcp.transport.url` with the production hostname.

**Important**: Always run `npx prisma generate` during build to avoid runtime crashes. See `render.yaml` for reference configuration.
