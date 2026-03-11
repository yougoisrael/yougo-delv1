import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { C, IcoBack, IcoCart, IcoClock, IcoStar, IcoTruck, IcoPlus, IcoMinus, IcoFire, IcoPin, IcoOrders } from "../components/Icons";
import { supabase } from "../lib/supabase";

export default function RestaurantPage({ cart, add, rem, cartCount }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { state: rest } = useLocation();
  const [menu, setMenu] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const scrollRef = useRef(null);

  const r = rest || { name:"מסעדה", rating:5.0, delivery_time:25, delivery_fee:10, min_order:30, logo_emoji:"🍽️", category:"אוכל" };

  useEffect(() => {
    supabase.from("menu_items").select("*").eq("restaurant_id", id).eq("available", true)
      .order("sort_order")
      .then(({ data }) => { setMenu(data||[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const sections = [...new Set(menu.map(m => m.category).filter(Boolean))];
  const cartItems = cart.filter(c => c.rid === id);
  const cartRestTotal = cartItems.reduce((s,c) => s + c.price*c.qty, 0);

  function getQty(itemId) {
    return cart.find(c => c.id===itemId && c.rid===id)?.qty || 0;
  }

  function handleScroll(e) {
    setHeaderCollapsed(e.target.scrollTop > 60);
  }

  const coverBg = r.cover_color
    ? `linear-gradient(160deg, ${r.cover_color}88 0%, ${r.cover_color}cc 100%)`
    : "linear-gradient(160deg,#C8102E,#7B0D1E)";

  return (
    <div style={{ fontFamily:"Arial,sans-serif", background:C.bg, minHeight:"100vh", maxWidth:430, margin:"0 auto", direction:"rtl", position:"relative" }}>

      {/* ── HERO HEADER ── */}
      <div style={{ background:coverBg, minHeight:240, position:"relative", overflow:"hidden" }}>
        {/* Background decoration */}
        <div style={{ position:"absolute", width:300, height:300, borderRadius:"50%", background:"rgba(255,255,255,0.05)", top:-100, right:-80 }} />
        <div style={{ position:"absolute", width:200, height:200, borderRadius:"50%", background:"rgba(255,255,255,0.04)", bottom:-60, left:-40 }} />

        {/* Top bar */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"48px 20px 16px", position:"relative", zIndex:2 }}>
          <button onClick={() => navigate(-1)}
            style={{ background:"rgba(0,0,0,0.25)", backdropFilter:"blur(8px)", border:"none", borderRadius:"50%", width:42, height:42, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
            <IcoBack s={18} c="white" />
          </button>
          <button onClick={() => navigate("/cart")} style={{ position:"relative", background:"rgba(0,0,0,0.25)", backdropFilter:"blur(8px)", border:"none", borderRadius:"50%", width:42, height:42, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
            <IcoCart s={18} c="white" />
            {cartCount > 0 && <span style={{ position:"absolute", top:-2, left:-2, background:C.gold, color:"#111", fontSize:9, fontWeight:900, width:17, height:17, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" }}>{cartCount}</span>}
          </button>
        </div>

        {/* Logo + name */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", paddingBottom:48, position:"relative", zIndex:2 }}>
          <div style={{ width:90, height:90, borderRadius:26, background:"rgba(255,255,255,0.15)", backdropFilter:"blur(10px)", border:"2px solid rgba(255,255,255,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:52, marginBottom:12, boxShadow:"0 8px 32px rgba(0,0,0,0.2)" }}>
            {r.logo_emoji||"🍽️"}
          </div>
          <div style={{ color:"white", fontSize:26, fontWeight:900, textShadow:"0 2px 8px rgba(0,0,0,0.3)" }}>{r.name}</div>
          <div style={{ color:"rgba(255,255,255,0.8)", fontSize:13, marginTop:3, display:"flex", alignItems:"center", gap:4 }}>
            <IcoPin s={11} c="rgba(255,255,255,0.7)" />{r.location||r.category||""}
          </div>
        </div>

        {/* Wave bottom */}
        <div style={{ position:"absolute", bottom:-1, left:0, right:0, height:40, background:C.bg, borderRadius:"50% 50% 0 0" }} />
      </div>

      {/* ── INFO CARDS ROW ── */}
      <div style={{ padding:"0 16px", marginTop:-10, marginBottom:16, position:"relative", zIndex:3 }}>
        <div style={{ background:"white", borderRadius:22, padding:"14px 16px", boxShadow:"0 4px 20px rgba(0,0,0,0.08)", display:"flex", justifyContent:"space-around" }}>
          {[
            { icon:"⭐", top: r.rating||"4.5", bottom:"דירוג", color:"#B45309" },
            { icon:"🕐", top:(r.delivery_time||"25")+" דק'", bottom:"זמן משלוח", color:C.dark },
            { icon:"🛵", top: r.delivery_fee===0?"חינם":"₪"+(r.delivery_fee||12), bottom:"משלוח", color: r.delivery_fee===0?C.green:C.dark },
            { icon:"🛒", top:"₪"+(r.min_order||40), bottom:"מינימום", color:C.dark },
          ].map((x,i) => (
            <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
              <span style={{ fontSize:18 }}>{x.icon}</span>
              <span style={{ fontSize:13, fontWeight:900, color:x.color }}>{x.top}</span>
              <span style={{ fontSize:9, color:C.gray, fontWeight:500 }}>{x.bottom}</span>
            </div>
          ))}
        </div>

        {/* Open/close status */}
        <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:10, justifyContent:"center" }}>
          <span style={{ width:8, height:8, borderRadius:"50%", background: r.active?"#22C55E":"#EF4444", display:"inline-block", boxShadow: r.active?"0 0 0 3px rgba(34,197,94,0.2)":"none" }} />
          <span style={{ fontSize:13, color: r.active?"#22C55E":"#EF4444", fontWeight:700 }}>{r.active?"פתוח עכשיו":"סגור כעת"}</span>
          {r.open && r.close && <span style={{ fontSize:11, color:C.gray }}>• {r.open}–{r.close}</span>}
        </div>
      </div>

      {/* ── SECTION TABS ── */}
      {sections.length > 1 && (
        <div style={{ display:"flex", gap:8, overflowX:"auto", padding:"0 16px 12px", scrollbarWidth:"none" }}>
          <button onClick={() => setActiveSection(null)}
            style={{ flexShrink:0, padding:"8px 16px", borderRadius:20, border:"none", background: !activeSection?C.red:"white", color: !activeSection?"white":C.gray, fontSize:12, fontWeight:700, cursor:"pointer", boxShadow: !activeSection?"0 3px 12px rgba(200,16,46,0.25)":"0 1px 4px rgba(0,0,0,0.08)", fontFamily:"Arial,sans-serif", transition:"all .2s" }}>
            הכל
          </button>
          {sections.map(s => (
            <button key={s} onClick={() => setActiveSection(activeSection===s?null:s)}
              style={{ flexShrink:0, padding:"8px 16px", borderRadius:20, border:"none", background: activeSection===s?C.red:"white", color: activeSection===s?"white":C.gray, fontSize:12, fontWeight:700, cursor:"pointer", boxShadow: activeSection===s?"0 3px 12px rgba(200,16,46,0.25)":"0 1px 4px rgba(0,0,0,0.08)", fontFamily:"Arial,sans-serif", transition:"all .2s" }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* ── MENU ── */}
      <div style={{ padding:"0 16px", paddingBottom: cartItems.length>0?110:30 }}>
        {loading ? (
          <div style={{ textAlign:"center", padding:50, color:C.gray }}>
            <div style={{ width:36, height:36, borderRadius:"50%", border:"3px solid "+C.lightGray, borderTopColor:C.red, animation:"spin .7s linear infinite", margin:"0 auto 12px" }} />
            טוען תפריט...
          </div>
        ) : menu.length===0 ? (
          <div style={{ textAlign:"center", padding:"50px 0", color:C.gray }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🍽️</div>
            <div style={{ fontSize:15, fontWeight:600, color:C.dark }}>אין פריטים בתפריט</div>
          </div>
        ) : (
          sections.filter(s => !activeSection || s===activeSection).map(section => (
            <div key={section} style={{ marginBottom:8 }}>
              {/* Section header */}
              <div style={{ display:"flex", alignItems:"center", gap:8, margin:"18px 0 10px" }}>
                <div style={{ flex:1, height:1, background:C.lightGray }} />
                <div style={{ display:"flex", alignItems:"center", gap:5, background:"white", borderRadius:20, padding:"5px 14px", boxShadow:"0 1px 6px rgba(0,0,0,0.06)" }}>
                  <IcoFire s={13} />
                  <span style={{ fontSize:13, fontWeight:900, color:C.dark }}>{section}</span>
                </div>
                <div style={{ flex:1, height:1, background:C.lightGray }} />
              </div>

              {/* Menu items */}
              {menu.filter(m => m.category===section).map((item, idx) => {
                const qty = getQty(item.id);
                return (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    qty={qty}
                    onAdd={() => add(item, r)}
                    onRem={() => rem(item.id, id)}
                    delay={idx*40}
                  />
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* ── CART BAR ── */}
      {cartItems.length > 0 && (
        <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, padding:"12px 16px 24px", background:"white", boxShadow:"0 -4px 24px rgba(0,0,0,0.1)", zIndex:50 }}>
          <button onClick={() => navigate("/cart")}
            style={{ width:"100%", background:C.red, color:"white", border:"none", borderRadius:18, padding:"15px 20px", fontSize:15, fontWeight:900, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between", boxShadow:"0 6px 20px rgba(200,16,46,0.35)", fontFamily:"Arial,sans-serif" }}>
            <span style={{ background:"rgba(255,255,255,0.2)", borderRadius:10, padding:"2px 10px", fontSize:13 }}>
              {cartItems.reduce((s,c)=>s+c.qty,0)}
            </span>
            <span>מעבר לעגלה</span>
            <span>₪{cartRestTotal}</span>
          </button>
        </div>
      )}

      <style>{`*{box-sizing:border-box}::-webkit-scrollbar{display:none}@keyframes spin{to{transform:rotate(360deg)}}@keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

function MenuItemCard({ item, qty, onAdd, onRem, delay }) {
  const [pressed, setPressed] = useState(false);

  return (
    <div
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        background:"white", borderRadius:18, marginBottom:10,
        boxShadow: pressed?"0 2px 6px rgba(0,0,0,0.06)":"0 3px 12px rgba(0,0,0,0.06)",
        display:"flex", gap:12, alignItems:"center", padding:"12px 12px 12px 14px",
        transform: pressed?"scale(0.99)":"scale(1)",
        transition:"transform 0.15s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.15s ease",
        animation:`slideUp 0.35s cubic-bezier(0.34,1.2,0.64,1) ${delay}ms both`,
      }}
    >
      {/* Item image/emoji */}
      <div style={{ width:70, height:70, borderRadius:14, background:`linear-gradient(135deg,${C.bg},#E5E7EB)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:36, flexShrink:0, overflow:"hidden" }}>
        {item.image_url
          ? <img src={item.image_url} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt={item.name} />
          : <span>{item.is_hot?"🌶️":"🍽️"}</span>
        }
      </div>

      {/* Info */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:800, fontSize:14, color:C.dark, marginBottom:2 }}>{item.name}</div>
        {item.description && (
          <div style={{ fontSize:11, color:C.gray, lineHeight:1.4, marginBottom:4,
            display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
            {item.description}
          </div>
        )}
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontSize:16, fontWeight:900, color:C.red }}>₪{item.price}</span>
          {item.is_hot && <span style={{ fontSize:10, background:"#FEF2F2", color:"#EF4444", borderRadius:10, padding:"1px 7px", fontWeight:700 }}>🌶️ חריף</span>}
          {item.is_popular && <span style={{ fontSize:10, background:"#FFF9EB", color:"#B45309", borderRadius:10, padding:"1px 7px", fontWeight:700 }}>⭐ פופולרי</span>}
        </div>
      </div>

      {/* Add/remove */}
      <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
        {qty > 0 ? (
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <button onClick={onRem}
              style={{ width:32, height:32, borderRadius:"50%", border:"2px solid "+C.lightGray, background:"white", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"transform 0.15s" }}>
              <IcoMinus s={13} c={C.dark} />
            </button>
            <span style={{ fontSize:16, fontWeight:900, color:C.dark, minWidth:20, textAlign:"center" }}>{qty}</span>
          </div>
        ) : null}
        <button onClick={onAdd}
          style={{ width:36, height:36, borderRadius:"50%", border:"none", background:C.red, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", boxShadow:"0 3px 10px rgba(200,16,46,0.35)", transition:"transform 0.15s cubic-bezier(0.34,1.56,0.64,1)" }}>
          <IcoPlus s={16} c="white" />
        </button>
      </div>
    </div>
  );
}
