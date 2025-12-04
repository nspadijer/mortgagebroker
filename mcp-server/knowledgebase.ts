import { searchRelevantData } from "./fred-api.js";
import { askOpenAI, initializeOpenAI, isOpenAIAvailable } from "./openai-service.js";

export type AdvisorAnswer = {
  summary: string;
  highlights: string[];
  sources: Array<{ title: string; snippet: string }>;
  followUps: string[];
};

// Intelligent question analyzer that understands intent
function analyzeQuestion(question: string): {
  category: string;
  keywords: string[];
  isEdgeCase: boolean;
  sentiment: 'negative' | 'neutral' | 'positive';
} {
  const q = question.toLowerCase();
  const keywords = q.split(/\W+/).filter(w => w.length > 3);

  // Edge case detection
  const isEdgeCase =
    q.includes("not from") || q.includes("non-us") || q.includes("foreign") || q.includes("immigrant") ||
    q.includes("no tax") || q.includes("wasn't paying tax") || q.includes("didnt pay tax") ||
    q.includes("self-employed") || q.includes("freelance") || q.includes("gig work") ||
    q.includes("bankruptcy") || q.includes("foreclosure") || q.includes("bad credit") ||
    q.includes("no credit") || q.includes("low credit") || q.includes("poor credit") ||
    q.includes("no down payment") || q.includes("zero down") ||
    q.includes("student debt") || q.includes("high debt");

  // Sentiment detection
  let sentiment: 'negative' | 'neutral' | 'positive' = 'neutral';
  if (q.includes("not") || q.includes("can't") || q.includes("cannot") || q.includes("no ") || q.includes("wasn't")) {
    sentiment = 'negative';
  }

  // Category detection
  let category = "general";

  if (q.includes("citizen") || q.includes("visa") || q.includes("green card") || q.includes("foreign") || q.includes("not from us") || q.includes("immigrant")) {
    category = "citizenship";
  } else if (q.includes("tax") || q.includes("income") || q.includes("w-2") || q.includes("1099")) {
    category = "income_verification";
  } else if (q.includes("credit") || q.includes("score") || q.includes("fico")) {
    category = "credit";
  } else if (q.includes("down payment") || q.includes("down") || q.includes("upfront")) {
    category = "downpayment";
  } else if (q.includes("document") || q.includes("paperwork") || q.includes("need") && q.includes("provide")) {
    category = "documents";
  } else if (q.includes("pmi") || (q.includes("avoid") && q.includes("insurance"))) {
    category = "pmi";
  } else if (q.includes("dti") || q.includes("debt") && q.includes("income")) {
    category = "dti";
  } else if (q.includes("closing cost") || q.includes("fees")) {
    category = "closing";
  } else if (q.includes("rate") || q.includes("interest") || q.includes("apr")) {
    category = "rates";
  } else if (q.includes("pre") && (q.includes("approval") || q.includes("qualify"))) {
    category = "preapproval";
  } else if (q.includes("first time") || q.includes("never bought")) {
    category = "firsttime";
  } else if (q.includes("self-employed") || q.includes("freelance") || q.includes("business owner")) {
    category = "selfemployed";
  } else if (q.includes("bankruptcy") || q.includes("foreclosure")) {
    category = "credit_issues";
  }

  return { category, keywords, isEdgeCase, sentiment };
}

// Comprehensive knowledge base with specific answers
const KNOWLEDGE_BASE: Record<string, { summary: string; highlights: string[] }> = {
  citizenship: {
    summary: "Non-U.S. citizens CAN get mortgages in the United States, but requirements vary by visa status. Permanent residents (Green Card holders) generally qualify for the same programs as U.S. citizens. Non-permanent residents on work visas (H-1B, L-1, etc.) can qualify but typically need: a valid work visa with at least 3 years remaining, proof of legal residency, employment history in the U.S., and strong credit history. ITIN (Individual Taxpayer Identification Number) loans are available for those without Social Security numbers. FHA loans accept non-citizens with valid work authorization.",
    highlights: [
      "Green Card holders qualify for standard mortgage programs (FHA, Conventional, VA if applicable)",
      "Work visa holders (H-1B, L-1, etc.) need 3+ years visa validity and U.S. employment history",
      "ITIN loans available for non-citizens without SSN (higher rates, larger down payment)",
      "You'll need passport, visa documents, I-94 arrival record, and employment authorization",
      "Some lenders specialize in foreign national loans - shop around for best terms"
    ]
  },

  income_verification: {
    summary: "Tax returns are typically required for mortgage approval, but there are options if you haven't been filing taxes. If you weren't paying taxes because you're self-employed or had irregular income, you'll need to start filing immediately and may need 1-2 years of tax returns to qualify. Bank statement loans are available for those who can't provide tax returns - lenders verify income through 12-24 months of bank deposits instead. These typically require larger down payments (15-20%+) and have higher interest rates. If you have W-2 income but didn't file, you'll need to file back taxes before applying. No-doc loans exist but are rare and expensive post-2008 regulations.",
    highlights: [
      "Standard mortgages require 2 years of tax returns to verify income",
      "Bank statement loans: Verify income via 12-24 months of bank deposits (higher rates)",
      "Self-employed: Need to file taxes immediately, may need 1-2 years of returns",
      "W-2 employees who didn't file: Must file back taxes before applying",
      "Asset depletion loans: Use assets instead of income (for retirees/high net worth)",
      "Fix tax compliance now - waiting will only delay your ability to buy"
    ]
  },

  credit: {
    summary: "Credit scores are crucial for mortgage approval. Conventional loans typically require 620+ credit score, FHA allows as low as 580 (500 with 10% down), and VA loans have no official minimum but lenders usually want 620+. If you have poor credit (below 620), focus on: paying down credit card balances to below 30% utilization, making all payments on time for 6-12 months, disputing errors on credit reports, and avoiding new credit inquiries. Consider FHA loans for lower score requirements. Manual underwriting is available for those with no credit history - provide alternative payment history (rent, utilities, phone bills).",
    highlights: [
      "Minimum scores: Conventional 620+, FHA 580+, VA typically 620+ (no official minimum)",
      "Poor credit (below 620): Focus on FHA loans or credit repair for 6-12 months",
      "No credit history: Manual underwriting with alternative payment records (rent, utilities)",
      "Quick wins: Pay down cards to <30% utilization, dispute errors, on-time payments",
      "Credit score impacts rate: 740+ gets best pricing, each 20-point drop costs ~0.25% rate"
    ]
  },

  downpayment: {
    summary: "Down payment requirements vary by loan type. Conventional loans: 3-5% minimum for primary residence (first-time buyers), 5-15% for investment properties. FHA loans: 3.5% down with 580+ credit score, 10% with 500-579 score. VA loans: 0% down for eligible veterans and active military. USDA loans: 0% down for rural properties and income-qualified buyers. State/local programs offer down payment assistance grants (often $5,000-$15,000) for first-time buyers. Larger down payments (20%+) avoid PMI and get better rates.",
    highlights: [
      "Conventional: 3-5% down for primary residence, 5-15% for investment",
      "FHA: 3.5% down (580+ score) or 10% down (500-579 score)",
      "VA: 0% down for eligible veterans and active military",
      "USDA: 0% down for rural properties (income limits apply)",
      "First-time buyer programs: Grants up to $5,000-$15,000 in many states",
      "20% down avoids PMI and gets best rates"
    ]
  },

  documents: {
    summary: "For mortgage pre-approval, you'll typically need: recent pay stubs (last 2 months), W-2 forms from the past 2 years, 2-3 months of bank statements for all accounts, tax returns if self-employed or have rental income, government-issued ID, proof of assets (retirement accounts, investments), and employment verification. Self-employed applicants need 2 years of personal and business tax returns, profit & loss statement, and business license. Additional docs may be required based on your situation (divorce decree, gift letter for down payment assistance, bankruptcy discharge papers).",
    highlights: [
      "Pay stubs from last 30-60 days showing year-to-date income",
      "W-2 forms or 1099s from past 2 years",
      "Bank statements for all accounts (2-3 months)",
      "Tax returns if self-employed or have rental income (2 years)",
      "Self-employed: Business tax returns, P&L statement, business license",
      "Additional: Gift letters, asset statements, employment verification"
    ]
  },

  pmi: {
    summary: "To avoid Private Mortgage Insurance (PMI) on conventional loans, you need at least 20% down payment. For example, on a $400,000 home, that's $80,000 down. Alternatives to avoid PMI: piggyback loans (80-10-10: first mortgage 80%, second mortgage 10%, you pay 10%), lender-paid MI (LPMI: higher interest rate instead of monthly PMI), VA loans (no PMI regardless of down payment), or wait until you reach 20% equity through payments/appreciation then request PMI removal. PMI typically costs 0.5-1% of loan amount annually ($100-200/month on $300K loan).",
    highlights: [
      "20% down payment eliminates PMI on conventional loans",
      "PMI costs 0.5-1% of loan amount annually ($100-200/month on $300K loan)",
      "Alternatives: 80-10-10 piggyback loan, lender-paid MI (higher rate), VA loans",
      "FHA loans require mortgage insurance regardless of down payment (lifetime MIP)",
      "PMI auto-cancels at 22% equity, can request removal at 20% equity",
      "Building equity through payments or appreciation allows PMI removal later"
    ]
  },

  dti: {
    summary: "Debt-to-Income (DTI) ratio compares your monthly debt payments to gross monthly income. Most lenders prefer DTI of 43% or lower, though some programs allow up to 50% with compensating factors (high credit score, large assets, stable employment). Calculate DTI: Add all monthly debts (mortgage+insurance+taxes, car loans, credit cards, student loans, personal loans) ÷ gross monthly income × 100. Front-end ratio (housing only): typically 28% max. Back-end ratio (all debts): typically 43% max. To improve DTI: pay off small debts, increase income, avoid new debt, or consider larger down payment.",
    highlights: [
      "Front-end DTI (housing only): typically 28% or less preferred",
      "Back-end DTI (all debts): typically 43% or less, up to 50% with strong profile",
      "Calculate: (Total monthly debts ÷ gross monthly income) × 100",
      "Improving DTI: Pay off small debts first, increase income, avoid new debt",
      "Compensating factors: High credit (740+), large reserves (6+ months), stable job",
      "Lower DTI improves approval odds and may qualify for better rates"
    ]
  },

  closing: {
    summary: "Closing costs typically range from 2-5% of the loan amount ($6,000-$15,000 on a $300,000 loan). They include: loan origination fees (0.5-1% of loan), appraisal ($400-$600), title search and insurance ($500-$2,500), credit report fees ($30-$50), recording fees ($100-$300), survey fees ($300-$500), and prepaid items (property taxes, homeowner's insurance, prepaid interest). You'll receive a Loan Estimate within 3 days of applying (itemizes all costs) and Closing Disclosure 3 business days before closing (final numbers). Some costs are negotiable or can be covered by seller concessions (ask seller to pay up to 3-6% of purchase price toward closing costs).",
    highlights: [
      "Expect 2-5% of loan amount ($6,000-$15,000 on $300K loan)",
      "Loan Estimate provided within 3 days of application (initial costs)",
      "Closing Disclosure provided 3 days before closing (final locked costs)",
      "Major costs: Origination (0.5-1%), appraisal ($400-$600), title ($500-$2,500)",
      "Seller concessions: Ask seller to pay 3-6% toward your closing costs",
      "Some lender fees are negotiable - shop multiple lenders for best deal"
    ]
  },

  rates: {
    summary: "Interest rates vary based on credit score, loan type, down payment, property type, and market conditions. Rates change daily based on economic factors. Better credit scores (740+) get best rates, typically 0.25-0.50% better than 620-680 scores. Larger down payments often qualify for better rates (20%+ vs 5%). Rate locks protect you from rate increases for 30-60 days (extended locks available at cost). Points can be paid to lower rate: 1 point = 1% of loan amount, typically reduces rate by 0.25%. Compare APR (includes fees) not just rate when shopping lenders.",
    highlights: [
      "Rates change daily based on Federal Reserve policy and economic conditions",
      "Credit score heavily impacts rate: 740+ gets best pricing, up to 0.5% better than 620-680",
      "Larger down payments (20%+) often qualify for 0.125-0.25% better rates",
      "Rate locks: 30-60 days standard, extended locks cost more",
      "Points: Pay 1% of loan to reduce rate ~0.25% (breakeven in 3-5 years)",
      "Compare APR (includes all fees) not just interest rate when shopping"
    ]
  },

  preapproval: {
    summary: "Pre-approval involves a lender reviewing your finances and credit to determine how much they'll lend you. It's stronger than pre-qualification (which is just an estimate) and shows sellers you're a serious buyer. Pre-approval process: submit financial documents (pay stubs, tax returns, bank statements), lender pulls credit report, underwriter reviews application, you receive pre-approval letter stating maximum loan amount. Valid for 60-90 days (can be updated). Doesn't guarantee final approval - full underwriting happens after you're under contract. Get pre-approved BEFORE house hunting to know your budget and strengthen offers.",
    highlights: [
      "Pre-approval letters strengthen your offer to sellers (shows financial readiness)",
      "Valid for 60-90 days, can be updated as needed",
      "Requires credit check and documentation verification (hard inquiry)",
      "Shows maximum loan amount but doesn't guarantee final approval",
      "Get pre-approved BEFORE house hunting to know realistic budget",
      "Final approval comes after underwriting (post-contract)"
    ]
  },

  firsttime: {
    summary: "First-time homebuyer programs offer significant advantages: lower down payments (as low as 3%), down payment assistance grants ($5,000-$15,000 in many states), reduced mortgage insurance costs, tax credits, and educational resources. Definition: Haven't owned home in past 3 years (even if you owned before). Programs include: FHA loans (3.5% down), Fannie Mae HomeReady/Freddie Mac Home Possible (3% down, income limits), state housing finance agency programs, local city/county programs. Many programs offer free homebuyer education courses (often required). Research your state's housing finance agency for specific programs in your area.",
    highlights: [
      "Definition: Haven't owned home in past 3 years (even prior owners qualify)",
      "FHA: 3.5% down, flexible credit (580+ score)",
      "Conventional: 3% down programs (HomeReady, Home Possible) with income limits",
      "Down payment assistance: Grants $5,000-$15,000 in many states (no repayment)",
      "State/local programs: Research your state's housing finance agency",
      "Free homebuyer education courses often required (8-hour online or in-person)"
    ]
  },

  selfemployed: {
    summary: "Self-employed borrowers face additional documentation requirements but can absolutely get mortgages. Lenders want to see: 2 years of personal AND business tax returns (1099-MISC or Schedule C), profit & loss statement (YTD), business license, CPA letter verifying income stability. Income is calculated by averaging last 2 years' net income (after business deductions). This often lowers qualifying income vs W-2 employees. Options: bank statement loans (verify income via 12-24 months of deposits, higher rates), asset depletion loans, or wait until you have clean 2-year tax history. Keep business and personal finances separate, minimize aggressive tax deductions in years before buying.",
    highlights: [
      "Need 2 years of personal AND business tax returns (Schedule C or 1099)",
      "Income calculated as average of last 2 years' net income (after deductions)",
      "Additional docs: P&L statement, business license, CPA letter",
      "Bank statement loans: Alternative for those without tax returns (higher rates, 15-20% down)",
      "Strategy: Minimize tax deductions 2 years before buying to show higher income",
      "Keep business/personal finances separate - makes underwriting easier"
    ]
  },

  credit_issues: {
    summary: "Past credit issues (bankruptcy, foreclosure) don't permanently disqualify you, but require waiting periods. Chapter 7 bankruptcy: 2 years wait for FHA, 4 years for conventional (with clean credit since). Chapter 13: 1 year into repayment for FHA, 2-4 years for conventional. Foreclosure: 3 years for FHA, 7 years for conventional (3 years with extenuating circumstances). Short sale: 2-3 years for FHA, 2-4 years for conventional. During waiting period: rebuild credit (secured credit cards, on-time payments), save for larger down payment (10-20%), document extenuating circumstances (job loss, medical emergency, divorce) for shorter waiting periods.",
    highlights: [
      "Chapter 7 bankruptcy: 2 years (FHA), 4 years (Conventional) with clean credit since",
      "Chapter 13: 1 year into repayment (FHA), 2-4 years (Conventional)",
      "Foreclosure: 3 years (FHA), 7 years (Conventional), 3 years with extenuating circumstances",
      "Extenuating circumstances: Job loss, medical emergency, divorce (document thoroughly)",
      "Rebuild credit: Secured cards, on-time payments, keep utilization low",
      "Larger down payment (10-20%) helps offset past issues"
    ]
  },

  general: {
    summary: "Mortgage qualification depends on several key factors: credit score (higher is better, 620+ for conventional, 580+ for FHA), income stability (2 years employment history preferred), debt-to-income ratio (43% or lower), down payment (3-20% depending on loan type), and property type. The process typically involves: pre-approval (1-3 days), house hunting, purchase offer, home inspection, appraisal, final underwriting, and closing (30-45 days total). Different loan types serve different needs: Conventional (best rates, flexible), FHA (low down payment, easier credit), VA (veterans, 0% down), USDA (rural, 0% down). Shop multiple lenders for best terms.",
    highlights: [
      "Key qualifications: Credit score, stable income, low debt, down payment",
      "Timeline: Pre-approval (1-3 days) → House hunt → Offer → Closing (30-45 days total)",
      "Loan types: Conventional (best rates), FHA (low down), VA (veterans, 0% down), USDA (rural)",
      "Shop 3-5 lenders for best rate and terms (can save thousands)",
      "Get pre-approved before house hunting to know your budget",
      "Working with a mortgage broker can access multiple lenders at once"
    ]
  }
};

function buildFollowUps(category: string): string[] {
  const followUps: string[] = [];

  // Category-specific follow-ups
  switch (category) {
    case "citizenship":
      followUps.push(
        "What documents do I need as a non-U.S. citizen?",
        "What are ITIN loans and how do they work?",
        "Do I qualify for FHA with a work visa?"
      );
      break;
    case "income_verification":
      followUps.push(
        "What are bank statement loans?",
        "How do I start filing taxes to qualify?",
        "What if I'm self-employed with irregular income?"
      );
      break;
    case "credit":
      followUps.push(
        "How can I improve my credit score quickly?",
        "What if I have no credit history at all?",
        "Do you offer manual underwriting?"
      );
      break;
    default:
      followUps.push(
        "Would you like to calculate your estimated monthly payment?",
        "What are current interest rates?",
        "Ready to discuss the pre-qualification process?"
      );
  }

  return followUps.slice(0, 3);
}

export async function createKnowledgeBase() {
  // Initialize OpenAI client (if API key is configured)
  initializeOpenAI();

  console.log("✓ Knowledge base initialized with FRED API, intelligent Q&A, and OpenAI fallback");
  console.log(`  - FRED API: ✅ Always checked first`);
  console.log(`  - Knowledge Base: ✅ 12 curated categories`);
  console.log(`  - OpenAI GPT-4: ${isOpenAIAvailable() ? '✅ Available as fallback' : '⚠️  Not configured (set OPENAI_API_KEY)'}`);

  return {
    async answer(question: string): Promise<AdvisorAnswer> {
      // PRIORITY 1: Always check FRED API first for real-time economic data
      console.log(`🔍 [PRIORITY 1] Checking FRED API first for: ${question}`);
      const fredData = await searchRelevantData(question);

      // If FRED has relevant data, prioritize it and return immediately
      if (fredData) {
        console.log(`✅ FRED API data found - using as primary source`);
        const analysis = analyzeQuestion(question);
        const knowledgeResponse = KNOWLEDGE_BASE[analysis.category] || KNOWLEDGE_BASE.general;

        // Build comprehensive response with FRED as PRIMARY, knowledge base as context
        let summary = fredData;
        let highlights = knowledgeResponse.highlights.slice(0, 3);

        // Add knowledge base context if relevant
        if (analysis.category !== "general" && analysis.category !== "rates") {
          summary += "\n\n**Additional Context:**\n" + knowledgeResponse.summary;
        }

        return {
          summary,
          highlights,
          sources: [
            { title: "FRED (Federal Reserve Economic Data)", snippet: "Official real-time data from the St. Louis Federal Reserve - PRIMARY SOURCE" },
            { title: "Mortgage Guidelines", snippet: `Industry-standard practices for ${analysis.category}` }
          ],
          followUps: buildFollowUps(analysis.category)
        };
      }

      console.log(`ℹ️  No FRED data available - checking knowledge base`);

      // PRIORITY 2: Intelligent knowledge base analysis
      console.log(`🔍 [PRIORITY 2] Checking knowledge base for: ${question}`);
      const analysis = analyzeQuestion(question);
      const knowledgeResponse = KNOWLEDGE_BASE[analysis.category];

      if (knowledgeResponse) {
        console.log(`✅ Matched category: ${analysis.category}, edge case: ${analysis.isEdgeCase}`);

        return {
          summary: knowledgeResponse.summary,
          highlights: knowledgeResponse.highlights,
          sources: [
            { title: "Mortgage Guidelines", snippet: `Expert guidance for ${analysis.category}` },
            { title: "Lender Requirements", snippet: "Industry-standard requirements and best practices" }
          ],
          followUps: buildFollowUps(analysis.category)
        };
      }

      // PRIORITY 3: OpenAI GPT-4 fallback (if available)
      if (isOpenAIAvailable()) {
        console.log(`🤖 [PRIORITY 3] Using OpenAI GPT-4 for dynamic answer`);

        try {
          // Build context from FRED + knowledge base (if any)
          let context = "";
          if (fredData) {
            context += `FRED Data:\n${fredData}\n\n`;
          }
          const generalResponse = KNOWLEDGE_BASE.general;
          context += `General Mortgage Guidelines:\n${generalResponse.summary}`;

          const aiAnswer = await askOpenAI(question, context);

          return {
            summary: aiAnswer,
            highlights: [
              "This answer was generated using AI with strict mortgage/real estate focus",
              "Always consult a licensed loan officer for specific loan quotes",
              "NMLS #2459410 • Equal Housing Lender"
            ],
            sources: [
              { title: "AI-Powered Analysis", snippet: "GPT-4 with strict mortgage/real estate guardrails" },
              { title: "General Guidelines", snippet: "Industry best practices and compliance standards" }
            ],
            followUps: buildFollowUps(analysis.category)
          };
        } catch (error) {
          console.error(`❌ OpenAI error:`, error);
          // Fall through to general guidance if OpenAI fails
        }
      }

      // PRIORITY 4: Final fallback to general guidance
      console.log(`⚠️  [PRIORITY 4] Using general guidance as final fallback`);
      const generalResponse = KNOWLEDGE_BASE.general;

      return {
        summary: `I understand you're asking about "${question}". ${generalResponse.summary}`,
        highlights: generalResponse.highlights,
        sources: [
          { title: "General Mortgage Guidance", snippet: "Overview of mortgage qualification and process" },
          { title: "Lender Requirements", snippet: "Standard industry practices" }
        ],
        followUps: buildFollowUps("general")
      };
    }
  };
}
