import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { WidgetToastTone } from "./openai-apps";
import logoDataUri from "./assets/logoDataUri";

type Step = "advisor" | "lead" | "purpose" | "handoff";

type SubmitLeadInput = {
  fullName: string;
  email: string;
  phone: string;
  consent: boolean;
};

type SaveIntakeInput = {
  purpose: "purchase" | "refinance" | "cashout" | "secondhome" | "investment";
  occupancy: "primary" | "secondhome" | "investment";
  propertyType: "singlefamily" | "condo" | "townhome" | "multiunit";
  estPrice?: number;
  estDownPayment?: number;
};

type StartPrequalSessionPayload = {
  url: string;
  label: string;
};

type KnowledgeAnswer = {
  summary: string;
  highlights: string[];
  sources: Array<{ title: string; snippet: string }>;
  followUps: string[];
};

type AdvisorToolResponse = {
  answer: KnowledgeAnswer;
};

type CalculatorResult = {
  monthlyPayment: number;
  totalPaid: number;
  totalInterest: number;
  payoffDateMonths: number;
};

type MortgageCalculatorResponse = {
  calculator: CalculatorResult;
};

type AdvisorMessage = {
  id: string;
  role: "system" | "user" | "assistant";
  text: string;
  highlights?: string[];
  sources?: Array<{ title: string; snippet: string }>;
  followUps?: string[];
};

type CalculatorFormState = {
  totalAmount: string;
  downPercent: string;
  loanAmount: string;
  rate: string;
  termYears: string;
};

// Refined luxury color palette
const COLORS = {
  bgPrimary: "#0f1419",
  bgSecondary: "#1a1f2e",
  bgCard: "#1e2433",
  text: "#f5f3ef",
  textMuted: "#a8a29e",
  accent: "#6CE3CF", // Teal accent
  accentHover: "#7ef5df",
  sage: "#7c9885", // Calming green
  border: "#2d3343",
  borderAccent: "#6CE3CF",
  shadow: "rgba(0, 0, 0, 0.4)"
};

const HANDOFF_URL =
  "https://apply.newamericanfunding.com/apply/nikola-spadijer/account?utm_source=mortgagebroker_app&utm_medium=chatgpt&utm_campaign=prequal_flow";

const DEFAULT_QUESTIONS = [
  "What documents do I need for pre-approval?",
  "How much should I put down to avoid mortgage insurance?",
  "Can you explain points vs. APR?",
  "What affects my closing timeline?"
];

const createId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);

async function callMortgageTool<T>(name: string, payload?: unknown): Promise<T> {
  if (typeof window !== "undefined" && window.openai?.callTool) {
    return window.openai.callTool<T>(name, payload);
  }

  await new Promise((resolve) => setTimeout(resolve, 250));

  if (name === "startPrequalSession") {
    return { url: HANDOFF_URL, label: "Continue / Create Account" } as T;
  }

  if (name === "mortgageAdvisor") {
    return {
      answer: {
        summary: "Here's a preview answer about mortgage basics. In ChatGPT this will be grounded in your knowledge base PDFs.",
        highlights: [
          "Uniform Residential Loan Application (1003) covers income, assets, liabilities, and declarations.",
          "Desktop Underwriter (DU) looks at credit, reserves, DTI, and AUS findings before clear-to-close."
        ],
        sources: [
          { title: "Mortgage_Lending.pdf", snippet: "Demonstrates how underwriters evaluate capacity, capital, collateral, and credit." }
        ],
        followUps: ["Ready to explore monthly payments?", "Want to start the pre-qualification steps?"]
      }
    } as T;
  }

  if (name === "mortgageCalculator" && payload && typeof payload === "object") {
    const { loanAmount, rate, termYears } = payload as { loanAmount: number; rate: number; termYears: number };
    const result = computeLocalMortgage(loanAmount, rate, termYears);
    return { calculator: result } as T;
  }

  return { ok: true } as T;
}

function computeLocalMortgage(loanAmount = 400000, rate = 6.5, termYears = 30): CalculatorResult {
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

async function showToast({ title, description, tone }: { title: string; description?: string; tone?: WidgetToastTone }) {
  if (typeof window !== "undefined" && window.openai?.ui?.showToast) {
    await window.openai.ui.showToast({ title, description, tone });
    return;
  }
  console.info(`[toast:${tone ?? "info"}] ${title}${description ? ` — ${description}` : ""}`);
}

async function openSecureWebView(url: string) {
  if (typeof window !== "undefined" && window.openai?.ui?.openWebView) {
    await window.openai.ui.openWebView({ url, title: "MortgageBroker • Application" });
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

// Global styles with elegant fonts and animations
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=DM+Sans:wght@400;500;700&family=JetBrains+Mono:wght@400;600&family=Outfit:wght@300;400;500;600;700;800&display=swap');

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes shimmer {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }

    @keyframes pulseGlow {
      0%, 100% { box-shadow: 0 0 20px rgba(108, 227, 207, 0.3); }
      50% { box-shadow: 0 0 30px rgba(108, 227, 207, 0.5); }
    }

    * {
      box-sizing: border-box;
    }

    input, textarea, select, button {
      font-family: 'DM Sans', system-ui, sans-serif;
    }

    input:focus, textarea:focus, select:focus {
      outline: none;
      border-color: ${COLORS.borderAccent} !important;
      box-shadow: 0 0 0 3px rgba(108, 227, 207, 0.15);
    }

    a {
      color: ${COLORS.accent};
      text-decoration: none;
      transition: color 200ms ease;
    }

    a:hover {
      color: ${COLORS.accentHover};
      text-decoration: underline;
    }

    ::placeholder {
      color: ${COLORS.textMuted};
      opacity: 0.6;
    }

    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    ::-webkit-scrollbar-track {
      background: ${COLORS.bgSecondary};
      border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb {
      background: ${COLORS.border};
      border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: ${COLORS.borderAccent};
    }
  `}</style>
);

export default function MortgageBrokerApp() {
  const [isDesktop, setIsDesktop] = useState(() => (typeof window !== "undefined" ? window.innerWidth >= 1024 : false));
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => setIsDesktop(window.innerWidth >= 1024);
    handler();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const [step, setStep] = useState<Step>("advisor");
  const [advisorMessages, setAdvisorMessages] = useState<AdvisorMessage[]>([
    {
      id: createId(),
      role: "system",
      text: "Welcome to MortgageBroker! Ask me anything about the mortgage process, programs, or documents."
    }
  ]);
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState("");
  const [calculatorForm, setCalculatorForm] = useState<CalculatorFormState>({
    totalAmount: "500000",
    downPercent: "10",
    loanAmount: "450000",
    rate: "6.5",
    termYears: "30"
  });
  const [calculatorResult, setCalculatorResult] = useState<CalculatorResult | null>(null);

  // Store intake data to include in email later
  const [intakeData, setIntakeData] = useState<SaveIntakeInput | null>(null);

  const canCollectLead = advisorMessages.some((message) => message.role === "assistant");

  const latestFollowUps = useMemo(() => {
    const reversed = [...advisorMessages].reverse();
    const messageWithFollowUps = reversed.find((message) => Boolean(message.followUps?.length));
    return messageWithFollowUps?.followUps ?? DEFAULT_QUESTIONS;
  }, [advisorMessages]);

  const handleAskQuestion = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed) return;
    const userMessage: AdvisorMessage = { id: createId(), role: "user", text: trimmed };
    setAdvisorMessages((prev) => [...prev, userMessage]);
    setPendingQuestion("");
    setAdvisorLoading(true);
    try {
      const response = await callMortgageTool<AdvisorToolResponse>("mortgageAdvisor", { question: trimmed });
      const answer = response?.answer;
      const assistantMessage: AdvisorMessage = {
        id: createId(),
        role: "assistant",
        text: answer?.summary ?? "Here's what I'd consider as you plan your mortgage.",
        highlights: answer?.highlights ?? [],
        sources: answer?.sources ?? [],
        followUps: answer?.followUps ?? []
      };
      setAdvisorMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      await showToast({
        title: "Unable to answer right now",
        description: error instanceof Error ? error.message : "Unknown error",
        tone: "error"
      });
    } finally {
      setAdvisorLoading(false);
    }
  };

  const handleCalculatorChange = (field: keyof CalculatorFormState, value: string) => {
    setCalculatorForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "totalAmount" || field === "downPercent") {
        const total = Number(next.totalAmount);
        const downPct = Number(next.downPercent);
        if (total > 0 && downPct >= 0 && downPct < 100) {
          const loan = total * (1 - downPct / 100);
          next.loanAmount = loan > 0 ? String(Math.round(loan)) : "";
        } else if (!Number.isFinite(total) || !Number.isFinite(downPct)) {
          next.loanAmount = "";
        }
      }
      return next;
    });
  };

  const handleCalculator = async () => {
    const loanAmount = Number(calculatorForm.loanAmount);
    const rate = Number(calculatorForm.rate);
    const termYears = Number(calculatorForm.termYears);

    if (!loanAmount || !rate || !termYears) {
      await showToast({ title: "Enter total amount, down payment, rate, and term", tone: "warning" });
      return;
    }

    try {
      const response = await callMortgageTool<MortgageCalculatorResponse>("mortgageCalculator", {
        loanAmount,
        rate,
        termYears
      });
      if (response?.calculator) {
        setCalculatorResult(response.calculator);
        const text = `Estimated payment ≈ ${formatCurrency(response.calculator.monthlyPayment)}. Total interest ${formatCurrency(
          response.calculator.totalInterest
        )}.`;
        setAdvisorMessages((prev) => [
          ...prev,
          {
            id: createId(),
            role: "assistant",
            text,
            highlights: ["Tip: consider locking once you have an executed contract."],
            followUps: ["Ready to start the pre-qualification questions?"]
          }
        ]);
      }
    } catch (error) {
      await showToast({
        title: "Calculator unavailable",
        description: error instanceof Error ? error.message : "Unknown error",
        tone: "error"
      });
    }
  };

  return (
    <>
      <GlobalStyles />
      <div
        style={{
          background: `linear-gradient(135deg, ${COLORS.bgPrimary} 0%, ${COLORS.bgSecondary} 100%)`,
          color: COLORS.text,
          padding: isDesktop ? 28 : 18,
          borderRadius: isDesktop ? 20 : 14,
          fontFamily: "'DM Sans', system-ui, sans-serif",
          maxWidth: isDesktop ? 1920 : 640,
          width: "100%",
          margin: "0 auto",
          boxShadow: `0 20px 60px ${COLORS.shadow}, inset 0 1px 0 rgba(255,255,255,0.05)`,
          position: "relative",
          overflow: "hidden"
        }}
      >
        {/* Subtle texture overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E\")",
            pointerEvents: "none",
            opacity: 0.4
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          <Header />
          {step === "advisor" && (
            <AdvisorStep
              messages={advisorMessages}
              loading={advisorLoading}
              pendingQuestion={pendingQuestion}
              onQuestionChange={setPendingQuestion}
              onAsk={handleAskQuestion}
              followUps={latestFollowUps}
              onSelectFollowUp={(question) => setPendingQuestion(question)}
              canContinue={canCollectLead}
              onContinue={() => setStep("purpose")}
              calculatorForm={calculatorForm}
              onCalculatorChange={handleCalculatorChange}
              onCalculate={handleCalculator}
              calculatorResult={calculatorResult}
              isDesktop={isDesktop}
            />
          )}
          {step === "purpose" && <PurposeStep onNext={(data) => {
            setIntakeData(data);
            setStep("lead");
          }} />}
          {step === "lead" && <LeadCapture intakeData={intakeData} onNext={() => setStep("handoff")} />}
          {step === "handoff" && <Handoff />}
          <Footer />
        </div>
      </div>
    </>
  );
}

type AdvisorStepProps = {
  messages: AdvisorMessage[];
  loading: boolean;
  pendingQuestion: string;
  onQuestionChange: (value: string) => void;
  onAsk: (question: string) => void;
  followUps: string[];
  onSelectFollowUp: (question: string) => void;
  canContinue: boolean;
  onContinue: () => void;
  calculatorForm: CalculatorFormState;
  onCalculatorChange: (field: keyof CalculatorFormState, value: string) => void;
  onCalculate: () => void;
  calculatorResult: CalculatorResult | null;
  isDesktop: boolean;
};

function AdvisorStep({
  messages,
  loading,
  pendingQuestion,
  onQuestionChange,
  onAsk,
  followUps,
  onSelectFollowUp,
  canContinue,
  onContinue,
  calculatorForm,
  onCalculatorChange,
  onCalculate,
  calculatorResult,
  isDesktop
}: AdvisorStepProps) {
  const chatHeight = isDesktop ? 400 : 240;
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const lastMessageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = transcriptRef.current;
    const anchor = lastMessageRef.current;
    if (!node || !anchor) return;
    const offsetTop = anchor.offsetTop - node.offsetTop;
    node.scrollTo({ top: Math.max(offsetTop, 0), behavior: "smooth" });
  }, [messages]);

  return (
    <section
      style={{
        display: "grid",
        gap: 14,
        gridTemplateColumns: isDesktop ? "2.5fr 1fr" : "1fr",
        alignItems: "start",
        animation: "fadeIn 0.5s ease-out"
      }}
    >
      <div
        style={{
          background: COLORS.bgCard,
          borderRadius: 14,
          padding: isDesktop ? 20 : 14,
          border: `1px solid ${COLORS.border}`,
          boxShadow: `0 4px 16px ${COLORS.shadow}`,
          position: "relative",
          overflow: "hidden"
        }}
      >
        {/* Gold accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(90deg, ${COLORS.accent}, transparent)`,
            opacity: 0.6
          }}
        />

        <div
          ref={transcriptRef}
          style={{
            maxHeight: chatHeight,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginBottom: 14,
            paddingRight: 4
          }}
        >
          {messages.map((message, index) => {
            const isLast = index === messages.length - 1;
            return (
              <div
                key={message.id}
                ref={isLast ? lastMessageRef : undefined}
                style={{
                  animation: `fadeIn 0.4s ease-out ${index * 0.05}s both`
                }}
              >
                <AdvisorMessageBubble message={message} />
              </div>
            );
          })}
          {loading && <Info>Reviewing the knowledge base…</Info>}
        </div>

        <div style={{ position: "relative" }}>
          <textarea
            value={pendingQuestion}
            onChange={(event) => onQuestionChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (pendingQuestion.trim() && !loading) {
                  onAsk(pendingQuestion);
                }
              }
            }}
            placeholder="Ask about down payments, underwriting, timelines, etc."
            style={{
              width: "100%",
              minHeight: 70,
              borderRadius: 10,
              border: `1px solid ${COLORS.border}`,
              padding: 12,
              paddingRight: 50,
              background: COLORS.bgSecondary,
              color: COLORS.text,
              resize: "vertical",
              fontSize: 14,
              lineHeight: 1.5,
              transition: "border-color 200ms ease, box-shadow 200ms ease"
            }}
          />
          <button
            onClick={() => onAsk(pendingQuestion)}
            disabled={!pendingQuestion.trim() || loading}
            style={{
              position: "absolute",
              right: 8,
              bottom: 8,
              background: !pendingQuestion.trim() || loading ? COLORS.border : COLORS.accent,
              color: !pendingQuestion.trim() || loading ? COLORS.textMuted : COLORS.bgPrimary,
              border: "none",
              borderRadius: 8,
              width: 36,
              height: 36,
              cursor: !pendingQuestion.trim() || loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              fontWeight: "bold",
              transition: "all 200ms ease",
              transform: "scale(1)",
              boxShadow: !pendingQuestion.trim() || loading ? "none" : `0 2px 8px rgba(108, 227, 207, 0.3)`
            }}
            onMouseEnter={(event) => {
              if (!pendingQuestion.trim() || loading) return;
              event.currentTarget.style.background = COLORS.accentHover;
              event.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(event) => {
              if (!pendingQuestion.trim() || loading) return;
              event.currentTarget.style.background = COLORS.accent;
              event.currentTarget.style.transform = "scale(1)";
            }}
          >
            ↑
          </button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 10 }}>
          {followUps.slice(0, 4).map((suggestion, idx) => (
            <button
              key={suggestion}
              onClick={() => {
                onSelectFollowUp(suggestion);
                onAsk(suggestion);
              }}
              style={{
                background: `rgba(108, 227, 207, 0.08)`,
                color: COLORS.accent,
                border: `1px solid rgba(108, 227, 207, 0.2)`,
                borderRadius: 999,
                padding: "6px 13px",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 500,
                transition: "all 200ms ease",
                animation: `fadeIn 0.4s ease-out ${0.3 + idx * 0.08}s both`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `rgba(108, 227, 207, 0.15)`;
                e.currentTarget.style.borderColor = COLORS.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `rgba(108, 227, 207, 0.08)`;
                e.currentTarget.style.borderColor = `rgba(108, 227, 207, 0.2)`;
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <Button onClick={onContinue} disabled={!canContinue}>
            Continue to Pre-Qual
          </Button>
        </div>
      </div>

      <CalculatorCard
        form={calculatorForm}
        onChange={onCalculatorChange}
        onCalculate={onCalculate}
        result={calculatorResult}
        isDesktop={isDesktop}
      />
    </section>
  );
}

type CalculatorCardProps = {
  form: CalculatorFormState;
  onChange: (field: keyof CalculatorFormState, value: string) => void;
  onCalculate: () => void;
  result: CalculatorResult | null;
  isDesktop: boolean;
};

function CalculatorCard({ form, onChange, onCalculate, result, isDesktop }: CalculatorCardProps) {
  return (
    <div
      style={{
        background: COLORS.bgCard,
        borderRadius: 14,
        padding: isDesktop ? 18 : 14,
        border: `1px solid ${COLORS.border}`,
        boxShadow: `0 4px 16px ${COLORS.shadow}`,
        width: "100%",
        animation: "fadeIn 0.5s ease-out 0.1s both",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Sage accent corner */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 80,
          height: 80,
          background: `radial-gradient(circle at top right, ${COLORS.sage}15, transparent)`,
          pointerEvents: "none"
        }}
      />

      <div style={{ position: "relative", marginBottom: 14 }}>
        <h4
          style={{
            margin: "0 0 4px 0",
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 22,
            fontWeight: 600,
            color: COLORS.text,
            letterSpacing: "0.3px"
          }}
        >
          Payment Calculator
        </h4>
        <small style={{ color: COLORS.textMuted, fontSize: 12 }}>Estimate your monthly payment</small>
      </div>

      <div
        style={{
          display: "grid",
          gap: 9,
          gridTemplateColumns: "1fr",
          marginBottom: 12
        }}
      >
        <Field label="Total amount" value={form.totalAmount} onChange={(value) => onChange("totalAmount", value)} type="number" compact />
        <Field
          label="Down payment (%)"
          value={form.downPercent}
          onChange={(value) => onChange("downPercent", value)}
          type="number"
          compact
        />
        <Field
          label="Loan amount"
          value={form.loanAmount}
          onChange={(value) => onChange("loanAmount", value)}
          type="number"
          readOnly
          compact
        />
        <Field label="Interest rate (%)" value={form.rate} onChange={(value) => onChange("rate", value)} type="number" compact />
        <Field label="Term (years)" value={form.termYears} onChange={(value) => onChange("termYears", value)} type="number" compact />
      </div>

      <Button onClick={onCalculate} fullWidth>
        Calculate
      </Button>

      {result && (
        <div
          style={{
            marginTop: 14,
            padding: 14,
            background: `linear-gradient(135deg, rgba(124, 152, 133, 0.08), rgba(108, 227, 207, 0.08))`,
            borderRadius: 10,
            border: `1px solid rgba(108, 227, 207, 0.2)`,
            animation: "fadeIn 0.4s ease-out"
          }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 20,
              fontWeight: 600,
              color: COLORS.accent,
              marginBottom: 8
            }}
          >
            {formatCurrency(result.monthlyPayment)}/mo
          </div>
          <div style={{ fontSize: 11, color: COLORS.textMuted, lineHeight: 1.5 }}>
            Total interest: {formatCurrency(result.totalInterest)}<br />
            Total paid: {formatCurrency(result.totalPaid)} over {result.payoffDateMonths} payments
          </div>
        </div>
      )}
    </div>
  );
}

type AdvisorMessageBubbleProps = {
  message: AdvisorMessage;
};

function AdvisorMessageBubble({ message }: AdvisorMessageBubbleProps) {
  const isUser = message.role === "user";
  const background = isUser
    ? `linear-gradient(135deg, rgba(108, 227, 207, 0.12), rgba(108, 227, 207, 0.08))`
    : `rgba(255,255,255,0.03)`;
  const alignSelf = isUser ? "flex-end" : "flex-start";
  const borderColor = isUser ? `rgba(108, 227, 207, 0.3)` : COLORS.border;

  return (
    <div
      style={{
        background,
        padding: 12,
        borderRadius: 11,
        maxWidth: "88%",
        alignSelf,
        border: `1px solid ${borderColor}`,
        boxShadow: `0 2px 8px rgba(0,0,0,0.1)`
      }}
    >
      <div style={{ fontSize: 13, lineHeight: 1.6, color: COLORS.text }}>{message.text}</div>
      {message.highlights && message.highlights.length > 0 && (
        <ul style={{ margin: "10px 0 0", paddingLeft: 18, fontSize: 12, color: COLORS.textMuted, lineHeight: 1.5 }}>
          {message.highlights.map((highlight) => (
            <li key={highlight} style={{ marginBottom: 4 }}>{highlight}</li>
          ))}
        </ul>
      )}
      {message.sources && message.sources.length > 0 && (
        <div style={{ marginTop: 10, borderTop: `1px solid ${COLORS.border}`, paddingTop: 8 }}>
          <small style={{ color: COLORS.accent, fontSize: 11, fontWeight: 600 }}>Sources</small>
          <ul style={{ margin: "4px 0 0", paddingLeft: 16, fontSize: 11, color: COLORS.textMuted, lineHeight: 1.4 }}>
            {message.sources.map((source) => (
              <li key={`${message.id}-${source.title}`}>{source.title}: {source.snippet}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Header() {
  return (
    <header
      style={{
        display: "flex",
        gap: 14,
        alignItems: "center",
        marginBottom: 18,
        paddingBottom: 16,
        borderBottom: `1px solid ${COLORS.border}`,
        position: "relative",
        animation: "fadeIn 0.6s ease-out"
      }}
    >
      {/* Decorative gold accent */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: 120,
          height: 2,
          background: `linear-gradient(90deg, ${COLORS.accent}, transparent)`
        }}
      />

      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          overflow: "hidden",
          border: `2px solid ${COLORS.borderAccent}`,
          boxShadow: `0 4px 12px rgba(108, 227, 207, 0.2)`,
          flexShrink: 0
        }}
      >
        <img src={logoDataUri} alt="MortgageBroker logo" width={56} height={56} style={{ display: "block" }} />
      </div>

      <div>
        <h2
          style={{
            margin: 0,
            fontFamily: "'Outfit', sans-serif",
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: "-0.5px",
            background: `linear-gradient(135deg, ${COLORS.text}, ${COLORS.textMuted})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
          }}
        >
          MortgageBroker
        </h2>
        <small style={{ color: COLORS.accent, fontSize: 13, fontWeight: 500 }}>Prequal made simple</small>
      </div>
    </header>
  );
}

function LeadCapture({ intakeData, onNext }: { intakeData: SaveIntakeInput | null; onNext: () => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    return fullName.trim().length >= 2 && validateEmail(email) && phone.replace(/\D/g, "").length >= 10 && consent;
  }, [fullName, email, phone, consent]);

  const submitLead = async () => {
    if (!canSubmit || loading) {
      await showToast({ title: "Please complete the lead form", tone: "warning" });
      return;
    }

    setLoading(true);
    try {
      const leadPayload: SubmitLeadInput = {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: normalizePhone(phone),
        consent
      };

      // Combine lead and intake data for the tool call
      const combinedPayload = {
        ...leadPayload,
        intake: intakeData
      };

      await callMortgageTool("submitLead", combinedPayload);
      await showToast({ title: "Lead saved", tone: "success" });
      onNext();
    } catch (error) {
      await showToast({
        title: "Unable to save lead",
        description: error instanceof Error ? error.message : "Unknown error",
        tone: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ display: "grid", gap: 12, animation: "fadeIn 0.5s ease-out" }}>
      <Info>We'll email a recap of what we discussed before you start the secure application.</Info>
      <Field label="Full name" value={fullName} onChange={setFullName} autoComplete="name" required />
      <Field label="Email" value={email} type="email" autoComplete="email" onChange={setEmail} required />
      <Field label="Phone" value={phone} onChange={setPhone} placeholder="e.g., 786-555-1234" autoComplete="tel" required />

      <label
        style={{
          fontSize: 13,
          lineHeight: 1.5,
          color: COLORS.text,
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          cursor: "pointer"
        }}
      >
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          style={{
            marginTop: 2,
            accentColor: COLORS.accent,
            cursor: "pointer"
          }}
        />
        <span>I agree to be contacted by MortgageBroker and New American Funding as described below.</span>
      </label>

      <ConsentBlock />

      <Button onClick={submitLead} loading={loading} disabled={!canSubmit} fullWidth>
        SUBMIT
      </Button>
    </section>
  );
}

function PurposeStep({ onNext }: { onNext: (data: SaveIntakeInput) => void }) {
  const [purpose, setPurpose] = useState<SaveIntakeInput["purpose"]>("purchase");
  const [occupancy, setOccupancy] = useState<SaveIntakeInput["occupancy"]>("primary");
  const [propertyType, setPropertyType] = useState<SaveIntakeInput["propertyType"]>("singlefamily");
  const [estPrice, setEstPrice] = useState("");
  const [down, setDown] = useState("");

  const handleContinue = () => {
    const payload: SaveIntakeInput = {
      purpose,
      occupancy,
      propertyType,
      estPrice: parseNumber(estPrice),
      estDownPayment: parseNumber(down)
    };
    onNext(payload);
  };

  return (
    <section style={{ display: "grid", gap: 12, animation: "fadeIn 0.5s ease-out" }}>
      <Select
        label="Loan purpose"
        value={purpose}
        onChange={(value) => setPurpose(value as SaveIntakeInput["purpose"])}
        options={[
          ["purchase", "Purchase"],
          ["refinance", "Rate/Term Refinance"],
          ["cashout", "Cash-out Refinance"],
          ["secondhome", "Second Home"],
          ["investment", "Investment Property"]
        ]}
      />
      <Select
        label="Occupancy"
        value={occupancy}
        onChange={(value) => setOccupancy(value as SaveIntakeInput["occupancy"])}
        options={[
          ["primary", "Primary Residence"],
          ["secondhome", "Second Home"],
          ["investment", "Investment"]
        ]}
      />
      <Select
        label="Property type"
        value={propertyType}
        onChange={(value) => setPropertyType(value as SaveIntakeInput["propertyType"])}
        options={[
          ["singlefamily", "Single Family"],
          ["condo", "Condo"],
          ["townhome", "Townhome"],
          ["multiunit", "2–4 Unit"]
        ]}
      />
      <Field label="Estimated price (optional)" value={estPrice} type="number" onChange={setEstPrice} min="0" />
      <Field label="Estimated down payment (optional)" value={down} type="number" onChange={setDown} min="0" />
      <Info>We'll hand you off to the secure New American Funding portal to finish your application.</Info>
      <Button onClick={handleContinue} fullWidth>
        Continue
      </Button>
    </section>
  );
}

function Handoff() {
  const [loading, setLoading] = useState(false);

  const openPortal = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const session = await callMortgageTool<StartPrequalSessionPayload>("startPrequalSession", {});
      await showToast({ title: "Launching secure portal", tone: "info" });
      await openSecureWebView(session?.url ?? HANDOFF_URL);
    } catch (error) {
      await showToast({
        title: "Unable to start prequal",
        description: error instanceof Error ? error.message : "Unknown error",
        tone: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ display: "grid", gap: 12, animation: "fadeIn 0.5s ease-out" }}>
      <Info>
        You're ready to create an account or continue your application securely with New American Funding. We'll pass along
        the intake details you already shared.
      </Info>
      <Button onClick={openPortal} loading={loading} fullWidth>
        Continue / Create Account
      </Button>
    </section>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  min?: string;
  required?: boolean;
  readOnly?: boolean;
  compact?: boolean;
};

function Field({ label, value, onChange, type = "text", placeholder, autoComplete, min, required, readOnly, compact }: FieldProps) {
  return (
    <label style={{ display: "grid", gap: compact ? 4 : 6 }}>
      <span style={{ fontSize: compact ? 11 : 12, color: COLORS.textMuted, fontWeight: 500 }}>{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        min={min}
        required={required}
        readOnly={readOnly}
        style={{
          padding: compact ? 9 : 11,
          borderRadius: 9,
          border: `1px solid ${COLORS.border}`,
          background: readOnly ? `${COLORS.bgSecondary}80` : COLORS.bgSecondary,
          color: COLORS.text,
          fontSize: 14,
          transition: "border-color 200ms ease, box-shadow 200ms ease",
          cursor: readOnly ? "not-allowed" : "text"
        }}
      />
    </label>
  );
}

type SelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
};

function Select({ label, value, onChange, options }: SelectProps) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: 500 }}>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{
          padding: 11,
          borderRadius: 9,
          border: `1px solid ${COLORS.border}`,
          background: COLORS.bgSecondary,
          color: COLORS.text,
          fontSize: 14,
          cursor: "pointer",
          transition: "border-color 200ms ease, box-shadow 200ms ease"
        }}
      >
        {options.map(([val, labelText]) => (
          <option key={val} value={val}>
            {labelText}
          </option>
        ))}
      </select>
    </label>
  );
}

type ButtonProps = {
  children: ReactNode;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
};

function Button({ children, onClick, loading = false, disabled = false, fullWidth }: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      style={{
        background: isDisabled
          ? COLORS.border
          : `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentHover})`,
        color: isDisabled ? COLORS.textMuted : COLORS.bgPrimary,
        padding: "13px 20px",
        borderRadius: 10,
        border: "none",
        fontWeight: 700,
        fontSize: 14,
        letterSpacing: "0.3px",
        cursor: isDisabled ? "not-allowed" : "pointer",
        transition: "all 200ms ease",
        transform: "scale(1)",
        boxShadow: isDisabled ? "none" : `0 4px 14px rgba(108, 227, 207, 0.3)`,
        width: fullWidth ? "100%" : "auto"
      }}
      onMouseEnter={(event) => {
        if (isDisabled) return;
        event.currentTarget.style.transform = "scale(1.02) translateY(-1px)";
        event.currentTarget.style.boxShadow = `0 6px 20px rgba(108, 227, 207, 0.4)`;
      }}
      onMouseLeave={(event) => {
        if (isDisabled) return;
        event.currentTarget.style.transform = "scale(1)";
        event.currentTarget.style.boxShadow = `0 4px 14px rgba(108, 227, 207, 0.3)`;
      }}
    >
      {loading ? "Please wait…" : children}
    </button>
  );
}

function Info({ children }: { children: ReactNode }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, rgba(124, 152, 133, 0.06), rgba(124, 152, 133, 0.03))`,
      padding: 13,
      borderRadius: 10,
      border: `1px solid rgba(124, 152, 133, 0.2)`,
      fontSize: 13,
      lineHeight: 1.6,
      color: COLORS.text
    }}>
      {children}
    </div>
  );
}

function ConsentBlock() {
  return (
    <div
      style={{
        fontSize: 11,
        lineHeight: 1.6,
        color: COLORS.textMuted,
        background: `${COLORS.bgCard}80`,
        padding: 12,
        borderRadius: 8,
        border: `1px solid ${COLORS.border}`
      }}
    >
      By clicking <strong style={{ color: COLORS.accent }}>Submit</strong>, you agree to receive calls, emails, and texts from{" "}
      <strong>MortgageBroker</strong> and <strong>New American Funding</strong> at the number and email provided (including via autodialer and prerecorded messages).
      Message/data rates may apply. Consent is <strong>not</strong> required to obtain a loan. You can opt out at any time by replying STOP. See our{" "}
      <a href="https://apply.newamericanfunding.com/terms" target="_blank" rel="noreferrer noopener">
        Terms of Service
      </a>{" "}
      and{" "}
      <a href="https://apply.newamericanfunding.com/privacy" target="_blank" rel="noreferrer noopener">
        Privacy Policy
      </a>.
    </div>
  );
}

function Footer() {
  return (
    <footer
      style={{
        marginTop: 20,
        paddingTop: 16,
        borderTop: `1px solid ${COLORS.border}`,
        fontSize: 11,
        color: COLORS.textMuted,
        lineHeight: 1.6
      }}
    >
      <div style={{ marginBottom: 4, fontWeight: 500, color: COLORS.text }}>
        NMLS #2459410 • Equal Housing Lender
      </div>
      <div>
        <a href="https://apply.newamericanfunding.com/terms" target="_blank" rel="noreferrer noopener">
          Terms
        </a>{" "}
        ·{" "}
        <a href="https://apply.newamericanfunding.com/privacy" target="_blank" rel="noreferrer noopener">
          Privacy
        </a>{" "}
        · Support:{" "}
        <a href="mailto:nikola.spadijer@nafinc.com">nikola.spadijer@nafinc.com</a>
      </div>
    </footer>
  );
}

function parseNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function validateEmail(value: string) {
  return /\S+@\S+\.\S+/.test(value.trim());
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 10) return digits;
  return digits.slice(-10);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}
