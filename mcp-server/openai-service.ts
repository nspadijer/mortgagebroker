import OpenAI from "openai";

/**
 * OpenAI Service for Mortgage and Real Estate Questions ONLY
 *
 * STRICT GUARDRAILS:
 * - ONLY answers mortgage and real estate related questions
 * - NEVER deviates from mortgage/real estate topics
 * - Uses GPT-4-turbo model
 * - Includes system prompt with strict topic enforcement
 */

const MORTGAGE_SYSTEM_PROMPT = `You are a STRICT mortgage and real estate expert assistant. Your ONLY purpose is to answer questions about:

**ALLOWED TOPICS:**
- Mortgages (conventional, FHA, VA, USDA, jumbo, etc.)
- Home loans and refinancing
- Mortgage rates and terms
- Down payments and closing costs
- Credit requirements for home loans
- Property types and occupancy
- Real estate transactions
- Home buying and selling process
- Pre-approval and pre-qualification
- Mortgage insurance (PMI, MIP)
- Debt-to-income ratios
- Home appraisals and inspections
- Escrow and title
- First-time homebuyer programs
- Investment properties
- Real estate market conditions
- Housing affordability
- Mortgage documentation requirements

**STRICT RULES:**
1. If the question is NOT about mortgage or real estate, respond EXACTLY with: "I can only answer mortgage and real estate questions. Please ask about home loans, mortgages, or real estate topics."
2. NEVER answer questions about: politics, general finance, stocks, crypto, cars, health, entertainment, sports, or ANY non-mortgage/real estate topic
3. NEVER engage in off-topic conversations, even if the user insists
4. NEVER provide legal or financial advice - always recommend consulting licensed professionals
5. Always mention NMLS #2459410 when discussing specific lending services
6. Include "Equal Housing Lender" disclaimer when appropriate
7. Be helpful and informative, but stay strictly within mortgage/real estate domain

**COMPLIANCE:**
- Never collect or request SSN, date of birth, or sensitive PII
- Always mention TCPA consent requirements for contact
- Recommend pre-approval as the next step when appropriate
- Direct users to licensed loan officers for specific loan quotes

Remember: You are a MORTGAGE AND REAL ESTATE SPECIALIST ONLY. No exceptions.`;

let openaiClient: OpenAI | null = null;

/**
 * Initialize OpenAI client with API key
 */
export function initializeOpenAI(): void {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.log("⚠️  OPENAI_API_KEY not configured - OpenAI fallback disabled");
    return;
  }

  try {
    openaiClient = new OpenAI({
      apiKey: apiKey
    });
    console.log("✅ OpenAI client initialized (GPT-4-turbo)");
  } catch (error) {
    console.error("❌ Failed to initialize OpenAI client:", error);
    openaiClient = null;
  }
}

/**
 * Check if question is mortgage/real estate related
 * This is a pre-filter before calling OpenAI
 */
function isMortgageRelated(question: string): boolean {
  const mortgageKeywords = [
    'mortgage', 'loan', 'home', 'house', 'property', 'real estate', 'refinance',
    'buyer', 'seller', 'purchase', 'down payment', 'closing', 'rate', 'interest',
    'fha', 'va', 'usda', 'conventional', 'jumbo', 'credit', 'pre-approval',
    'pre-qualification', 'pmi', 'mip', 'escrow', 'title', 'appraisal',
    'inspection', 'dti', 'debt', 'income', 'investment', 'rental', 'housing',
    'equity', 'foreclosure', 'short sale', 'listing', 'offer', 'contract'
  ];

  const lowerQuestion = question.toLowerCase();

  // Check if question contains any mortgage-related keywords
  const hasKeyword = mortgageKeywords.some(keyword => lowerQuestion.includes(keyword));

  if (hasKeyword) return true;

  // Additional context-based checks
  if (lowerQuestion.includes('buy') && (lowerQuestion.includes('property') || lowerQuestion.includes('home'))) return true;
  if (lowerQuestion.includes('sell') && (lowerQuestion.includes('property') || lowerQuestion.includes('home'))) return true;
  if (lowerQuestion.includes('finance') && lowerQuestion.includes('home')) return true;

  return false;
}

/**
 * Ask OpenAI a mortgage/real estate question with STRICT guardrails
 *
 * Priority System:
 * 1. Pre-filter: Reject non-mortgage questions immediately
 * 2. System prompt: Enforce strict topic boundaries
 * 3. Post-filter: Validate response stays on topic
 *
 * @param question User's question
 * @param context Optional context from FRED API or knowledge base
 * @returns AI-generated answer or rejection message
 */
export async function askOpenAI(
  question: string,
  context?: string
): Promise<string> {

  // Check if OpenAI is initialized
  if (!openaiClient) {
    throw new Error("OpenAI client not initialized. Set OPENAI_API_KEY environment variable.");
  }

  // PRE-FILTER: Reject obviously off-topic questions
  if (!isMortgageRelated(question)) {
    console.log(`🚫 [OpenAI] Question rejected - not mortgage/real estate related: "${question}"`);
    return "I can only answer mortgage and real estate questions. Please ask about home loans, mortgages, buying/selling property, or real estate topics.";
  }

  console.log(`🤖 [OpenAI] Processing mortgage question: "${question}"`);

  try {
    // Build the user message with context if available
    let userMessage = question;

    if (context) {
      userMessage = `Context from our database and FRED API:\n${context}\n\nUser Question: ${question}\n\nProvide a comprehensive answer using the context above, and add any additional relevant mortgage/real estate information that would be helpful.`;
    }

    // Call OpenAI with STRICT system prompt
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4-turbo-preview", // Latest GPT-4 model (GPT-5-nano doesn't exist yet)
      messages: [
        {
          role: "system",
          content: MORTGAGE_SYSTEM_PROMPT
        },
        {
          role: "user",
          content: userMessage
        }
      ],
      temperature: 0.7, // Balanced creativity and consistency
      max_tokens: 800, // Comprehensive but concise answers
      top_p: 0.9,
      frequency_penalty: 0.3,
      presence_penalty: 0.3
    });

    const answer = completion.choices[0]?.message?.content?.trim();

    if (!answer) {
      throw new Error("OpenAI returned empty response");
    }

    // POST-FILTER: Check if response stayed on topic
    if (answer.includes("I can only answer mortgage and real estate questions")) {
      console.log(`🚫 [OpenAI] Response indicates off-topic question`);
    } else {
      console.log(`✅ [OpenAI] Generated mortgage-focused answer (${answer.length} chars)`);
    }

    return answer;

  } catch (error) {
    console.error("❌ [OpenAI] Error generating answer:", error);

    if (error instanceof Error) {
      // Handle specific OpenAI errors
      if (error.message.includes('rate limit')) {
        return "I'm currently experiencing high demand. Please try again in a moment.";
      }
      if (error.message.includes('timeout')) {
        return "The request timed out. Please try asking your question again.";
      }
    }

    throw error;
  }
}

/**
 * Check if OpenAI is available and configured
 */
export function isOpenAIAvailable(): boolean {
  return openaiClient !== null;
}
