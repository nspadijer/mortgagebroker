import { useState } from "react";
import { useOpenAI } from "@openai/apps-sdk/react";

const COLORS = {
  bg: "#081827",
  text: "#FFFFFF",
  primary: "#6CE3CF",
  primaryText: "#081827",
  accent: "#2F6E94",
  hover: "#539FA7"
};

export default function MortgageBrokerApp() {
  const ai = useOpenAI();
  const [step, setStep] = useState<"lead"|"purpose"|"handoff">("lead");
  return (
    <div style={{ background: COLORS.bg, color: COLORS.text, padding: 16, borderRadius: 12 }}>
      <Header />
      {step === "lead" && <LeadCapture onNext={() => setStep("purpose")} ai={ai} />}
      {step === "purpose" && <PurposeStep onNext={() => setStep("handoff")} ai={ai} />}
      {step === "handoff" && <Handoff ai={ai} />}
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header style={{ display:"flex", gap:12, alignItems:"center", marginBottom:12 }}>
      <img src="/assets/logo.png" alt="MortgageBroker" width={48} height={48}/>
      <div>
        <h2 style={{ margin:0 }}>MortgageBroker</h2>
        <small style={{ color: COLORS.primary }}>Prequal made simple</small>
      </div>
    </header>
  );
}

function LeadCapture({ onNext, ai }:{ onNext:()=>void; ai:any }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail]     = useState("");
  const [phone, setPhone]     = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await ai.tools.call("submitLead", { fullName, email, phone, consent });
      onNext();
    } catch (e:any) {
      await ai.ui.showToast({ title: "Please complete all fields & consent", description: e.message || "Validation error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ display:"grid", gap:10 }}>
      <Field label="Full name" value={fullName} onChange={setFullName} />
      <Field label="Email" type="email" value={email} onChange={setEmail} />
      <Field label="Phone" value={phone} onChange={setPhone} placeholder="e.g., 786-555-1234"/>
      <label style={{ fontSize:12, lineHeight:1.3 }}>
        <input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} />{" "}
        I agree to be contacted by MortgageBroker and New American Funding as described below.
      </label>
      <ConsentBlock />
      <Button onClick={submit} loading={loading}>Submit</Button>
    </section>
  );
}

function PurposeStep({ onNext, ai }:{ onNext:()=>void; ai:any }) {
  const [purpose, setPurpose] = useState<"purchase"|"refinance"|"cashout"|"secondhome"|"investment">("purchase");
  const [occupancy, setOccupancy] = useState<"primary"|"secondhome"|"investment">("primary");
  const [propertyType, setPropertyType] = useState<"singlefamily"|"condo"|"townhome"|"multiunit">("singlefamily");
  const [estPrice, setEstPrice] = useState<string>("");
  const [down, setDown] = useState<string>("");

  const save = async () => {
    await ai.tools.call("saveIntake", {
      purpose, occupancy, propertyType,
      estPrice: estPrice ? Number(estPrice) : undefined,
      estDownPayment: down ? Number(down) : undefined
    });
    onNext();
  };

  return (
    <section style={{ display:"grid", gap:10 }}>
      <Select label="Loan purpose" value={purpose} onChange={setPurpose}
        options={[
          ["purchase","Purchase"],
          ["refinance","Rate/Term Refinance"],
          ["cashout","Cash-out Refinance"],
          ["secondhome","Second Home"],
          ["investment","Investment Property"]
        ]}/>
      <Select label="Occupancy" value={occupancy} onChange={setOccupancy}
        options={[
          ["primary","Primary Residence"],
          ["secondhome","Second Home"],
          ["investment","Investment"]
        ]}/>
      <Select label="Property type" value={propertyType} onChange={setPropertyType}
        options={[
          ["singlefamily","Single Family"],
          ["condo","Condo"],
          ["townhome","Townhome"],
          ["multiunit","2–4 Unit"]
        ]}/>
      <Field label="Estimated price (optional)" value={estPrice} onChange={setEstPrice} type="number"/>
      <Field label="Estimated down payment (optional)" value={down} onChange={setDown} type="number"/>
      <Info>We’ll hand you off to the secure New American Funding portal to finish your application.</Info>
      <Button onClick={save}>Continue</Button>
    </section>
  );
}

function Handoff({ ai }:{ ai:any }) {
  const open = async () => {
    const { url } = await ai.tools.call("startPrequalSession", {});
    await ai.ui.openWebView({ url, title:"MortgageBroker • Application" });
  };
  return (
    <section style={{ display:"grid", gap:10 }}>
      <Info>You’re ready to create an account / continue your application securely with New American Funding.</Info>
      <Button onClick={open}>Continue / Create Account</Button>
    </section>
  );
}

function Field({ label, value, onChange, type="text", placeholder }:{
  label:string; value:string; onChange:(v:string)=>void; type?:string; placeholder?:string;
}) {
  return (
    <label style={{ display:"grid", gap:6 }}>
      <span style={{ fontSize:12, opacity:0.9 }}>{label}</span>
      <input
        value={value}
        onChange={e=>onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        style={{ padding:10, borderRadius:8, border:"1px solid #102F48", background:"#0E2234", color:"#fff" }}
      />
    </label>
  );
}
function Select({ label, value, onChange, options }:{
  label:string; value:string; onChange:(v:any)=>void; options:[string,string][];
}) {
  return (
    <label style={{ display:"grid", gap:6 }}>
      <span style={{ fontSize:12, opacity:0.9 }}>{label}</span>
      <select
        value={value}
        onChange={e=>onChange(e.target.value)}
        style={{ padding:10, borderRadius:8, border:"1px solid #102F48", background:"#0E2234", color:"#fff" }}
      >
        {options.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}
function Button({ children, onClick, loading=false }:{ children:any; onClick:()=>void; loading?:boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        background: COLORS.primary, color: COLORS.primaryText, padding:"12px 16px",
        borderRadius:10, border:"none", fontWeight:700, cursor:"pointer"
      }}
      onMouseOver={(e:any)=>e.currentTarget.style.background=COLORS.hover}
      onMouseOut={(e:any)=>e.currentTarget.style.background=COLORS.primary}
    >
      {loading ? "Submitting..." : children}
    </button>
  );
}
function Info({ children }:{ children:any }) {
  return <div style={{ background:"#0E2234", padding:10, borderRadius:8, border:"1px solid #102F48" }}>{children}</div>;
}
function ConsentBlock() {
  return (
    <div style={{ fontSize:12, lineHeight:1.4, opacity:0.9 }}>
      By clicking <b>Submit</b>, you agree to receive calls, emails, and texts from <b>MortgageBroker</b> and
      <b> New American Funding</b> at the number and email provided (including via autodialer and prerecorded messages).
      Message/data rates may apply. Consent is <b>not</b> required to obtain a loan. You can opt out at any time by
      replying STOP. See our <a href="https://apply.newamericanfunding.com/terms" target="_blank" rel="noreferrer">Terms of Service</a> and <a href="https://apply.newamericanfunding.com/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.
    </div>
  );
}
function Footer() {
  return (
    <footer style={{ marginTop:16, fontSize:12, opacity:0.8 }}>
      NMLS #2459410 • Equal Housing Lender • <a href="https://apply.newamericanfunding.com/terms" target="_blank" rel="noreferrer">Terms</a> · <a href="https://apply.newamericanfunding.com/privacy" target="_blank" rel="noreferrer">Privacy</a> · Support: <a href="mailto:nikola.spadijer@nafinc.com">nikola.spadijer@nafinc.com</a>
    </footer>
  );
}
