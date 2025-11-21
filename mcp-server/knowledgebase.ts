import { searchRelevantData } from "./fred-api.js";

export type AdvisorAnswer = {
  summary: string;
  highlights: string[];
  sources: Array<{ title: string; snippet: string }>;
  followUps: string[];
};

const WEB_INSIGHTS = [
  "Most lenders require a debt-to-income (DTI) ratio at or below 43%. Strong compensating factors can support approvals up to 50%.",
  "To avoid PMI on conventional loans, you typically need a down payment of at least 20% of the home's purchase price.",
  "Common closing costs include origination fees (0.5-1% of loan), appraisal ($300-500), title insurance, and escrow deposits.",
  "Pre-approval typically requires: recent pay stubs, W-2s from the last 2 years, bank statements (2-3 months), and credit authorization.",
  "Interest rate locks are typically good for 30-60 days. Extended locks are available but cost more.",
  "The loan application process usually takes 30-45 days from application to closing.",
  "Conventional loans follow Fannie Mae/Freddie Mac limits ($766,550 for 2024 in most areas). FHA and VA have different limits.",
  "First-time buyers may qualify for programs with as little as 3% down payment.",
  "Credit score requirements: Conventional loans typically need 620+, FHA allows 580+, VA has no minimum."
];

const TOPIC_RESPONSES: Record<string, { summary: string; highlights: string[] }> = {
  documents: {
    summary: "For mortgage pre-approval, you'll typically need: recent pay stubs (last 2 months), W-2 forms from the past 2 years, 2-3 months of bank statements, tax returns if self-employed, and government-issued ID. Lenders use these to verify your income, assets, and employment history.",
    highlights: [
      "Pay stubs from the last 30-60 days showing year-to-date income",
      "W-2 forms or 1099s from the past 2 years",
      "Bank statements for all accounts (2-3 months)",
      "Tax returns if you're self-employed or have rental income"
    ]
  },
  pmi: {
    summary: "To avoid Private Mortgage Insurance (PMI) on a conventional loan, you need to put down at least 20% of the home's purchase price. For example, on a $400,000 home, that's $80,000 down. Alternatively, you can use a piggyback loan or lender-paid MI (which typically means a slightly higher rate).",
    highlights: [
      "20% down payment eliminates PMI on conventional loans",
      "PMI typically costs 0.5-1% of the loan amount annually",
      "FHA loans require mortgage insurance regardless of down payment",
      "PMI can be removed once you reach 20% equity through payments or appreciation"
    ]
  },
  dti: {
    summary: "Debt-to-Income (DTI) ratio compares your monthly debt payments to your gross monthly income. Most lenders prefer a DTI of 43% or lower, though some programs allow up to 50% with strong compensating factors like high credit score or significant assets.",
    highlights: [
      "Front-end DTI (housing only): typically 28% or less",
      "Back-end DTI (all debts): typically 43% or less",
      "Calculate by dividing total monthly debts by gross monthly income",
      "Lower DTI improves your chances of approval and better rates"
    ]
  },
  closing: {
    summary: "Closing costs typically range from 2-5% of the loan amount. They include: loan origination fees (0.5-1%), appraisal ($300-$600), title search and insurance ($500-$1,500), credit report fees, recording fees, and prepaid items like property taxes and homeowner's insurance.",
    highlights: [
      "Expect 2-5% of the purchase price in closing costs",
      "You'll receive a Loan Estimate within 3 days of applying",
      "Closing Disclosure must be provided 3 business days before closing",
      "Some costs are negotiable or can be covered by the seller"
    ]
  },
  rates: {
    summary: "Interest rates vary based on credit score, loan type, down payment, and market conditions. Rates can be locked for 30-60 days. A rate lock protects you from rate increases but you won't benefit if rates drop. Better credit scores (740+) typically get the best rates.",
    highlights: [
      "Rates change daily based on market conditions",
      "Credit score heavily impacts your rate (740+ gets best pricing)",
      "Larger down payments often qualify for better rates",
      "Points can be paid to lower your rate (1 point = 1% of loan amount)"
    ]
  },
  preapproval: {
    summary: "Pre-approval involves a lender reviewing your finances and credit to determine how much they'll lend you. It's stronger than pre-qualification and shows sellers you're a serious buyer. Pre-approval typically takes 1-3 days and is valid for 60-90 days.",
    highlights: [
      "Pre-approval letters strengthen your offer to sellers",
      "Valid for 60-90 days, but can be updated",
      "Requires credit check and documentation verification",
      "Doesn't guarantee final loan approval (that comes after underwriting)"
    ]
  }
};

function detectTopic(question: string): string | null {
  const q = question.toLowerCase();

  if (q.includes("document") || q.includes("paperwork") || q.includes("need") && q.includes("provide")) {
    return "documents";
  }
  if (q.includes("pmi") || (q.includes("avoid") && q.includes("insurance")) || q.includes("private mortgage insurance")) {
    return "pmi";
  }
  if (q.includes("dti") || q.includes("debt") && q.includes("income")) {
    return "dti";
  }
  if (q.includes("closing cost") || q.includes("fees") || q.includes("how much") && q.includes("close")) {
    return "closing";
  }
  if (q.includes("rate") || q.includes("interest") || q.includes("apr") || q.includes("lock")) {
    return "rates";
  }
  if (q.includes("pre") && (q.includes("approval") || q.includes("qualify"))) {
    return "preapproval";
  }

  return null;
}

function buildFollowUps(question: string): string[] {
  const followUps = [
    "Would you like to calculate your estimated monthly payment?",
    "Ready to discuss the pre-qualification process?"
  ];

  const q = question.toLowerCase();
  if (!q.includes("rate")) {
    followUps.unshift("What are current interest rates?");
  }
  if (!q.includes("document")) {
    followUps.unshift("What documents will I need?");
  }

  return followUps.slice(0, 3);
}

async function searchWebForMortgageInfo(question: string): Promise<AdvisorAnswer | null> {
  try {
    // Use native fetch if available (Node 18+)
    if (typeof fetch === 'undefined') {
      return null;
    }

    // Create a mortgage-focused search query (for future API integration)
    // const mortgageQuery = `mortgage ${question} site:bankrate.com OR site:nerdwallet.com OR site:investopedia.com OR site:fanniemae.com OR site:freddiemac.com`;

    // For now, we'll return null and use the fallback insights
    // In production, you could integrate with a search API using mortgageQuery
    console.log(`🔍 Web search attempted for: ${question} (using fallback)`);
    return null;
  } catch (error) {
    console.error("Web search failed:", error);
    return null;
  }
}

export async function createKnowledgeBase() {
  console.log("✓ Knowledge base initialized with FRED API integration (prioritized)");

  return {
    async answer(question: string): Promise<AdvisorAnswer> {
      // PRIORITY 1: Always check FRED API first for real-time economic data
      console.log(`🔍 [PRIORITY] Checking FRED API first for: ${question}`);
      const fredData = await searchRelevantData(question);

      // If FRED has relevant data, prioritize it and return immediately
      if (fredData) {
        console.log(`✅ FRED API data found - using as primary source`);
        const topic = detectTopic(question);
        const keywords = question.toLowerCase().split(/\W+/).filter(w => w.length > 3);
        const relevantInsights = WEB_INSIGHTS.filter(insight =>
          keywords.some(kw => insight.toLowerCase().includes(kw))
        );

        // Build a comprehensive response with FRED data as the primary content
        let summary = fredData;
        let highlights: string[] = [];

        // Add topic-specific guidance as supplementary context (if available)
        if (topic && TOPIC_RESPONSES[topic]) {
          const response = TOPIC_RESPONSES[topic];
          summary += "\n\n**Additional Context:**\n" + response.summary;
          highlights = response.highlights;
        } else if (relevantInsights.length > 0) {
          // Add general insights as context
          highlights = relevantInsights.slice(0, 3);
        }

        return {
          summary,
          highlights,
          sources: [
            { title: "FRED (Federal Reserve Economic Data)", snippet: "Official real-time data from the St. Louis Federal Reserve - PRIMARY SOURCE" },
            { title: "Market Analysis", snippet: "Current economic conditions and mortgage market trends" }
          ],
          followUps: buildFollowUps(question)
        };
      }

      console.log(`ℹ️  No FRED data available - falling back to knowledge base`);

      // PRIORITY 2: Knowledge base (only if FRED has no data)
      const topic = detectTopic(question);

      if (topic && TOPIC_RESPONSES[topic]) {
        const response = TOPIC_RESPONSES[topic];
        return {
          summary: response.summary,
          highlights: response.highlights,
          sources: [
            { title: "Mortgage Guidelines", snippet: "Industry-standard practices for " + topic },
            { title: "Lender Requirements", snippet: "Common requirements across major lenders" }
          ],
          followUps: buildFollowUps(question)
        };
      }

      // PRIORITY 3: General insights fallback
      const keywords = question.toLowerCase().split(/\W+/).filter(w => w.length > 3);
      const relevantInsights = WEB_INSIGHTS.filter(insight =>
        keywords.some(kw => insight.toLowerCase().includes(kw))
      );

      // PRIORITY 4: Web search (if no insights found)
      if (relevantInsights.length === 0) {
        console.log(`📡 Searching web for: ${question}`);
        const webResult = await searchWebForMortgageInfo(question);
        if (webResult) {
          return webResult;
        }
      }

      const insights = relevantInsights.length > 0 ? relevantInsights : WEB_INSIGHTS;

      return {
        summary: insights[0] || "Based on standard mortgage guidelines, lenders evaluate your ability to repay through income verification, credit history, and debt-to-income ratios. Typical requirements include stable employment, adequate income, and manageable debt levels.",
        highlights: insights.slice(0, 3),
        sources: [
          { title: "Industry Guidelines", snippet: "Standard mortgage lending practices" },
          { title: "Federal Requirements", snippet: "CFPB and federal lending regulations" }
        ],
        followUps: buildFollowUps(question)
      };
    }
  };
}
