// ══════════════════════════════════════════════════════
//  AuthSheet.jsx — v3
//  Flow:
//  Phone → existing user → password expands inline
//                         → "שכחתי סיסמה" | "כניסה דרך קוד"
//                         → OTP to masked email → login
//       → new user → Info → Email + Password → register
//  + phone uniqueness enforced on registration
// ══════════════════════════════════════════════════════
import { useState, useEffect, useRef } from "react";
import BottomSheet from "./BottomSheet";
import { supabase } from "../lib/supabase";
import { IcoILFlag } from "./Icons";

// ── hCaptcha (invisible) — skipped if no site key set ──
const HCAP_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY;
function loadHcap() {
  if (!HCAP_KEY || document.getElementById("hcap-script")) return;
  const s = document.createElement("script");
  s.id = "hcap-script";
  s.src = "https://js.hcaptcha.com/1/api.js?render=explicit";
  s.async = true;
  document.head.appendChild(s);
}
async function getCaptchaToken() {
  if (!HCAP_KEY) return undefined;
  return new Promise(resolve => {
    function tryExec() {
      if (!window.hcaptcha) { setTimeout(tryExec, 200); return; }
      const el = document.createElement("div");
      el.style.display = "none";
      document.body.appendChild(el);
      try {
        const wid = window.hcaptcha.render(el, {
          sitekey: HCAP_KEY, size: "invisible",
          callback:           t => { try{document.body.removeChild(el);}catch{} resolve(t); },
          "error-callback":   () => { try{document.body.removeChild(el);}catch{} resolve(undefined); },
          "expired-callback": () => { try{document.body.removeChild(el);}catch{} resolve(undefined); },
        });
        window.hcaptcha.execute(wid);
      } catch { try{document.body.removeChild(el);}catch{} resolve(undefined); }
    }
    tryExec();
  });
}

const RED   = "#C8102E";
const DARK  = "#111827";
const GRAY  = "#6B7280";
const GREEN = "#16A34A";

const isPhone = v => { const d=(v||"").replace(/\D/g,""); return d.length>=9&&d.length<=12; };
const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v||"").trim());
const pwOk    = v => v && v.length>=8 && /[A-Z]/.test(v);

function maskEmail(em) {
  if (!em) return "";
  const [user, domain] = em.split("@");
  if (!domain) return em;
  const visible = user.length > 2 ? user.slice(0,2) : user.slice(0,1);
  const stars   = "*".repeat(Math.max(3, user.length - visible.length));
  return `${visible}${stars}@${domain}`;
}

function phoneVariants(raw) {
  const d = raw.replace(/\D/g,"");
  const s = d.replace(/^972/,"").replace(/^0/,"");
  return [d, "0"+s, s, "+972"+s, "972"+s];
}

const CSS = `
  @keyframes authIn  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes authSpin{ to{transform:rotate(360deg)} }
  *{box-sizing:border-box}
`;

function Spin({ c="white" }) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
      style={{ animation:"authSpin .7s linear infinite", flexShrink:0 }}>
      <circle cx="12" cy="12" r="10" stroke={c} strokeWidth="2.5"
        strokeDasharray="40" strokeDashoffset="15" strokeLinecap="round"/>
    </svg>
  );
}

function Eye({ show, toggle }) {
  return (
    <button type="button" onClick={toggle}
      style={{ background:"none",border:"none",cursor:"pointer",padding:4,display:"flex",color:GRAY,flexShrink:0 }}>
      {show
        ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></svg>
        : <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10 10 0 0112 20c-7 0-11-8-11-8a18 18 0 015.06-5.94M9.9 4.24A9 9 0 0112 4c7 0 11 8 11 8a18 18 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
      }
    </button>
  );
}

function PwInput({ label, value, onChange, placeholder, autoFocus, onEnter }) {
  const [show, setShow] = useState(false);
  const [f, setF] = useState(false);
  return (
    <div style={{ marginBottom:12 }}>
      {label && <div style={{ fontSize:12,fontWeight:700,color:GRAY,marginBottom:5 }}>{label}</div>}
      <div style={{ position:"relative" }}>
        <input value={value} onChange={onChange} type={show?"text":"password"}
          placeholder={placeholder} autoFocus={autoFocus} dir="ltr"
          onFocus={()=>setF(true)} onBlur={()=>setF(false)}
          onKeyDown={e=>e.key==="Enter"&&onEnter?.()}
          style={{
            width:"100%", padding:"13px 46px 13px 14px",
            border:`1.5px solid ${f?RED:"#E5E7EB"}`, borderRadius:14,
            fontSize:15, outline:"none", background:"white",
            direction:"ltr", fontFamily:"inherit", color:DARK,
            transition:"border-color .15s",
          }}/>
        <div style={{ position:"absolute",top:"50%",right:12,transform:"translateY(-50%)" }}>
          <Eye show={show} toggle={()=>setShow(p=>!p)}/>
        </div>
      </div>
    </div>
  );
}

function TextInput({ label, value, onChange, placeholder, type="text", dir="rtl", autoFocus, maxLength, onEnter, error }) {
  const [f, setF] = useState(false);
  return (
    <div style={{ marginBottom:12 }}>
      {label && <div style={{ fontSize:12,fontWeight:700,color:GRAY,marginBottom:5 }}>{label}</div>}
      <input value={value} onChange={onChange} type={type} placeholder={placeholder}
        autoFocus={autoFocus} maxLength={maxLength} dir={dir}
        onFocus={()=>setF(true)} onBlur={()=>setF(false)}
        onKeyDown={e=>e.key==="Enter"&&onEnter?.()}
        style={{
          width:"100%", padding:"13px 14px",
          border:`1.5px solid ${error?"#FCA5A5":f?RED:"#E5E7EB"}`, borderRadius:14,
          fontSize:15, outline:"none", background:"white",
          direction:dir, fontFamily:"inherit", color:DARK,
          transition:"border-color .15s",
        }}/>
      {error && <div style={{ color:"#DC2626",fontSize:11,fontWeight:600,marginTop:4 }}>{error}</div>}
    </div>
  );
}

function Btn({ children, onClick, loading, disabled, variant="red", style:sx }) {
  const bg = variant==="red"
    ? (disabled||loading ? "rgba(200,16,46,0.5)" : RED)
    : variant==="outline" ? "white" : "#F3F4F6";
  return (
    <button type="button" onClick={onClick} disabled={disabled||loading}
      style={{
        width:"100%", padding:"14px", borderRadius:14,
        border: variant==="outline" ? "1.5px solid #E5E7EB" : "none",
        background:bg, color: variant==="red" ? "white" : DARK,
        fontSize:14, fontWeight:800, cursor:disabled||loading?"not-allowed":"pointer",
        display:"flex", alignItems:"center", justifyContent:"center", gap:8,
        fontFamily:"inherit",
        boxShadow: variant==="red" ? "0 5px 18px rgba(200,16,46,.28)" : "none",
        transition:"all .15s", ...sx,
      }}>
      {loading && <Spin c={variant==="red"?"white":DARK}/>}
      {children}
    </button>
  );
}

function ErrBox({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      background:"#FEF2F2", border:"1px solid #FCA5A5", borderRadius:12,
      padding:"11px 14px", marginBottom:12,
      fontSize:13, color:"#DC2626", fontWeight:600, animation:"authIn .2s",
    }}>⚠️ {msg}</div>
  );
}

function StepBar({ step, total }) {
  return (
    <div style={{ display:"flex", gap:5, marginBottom:20 }}>
      {Array.from({length:total}).map((_,i)=>(
        <div key={i} style={{
          flex:1, height:4, borderRadius:4,
          background: i<=step ? RED : "#E5E7EB",
          opacity: i===step ? 1 : i<step ? 0.55 : 1,
          transition:"background .3s",
        }}/>
      ))}
    </div>
  );
}

export default function AuthSheet({ onClose, onDone }) {
  const [view,       setView]       = useState("phone");
  const [phone,      setPhone]      = useState("");
  const [phoneErr,   setPhoneErr]   = useState("");
  const [busy,       setBusy]       = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass,  setLoginPass]  = useState("");
  const [loginErr,   setLoginErr]   = useState("");
  const [showForgot, setShowForgot] = useState(false);

  const [maskedEmail,setMaskedEmail]= useState("");
  const [otp,        setOtp]        = useState(["","","","","",""]);
  const [otpErr,     setOtpErr]     = useState("");
  const [otpTimer,   setOtpTimer]   = useState(60);
  const [canResend,  setCanResend]  = useState(false);
  const otpRef = useRef(null);

  const [info,     setInfo]     = useState({ firstName:"", lastName:"", gender:"", age:"" });
  const [infoErrs, setInfoErrs] = useState({});

  const [regEmail, setRegEmail] = useState("");
  const [regPass,  setRegPass]  = useState("");
  const [regPass2, setRegPass2] = useState("");
  const [regErr,   setRegErr]   = useState("");

  function startTimer() {
    clearInterval(otpRef.current);
    setOtpTimer(60); setCanResend(false);
    otpRef.current = setInterval(()=>{
      setOtpTimer(t=>{ if(t<=1){clearInterval(otpRef.current);setCanResend(true);return 0;} return t-1; });
    },1000);
  }
  useEffect(()=>{ loadHcap(); return ()=>clearInterval(otpRef.current); },[]);

  async function submitPhone() {
    setPhoneErr("");
    const raw = phone.replace(/\D/g,"");
    if (!isPhone(raw)) { setPhoneErr("מספר טלפון לא תקין"); return; }
    setBusy(true);
    let found = null;
    for (const v of phoneVariants(raw)) {
      const { data } = await supabase.from("users").select("id,email").eq("phone",v).maybeSingle();
      if (data) { found = data; break; }
    }
    setBusy(false);
    if (found) {
      setLoginEmail(found.email||""); setLoginPass(""); setLoginErr(""); setShowForgot(false);
      setView("login");
    } else {
      setView("info");
    }
  }

  async function doLogin() {
    setLoginErr("");
    if (!loginPass) { setLoginErr("הזן סיסמה"); return; }
    setBusy(true);
    const captchaToken = await getCaptchaToken();
    const { data, error } = await supabase.auth.signInWithPassword({
      email:loginEmail, password:loginPass,
      ...(captchaToken && { options:{ captchaToken } }),
    });
    setBusy(false);
    if (error) { setLoginErr("סיסמה שגויה — נסה שוב"); return; }
    const m = data.user?.user_metadata||{};
    onDone?.({ id:data.user.id, email:data.user.email, name:(m.firstName||"")+" "+(m.lastName||""), firstName:m.firstName||"", phone:m.phone||phone });
  }

  async function sendOtpCode() {
    if (!loginEmail) { setLoginErr("לא נמצא אימייל מקושר"); return; }
    setBusy(true);
    const captchaToken = await getCaptchaToken();
    const { error } = await supabase.auth.signInWithOtp({
      email:loginEmail,
      options:{ shouldCreateUser:false, ...(captchaToken && { captchaToken }) }
    });
    setBusy(false);
    if (error) { setLoginErr(error.message?.includes("rate")?"יותר מדי בקשות — המתן דקה":"שגיאה בשליחת הקוד"); return; }
    setMaskedEmail(maskEmail(loginEmail));
    setOtp(["","","","","",""]); setOtpErr(""); startTimer();
    setView("otp");
  }

  function onOtpDigit(i, v) {
    if (!/^\d*$/.test(v)) return;
    const n=[...otp]; n[i]=v.slice(-1); setOtp(n); setOtpErr("");
    if (v&&i<5) document.getElementById("asotp"+(i+1))?.focus();
    if (n.join("").length===6) verifyOtp(n.join(""));
  }
  function onOtpBk(i,e){ if(e.key==="Backspace"&&!otp[i]&&i>0) document.getElementById("asotp"+(i-1))?.focus(); }

  async function verifyOtp(code) {
    setBusy(true);
    const { data, error } = await supabase.auth.verifyOtp({ email:loginEmail, token:code, type:"email" });
    setBusy(false);
    if (error) { setOtpErr("הקוד שגוי — נסה שוב"); setOtp(["","","","","",""]); setTimeout(()=>document.getElementById("asotp0")?.focus(),100); return; }
    const m=data.user?.user_metadata||{};
    onDone?.({ id:data.user.id, email:data.user.email, name:(m.firstName||"")+" "+(m.lastName||""), firstName:m.firstName||"", phone:m.phone||phone });
  }

  function submitInfo() {
    const e={};
    if (!info.firstName.trim()) e.firstName="שדה חובה";
    if (!info.lastName.trim())  e.lastName="שדה חובה";
    if (!info.gender)           e.gender="בחר מגדר";
    const a=parseInt(info.age);
    if (!info.age||isNaN(a)||a<13||a>100) e.age="גיל 13-100";
    if (Object.keys(e).length){setInfoErrs(e);return;}
    setInfoErrs({}); setView("register");
  }

  async function doRegister() {
    setRegErr("");
    const e=regEmail.trim().toLowerCase();
    if (!isEmail(e))    { setRegErr("כתובת אימייל לא תקינה"); return; }
    if (!pwOk(regPass)) { setRegErr("סיסמה: לפחות 8 תווים + אות גדולה"); return; }
    if (regPass!==regPass2){ setRegErr("הסיסמאות אינן תואמות"); return; }
    setBusy(true);
    const {data:eEx}=await supabase.from("users").select("id").eq("email",e).maybeSingle();
    if (eEx){ setRegErr("האימייל כבר רשום — נסה להתחבר"); setBusy(false); return; }
    const raw=phone.replace(/\D/g,"");
    let pEx=null;
    for (const v of phoneVariants(raw)){const{data}=await supabase.from("users").select("id").eq("phone",v).maybeSingle();if(data){pEx=data;break;}}
    if (pEx){ setRegErr("מספר הטלפון כבר רשום — נסה להתחבר"); setBusy(false); return; }
    const meta={ firstName:info.firstName.trim(), lastName:info.lastName.trim(), phone:raw, gender:info.gender, age:info.age };
    const captchaToken = await getCaptchaToken();
    const {data,error}=await supabase.auth.signUp({
      email:e, password:regPass,
      options:{ data:meta, ...(captchaToken && { captchaToken }) }
    });
    if (error){ setRegErr((error.message?.toLowerCase().includes("already")||error.message?.toLowerCase().includes("registered"))?"האימייל כבר רשום — נסה להתחבר":"שגיאה: "+error.message); setBusy(false); return; }
    if (data.user) await supabase.from("users").upsert({ id:data.user.id, name:meta.firstName+" "+meta.lastName, phone:raw, email:e });
    setBusy(false);
    onDone?.({ id:data.user?.id, email:e, name:meta.firstName+" "+meta.lastName, firstName:meta.firstName, phone:raw });
  }

  const stepMap={ phone:0, login:0, otp:0, info:1, register:2 };
  const titleMap={
    phone:    { t:"מספר הטלפון",    s:"הירשם או התחבר" },
    login:    { t:"כניסה לחשבון",  s:"הזן סיסמה להמשך" },
    otp:      { t:"קוד אימות",      s:`נשלח ל-${maskedEmail}` },
    info:     { t:"פרטים אישיים",   s:"עוד שלב קטן 👤" },
    register: { t:"אימייל וסיסמה", s:"כמעט סיימנו 🎉" },
  };

  return (
    <>
      <style>{CSS}</style>
      <BottomSheet open={true} onClose={onClose} maxHeight="92vh" zIndex={8000}>
        <div style={{ fontFamily:"system-ui,Arial,sans-serif", direction:"rtl", position:"relative" }}>
          <button onClick={onClose} style={{
            position:"absolute",top:6,left:14,width:32,height:32,borderRadius:"50%",
            background:"#F3F4F6",border:"none",cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",zIndex:2,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke={GRAY} strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </button>

          <div style={{ padding:"8px 20px 28px" }}>
            <StepBar step={stepMap[view]} total={3}/>
            <div key={view} style={{ animation:"authIn .25s", marginBottom:22 }}>
              <div style={{ fontSize:22,fontWeight:900,color:DARK,marginBottom:4 }}>{titleMap[view].t}</div>
              <div style={{ fontSize:13,color:GRAY }}>{titleMap[view].s}</div>
            </div>

            {/* ── PHONE ── */}
            {view==="phone" && (
              <>
                <div style={{ display:"flex",gap:10,marginBottom:10 }}>
                  <div style={{ background:"#F3F4F6",border:"1.5px solid #E5E7EB",borderRadius:14,padding:"13px 12px",display:"flex",alignItems:"center",gap:6,flexShrink:0,fontSize:14,fontWeight:700,color:DARK }}>
                    <IcoILFlag s={20}/> +972
                  </div>
                  <input value={phone}
                    onChange={e=>{setPhone(e.target.value.replace(/[^\d\-]/g,""));setPhoneErr("");}}
                    placeholder="05X-XXX-XXXX" type="tel" dir="ltr" maxLength={12} autoFocus
                    onKeyDown={e=>e.key==="Enter"&&submitPhone()}
                    style={{ flex:1,padding:"13px 14px",border:`1.5px solid ${phoneErr?"#FCA5A5":"#E5E7EB"}`,borderRadius:14,fontSize:15,outline:"none",direction:"ltr",textAlign:"left",fontFamily:"inherit",color:DARK,transition:"border-color .15s" }}/>
                </div>
                <ErrBox msg={phoneErr}/>
                <Btn onClick={submitPhone} loading={busy} disabled={!phone}>המשך ←</Btn>
              </>
            )}

            {/* ── LOGIN ── */}
            {view==="login" && (
              <div key="login" style={{ animation:"authIn .28s" }}>
                <div style={{ background:"#F9FAFB",border:"1.5px solid #E5E7EB",borderRadius:14,padding:"12px 14px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                  <span style={{ fontSize:15,color:DARK,direction:"ltr" }}>{phone}</span>
                  <button onClick={()=>{setView("phone");setPhone("");setLoginPass("");setLoginErr("");}}
                    style={{ background:"none",border:"none",color:RED,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>שנה</button>
                </div>
                <PwInput value={loginPass} onChange={e=>{setLoginPass(e.target.value);setLoginErr("");}} placeholder="הסיסמה שלך" autoFocus onEnter={doLogin}/>
                <ErrBox msg={loginErr}/>
                <Btn onClick={doLogin} loading={busy}>כניסה ←</Btn>

                {/* Forgot + Code — side by side */}
                <div style={{ display:"flex",gap:8,marginTop:4 }}>
                  <button onClick={()=>setShowForgot(p=>!p)} style={{
                    flex:1,padding:"11px 8px",borderRadius:12,
                    border:`1.5px solid ${showForgot?"#FCA5A5":"#E5E7EB"}`,
                    background:showForgot?"#FEF2F2":"white",
                    color:showForgot?RED:GRAY,fontSize:12,fontWeight:700,
                    cursor:"pointer",fontFamily:"inherit",transition:"all .2s",
                  }}>🔑 שכחתי סיסמה</button>
                  <button onClick={()=>sendOtpCode()} style={{
                    flex:1,padding:"11px 8px",borderRadius:12,
                    border:"1.5px solid #E5E7EB",background:"white",
                    color:GRAY,fontSize:12,fontWeight:700,
                    cursor:"pointer",fontFamily:"inherit",transition:"all .2s",
                  }}>📧 כניסה דרך קוד</button>
                </div>

                {/* Forgot expand */}
                <div style={{ maxHeight:showForgot?200:0,overflow:"hidden",transition:"max-height .35s cubic-bezier(0.4,0,0.2,1)" }}>
                  <div style={{ marginTop:12,background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:14,padding:"14px 16px" }}>
                    <div style={{ fontSize:13,fontWeight:700,color:"#92400E",marginBottom:6 }}>🔑 שחזור סיסמה</div>
                    <div style={{ fontSize:12,color:GRAY,marginBottom:12,lineHeight:1.5 }}>
                      נשלח קוד לאימייל המקושר:<br/>
                      <b style={{color:DARK}}>{maskEmail(loginEmail)}</b>
                    </div>
                    <button onClick={()=>sendOtpCode()} style={{
                      width:"100%",padding:"12px",background:"linear-gradient(135deg,#F59E0B,#B45309)",
                      color:"white",border:"none",borderRadius:12,fontSize:13,fontWeight:800,
                      cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 14px rgba(245,158,11,.35)",
                    }}>{busy?"שולח...":"שלח קוד לאימייל ←"}</button>
                  </div>
                </div>
              </div>
            )}

            {/* ── OTP ── */}
            {view==="otp" && (
              <div key="otp" style={{ animation:"authIn .28s" }}>
                <div style={{ background:"#F0FDF4",border:"1px solid #86EFAC",borderRadius:14,padding:"12px 16px",marginBottom:20,fontSize:13,color:DARK,textAlign:"center" }}>
                  שלחנו קוד 6 ספרות ל<br/>
                  <b style={{color:GREEN,fontSize:15}}>{maskedEmail}</b>
                </div>
                <div style={{ display:"flex",gap:8,justifyContent:"center",direction:"ltr",marginBottom:16 }}>
                  {otp.map((d,i)=>(
                    <input key={i} id={"asotp"+i} value={d} maxLength={1} autoFocus={i===0}
                      onChange={e=>onOtpDigit(i,e.target.value)} onKeyDown={e=>onOtpBk(i,e)}
                      style={{ width:46,height:56,textAlign:"center",fontSize:24,fontWeight:900,border:`2px solid ${otpErr?"#FCA5A5":d?RED:"#E5E7EB"}`,borderRadius:14,outline:"none",background:d?"rgba(200,16,46,0.05)":"white",color:otpErr?"#EF4444":DARK,fontFamily:"inherit",transition:"border-color .15s" }}/>
                  ))}
                </div>
                <ErrBox msg={otpErr}/>
                {busy && <div style={{textAlign:"center",padding:8,color:GRAY,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Spin c={RED}/>מאמת...</div>}
                <div style={{textAlign:"center",marginTop:8,marginBottom:16}}>
                  {canResend
                    ? <button onClick={()=>sendOtpCode()} style={{background:"none",border:"none",color:RED,fontSize:13,fontWeight:700,cursor:"pointer"}}>שלח קוד חדש</button>
                    : <div style={{color:GRAY,fontSize:13}}>שלח שוב בעוד <b style={{color:RED}}>{otpTimer}</b> שניות</div>
                  }
                </div>
                <Btn variant="outline" onClick={()=>setView("login")}>← חזור</Btn>
              </div>
            )}

            {/* ── INFO ── */}
            {view==="info" && (
              <div key="info" style={{ animation:"authIn .28s" }}>
                <div style={{display:"flex",gap:10}}>
                  <div style={{flex:1}}><TextInput label="שם פרטי *" value={info.firstName} onChange={e=>setInfo(p=>({...p,firstName:e.target.value}))} placeholder="שם פרטי" autoFocus error={infoErrs.firstName}/></div>
                  <div style={{flex:1}}><TextInput label="שם משפחה *" value={info.lastName} onChange={e=>setInfo(p=>({...p,lastName:e.target.value}))} placeholder="שם משפחה" error={infoErrs.lastName}/></div>
                </div>
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:12,fontWeight:700,color:GRAY,marginBottom:6}}>מגדר *</div>
                  <div style={{display:"flex",gap:8}}>
                    {[{v:"male",l:"זכר 👨"},{v:"female",l:"נקבה 👩"},{v:"other",l:"אחר 🧑"}].map(g=>(
                      <button key={g.v} type="button" onClick={()=>setInfo(p=>({...p,gender:g.v}))} style={{flex:1,padding:"12px 4px",borderRadius:14,border:`2px solid ${info.gender===g.v?RED:"#E5E7EB"}`,background:info.gender===g.v?"rgba(200,16,46,0.06)":"white",cursor:"pointer",fontSize:12,fontWeight:info.gender===g.v?700:500,color:info.gender===g.v?RED:GRAY,fontFamily:"inherit",transition:"all .15s"}}>{g.l}</button>
                    ))}
                  </div>
                  {infoErrs.gender && <div style={{color:"#DC2626",fontSize:11,marginTop:4}}>{infoErrs.gender}</div>}
                </div>
                <TextInput label="גיל *" value={info.age} onChange={e=>setInfo(p=>({...p,age:e.target.value.replace(/\D/g,"")}))} placeholder="גיל (13-100)" maxLength={3} error={infoErrs.age}/>
                <Btn onClick={submitInfo} style={{marginTop:4}}>המשך ←</Btn>
                <div style={{marginTop:8}}><Btn variant="outline" onClick={()=>setView("phone")}>← חזור</Btn></div>
              </div>
            )}

            {/* ── REGISTER ── */}
            {view==="register" && (
              <div key="register" style={{ animation:"authIn .28s" }}>
                <TextInput label="אימייל *" value={regEmail} onChange={e=>{setRegEmail(e.target.value);setRegErr("");}} type="email" placeholder="example@email.com" dir="ltr" autoFocus/>
                <PwInput label="סיסמה *" value={regPass} onChange={e=>{setRegPass(e.target.value);setRegErr("");}} placeholder="לפחות 8 תווים + אות גדולה"/>
                {regPass.length>0 && (
                  <div style={{display:"flex",flexDirection:"column",gap:3,marginBottom:12}}>
                    {[{ok:regPass.length>=8,t:"8 תווים לפחות"},{ok:/[A-Z]/.test(regPass),t:"אות גדולה"},{ok:/\d/.test(regPass),t:"מספר"}].map((r,i)=>(
                      <div key={i} style={{display:"flex",gap:6,alignItems:"center"}}>
                        <span style={{fontSize:11,color:r.ok?GREEN:"#D1D5DB"}}>{r.ok?"✓":"○"}</span>
                        <span style={{fontSize:11,color:r.ok?GREEN:"#9CA3AF",fontWeight:r.ok?600:400}}>{r.t}</span>
                      </div>
                    ))}
                  </div>
                )}
                <PwInput label="אימות סיסמה *" value={regPass2} onChange={e=>{setRegPass2(e.target.value);setRegErr("");}} placeholder="חזור על הסיסמה" onEnter={doRegister}/>
                {regPass2 && <div style={{fontSize:11,marginBottom:8,color:regPass===regPass2?GREEN:"#EF4444",fontWeight:600}}>{regPass===regPass2?"✓ הסיסמאות תואמות":"✗ הסיסמאות אינן תואמות"}</div>}
                <ErrBox msg={regErr}/>
                <Btn onClick={doRegister} loading={busy} disabled={!isEmail(regEmail)||!pwOk(regPass)||regPass!==regPass2}>צור חשבון ✓</Btn>
                <div style={{marginTop:8}}><Btn variant="outline" onClick={()=>setView("info")}>← חזור</Btn></div>
              </div>
            )}

            <div style={{textAlign:"center",color:"#9CA3AF",fontSize:10,marginTop:14,lineHeight:1.7}}>
              בהמשך אתה מסכים ל<span style={{color:RED,fontWeight:700}}>תנאי השימוש</span> ול<span style={{color:RED,fontWeight:700}}>מדיניות הפרטיות</span>
            </div>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
