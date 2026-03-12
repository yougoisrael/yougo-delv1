import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  C, hexA,
  IcoSearch, IcoClose, IcoHome, IcoChevDown, IcoShield,
  IcoStar, IcoPin, IcoFork, IcoStore, IcoUser, IcoBack,
  IcoPackage, IcoCreditCard, IcoUsers, IcoHelp, IcoLock,
  IcoClock, IcoTruck, IcoOrders,
} from "../components/Icons";
import BottomNav from "../components/BottomNav";

function YougoLogo({ size = 36, white = false }) {
  const bg = white ? "white" : C.red;
  const fg = white ? C.red : "white";
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <rect width="60" height="60" rx="16" fill={bg} />
      <path d="M12 42V20l16 16V20" stroke={fg} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M34 30h16M42 24l8 6-8 6" stroke={fg} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Store Card — EXACT same design as RestCardH in HomePage ──
function StoreCard({ s, onClick, delay }) {
  const [pressed, setPressed] = useState(false);
  return (
    <div
      onClick={() => s.active !== false && onClick()}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        flexShrink:0, width:200, background:"white", borderRadius:22, overflow:"hidden",
        cursor: s.active !== false ? "pointer" : "default",
        opacity: s.active !== false ? 1 : 0.6,
        boxShadow: pressed ? "0 2px 8px rgba(0,0,0,0.1)" : "0 4px 16px rgba(0,0,0,0.08)",
        transform: pressed ? "scale(0.96)" : "scale(1)",
        transition:"transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease",
        animation:`slideUp 0.4s cubic-bezier(0.34,1.2,0.64,1) ${delay}ms both`,
      }}
    >
      <div style={{
        height:110,
        background: s.image_url ? "transparent"
          : `linear-gradient(135deg,${hexA(s.color||s.cover_color||"#C8102E","33")},${hexA(s.color||s.cover_color||"#C8102E","55")})`,
        display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden",
      }}>
        {s.image_url
          ? <img src={s.image_url} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt={s.name}/>
          : <span style={{ fontSize:52 }}>{s.emoji || s.logo_emoji || "🏪"}</span>
        }
        {s.active === false && (
          <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ color:"white", fontSize:11, fontWeight:700, background:"rgba(0,0,0,0.5)", padding:"3px 12px", borderRadius:20 }}>סגור כעת</span>
          </div>
        )}
        {s.free_delivery && <span style={{ position:"absolute", top:8, right:8, background:C.green, color:"white", fontSize:9, fontWeight:800, padding:"2px 8px", borderRadius:20 }}>🚀 חינם</span>}
        <div style={{ position:"absolute", bottom:8, left:8, display:"flex", alignItems:"center", gap:3, background:"rgba(0,0,0,0.45)", borderRadius:20, padding:"3px 8px" }}>
          <span style={{ fontSize:10 }}>⭐</span>
          <span style={{ fontSize:11, fontWeight:800, color:"white" }}>{s.rating || "4.5"}</span>
        </div>
      </div>
      <div style={{ padding:"10px 12px 12px" }}>
        <div style={{ fontWeight:900, fontSize:14, color:C.dark, marginBottom:3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{s.name}</div>
        <div style={{ fontSize:10, color:C.gray, marginBottom:8, display:"flex", alignItems:"center", gap:2 }}>
          <IcoPin s={9}/>{s.location || s.address || ""}
        </div>
        <div style={{ display:"flex", gap:5 }}>
          <span style={{ fontSize:9, fontWeight:600, color:C.gray, background:C.bg, borderRadius:10, padding:"2px 7px", display:"flex", alignItems:"center", gap:2 }}>
            <IcoClock s={9}/>{s.delivery_time || "25"} דק'
          </span>
          <span style={{ fontSize:9, fontWeight:600, color: s.delivery_fee===0 ? C.green : C.gray, background:C.bg, borderRadius:10, padding:"2px 7px" }}>
            {s.delivery_fee === 0 ? "חינם" : "₪" + (s.delivery_fee || 12)}
          </span>
        </div>
        <div style={{ marginTop:6, display:"flex", alignItems:"center", gap:4 }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background: s.active !== false ? C.green : "#EF4444", display:"inline-block" }}/>
          <span style={{ fontSize:10, color: s.active !== false ? C.green : "#EF4444", fontWeight:700 }}>{s.active !== false ? "פתוח" : "סגור"}</span>
        </div>
      </div>
    </div>
  );
}

// ── Market Category Icons — Professional SVG ──────
function MktAll({ active }) {
  const c = active ? "white" : null;
  return (
    <svg width="30" height="30" viewBox="0 0 40 40" fill="none">
      {/* Shopping cart */}
      <path d="M6 8h4l5 16h14l4-10H11" stroke={c || C.red} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="16" cy="29" r="2.5" fill={c || C.red}/>
      <circle cx="26" cy="29" r="2.5" fill={c || C.red}/>
    </svg>
  );
}
function MktFruits({ active }) {
  const green = active ? "white" : "#16A34A";
  const red   = active ? "rgba(255,255,255,0.85)" : "#EF4444";
  const yel   = active ? "rgba(255,255,255,0.7)"  : "#FCD34D";
  return (
    <svg width="30" height="30" viewBox="0 0 40 40" fill="none">
      {/* Apple */}
      <path d="M20 11c-1-3 2-5 4-4" stroke={green} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M12 17c0-4 3-7 8-7s8 3 8 7c0 8-4 14-8 14s-8-6-8-14z" fill={red}/>
      {/* Highlight */}
      <ellipse cx="16" cy="20" rx="2" ry="3.5" fill="rgba(255,255,255,0.25)" transform="rotate(-15 16 20)"/>
      {/* Leaf */}
      <path d="M20 11c2-3 6-2 5 1-1 2-4 2-5-1z" fill={green}/>
    </svg>
  );
}
function MktMeat({ active }) {
  const meat = active ? "white" : "#C8102E";
  const bone = active ? "rgba(255,255,255,0.6)" : "#FCD34D";
  return (
    <svg width="30" height="30" viewBox="0 0 40 40" fill="none">
      {/* Leg shape */}
      <path d="M10 30c-3-3-2-7 1-9l14-14c2-2 6-3 9-1s3 6 1 9L21 29c-2 2-6 3-9 1z" fill={meat}/>
      {/* Bone knob top */}
      <circle cx="31" cy="9" r="4" fill={bone}/>
      {/* Bone knob bottom */}
      <circle cx="9" cy="31" r="4" fill={bone}/>
      {/* Shine */}
      <ellipse cx="17" cy="17" rx="3" ry="6" fill="rgba(255,255,255,0.2)" transform="rotate(-45 17 17)"/>
    </svg>
  );
}
function MktSnacks({ active }) {
  const bag  = active ? "white" : "#F59E0B";
  const text = active ? "rgba(255,255,255,0.5)" : "#D97706";
  return (
    <svg width="30" height="30" viewBox="0 0 40 40" fill="none">
      {/* Chip bag shape */}
      <path d="M12 8l4 3h8l4-3 2 10-2 2-4 3h-8l-4-3-2-2L12 8z" fill={bag}/>
      <path d="M14 18l4 4h4l4-4" fill={text}/>
      {/* Bag bottom */}
      <path d="M14 23l-2 9h16l-2-9H14z" fill={bag}/>
      {/* Fold line */}
      <path d="M12 18h16" stroke={text} strokeWidth="1.5"/>
    </svg>
  );
}
function MktDairy({ active }) {
  const white_ = active ? "rgba(255,255,255,0.9)" : "#DBEAFE";
  const blue   = active ? "rgba(255,255,255,0.6)" : "#3B82F6";
  return (
    <svg width="30" height="30" viewBox="0 0 40 40" fill="none">
      {/* Milk carton */}
      <rect x="11" y="16" width="18" height="20" rx="2" fill={white_}/>
      {/* Carton top/roof */}
      <path d="M11 16l9-9 9 9H11z" fill={blue}/>
      {/* Label stripe */}
      <rect x="11" y="24" width="18" height="6" fill={blue} opacity="0.35"/>
      {/* Milk dots */}
      <circle cx="17" cy="21" r="1.5" fill={blue} opacity="0.5"/>
      <circle cx="20" cy="21" r="1.5" fill={blue} opacity="0.5"/>
      <circle cx="23" cy="21" r="1.5" fill={blue} opacity="0.5"/>
    </svg>
  );
}

const MKTCATS = [
  { id:"all",    Cmp:MktAll,    label:"מרקט",          bg:"#C8102E" },
  { id:"fruits", Cmp:MktFruits, label:"פירות וירקות",  bg:"#16A34A" },
  { id:"meat",   Cmp:MktMeat,   label:"דגים ובשרים",   bg:"#C8102E" },
  { id:"snacks", Cmp:MktSnacks, label:"חטיפים",         bg:"#F59E0B" },
  { id:"dairy",  Cmp:MktDairy,  label:"מוצרי חלב",     bg:"#3B82F6" },
];

export default function MarketPage({ cartCount, user }) {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mktCat, setMktCat] = useState("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");

  useEffect(() => {
    supabase.from("restaurants")
      .select("*")
      .eq("active", true)
      .then(({ data }) => { setStores(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = stores.filter(s => {
    if (searchQ) return s.name?.includes(searchQ) || s.category?.includes(searchQ);
    return true;
  });

  // ── Sidebar ──
  const Sidebar = () => (
    <>
      <div onClick={() => setSidebarOpen(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:600, opacity:sidebarOpen?1:0, pointerEvents:sidebarOpen?"all":"none", transition:"opacity 0.3s ease" }}/>
      <div style={{ position:"fixed", top:0, right:0, bottom:0, width:300, maxWidth:"80vw", background:"white", zIndex:601, display:"flex", flexDirection:"column", transform:sidebarOpen?"translateX(0)":"translateX(100%)", transition:"transform 0.35s cubic-bezier(0.34,1.1,0.64,1)", boxShadow:"-8px 0 40px rgba(0,0,0,0.15)", overflowY:"auto" }}>
        <div style={{ background:"linear-gradient(135deg,#C8102E,#7B0D1E)", padding:"calc(env(safe-area-inset-top,0px) + 54px) 20px 24px", position:"relative", flexShrink:0 }}>
          <button onClick={() => setSidebarOpen(false)} style={{ position:"absolute", top:14, left:14, background:"rgba(255,255,255,0.15)", border:"none", borderRadius:"50%", width:34, height:34, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
            <IcoBack s={16} c="white"/>
          </button>
          <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(255,255,255,0.15)", border:"2px solid rgba(255,255,255,0.3)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:10 }}>
            <IcoUser s={32} c="white"/>
          </div>
          <div style={{ color:"white", fontSize:18, fontWeight:900 }}>{user?.name || "אורח"}</div>
          <div style={{ color:"rgba(255,255,255,0.7)", fontSize:12, marginTop:2 }}>{user?.email || "התחבר לחשבון שלך"}</div>
        </div>
        <div style={{ flex:1, padding:"12px 0" }}>
          {[
            { icon:<IcoUser s={20} c={C.red}/>, label:"הפרופיל שלי", path:"/profile" },
            { icon:<IcoPackage s={20} c={C.red}/>, label:"ההזמנות שלי", path:"/orders" },
            { icon:<IcoCreditCard s={20} c={C.red}/>, label:"אמצעי תשלום", path:"/cards" },
            { icon:<IcoUsers s={20} c={C.red}/>, label:"הזמן חברים", path:"/invite" },
            { icon:<IcoFork s={20} c={C.red}/>, label:"מסעדות", path:"/" },
            { icon:<IcoHelp s={20} c="#6B7280"/>, label:"תמיכה", path:"/support" },
            { icon:<IcoLock s={20} c="#6B7280"/>, label:"מדיניות פרטיות", path:"/privacy" },
          ].map((item, i) => (
            <button key={i} onClick={() => { navigate(item.path); setSidebarOpen(false); }} style={{ width:"100%", background:"none", border:"none", padding:"14px 20px", display:"flex", alignItems:"center", gap:14, cursor:"pointer", textAlign:"right", fontFamily:"Arial,sans-serif", borderBottom:"1px solid #F9FAFB" }}>
              <div style={{ width:40, height:40, borderRadius:12, background:"rgba(200,16,46,0.07)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{item.icon}</div>
              <span style={{ flex:1, fontSize:14, fontWeight:700, color:"#111827" }}>{item.label}</span>
              <span style={{ color:"#D1D5DB", fontSize:16 }}>‹</span>
            </button>
          ))}
        </div>
        <div style={{ padding:"16px 20px", paddingBottom:"calc(env(safe-area-inset-bottom,0px) + 20px)", borderTop:"1px solid #F3F4F6", flexShrink:0 }}>
          <button onClick={() => { navigate("/admin"); setSidebarOpen(false); }} style={{ width:"100%", background:"linear-gradient(135deg,#111827,#1F2937)", color:"white", border:"none", borderRadius:16, padding:"14px", fontSize:14, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, fontFamily:"Arial,sans-serif" }}>
            <IcoShield s={18} c="#F87171"/> ניהול המערכת
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="page-enter" style={{ fontFamily:"Arial,sans-serif", background:C.bg, minHeight:"100vh", maxWidth:430, margin:"0 auto", direction:"rtl", overflowX:"hidden", paddingBottom:90, paddingTop:106 }}>
      <Sidebar/>

      {/* FIXED HEADER: TopBar + Tabs */}
      <div className="app-header">

        {/* TOP BAR */}
        <div style={{ padding:"10px 16px", display:"flex", alignItems:"center", gap:10 }}>
          {searchOpen ? (
            <div style={{ flex:1, display:"flex", gap:8, alignItems:"center" }}>
              <input autoFocus value={searchQ} onChange={e => setSearchQ(e.target.value)}
                placeholder="חיפוש חנות..."
                style={{ flex:1, border:"1.5px solid "+C.lightGray, borderRadius:24, padding:"8px 14px", fontSize:13, outline:"none", background:C.bg, direction:"rtl" }}/>
              <button onClick={() => { setSearchOpen(false); setSearchQ(""); }}
                style={{ background:C.bg, border:"none", borderRadius:"50%", width:34, height:34, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <IcoClose/>
              </button>
            </div>
          ) : (
            <>
              <button onClick={() => setSearchOpen(true)} style={{ background:"none", border:"none", cursor:"pointer", padding:4, display:"flex" }}>
                <IcoSearch/>
              </button>
              <div style={{ flex:1, display:"flex", alignItems:"center", gap:8, background:C.bg, borderRadius:24, padding:"7px 14px", cursor:"pointer" }}>
                <IcoHome s={18} c={C.red}/>
                <div style={{ flex:1, textAlign:"right" }}>
                  <div style={{ fontSize:12, fontWeight:700, color:C.dark }}>בית</div>
                  <div style={{ fontSize:10, color:C.gray }}>ראמה, ישראל</div>
                </div>
                <IcoChevDown/>
              </div>
              <button onClick={() => setSidebarOpen(true)} style={{ background:C.bg, border:"none", borderRadius:12, width:38, height:38, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M3 12h18M3 18h18" stroke="#111827" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </>
          )}
        </div>

        {/* TABS */}
        <div style={{ display:"flex", borderBottom:"1px solid "+C.lightGray }}>
          {[
            { id:"restaurants", label:"מסעדות", I:IcoFork },
            { id:"market",      label:"מרקט",   I:IcoStore },
          ].map(t => {
            const active = t.id === "market";
            return (
              <button key={t.id}
                onClick={() => t.id === "restaurants" && navigate("/")}
                style={{ flex:1, background:"none", border:"none", padding:"11px 0 8px", fontSize:13, fontWeight:700, color:active?C.red:C.gray, borderBottom:active?"2.5px solid "+C.red:"2.5px solid transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                <t.I s={18} c={active?C.red:C.gray}/>{t.label}
              </button>
            );
          })}
        </div>

      </div>

      {/* MARKET HERO */}
      <div style={{ margin:"14px 16px 0", background:"linear-gradient(135deg,#C8102E,#7B0D1E)", borderRadius:22, padding:"22px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", left:16, bottom:10, opacity:0.1 }}><YougoLogo size={70} white={true}/></div>
        <span style={{ color:"rgba(255,255,220,0.9)", fontSize:11, fontWeight:700, background:"rgba(255,255,255,0.12)", borderRadius:20, padding:"2px 10px", display:"inline-flex", alignItems:"center", gap:5 }}>
          <IcoStore s={12} c="white"/> Yougo מרקט
        </span>
        <div style={{ color:"white", fontSize:20, fontWeight:900, marginTop:8 }}>הבית תמיד מוכן</div>
        <div style={{ color:"rgba(255,255,255,0.8)", fontSize:13, marginTop:3 }}>כל מה שחסר בבית מגיע בחצי שעה</div>
      </div>

      {/* CATEGORY ICONS */}
      <div style={{ padding:"14px 0 4px" }}>
        <div style={{ display:"flex", gap:10, overflowX:"auto", padding:"4px 16px", scrollbarWidth:"none" }}>
          {MKTCATS.map(c => {
            const active = mktCat === c.id;
            return (
              <button key={c.id} onClick={() => setMktCat(c.id)}
                style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5, background:active?C.red:C.white, border:active?"none":"1.5px solid "+C.lightGray, borderRadius:18, padding:"10px 14px", cursor:"pointer", flexShrink:0, transition:"all .2s", minWidth:76, boxShadow:active?"0 4px 14px rgba(200,16,46,0.3)":"0 1px 4px rgba(0,0,0,0.05)" }}>
                <c.Cmp active={active}/>
                <span style={{ fontSize:10, fontWeight:700, color:active?"white":C.dark, whiteSpace:"nowrap" }}>{c.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* STORE CAROUSELS — same style as HomePage */}
      <div style={{ paddingBottom: 8 }}>
        {loading ? (
          <div style={{ textAlign:"center", padding:40, color:C.gray }}>
            <div style={{ width:36, height:36, borderRadius:"50%", border:"3px solid "+C.lightGray, borderTopColor:C.red, animation:"spin .7s linear infinite", margin:"0 auto 12px" }}/>
            טוען חנויות...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"50px 0", color:C.gray }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🏪</div>
            <div style={{ fontSize:15, fontWeight:600 }}>אין חנויות זמינות</div>
          </div>
        ) : (() => {
          // Build category groups like HomePage
          const catGroups = MKTCATS.filter(c => c.id !== "all").map(c => {
            const items = filtered.filter(s =>
              (s.category||"").toLowerCase().includes(c.id) ||
              (s.tags||[]).includes(c.id)
            );
            return { ...c, items };
          }).filter(g => g.items.length > 0);

          const CarouselRow = ({ title, items, icon, onSeeAll }) => (
            <div style={{ marginBottom:24 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"4px 16px 10px" }}>
                <span style={{ fontSize:16, fontWeight:900, color:C.dark, display:"flex", alignItems:"center", gap:8 }}>
                  {icon}
                  {title}
                </span>
                {onSeeAll && <span onClick={onSeeAll} style={{ fontSize:12, color:C.red, fontWeight:700, cursor:"pointer" }}>הכל ←</span>}
              </div>
              <div style={{
                display:"flex", gap:12, overflowX:"auto", overflowY:"visible",
                paddingTop:4, paddingBottom:12,
                paddingInlineStart:16, paddingInlineEnd:16,
                scrollbarWidth:"none", WebkitOverflowScrolling:"touch",
              }}>
                {items.map((s, i) => (
                  <StoreCard key={s.id} s={s} onClick={() => navigate("/restaurant/"+s.id, { state:s })} delay={i*50}/>
                ))}
              </div>
            </div>
          );

          return (
            <>
              {/* All stores row */}
              <CarouselRow
                title="🔥 כל החנויות"
                items={filtered}
                onSeeAll={null}
              />
              {/* Per-category rows */}
              {catGroups.map(g => (
                <CarouselRow
                  key={g.id}
                  title={g.label}
                  icon={<g.Cmp active={false}/>}
                  items={g.items}
                />
              ))}
            </>
          );
        })()}
      </div>

      <BottomNav cartCount={cartCount}/>
      <style>{`
        @keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        *{box-sizing:border-box}::-webkit-scrollbar{display:none}
      `}</style>
    </div>
  );
}
