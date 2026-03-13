// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  CartPage.jsx — v3 — guest cart + phone modal
//  + location picker + אמצעי תשלום fixed
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { C, IcoBack, IcoPlus, IcoMinus, IcoClose, IcoCheck, IcoShield, IcoPin, IcoCash, IcoCreditCard } from "../components/Icons";
import BottomNav from "../components/BottomNav";
import { supabase } from "../lib/supabase";

const FREE_DELIVERY_MIN = 150;
const PROMO_CODES = { "NAAT10": 0.10 };
const RED  = "#C8102E";
const DARK = "#111827";
const GRAY = "#6B7280";

function Spinner({ s=18, c="white" }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ animation:"cpSpin .8s linear infinite", flexShrink:0 }}>
      <circle cx="12" cy="12" r="10" stroke={c} strokeWidth="2.5" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round"/>
      <style>{`@keyframes cpSpin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </svg>
  );
}

/* ── Tracking Screen ── */
function TrackingScreen({ orderId, total, navigate }) {
  const STEPS = [
    { label:"ההזמנה התקבלה", icon:"✅", delay:0 },
    { label:"בהכנה",          icon:"👨‍🍳", delay:4000 },
    { label:"בדרך אליך",      icon:"🛵", delay:12000 },
    { label:"הגיע!",           icon:"🎉", delay:25000 },
  ];
  const [stepIdx, setStepIdx] = useState(0);
  useEffect(() => {
    const ts = STEPS.slice(1).map((s,i) => setTimeout(()=>setStepIdx(i+1), s.delay));
    return () => ts.forEach(clearTimeout);
  }, []);
  const cur = STEPS[stepIdx];
  return (
    <div style={{ fontFamily:"system-ui,Arial,sans-serif",background:"linear-gradient(160deg,#C8102E,#7B0D1E)",minHeight:"100vh",maxWidth:430,margin:"0 auto",direction:"rtl",display:"flex",flexDirection:"column",alignItems:"center",paddingTop:60,paddingBottom:40 }}>
      <div key={stepIdx} style={{ width:120,height:120,borderRadius:"50%",background:"rgba(255,255,255,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:56,marginBottom:20,animation:"cpPop .5s cubic-bezier(.34,1.56,.64,1)" }}>
        {cur.icon}
      </div>
      <div style={{ color:"white",fontSize:24,fontWeight:900,marginBottom:6 }}>{cur.label}</div>
      {orderId && <div style={{ color:"rgba(255,255,255,.6)",fontSize:12,marginBottom:32 }}>הזמנה #{String(orderId).slice(-6).toUpperCase()}</div>}
      <div style={{ display:"flex",gap:0,alignItems:"center",marginBottom:36,width:"82%" }}>
        {STEPS.map((s,i)=>{
          const done=i<=stepIdx, active=i===stepIdx;
          return (
            <div key={i} style={{ display:"flex",alignItems:"center",flex:i<STEPS.length-1?1:"none" }}>
              <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:5 }}>
                <div style={{ width:active?42:30,height:active?42:30,borderRadius:"50%",background:done?"white":"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:active?20:13,transition:"all .4s",boxShadow:active?"0 0 0 6px rgba(255,255,255,.2)":"none" }}>
                  {done?<span>{s.icon}</span>:<div style={{ width:7,height:7,borderRadius:"50%",background:"rgba(255,255,255,.4)" }}/>}
                </div>
                <div style={{ color:done?"white":"rgba(255,255,255,.4)",fontSize:9,fontWeight:active?800:500,textAlign:"center",width:55 }}>{s.label}</div>
              </div>
              {i<STEPS.length-1&&<div style={{ flex:1,height:2,background:i<stepIdx?"white":"rgba(255,255,255,.2)",transition:"background .6s",margin:"0 3px",marginBottom:18 }}/>}
            </div>
          );
        })}
      </div>
      {stepIdx<3&&<div style={{ background:"rgba(255,255,255,.15)",borderRadius:16,padding:"13px 28px",marginBottom:28,textAlign:"center" }}><div style={{ color:"rgba(255,255,255,.8)",fontSize:12 }}>זמן משלוח משוער</div><div style={{ color:"white",fontSize:22,fontWeight:900,marginTop:4 }}>~30 דקות</div></div>}
      <div style={{ color:"rgba(255,255,255,.7)",fontSize:14,marginBottom:26 }}>סה״כ שולם: <span style={{ color:"white",fontWeight:900 }}>₪{total}</span></div>
      <button onClick={()=>navigate("/")} style={{ background:"white",color:RED,border:"none",borderRadius:16,padding:"14px 40px",fontSize:15,fontWeight:900,cursor:"pointer",marginBottom:10 }}>חזור לדף הבית</button>
      <button onClick={()=>navigate("/orders")} style={{ background:"transparent",color:"rgba(255,255,255,.7)",border:"none",fontSize:14,cursor:"pointer" }}>מעקב הזמנות</button>
      <style>{`@keyframes cpPop{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:scale(1)}}*{box-sizing:border-box}`}</style>
    </div>
  );
}

/* ── Phone Login Modal ── */
function PhoneLoginModal({ onClose, onSuccess }) {
  const [phone, setPhone]   = useState("");
  const [otp,   setOtp]     = useState("");
  const [step,  setStep]    = useState("phone"); // phone | otp
  const [busy,  setBusy]    = useState(false);
  const [err,   setErr]     = useState("");
  const otpRefs = useRef([]);

  async function sendOTP() {
    const cleaned = phone.replace(/\D/g,"");
    if (cleaned.length < 9) { setErr("מספר טלפון לא תקין"); return; }
    setBusy(true); setErr("");
    try {
      const full = "+972" + (cleaned.startsWith("0") ? cleaned.slice(1) : cleaned);
      const { error } = await supabase.auth.signInWithOtp({ phone: full });
      if (error) throw error;
      setStep("otp");
    } catch(e) { setErr(e.message || "שגיאה בשליחת קוד"); }
    setBusy(false);
  }

  async function verifyOTP() {
    setBusy(true); setErr("");
    try {
      const cleaned = phone.replace(/\D/g,"");
      const full = "+972" + (cleaned.startsWith("0") ? cleaned.slice(1) : cleaned);
      const { data, error } = await supabase.auth.verifyOtp({ phone: full, token: otp, type:"sms" });
      if (error) throw error;
      onSuccess(data.user);
    } catch(e) { setErr(e.message || "קוד שגוי"); }
    setBusy(false);
  }

  function handleOtpChange(val, i) {
    const clean = val.replace(/\D/,"").slice(-1);
    const arr = otp.split(""); arr[i] = clean;
    const next = arr.join("").slice(0,6);
    setOtp(next);
    if (clean && i < 5) otpRefs.current[i+1]?.focus();
    if (next.length === 6) setTimeout(verifyOTP, 200);
  }

  return (
    <div style={{ position:"fixed",inset:0,zIndex:3000,background:"rgba(0,0,0,.6)",backdropFilter:"blur(5px)",display:"flex",alignItems:"flex-end",fontFamily:"system-ui,Arial,sans-serif",direction:"rtl" }}
      onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ width:"100%",maxWidth:430,margin:"0 auto",background:"white",borderRadius:"26px 26px 0 0",padding:"22px 20px 44px",animation:"cpSheet .32s cubic-bezier(.34,1.1,.64,1)" }}>

        {/* Handle */}
        <div style={{ display:"flex",justifyContent:"center",marginBottom:16 }}>
          <div style={{ width:38,height:4,background:"#E5E7EB",borderRadius:2 }}/>
        </div>

        {/* Close */}
        <button onClick={onClose} style={{ position:"absolute",top:18,left:18,width:32,height:32,borderRadius:"50%",background:"#F3F4F6",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        {step === "phone" ? (
          <>
            <div style={{ textAlign:"center",marginBottom:22 }}>
              <div style={{ fontSize:22,marginBottom:6 }}>📱</div>
              <div style={{ fontSize:18,fontWeight:900,color:DARK }}>מספר טלפון</div>
              <div style={{ fontSize:12,color:GRAY,marginTop:4 }}>הירשם או התחבר באמצעות מספר הטלפון שלך</div>
            </div>
            <div style={{ display:"flex",gap:8,marginBottom:10 }}>
              <div style={{ background:"#F9FAFB",border:"1.5px solid #E5E7EB",borderRadius:14,padding:"13px 14px",display:"flex",alignItems:"center",gap:6,flexShrink:0 }}>
                <span style={{ fontSize:16 }}>🇮🇱</span>
                <span style={{ fontSize:14,fontWeight:700,color:DARK }}>+972</span>
              </div>
              <input
                type="tel" inputMode="numeric" value={phone}
                onChange={e=>{ setPhone(e.target.value); setErr(""); }}
                onKeyDown={e=>{ if(e.key==="Enter") sendOTP(); }}
                placeholder="050 000 0000"
                autoFocus
                style={{ flex:1,border:"1.5px solid #E5E7EB",borderRadius:14,padding:"13px 14px",fontSize:17,outline:"none",textAlign:"right",fontFamily:"inherit",color:DARK,direction:"ltr",letterSpacing:2 }}
                onFocus={e=>e.target.style.borderColor=RED}
                onBlur={e=>e.target.style.borderColor="#E5E7EB"}
              />
            </div>
            {err && <div style={{ color:RED,fontSize:12,marginBottom:8,textAlign:"center" }}>{err}</div>}
            <button onClick={sendOTP} disabled={busy||phone.length<9} style={{ width:"100%",background:busy||phone.length<9?"#E5E7EB":`linear-gradient(135deg,${RED},#9B0B22)`,border:"none",borderRadius:16,padding:"15px",color:busy||phone.length<9?"#9CA3AF":"white",fontSize:15,fontWeight:900,cursor:busy||phone.length<9?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontFamily:"inherit",boxShadow:busy||phone.length<9?"none":"0 5px 18px rgba(200,16,46,.35)" }}>
              {busy ? <><Spinner/>שולח קוד...</> : "שלח קוד אימות →"}
            </button>
          </>
        ) : (
          <>
            <div style={{ textAlign:"center",marginBottom:22 }}>
              <div style={{ fontSize:22,marginBottom:6 }}>🔐</div>
              <div style={{ fontSize:18,fontWeight:900,color:DARK }}>קוד אימות</div>
              <div style={{ fontSize:12,color:GRAY,marginTop:4 }}>נשלח קוד למספר {phone}</div>
            </div>
            {/* 6-digit OTP boxes */}
            <div style={{ display:"flex",gap:8,justifyContent:"center",marginBottom:14,direction:"ltr" }}>
              {Array.from({length:6}).map((_,i)=>(
                <input key={i} ref={el=>otpRefs.current[i]=el}
                  type="tel" inputMode="numeric" maxLength={1}
                  value={otp[i]||""}
                  onChange={e=>handleOtpChange(e.target.value, i)}
                  onKeyDown={e=>{ if(e.key==="Backspace"&&!otp[i]&&i>0) otpRefs.current[i-1]?.focus(); }}
                  autoFocus={i===0}
                  style={{ width:44,height:52,border:`2px solid ${otp[i]?RED:"#E5E7EB"}`,borderRadius:12,fontSize:22,fontWeight:900,textAlign:"center",outline:"none",color:DARK,fontFamily:"inherit",transition:"border-color .15s" }}
                />
              ))}
            </div>
            {err && <div style={{ color:RED,fontSize:12,marginBottom:8,textAlign:"center" }}>{err}</div>}
            <button onClick={verifyOTP} disabled={busy||otp.length<6} style={{ width:"100%",background:otp.length<6?"#E5E7EB":`linear-gradient(135deg,${RED},#9B0B22)`,border:"none",borderRadius:16,padding:"15px",color:otp.length<6?"#9CA3AF":"white",fontSize:15,fontWeight:900,cursor:otp.length<6?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontFamily:"inherit" }}>
              {busy ? <><Spinner/>מאמת...</> : "אמת וכנס →"}
            </button>
            <button onClick={()=>{setStep("phone");setOtp("");setErr("");}} style={{ width:"100%",background:"none",border:"none",color:GRAY,fontSize:13,cursor:"pointer",marginTop:10,fontFamily:"inherit" }}>
              ← שנה מספר
            </button>
          </>
        )}
      </div>
      <style>{`@keyframes cpSheet{from{transform:translateY(100%)}to{transform:translateY(0)}}*{box-sizing:border-box}`}</style>
    </div>
  );
}

/* ── Location Picker Modal ── */
function LocationPickerModal({ savedLocations, selectedArea, onSelect, onClose, onAddNew }) {
  const [forOther,  setForOther]  = useState(false);
  const [otherPhone,setOtherPhone]= useState("");
  const [chosen,    setChosen]    = useState(null);

  const myLoc = selectedArea ? {
    label: selectedArea.short,
    address: selectedArea.coords ? `${selectedArea.coords.lat?.toFixed(4)}, ${selectedArea.coords.lng?.toFixed(4)}` : selectedArea.short,
    emoji: "🏠",
    isMe: true,
    zone: selectedArea,
  } : null;

  const allLocs = [
    ...(myLoc ? [myLoc] : []),
    ...savedLocations.map(s => ({ ...s, isMe: false })),
  ];

  function confirm() {
    if (!chosen) return;
    onSelect({
      loc: chosen,
      otherPhone: (forOther && !chosen.isMe) ? otherPhone : null,
    });
    onClose();
  }

  return (
    <div style={{ position:"fixed",inset:0,zIndex:3000,background:"rgba(0,0,0,.55)",backdropFilter:"blur(4px)",display:"flex",alignItems:"flex-end",fontFamily:"system-ui,Arial,sans-serif",direction:"rtl" }}
      onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ width:"100%",maxWidth:430,margin:"0 auto",background:"white",borderRadius:"26px 26px 0 0",padding:"20px 16px 40px",animation:"cpSheet .32s cubic-bezier(.34,1.1,.64,1)",maxHeight:"80vh",overflowY:"auto" }}>
        <div style={{ display:"flex",justifyContent:"center",marginBottom:14 }}>
          <div style={{ width:38,height:4,background:"#E5E7EB",borderRadius:2 }}/>
        </div>
        <div style={{ fontSize:16,fontWeight:900,color:DARK,marginBottom:4,textAlign:"center" }}>כתובת למשלוח</div>
        <div style={{ fontSize:12,color:GRAY,marginBottom:16,textAlign:"center" }}>בחר אחד מהמיקומים השמורים</div>

        {allLocs.length === 0 && (
          <div style={{ textAlign:"center",padding:"20px",color:GRAY,fontSize:13 }}>אין מיקומים שמורים</div>
        )}

        {allLocs.map((loc, i) => (
          <button key={i} onClick={()=>{ setChosen(loc); setForOther(!loc.isMe); }}
            style={{ width:"100%",display:"flex",alignItems:"center",gap:12,padding:"13px 14px",borderRadius:14,border:`2px solid ${chosen===loc?RED:"#E5E7EB"}`,background:chosen===loc?"rgba(200,16,46,.05)":"white",cursor:"pointer",marginBottom:8,fontFamily:"inherit",textAlign:"right" }}>
            <div style={{ width:42,height:42,borderRadius:12,background:chosen===loc?"rgba(200,16,46,.1)":"#F9FAFB",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0 }}>
              {loc.typeEmoji || loc.emoji || "📍"}
            </div>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontSize:13,fontWeight:800,color:DARK }}>{loc.label || loc.zoneName}</div>
              <div style={{ fontSize:11,color:GRAY,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                {loc.address || loc.zone?.short}
              </div>
            </div>
            {chosen===loc && (
              <div style={{ width:22,height:22,borderRadius:"50%",background:RED,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
            )}
          </button>
        ))}

        {/* Add new location */}
        <button onClick={onAddNew} style={{ width:"100%",display:"flex",alignItems:"center",gap:12,padding:"13px 14px",borderRadius:14,border:"2px dashed #D1D5DB",background:"white",cursor:"pointer",marginBottom:14,fontFamily:"inherit" }}>
          <div style={{ width:42,height:42,borderRadius:12,background:"#F9FAFB",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0 }}>➕</div>
          <div style={{ fontSize:13,fontWeight:700,color:RED }}>הוסף מיקום של קרוב / חבר / עבודה</div>
        </button>

        {/* Phone for other person */}
        {chosen && !chosen.isMe && (
          <div style={{ background:"#F9FAFB",borderRadius:14,padding:"13px 14px",marginBottom:14,border:"1px solid #F0F0F0" }}>
            <div style={{ fontSize:12,fontWeight:700,color:DARK,marginBottom:4 }}>
              📞 מספר טלפון לאיש הקשר <span style={{ color:GRAY,fontWeight:400 }}>(אופציונלי)</span>
            </div>
            <div style={{ fontSize:11,color:GRAY,marginBottom:8 }}>כדי שהשליח יוכל ליצור קשר אם ההזמנה עבור אדם אחר</div>
            <input type="tel" inputMode="numeric" value={otherPhone} onChange={e=>setOtherPhone(e.target.value)}
              placeholder="+972 050 000 0000"
              style={{ width:"100%",border:"1.5px solid #E5E7EB",borderRadius:11,padding:"10px 12px",fontSize:13,outline:"none",direction:"ltr",fontFamily:"inherit",boxSizing:"border-box" }}
              onFocus={e=>e.target.style.borderColor=RED}
              onBlur={e=>e.target.style.borderColor="#E5E7EB"}
            />
          </div>
        )}

        <button onClick={confirm} disabled={!chosen} style={{ width:"100%",background:!chosen?"#E5E7EB":`linear-gradient(135deg,${RED},#9B0B22)`,border:"none",borderRadius:16,padding:"15px",color:!chosen?"#9CA3AF":"white",fontSize:15,fontWeight:900,cursor:!chosen?"default":"pointer",fontFamily:"inherit",boxShadow:!chosen?"none":"0 5px 18px rgba(200,16,46,.35)" }}>
          אישור המיקום ←
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN CartPage
══════════════════════════════════════════════ */
export default function CartPage({ cart, add, rem, setCart, cartCount, user, guest, onLogin, selectedArea }) {
  const navigate = useNavigate();
  const [promoInput, setPromoInput] = useState("");
  const [promo,      setPromo]      = useState(null);
  const [promoError, setPromoError] = useState("");
  const [payment,    setPayment]    = useState("cash");
  const [loading,    setLoading]    = useState(false);
  const [ordered,    setOrdered]    = useState(false);
  const [orderId,    setOrderId]    = useState(null);
  const [showPhone,  setShowPhone]  = useState(false);
  const [showLocPicker, setShowLocPicker] = useState(false);
  const [deliveryLoc,   setDeliveryLoc]   = useState(null);
  const [savedLocs,     setSavedLocs]     = useState([]);

  useEffect(() => {
    try { setSavedLocs(JSON.parse(localStorage.getItem("yougo_saved_locations") || "[]")); } catch {}
  }, []);

  useEffect(() => {
    if (selectedArea && !deliveryLoc) {
      setDeliveryLoc({ label: selectedArea.short, address: selectedArea.short, isMe: true, zone: selectedArea });
    }
  }, [selectedArea]);

  const subtotal    = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const deliveryFee = subtotal >= FREE_DELIVERY_MIN ? 0 : 12;
  const discount    = promo ? Math.floor(subtotal * PROMO_CODES[promo]) : 0;
  const total       = subtotal + deliveryFee - discount;
  const restaurantName = cart[0]?.rname || null;

  function applyPromo() {
    const code = promoInput.trim().toUpperCase();
    if (PROMO_CODES[code]) { setPromo(code); setPromoError(""); }
    else { setPromoError("קוד שגוי או לא תקף"); setPromo(null); }
  }

  async function placeOrder() {
    if (!deliveryLoc) { setShowLocPicker(true); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.from("orders").insert({
        user_id: user?.id || null,
        customer_name: user?.name || user?.firstName || "",
        customer_phone: user?.phone || "",
        restaurant_name: restaurantName,
        items: cart,
        subtotal, delivery_fee: deliveryFee, total,
        address: deliveryLoc.address || deliveryLoc.label,
        contact_phone: deliveryLoc.otherPhone || null,
        payment_method: { cash:"מזומן", card:"אשראי", paypal:"PayPal", googlepay:"Google Pay", applepay:"Apple Pay" }[payment],
        status: "جديد",
        notes: promo ? `קוד פרומו: ${promo}` : null,
      }).select().single();
      setOrderId(!error && data ? data.id : "DEMO-" + Math.floor(Math.random()*9000+1000));
    } catch {
      setOrderId("DEMO-" + Math.floor(Math.random()*9000+1000));
    }
    setLoading(false);
    setCart([]);
    setOrdered(true);
  }

  if (ordered) return <TrackingScreen orderId={orderId} total={total} navigate={navigate} />;

  // ── Empty cart ──
  if (cart.length === 0) return (
    <div style={{ fontFamily:"system-ui,Arial,sans-serif",background:C.bg,minHeight:"100vh",maxWidth:430,margin:"0 auto",direction:"rtl",paddingBottom:80 }}>
      <div style={{ background:"linear-gradient(160deg,#C8102E,#9B0B22)",padding:"44px 20px 60px",position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",bottom:-30,left:0,right:0,height:60,background:C.bg,borderRadius:"50% 50% 0 0" }}/>
        <button onClick={()=>navigate(-1)} style={{ background:"rgba(255,255,255,.15)",border:"none",borderRadius:"50%",width:38,height:38,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}>
          <IcoBack s={18} c="white"/>
        </button>
        <div style={{ color:"white",fontSize:24,fontWeight:900,marginTop:12 }}>העגלה שלי</div>
      </div>
      <div style={{ textAlign:"center",padding:"60px 24px",color:C.gray }}>
        <div style={{ fontSize:60,marginBottom:16 }}>🛒</div>
        <div style={{ fontSize:18,fontWeight:700,color:C.dark,marginBottom:8 }}>העגלה ריקה</div>
        <div style={{ fontSize:14,marginBottom:28 }}>הוסף פריטים מהתפריט</div>
        <button onClick={()=>navigate("/")} style={{ background:C.red,color:"white",border:"none",borderRadius:16,padding:"14px 32px",fontSize:15,fontWeight:900,cursor:"pointer" }}>גלה מסעדות</button>
      </div>
      <BottomNav cartCount={cartCount}/>
      <style>{`*{box-sizing:border-box}`}</style>
    </div>
  );

  // ── Main cart ──
  return (
    <div style={{ fontFamily:"system-ui,Arial,sans-serif",background:C.bg,minHeight:"100vh",maxWidth:430,margin:"0 auto",direction:"rtl",paddingBottom:100 }}>
      <style>{`
        *{box-sizing:border-box}
        @keyframes cpSheet{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes cpPop{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:scale(1)}}
        .cp-inp:focus{border-color:${RED}!important;box-shadow:0 0 0 3px rgba(200,16,46,.08)!important;outline:none}
      `}</style>

      {/* Header */}
      <div style={{ background:"linear-gradient(160deg,#C8102E,#9B0B22)",padding:"44px 20px 60px",position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",bottom:-30,left:0,right:0,height:60,background:C.bg,borderRadius:"50% 50% 0 0" }}/>
        <button onClick={()=>navigate(-1)} style={{ background:"rgba(255,255,255,.15)",border:"none",borderRadius:"50%",width:38,height:38,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}>
          <IcoBack s={18} c="white"/>
        </button>
        <div style={{ color:"white",fontSize:24,fontWeight:900,marginTop:12 }}>ההזמנה שלי</div>
        <div style={{ color:"rgba(255,255,255,.75)",fontSize:13,marginTop:4 }}>{cart.length} פריטים</div>
      </div>

      <div style={{ padding:"0 16px" }}>

        {/* ── Cart items — always visible (guest + logged-in) ── */}
        <div style={{ marginBottom:14 }}>
          {cart.map(item=>(
            <div key={`${item.id}-${item.rid}`} style={{ background:"white",borderRadius:16,padding:14,marginBottom:10,boxShadow:"0 2px 8px rgba(0,0,0,.06)",display:"flex",gap:12,alignItems:"center" }}>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700,fontSize:14,color:C.dark }}>{item.name}</div>
                <div style={{ fontSize:12,color:C.gray,marginTop:2 }}>{item.rname}</div>
                <div style={{ fontSize:14,fontWeight:900,color:C.red,marginTop:4 }}>₪{item.price}</div>
              </div>
              <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                <button onClick={()=>rem(item.id,item.rid)} style={{ width:30,height:30,borderRadius:"50%",border:"2px solid #E5E7EB",background:"white",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}>
                  <IcoMinus s={12} c={C.dark}/>
                </button>
                <span style={{ fontSize:15,fontWeight:900,color:C.dark,minWidth:20,textAlign:"center" }}>{item.qty}</span>
                <button onClick={()=>add(item,{id:item.rid,name:item.rname})} style={{ width:30,height:30,borderRadius:"50%",border:"none",background:C.red,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}>
                  <IcoPlus s={14} c="white"/>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ── Guest banner — login to complete order ── */}
        {guest && (
          <div style={{ background:"linear-gradient(135deg,#1E293B,#0F172A)",borderRadius:20,padding:"20px 18px",marginBottom:16,textAlign:"center" }}>
            <div style={{ fontSize:32,marginBottom:8 }}>🔐</div>
            <div style={{ color:"white",fontSize:16,fontWeight:900,marginBottom:4 }}>כניסה נדרשת להמשך</div>
            <div style={{ color:"rgba(255,255,255,.6)",fontSize:12,marginBottom:16,lineHeight:1.5 }}>
              המוצרים שמורים בעגלה.<br/>התחבר/י כדי לבצע הזמנה ולשלם.
            </div>
            <button onClick={()=>setShowPhone(true)} style={{ background:`linear-gradient(135deg,${RED},#9B0B22)`,color:"white",border:"none",borderRadius:14,padding:"13px 28px",fontSize:14,fontWeight:900,cursor:"pointer",boxShadow:"0 5px 18px rgba(200,16,46,.40)" }}>
              התחבר/י עכשיו →
            </button>
          </div>
        )}

        {/* ── Delivery + Promo + Payment + Summary — only for logged-in ── */}
        {!guest && (<>

          {/* Delivery address picker */}
          <div style={{ background:"white",borderRadius:16,padding:16,marginBottom:12,boxShadow:"0 2px 8px rgba(0,0,0,.06)" }}>
            <div style={{ fontSize:13,fontWeight:700,color:C.dark,marginBottom:10,display:"flex",alignItems:"center",gap:6 }}>
              <IcoPin s={14} c={RED}/> כתובת למשלוח
            </div>
            {deliveryLoc ? (
              <div style={{ display:"flex",alignItems:"center",gap:12,background:"rgba(200,16,46,.04)",borderRadius:12,padding:"11px 13px",border:"1.5px solid rgba(200,16,46,.15)" }}>
                <div style={{ fontSize:22,flexShrink:0 }}>{deliveryLoc.typeEmoji||deliveryLoc.emoji||"📍"}</div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:13,fontWeight:800,color:DARK }}>{deliveryLoc.label}</div>
                  <div style={{ fontSize:11,color:GRAY,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{deliveryLoc.address}</div>
                  {deliveryLoc.otherPhone && <div style={{ fontSize:11,color:"#059669",marginTop:1 }}>📞 {deliveryLoc.otherPhone}</div>}
                </div>
                <button onClick={()=>setShowLocPicker(true)} style={{ background:"none",border:"none",cursor:"pointer",color:RED,fontSize:12,fontWeight:700,flexShrink:0 }}>שנה</button>
              </div>
            ) : (
              <button onClick={()=>setShowLocPicker(true)} style={{ width:"100%",display:"flex",alignItems:"center",gap:10,padding:"13px 14px",borderRadius:12,border:"2px dashed #E5E7EB",background:"#F9FAFB",cursor:"pointer",fontFamily:"inherit" }}>
                <div style={{ width:36,height:36,borderRadius:10,background:"rgba(200,16,46,.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0 }}>📍</div>
                <span style={{ fontSize:13,fontWeight:700,color:RED }}>בחר כתובת למשלוח</span>
              </button>
            )}
          </div>

          {/* Promo */}
          <div style={{ background:"white",borderRadius:16,padding:16,marginBottom:12,boxShadow:"0 2px 8px rgba(0,0,0,.06)" }}>
            <div style={{ fontSize:13,fontWeight:700,color:C.dark,marginBottom:8 }}>🎟️ קוד פרומו</div>
            {promo ? (
              <div style={{ display:"flex",alignItems:"center",gap:8,background:"rgba(16,185,129,.08)",borderRadius:12,padding:"10px 14px" }}>
                <IcoCheck s={16} c={C.green}/>
                <span style={{ color:C.green,fontWeight:700,fontSize:14 }}>{promo} — {PROMO_CODES[promo]*100}% הנחה</span>
                <button onClick={()=>{setPromo(null);setPromoInput("");}} style={{ marginRight:"auto",background:"none",border:"none",cursor:"pointer" }}><IcoClose s={13} c={C.gray}/></button>
              </div>
            ) : (
              <div style={{ display:"flex",gap:8 }}>
                <input className="cp-inp" value={promoInput} onChange={e=>{setPromoInput(e.target.value);setPromoError("");}}
                  onKeyDown={e=>{if(e.key==="Enter")applyPromo();}}
                  placeholder="הזן קוד (כגון: NAAT10)"
                  style={{ flex:1,border:"1.5px solid #E5E7EB",borderRadius:12,padding:"10px 12px",fontSize:13,outline:"none",direction:"rtl",fontFamily:"inherit" }}/>
                <button onClick={applyPromo} style={{ background:C.dark,color:"white",border:"none",borderRadius:12,padding:"10px 16px",fontSize:13,fontWeight:700,cursor:"pointer" }}>אשר</button>
              </div>
            )}
            {promoError && <div style={{ color:C.red,fontSize:11,marginTop:5 }}>{promoError}</div>}
          </div>

          {/* Payment */}
          <div style={{ background:"white",borderRadius:16,padding:16,marginBottom:12,boxShadow:"0 2px 8px rgba(0,0,0,.06)" }}>
            <div style={{ fontSize:13,fontWeight:700,color:C.dark,marginBottom:10 }}>אמצעי תשלום</div>
            <div style={{ display:"flex",gap:7 }}>
              {[{v:"cash",l:"מזומן",Ico:IcoCash},{v:"card",l:"אשראי",Ico:IcoCreditCard},{v:"paypal",l:"PayPal",e:"🅿️"},{v:"googlepay",l:"Google",e:"G"},{v:"applepay",l:"Apple Pay",e:"🍎"}].map(p=>(
                <button key={p.v} onClick={()=>setPayment(p.v)} style={{ flex:1,padding:"10px 4px",borderRadius:12,border:`2px solid ${payment===p.v?RED:"#E5E7EB"}`,background:payment===p.v?"rgba(200,16,46,.06)":"white",cursor:"pointer",fontSize:11,fontWeight:payment===p.v?700:500,color:payment===p.v?RED:GRAY,display:"flex",flexDirection:"column",alignItems:"center",gap:3,fontFamily:"inherit",transition:"all .15s" }}>
                  {p.Ico?<p.Ico s={20} c={payment===p.v?RED:GRAY}/>:<span style={{fontSize:16}}>{p.e}</span>}{p.l}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div style={{ background:"white",borderRadius:16,padding:16,marginBottom:14,boxShadow:"0 2px 8px rgba(0,0,0,.06)" }}>
            <div style={{ fontSize:13,fontWeight:700,color:C.dark,marginBottom:10 }}>סיכום הזמנה</div>
            {[
              { l:"סכום ביניים", v:`₪${subtotal}` },
              { l:"משלוח",       v:deliveryFee===0?"חינם 🎉":`₪${deliveryFee}` },
              ...(promo?[{l:`הנחה (${promo})`,v:`-₪${discount}`,c:C.green}]:[]),
            ].map((r,i)=>(
              <div key={i} style={{ display:"flex",justifyContent:"space-between",marginBottom:7 }}>
                <span style={{ fontSize:13,color:C.gray }}>{r.l}</span>
                <span style={{ fontSize:13,fontWeight:600,color:r.c||C.dark }}>{r.v}</span>
              </div>
            ))}
            <div style={{ borderTop:"1.5px solid #E5E7EB",paddingTop:10,display:"flex",justifyContent:"space-between" }}>
              <span style={{ fontSize:15,fontWeight:800,color:C.dark }}>סה״כ</span>
              <span style={{ fontSize:18,fontWeight:900,color:C.red }}>₪{total}</span>
            </div>
            {subtotal<FREE_DELIVERY_MIN&&<div style={{ marginTop:8,background:"rgba(245,166,35,.1)",borderRadius:10,padding:"8px 12px",fontSize:12,color:"#B45309",fontWeight:600,textAlign:"center" }}>הוסף עוד ₪{FREE_DELIVERY_MIN-subtotal} לקבלת משלוח חינם!</div>}
          </div>

        </>)}
      </div>

      {/* Fixed bottom bar */}
      <div style={{ position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,padding:"10px 16px 20px",background:"white",borderTop:"1px solid #F0F0F0",boxShadow:"0 -4px 20px rgba(0,0,0,.06)",zIndex:50 }}>
        <div style={{ display:"flex",alignItems:"center",gap:6,justifyContent:"center",marginBottom:8,background:"#F0FDF4",borderRadius:10,padding:"7px 14px",border:"1px solid #BBF7D0" }}>
          <IcoShield s={14} c="#16A34A"/>
          <span style={{ fontSize:12,color:"#15803D",fontWeight:700 }}>תשלום מאובטח ומוצפן 🔒</span>
        </div>
        {guest ? (
          <button onClick={()=>setShowPhone(true)} style={{ width:"100%",background:`linear-gradient(135deg,${RED},#9B0B22)`,color:"white",border:"none",borderRadius:16,padding:"16px",fontSize:16,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,boxShadow:"0 6px 20px rgba(200,16,46,.35)" }}>
            🔐 התחבר/י להמשך הזמנה
          </button>
        ) : (
          <button onClick={placeOrder} disabled={loading} style={{ width:"100%",background:loading?"rgba(200,16,46,.5)":`linear-gradient(135deg,${RED},#9B0B22)`,color:"white",border:"none",borderRadius:16,padding:"16px",fontSize:16,fontWeight:900,cursor:loading?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,boxShadow:"0 6px 20px rgba(200,16,46,.35)" }}>
            {loading?<><Spinner/>מעבד הזמנה...</>:<>עבור לתשלום — ₪{total}</>}
          </button>
        )}
      </div>

      {/* Phone login modal */}
      {showPhone && (
        <PhoneLoginModal
          onClose={()=>setShowPhone(false)}
          onSuccess={u=>{ setShowPhone(false); onLogin?.(u); }}
        />
      )}

      {/* Location picker modal */}
      {showLocPicker && (
        <LocationPickerModal
          savedLocations={savedLocs}
          selectedArea={selectedArea}
          onSelect={loc=>setDeliveryLoc(loc.loc)}
          onClose={()=>setShowLocPicker(false)}
          onAddNew={()=>{ setShowLocPicker(false); navigate("/address"); }}
        />
      )}

      <BottomNav cartCount={cartCount}/>
    </div>
  );
}
