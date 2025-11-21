import { createServer as createHttpServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { createKnowledgeBase } from "./knowledgebase.js";
import { sendLeadEmail } from "./email.js";

const outputTemplate = "ui://widget/mortgagebroker-prequal.html";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = __dirname.includes(`${path.sep}dist${path.sep}`)
  ? path.resolve(__dirname, "..", "..")
  : path.resolve(__dirname, "..");
const widgetDir = path.join(repoRoot, "dist", "widget");
const widgetJsPath = path.join(widgetDir, "mortgagebroker-widget.js");
const widgetCssPath = path.join(widgetDir, "mortgagebroker-widget.css");

const SaveIntakeInputShape = {
  purpose: z.enum(["purchase", "refinance", "cashout", "secondhome", "investment"]),
  occupancy: z.enum(["primary", "secondhome", "investment"]),
  propertyType: z.enum(["singlefamily", "condo", "townhome", "multiunit"]),
  estPrice: z.number().int().positive().optional(),
  estDownPayment: z.number().int().nonnegative().optional()
};

const SaveIntakeInput = z.object(SaveIntakeInputShape);

const SubmitLeadInputShape = {
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  consent: z.boolean().refine((value) => value === true, "Consent is required"),
  intake: SaveIntakeInput.optional()
};

const SubmitLeadInput = z.object(SubmitLeadInputShape);

const leads: Array<z.infer<typeof SubmitLeadInput> & { createdAt: string }> = [];
const intakes: Array<z.infer<typeof SaveIntakeInput> & { createdAt: string }> = [];

const MortgageAdvisorInput = {
  question: z.string().min(4, "Ask a full question so I can help")
};

const MortgageCalculatorInput = {
  loanAmount: z.number().positive().min(50000),
  rate: z.number().positive().max(20),
  termYears: z.number().int().positive().max(40)
};

const prisma = process.env.DATABASE_URL ? new PrismaClient() : null;
const knowledgeBase = await createKnowledgeBase();

function loadWidgetTemplate() {
  if (!existsSync(widgetJsPath)) {
    throw new Error("Missing widget bundle. Run `npm run build` before starting the MCP server.");
  }

  const js = readFileSync(widgetJsPath, "utf8");
  const css = existsSync(widgetCssPath) ? readFileSync(widgetCssPath, "utf8") : "";

  return `
<div id="mortgagebroker-root"></div>
${css ? `<style>${css}</style>` : ""}
<script type="module">
${js}
</script>
`.trim();
}

async function persistLead(payload: z.infer<typeof SubmitLeadInput> & { createdAt: string }) {
  if (prisma) {
    await prisma.lead.create({ data: payload });
    return;
  }
  leads.push(payload);
}

async function persistIntake(payload: z.infer<typeof SaveIntakeInput> & { createdAt: string }) {
  if (prisma) {
    await prisma.intake.create({ data: payload });
    return;
  }
  intakes.push(payload);
}

function registerResources(server: McpServer, widgetHtml: string) {
  server.registerResource(
    "mortgagebroker-widget",
    outputTemplate,
    {},
    async () => ({
      contents: [
        {
          uri: outputTemplate,
          mimeType: "text/html+skybridge",
          text: widgetHtml,
          _meta: {
            "openai/widgetPrefersBorder": true,
            "openai/widgetDomain": "https://mortgagebroker.app",
            "openai/widgetCSP": {
              connect_domains: [
                "https://apply.newamericanfunding.com"
              ],
              resource_domains: [
                "https://apply.newamericanfunding.com",
                "https://fonts.googleapis.com",
                "https://fonts.gstatic.com"
              ]
            }
          }
        }
      ]
    })
  );
}

function registerTools(server: McpServer) {
  server.registerTool(
    "mortgageAdvisor",
    {
      title: "Mortgage knowledge advisor",
      description: "Answers mortgage questions using the local knowledgebase. Falls back to web search for mortgage-related topics when needed.",
      inputSchema: MortgageAdvisorInput,
      _meta: {
        "openai/outputTemplate": outputTemplate,
        "openai/toolInvocation/invoking": "Reviewing knowledge base",
        "openai/toolInvocation/invoked": "Shared guidance",
        "openai/widgetAccessible": true
      }
    },
    async (input) => {
      const payload = z.object(MortgageAdvisorInput).parse(input);
      const answer = await knowledgeBase.answer(payload.question);

      return {
        content: [{ type: "text", text: answer.summary }],
        structuredContent: {
          step: "advisor",
          answer
        },
        answer
      };
    }
  );

  server.registerTool(
    "mortgageCalculator",
    {
      title: "Mortgage payment calculator",
      description: "Estimates monthly payment, interest, and payoff timeline.",
      inputSchema: MortgageCalculatorInput,
      _meta: {
        "openai/outputTemplate": outputTemplate,
        "openai/toolInvocation/invoking": " crunching numbers",
        "openai/toolInvocation/invoked": "Shared payment estimate",
        "openai/widgetAccessible": true
      }
    },
    async (input) => {
      const payload = z.object(MortgageCalculatorInput).parse(input);
      const result = calculateMortgage(payload.loanAmount, payload.rate, payload.termYears);
      const description = `Estimated payment is ${formatCurrency(result.monthlyPayment)} for ${payload.termYears} years with ${payload.rate}% interest.`;

      return {
        content: [{ type: "text", text: description }],
        structuredContent: {
          step: "advisor",
          calculator: result
        },
        calculator: result
      };
    }
  );

  server.registerTool(
    "submitLead",
    {
      title: "Capture lead",
      description: "Stores a GDPR/CCPA safe marketing lead with explicit consent.",
      inputSchema: SubmitLeadInputShape,
      _meta: {
        "openai/outputTemplate": outputTemplate,
        "openai/toolInvocation/invoking": "Collecting lead",
        "openai/toolInvocation/invoked": "Lead collected",
        "openai/widgetAccessible": true
      }
    },
    async (input) => {
      // Parse the full input including optional intake data
      const fullInput = input as any;
      console.log("📥 submitLead received input:", JSON.stringify(fullInput, null, 2));

      // Parse the input with the schema (now includes optional intake)
      const payload = SubmitLeadInput.parse(input);

      // Extract intake data if provided
      const rawIntake = payload.intake;

      // Create lead record WITHOUT the intake field
      const { intake, ...leadData } = payload;
      const leadRecord = { ...leadData, createdAt: new Date().toISOString() };

      // Save lead
      await persistLead(leadRecord);

      // If intake data is provided, save it too
      let intakeData = null;
      if (rawIntake) {
        console.log("✓ Intake data found:", JSON.stringify(rawIntake, null, 2));
        // Already parsed by Zod in SubmitLeadInput schema
        intakeData = rawIntake;
        const intakeRecord = { ...rawIntake, createdAt: new Date().toISOString() };
        await persistIntake(intakeRecord);
        console.log("✓ Intake data saved to database");
      } else {
        console.log("⚠️  No intake data found in request");
      }

      // Send email with both lead and intake data
      console.log("📧 Sending email with intake data:", intakeData ? "YES" : "NO");
      await sendLeadEmail(leadRecord, intakeData);

      return {
        content: [{ type: "text", text: `Lead saved for ${leadRecord.fullName}.` }],
        structuredContent: {
          step: "handoff"
        }
      };
    }
  );

  server.registerTool(
    "saveIntake",
    {
      title: "Save mortgage intake",
      description: "Persists the borrower’s program preferences before the secure handoff.",
      inputSchema: SaveIntakeInputShape,
      _meta: {
        "openai/outputTemplate": outputTemplate,
        "openai/toolInvocation/invoking": "Saving intake",
        "openai/toolInvocation/invoked": "Intake saved",
        "openai/widgetAccessible": true
      }
    },
    async (input) => {
      const payload = SaveIntakeInput.parse(input);
      const intakeRecord = { ...payload, createdAt: new Date().toISOString() };
      await persistIntake(intakeRecord);

      return {
        content: [{ type: "text", text: "Intake saved; ready for secure handoff." }],
        structuredContent: {
          step: "handoff"
        }
      };
    }
  );

  server.registerTool(
    "startPrequalSession",
    {
      title: "Start prequalification",
      description: "Returns the secure New American Funding URL with attribution parameters.",
      _meta: {
        "openai/outputTemplate": outputTemplate,
        "openai/toolInvocation/invoking": "Preparing handoff",
        "openai/toolInvocation/invoked": "Handoff ready",
        "openai/widgetAccessible": true
      }
    },
    async () => {
      const url = "https://apply.newamericanfunding.com/apply/nikola-spadijer/account?utm_source=mortgagebroker_app&utm_medium=chatgpt&utm_campaign=prequal_flow";
      return {
        content: [{ type: "text", text: "Launching secure application portal." }],
        structuredContent: {
          url,
          label: "Continue / Create Account"
        }
      };
    }
  );
}

function createMortgageServer(widgetHtml: string) {
  const server = new McpServer({ name: "mortgagebroker-mcp", version: "0.1.0" });
  registerResources(server, widgetHtml);
  registerTools(server);
  return server;
}

function calculateMortgage(loanAmount: number, rate: number, termYears: number) {
  const monthlyRate = rate / 100 / 12;
  const totalPayments = termYears * 12;
  const factor = Math.pow(1 + monthlyRate, totalPayments);
  const monthlyPayment = monthlyRate === 0 ? loanAmount / totalPayments : (loanAmount * monthlyRate * factor) / (factor - 1);
  const totalPaid = monthlyPayment * totalPayments;
  const totalInterest = totalPaid - loanAmount;

  return {
    monthlyPayment: Number(monthlyPayment.toFixed(2)),
    totalPaid: Number(totalPaid.toFixed(2)),
    totalInterest: Number(totalInterest.toFixed(2)),
    payoffDateMonths: totalPayments
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

const widgetHtml = loadWidgetTemplate();

const port = Number(process.env.PORT ?? 2091);
const host = process.env.HOST ?? "127.0.0.1";
const MCP_PATH = "/mcp";

const httpServer = createHttpServer(async (req, res) => {
  if (!req.url) {
    res.writeHead(400).end("Missing URL");
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);

  if (req.method === "OPTIONS" && url.pathname === MCP_PATH) {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "content-type, mcp-session-id",
      "Access-Control-Expose-Headers": "Mcp-Session-Id"
    });
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/") {
    res.writeHead(200, { "content-type": "text/plain" }).end("MortgageBroker MCP server");
    return;
  }

  const allowedMethods = new Set(["POST", "GET", "DELETE"]);
  if (url.pathname === MCP_PATH && req.method && allowedMethods.has(req.method)) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");

    const server = createMortgageServer(widgetHtml);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true
    });

    res.on("close", () => {
      transport.close();
      server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res);
    } catch (error) {
      console.error("Error handling MCP request", error);
      if (!res.headersSent) {
        res.writeHead(500).end("Internal server error");
      }
    }
    return;
  }

  res.writeHead(404).end("Not Found");
});

httpServer.listen(port, host, () => {
  console.log(`MortgageBroker MCP listening on http://${host}:${port}${MCP_PATH}`);
});
