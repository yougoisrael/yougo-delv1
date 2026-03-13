/**
 * AddressPickerPage.jsx — REBUILT FROM SCRATCH
 * Professional map address picker (Wolt/Bolt style)
 *
 * Flow:
 *   Step 0 → Zone selection (3 cards + auto-detect GPS)
 *   Step 1 → Map + form (center crosshair, shrink on scroll, bounce-back)
 *
 * Fixes:
 *  - Loads Leaflet JS itself (no dependency on MapPage)
 *  - Only draws circle for the active zone
 *  - Clean center crosshair pin (no broken emoji marker)
 *  - Map invalidateSize on height change
 *  - Auto-detect → saves zone + jumps to /
 *  - BottomNav always visible
 */

import { useEffect, useRef, useState } from "react";
import { useNavigate }                  from "react-router-dom";
import BottomNav                        from "../components/BottomNav";

/* ── constants ─────────────────────────────────────────────────── */
const R   = "#C8102E";   // brand red
const BLK = "#111827";
const GRY = "#6B7280";
const GRY2= "#9CA3AF";
const BG  = "#F5F5F7";

const ZONES = [
  {
    id:"east",
    short:"ראמה · מגאר · עראבה",
    nameHe:"ראמה, סאגור, שזור",
    cities:"ראמה, סאגור, שזור, עין אל-אסד, עראבה, סחנין, מגאר",
    lat:32.9078, lng:35.3524, radius:6500,
    emoji:"🌿", accent:"#059669", light:"#D1FAE5",
  },
  {
    id:"center",
    short:"כרמיאל · נחף · בעינה",
    nameHe:"כרמיאל - נחף - בעינה",
    cities:"כרמיאל, נחף, דיר אל-אסד, בעינה, מגד אל-כרום",
    lat:32.9178, lng:35.2999, radius:5000,
    emoji:"🏙️", accent:"#2563EB", light:"#DBEAFE",
  },
  {
    id:"north",
    short:"פקיעין · חורפיש · כסרה",
    nameHe:"פקיעין - חורפיש - כסרה",
    cities:"פקיעין, חורפיש, בית ג'ן, כסרה-סמיע",
    lat:32.9873, lng:35.3220, radius:5500,
    emoji:"⛰️", accent:"#7C3AED", light:"#EDE9FE",
  },
];

/* ── helpers ────────────────────────────────────────────────────── */
function haversine(la1,lo1,la2,lo2){
  const R=6371000,φ1=la1*Math.PI/180,φ2=la2*Math.PI/180,
        Δφ=(la2-la1)*Math.PI/180,Δλ=(lo2-lo1)*Math.PI/180;
  const a=Math.sin(Δφ/2)**2+Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
const inside  = (la,lo,z) => haversine(la,lo,z.lat,z.lng) <= z.radius * 1.15;
const nearest = (la,lo)   => ZONES.reduce((b,z)=> haversine(la,lo,z.lat,z.lng) < haversine(la,lo,b.lat,b.lng) ? z : b, ZONES[0]);
const resolve  = (iz) => !iz ? null : ZONES.find(z=>z.id===iz.id) || (iz.lat&&iz.lng ? nearest(iz.lat,iz.lng) : null);

/* ── CSS injected once ──────────────────────────────────────────── */
const GLOBAL_CSS = `
  @keyframes addrSpin  { to { transform:rotate(360deg); } }
  @keyframes addrPulse { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:0;transform:scale(2.6)} }
  @keyframes addrIn    { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes addrPop   { 0%{opacity:0;transform:scale(.5)} 70%{transform:scale(1.08)} 100%{opacity:1;transform:scale(1)} }
  @keyframes addrSlide { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  .leaflet-container   { background:#ede8df !important; }
  .addr-btn:active     { transform:scale(.97) !important; }
`;

/* ══════════════════════════════════════════════════════════════════
   STEP 0 — Zone Selector
══════════════════════════════════════════════════════════════════ */
function ZoneSelector({ onManual, onAuto }) {
  const [busy,  setBusy]  = useState(false);
  const [err,   setErr]   = useState("");
  const [tap,   setTap]   = useState(null);

  function detectGPS() {
    setBusy(true); setErr("");
    if (!navigator.geolocation) {
      setErr("المتصفح لا يدعم GPS"); setBusy(false); return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setBusy(false); onAuto(coords.latitude, coords.longitude); },
      (e)          => { setBusy(false); setErr(e.code===1 ? "يرجى السماح للموقع من إعدادات المتصفح ثم أعد المحاولة" : "تعذّر تحديد موقعك، اختر يدوياً"); },
      { enableHighAccuracy:true, timeout:9000, maximumAge:0 }
    );
  }

  return (
    <div style={{
      position:"fixed",inset:0,display:"flex",flexDirection:"column",
      fontFamily:"system-ui,Arial,sans-serif",direction:"rtl",
      background:BG, maxWidth:430, margin:"0 auto", zIndex:300,
    }}>
      <style>{GLOBAL_CSS}</style>

      {/* ── hero ── */}
      <div style={{
        background:`linear-gradient(160deg,#C8102E 0%,#6B0716 100%)`,
        padding:"36px 24px 30px", position:"relative", overflow:"hidden",
        flexShrink:0,
      }}>
        <div style={{position:"absolute",width:220,height:220,borderRadius:"50%",border:"1px solid rgba(255,255,255,.07)",top:-90,right:-70,pointerEvents:"none"}}/>
        <div style={{position:"absolute",width:160,height:160,borderRadius:"50%",border:"1px solid rgba(255,255,255,.05)",bottom:-60,left:-50,pointerEvents:"none"}}/>
        <div style={{fontSize:42,marginBottom:12,lineHeight:1}}>🗺️</div>
        <div style={{fontSize:23,fontWeight:900,color:"white",letterSpacing:.2}}>בחר את האזור שלך</div>
        <div style={{fontSize:13,color:"rgba(255,255,255,.65)",marginTop:6,lineHeight:1.55}}>כדי להציג לך מסעדות ומשלוחים בסביבתך</div>
      </div>

      {/* ── GPS button ── */}
      <div style={{padding:"20px 20px 0",flexShrink:0}}>
        <button
          className="addr-btn"
          onClick={detectGPS}
          disabled={busy}
          style={{
            width:"100%", border:"none", borderRadius:18, padding:0,
            background: busy ? "#F3F4F6" : `linear-gradient(135deg,${R},#9B0B22)`,
            boxShadow: busy ? "none" : "0 6px 22px rgba(200,16,46,.38)",
            cursor: busy ? "default" : "pointer", overflow:"hidden",
            transition:"all .22s", opacity: busy ? .85 : 1,
            fontFamily:"inherit",
          }}
        >
          <div style={{display:"flex",alignItems:"center",gap:14,padding:"15px 20px"}}>
            {/* icon */}
            <div style={{
              width:48,height:48,borderRadius:14,flexShrink:0,
              background: busy ? "#E5E7EB" : "rgba(255,255,255,.18)",
              display:"flex",alignItems:"center",justifyContent:"center",
            }}>
              {busy
                ? <div style={{width:22,height:22,borderRadius:"50%",border:"2.5px solid #D1D5DB",borderTopColor:R,animation:"addrSpin .75s linear infinite"}}/>
                : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" fill="white" stroke="none"/>
                    <line x1="12" y1="2" x2="12" y2="5"/>
                    <line x1="12" y1="19" x2="12" y2="22"/>
                    <line x1="2"  y1="12" x2="5"  y2="12"/>
                    <line x1="19" y1="12" x2="22" y2="12"/>
                    <circle cx="12" cy="12" r="8"/>
                  </svg>
              }
            </div>
            {/* text */}
            <div style={{flex:1,textAlign:"right"}}>
              <div style={{fontSize:15,fontWeight:900,color:busy?BLK:"white",lineHeight:1.2}}>
                {busy ? "מאתר מיקום..." : "זיהוי אוטומטי של המיקום שלי"}
              </div>
              <div style={{fontSize:11,color:busy?GRY:"rgba(255,255,255,.68)",marginTop:3}}>
                {busy ? "אנא המתן מספר שניות" : "GPS · מיידי · מעבר ישיר למסעדות"}
              </div>
            </div>
            {!busy && (
              <div style={{width:30,height:30,borderRadius:10,background:"rgba(255,255,255,.15)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            )}
          </div>
          {!busy && <div style={{height:3,background:"rgba(255,255,255,.18)"}}/>}
        </button>

        {err && (
          <div style={{marginTop:10,background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:12,padding:"10px 14px",display:"flex",gap:8,alignItems:"center",animation:"addrIn .25s both"}}>
            <span style={{fontSize:16,flexShrink:0}}>⚠️</span>
            <span style={{fontSize:12,color:"#DC2626",fontWeight:600,lineHeight:1.4}}>{err}</span>
          </div>
        )}
      </div>

      {/* ── divider ── */}
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"16px 20px 10px",flexShrink:0}}>
        <div style={{flex:1,height:1,background:"#E5E7EB"}}/>
        <span style={{fontSize:11,color:GRY,fontWeight:700}}>או בחר ידנית</span>
        <div style={{flex:1,height:1,background:"#E5E7EB"}}/>
      </div>

      {/* ── zone cards ── */}
      <div style={{flex:1,overflowY:"auto",padding:"0 20px 30px",display:"flex",flexDirection:"column",gap:10}}>
        {ZONES.map((z,i)=>(
          <button
            key={z.id}
            className="addr-btn"
            onMouseDown={()=>setTap(z.id)}
            onMouseUp={()=>setTap(null)}
            onTouchStart={()=>setTap(z.id)}
            onTouchEnd={()=>{setTap(null);onManual(z);}}
            onClick={()=>onManual(z)}
            style={{
              width:"100%",border:`2px solid ${tap===z.id?z.accent:"#E9EAEB"}`,
              borderRadius:18,padding:"14px 16px",cursor:"pointer",
              textAlign:"right",fontFamily:"inherit",
              background:tap===z.id?z.light:"white",
              display:"flex",alignItems:"center",gap:12,
              boxShadow: tap===z.id ? "0 8px 28px rgba(0,0,0,.1)" : "0 1px 5px rgba(0,0,0,.04)",
              transition:"all .18s",
              animation:`addrIn .35s ${i*.08}s both`,
            }}
          >
            <div style={{width:48,height:48,borderRadius:14,flexShrink:0,background:z.light,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>{z.emoji}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:900,color:BLK,marginBottom:3}}>{z.short}</div>
              <div style={{fontSize:11,color:GRY,lineHeight:1.45}}>{z.cities}</div>
            </div>
            <div style={{width:28,height:28,borderRadius:9,background:tap===z.id?z.accent:"#F3F4F6",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .18s",flexShrink:0}}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={tap===z.id?"white":"#9CA3AF"} strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   STEP 1 — Map Picker
══════════════════════════════════════════════════════════════════ */
const MAP_MAX = 300;
const MAP_MIN = 130;

function MapPicker({ zone, onChangeZone, onSave, cartCount=0 }) {
  const navigate   = useNavigate();
  const mapEl      = useRef(null);  // DOM node for Leaflet
  const map        = useRef(null);  // Leaflet map instance
  const circle     = useRef(null);  // zone boundary circle
  const userMarker = useRef(null);  // "אני כאן" marker
  const formEl     = useRef(null);  // scrollable form div
  const leafReady  = useRef(false);

  const lat = useRef(zone.lat);
  const lng = useRef(zone.lng);

  const [ready,    setReady]    = useState(false);
  const [dragging, setDragging] = useState(false);
  const [outside,  setOutside]  = useState(false);
  const [bouncing, setBouncing] = useState(false);
  const [address,  setAddress]  = useState("");
  const [addrLoad, setAddrLoad] = useState(false);
  const [toast,    setToast]    = useState("");
  const [mapH,     setMapH]     = useState(MAP_MAX);
  const [searchQ,  setSearchQ]  = useState("");
  const [sugs,     setSugs]     = useState([]);
  const [searching,setSearching]= useState(false);
  const searchTm   = useRef(null);
  const bounceTm   = useRef(null);

  // Form fields
  const [street,   setStreet]   = useState("");
  const [building, setBuilding] = useState("");
  const [floor,    setFloor]    = useState("");
  const [apt,      setApt]      = useState("");
  const [notes,    setNotes]    = useState("");
  const [locType,  setLocType]  = useState("בית");
  const [saving,   setSaving]   = useState(false);

  /* load Leaflet */
  useEffect(()=>{
    if (!document.querySelector('link[href*="leaflet"]')) {
      const el = document.createElement("link");
      el.rel = "stylesheet";
      el.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      document.head.appendChild(el);
    }
    if (window.L) { initMap(); return; }
    if (document.querySelector('script[src*="leaflet"]')) {
      const wait = setInterval(()=>{ if(window.L){clearInterval(wait);initMap();} },100);
      return ()=>clearInterval(wait);
    }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    s.onload = ()=> initMap();
    document.head.appendChild(s);
    return ()=>{ clearTimeout(bounceTm.current); clearTimeout(searchTm.current); };
  },[]);

  /* cleanup on unmount */
  useEffect(()=>{
    return ()=>{
      if (map.current) { map.current.remove(); map.current=null; }
      clearTimeout(bounceTm.current);
      clearTimeout(searchTm.current);
    };
  },[]);

  /* invalidate map size when height changes */
  useEffect(()=>{
    if (map.current) setTimeout(()=> map.current?.invalidateSize({ pan:false }),60);
  },[mapH]);

  /* scroll → shrink map */
  useEffect(()=>{
    const el = formEl.current;
    if (!el) return;
    const onScroll = ()=>{
      const h = Math.max(MAP_MIN, MAP_MAX - el.scrollTop * 1.5);
      setMapH(Math.round(h));
    };
    el.addEventListener("scroll", onScroll, { passive:true });
    return ()=> el.removeEventListener("scroll", onScroll);
  },[ready]);

  function initMap() {
    if (leafReady.current || !mapEl.current) return;
    leafReady.current = true;
    const L = window.L;

    const m = L.map(mapEl.current, {
      center:             [zone.lat, zone.lng],
      zoom:               15,
      zoomControl:        false,
      attributionControl: false,
      tap:                false,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      { maxZoom:19, crossOrigin:true }
    ).addTo(m);

    // draw zone boundary
    circle.current = L.circle([zone.lat, zone.lng], {
      radius:      zone.radius,
      color:       R,
      weight:      2.5,
      opacity:     0.5,
      fillColor:   R,
      fillOpacity: 0.06,
      dashArray:   "8 5",
      interactive: false,
    }).addTo(m);

    map.current = m;
    setReady(true);
    reverseGeo(zone.lat, zone.lng);

    /* ── map events ── */
    m.on("movestart", ()=> setDragging(true));
    m.on("moveend",   ()=> {
      setDragging(false);
      const c  = m.getCenter();
      const la = +c.lat.toFixed(7);
      const lo = +c.lng.toFixed(7);

      if (!inside(la, lo, zone)) {
        // bounce back
        setOutside(true); setBouncing(true);
        showToast("↩ חוזר לאזור " + zone.short.split("·")[0].trim());
        const d   = haversine(la,lo,zone.lat,zone.lng);
        const t   = (zone.radius * 1.05) / d;
        const bLa = zone.lat + (la - zone.lat) * t;
        const bLo = zone.lng + (lo - zone.lng) * t;
        bounceTm.current = setTimeout(()=>{
          m.flyTo([bLa,bLo], m.getZoom(), { animate:true, duration:.5, easeLinearity:.25 });
          lat.current = bLa; lng.current = bLo;
          setTimeout(()=>{ setOutside(false); setBouncing(false); reverseGeo(bLa,bLo); }, 560);
        }, 60);
      } else {
        lat.current = la; lng.current = lo;
        setOutside(false);
        reverseGeo(la, lo);
      }
    });

    // request GPS
    navigator.geolocation?.getCurrentPosition(
      ({ coords:{ latitude:ula, longitude:ulo } })=>{
        lat.current = ula; lng.current = ulo;
        placeUserMarker(ula, ulo, L, m);
        m.flyTo([ula, ulo], 16, { animate:true, duration:1 });
        reverseGeo(ula, ulo);
      },
      ()=>{}  // denied — no crash
    );
  }

  function placeUserMarker(la, lo, L, m) {
    userMarker.current?.remove();
    const icon = L.divIcon({
      className: "",
      html:`<div style="display:flex;flex-direction:column;align-items:center">
        <div style="
          background:${R};color:white;
          font-family:system-ui,Arial,sans-serif;
          font-size:11px;font-weight:800;
          padding:5px 11px 5px 9px;border-radius:20px;
          box-shadow:0 3px 14px rgba(200,16,46,.45);
          border:2px solid rgba(255,255,255,.55);
          display:flex;align-items:center;gap:5px;
          animation:addrPop .4s cubic-bezier(.34,1.5,.64,1) both;
          white-space:nowrap;
        "><span style="font-size:14px">🧭</span>אני כאן</div>
        <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:9px solid ${R};margin-top:-1px"></div>
        <div style="width:12px;height:12px;border-radius:50%;background:#3B82F6;border:2.5px solid white;box-shadow:0 2px 8px rgba(59,130,246,.55);margin-top:2px;position:relative;">
          <div style="position:absolute;inset:-5px;border-radius:50%;background:rgba(59,130,246,.18);animation:addrPulse 2s ease-out infinite"></div>
        </div>
      </div>`,
      iconSize:   [100, 62],
      iconAnchor: [50,  62],
    });
    userMarker.current = L.marker([la,lo], { icon, zIndexOffset:700, interactive:false }).addTo(m);
  }

  async function reverseGeo(la, lo) {
    setAddrLoad(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${la}&lon=${lo}&format=json`,
        { headers:{ "Accept-Language":"he" } }
      );
      const j = await res.json();
      const a = j.address || {};
      const road = a.road || a.pedestrian || a.suburb || "";
      const city = a.city || a.town || a.village || "";
      const num  = a.house_number || "";
      const full = [road + (num?" "+num:""), city].filter(Boolean).join(", ");
      setAddress(full || j.display_name?.split(",")[0] || "מיקום נבחר");
      if (road) setStreet(road + (num?" "+num:""));
    } catch { setAddress("מיקום נבחר"); }
    setAddrLoad(false);
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(()=> setToast(""), 2500);
  }

  function goToMyLoc() {
    navigator.geolocation?.getCurrentPosition(({ coords:{ latitude:la, longitude:lo } })=>{
      placeUserMarker(la, lo, window.L, map.current);
      map.current?.flyTo([la,lo], 17, { animate:true, duration:.7 });
      lat.current=la; lng.current=lo;
      setOutside(false);
      reverseGeo(la, lo);
    });
  }

  function doSearch(q) {
    setSearchQ(q);
    clearTimeout(searchTm.current);
    if (!q.trim()) { setSugs([]); return; }
    searchTm.current = setTimeout(async ()=>{
      setSearching(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q+" ישראל")}&format=json&limit=5&accept-language=he`);
        setSugs((await res.json()).slice(0,4));
      } catch {}
      setSearching(false);
    }, 480);
  }

  function pickSuggestion(s) {
    const la=+s.lat, lo=+s.lon;
    setSugs([]); setSearchQ(s.display_name.split(",")[0]);
    if (!ZONES.some(z=> inside(la,lo,z))) { showToast("🚫 כתובת זו מחוץ לאזורי השירות"); return; }
    map.current?.flyTo([la,lo], 17, { animate:true, duration:.6 });
    lat.current=la; lng.current=lo;
    setOutside(false);
    setAddress(s.display_name.split(",")[0]);
  }

  async function handleSave() {
    setSaving(true);
    await new Promise(ok=> setTimeout(ok,300));
    const addrParts = [street, building?`בניין ${building}`:"", floor?`קומה ${floor}`:"", apt?`דירה ${apt}`:""].filter(Boolean);
    onSave({
      address: addrParts.join(", ") || address,
      coords:  { lat: lat.current, lng: lng.current },
      zone, id:zone.id, short:zone.short, name:zone.nameHe,
      lat:zone.lat, lng:zone.lng, radius:zone.radius,
      type:locType, notes,
    });
    navigate(-1);
    setSaving(false);
  }

  const bad = outside || bouncing;
  const canSave = ready && !bad;
  const INP = {
    width:"100%", border:"1.5px solid #E5E7EB", borderRadius:11,
    padding:"12px 14px", fontSize:14, outline:"none",
    background:"white", textAlign:"right", fontFamily:"inherit",
    boxSizing:"border-box", color:BLK, direction:"rtl",
    transition:"border-color .15s, box-shadow .15s",
  };
  const focus = e=>{ e.target.style.borderColor=R; e.target.style.boxShadow=`0 0 0 3px rgba(200,16,46,.09)`; };
  const blur  = e=>{ e.target.style.borderColor="#E5E7EB"; e.target.style.boxShadow="none"; };

  return (
    <div style={{
      position:"fixed", inset:0,
      display:"flex", flexDirection:"column",
      fontFamily:"system-ui,Arial,sans-serif", direction:"rtl",
      background:"white", zIndex:200,
      maxWidth:430, margin:"0 auto",
    }}>
      <style>{GLOBAL_CSS}</style>

      {/* ── HEADER ── */}
      <div style={{
        flexShrink:0, background:"white",
        padding:"10px 16px",
        borderBottom:"1px solid #F0F0F0",
        display:"flex", alignItems:"center", gap:12, zIndex:20,
      }}>
        <button onClick={()=> navigate(-1)} style={{ width:38,height:38,borderRadius:12,background:"#F3F4F6",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={BLK} strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>

        <div style={{flex:1, textAlign:"center"}}>
          <div style={{fontSize:15,fontWeight:900,color:BLK}}>פרטי מיקום</div>
          <div style={{
            fontSize:10, fontWeight:700, marginTop:2,
            color: bad ? "#EF4444" : zone ? "#16A34A" : GRY,
            transition:"color .3s",
          }}>
            {bouncing ? "↩ חוזר לאזור..." : outside ? "⚠ מחוץ לאזור השירות" : `✓ ${zone.short.split("·")[0].trim()}`}
          </div>
        </div>

        <button
          onClick={onChangeZone}
          style={{fontSize:10,fontWeight:800,color:R,background:"rgba(200,16,46,.07)",border:"none",borderRadius:10,padding:"5px 10px",cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}
        >שנה אזור</button>
      </div>

      {/* ── SEARCH BAR ── */}
      <div style={{flexShrink:0, background:"white", padding:"8px 14px 10px", borderBottom:"1px solid #F0F0F0", position:"relative", zIndex:19}}>
        <div style={{display:"flex",alignItems:"center",background:"#F3F4F6",borderRadius:14,padding:"0 14px",border:"1.5px solid #EBEBEB"}}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={GRY} strokeWidth="2">
            <circle cx="11" cy="11" r="7.5"/><path d="M17 17l3.5 3.5" strokeLinecap="round"/>
          </svg>
          <input
            value={searchQ} onChange={e=> doSearch(e.target.value)}
            placeholder="חיפוש רחוב או כתובת"
            style={{flex:1,background:"none",border:"none",outline:"none",padding:"10px 10px",fontSize:13,textAlign:"right",fontFamily:"inherit",color:BLK,direction:"rtl"}}
          />
          {searching
            ? <div style={{width:14,height:14,borderRadius:"50%",border:"2px solid #eee",borderTopColor:R,animation:"addrSpin .7s linear infinite",flexShrink:0}}/>
            : searchQ
              ? <button onClick={()=>{setSearchQ("");setSugs([]);}} style={{background:"none",border:"none",cursor:"pointer",padding:"0 2px",color:GRY2,fontSize:16,lineHeight:1}}>×</button>
              : null
          }
        </div>

        {sugs.length>0 && (
          <div style={{position:"absolute",top:"100%",left:14,right:14,background:"white",borderRadius:16,boxShadow:"0 12px 40px rgba(0,0,0,.13)",border:"1px solid #E5E7EB",overflow:"hidden",zIndex:100,animation:"addrSlide .2s both"}}>
            {sugs.map((s,i)=>{
              const la=+s.lat,lo=+s.lon,ok=ZONES.some(z=>inside(la,lo,z));
              return (
                <button key={i} onClick={()=> pickSuggestion(s)} style={{width:"100%",background:"none",border:"none",padding:"11px 16px",textAlign:"right",cursor:"pointer",display:"flex",alignItems:"center",gap:10,borderBottom:i<sugs.length-1?"1px solid #F5F5F7":"none",fontFamily:"inherit"}}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill={ok?R:"#D1D5DB"} style={{flexShrink:0}}>
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                  </svg>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:BLK}}>{s.display_name.split(",")[0]}</div>
                    <div style={{fontSize:10,color:GRY}}>{s.display_name.split(",").slice(1,3).join(",")}</div>
                  </div>
                  {!ok && <span style={{fontSize:9,color:"#EF4444",fontWeight:700,background:"#FEF2F2",padding:"2px 7px",borderRadius:6}}>מחוץ לאזור</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MAP ── */}
      <div style={{position:"relative", height:mapH, flexShrink:0, transition:"height .22s ease", zIndex:1}}>

        {/* Leaflet container */}
        <div ref={mapEl} style={{position:"absolute", inset:0}}/>

        {/* Loading overlay */}
        {!ready && (
          <div style={{position:"absolute",inset:0,background:"rgba(255,255,255,.92)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,zIndex:10}}>
            <div style={{width:40,height:40,borderRadius:"50%",border:`3px solid rgba(200,16,46,.15)`,borderTopColor:R,animation:"addrSpin .8s linear infinite"}}/>
            <span style={{color:GRY,fontSize:13,fontWeight:600}}>טוען מפה...</span>
          </div>
        )}

        {/* ── CENTER PIN (crosshair style) ── */}
        {ready && (
          <div style={{
            position:"absolute", top:"50%", left:"50%",
            transform:"translate(-50%, -50%)",
            zIndex:5, pointerEvents:"none",
          }}>
            {/* crosshair arms */}
            <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:52,height:52}}>
              <div style={{position:"absolute",top:"50%",left:0,right:0,height:1.5,background:bad?"#EF4444":R,transform:"translateY(-50%)",opacity:.7}}/>
              <div style={{position:"absolute",left:"50%",top:0,bottom:0,width:1.5,background:bad?"#EF4444":R,transform:"translateX(-50%)",opacity:.7}}/>
            </div>

            {/* center dot */}
            <div style={{
              width:14, height:14, borderRadius:"50%",
              background: bad ? "#EF4444" : "white",
              border:`3px solid ${bad?"#EF4444":R}`,
              boxShadow:`0 0 0 4px rgba(200,16,46,.15), 0 2px 8px rgba(0,0,0,.2)`,
              transition:"background .2s, border-color .2s",
            }}/>

            {/* address label */}
            <div style={{
              position:"absolute",
              bottom:"calc(100% + 10px)",
              left:"50%",
              transform:`translateX(-50%) ${dragging?"scale(.9)":"scale(1)"}`,
              transition:"transform .18s cubic-bezier(.34,1.4,.64,1), opacity .15s",
              opacity: dragging ? .7 : 1,
              whiteSpace:"nowrap",
            }}>
              <div style={{
                background: bad ? "#EF4444" : "white",
                border:`1.5px solid ${bad?"#EF4444":"rgba(200,16,46,.2)"}`,
                borderRadius:20, padding:"5px 13px",
                fontSize:11, fontWeight:800,
                color: bad ? "white" : BLK,
                boxShadow:"0 3px 14px rgba(0,0,0,.1)",
                maxWidth:210, overflow:"hidden", textOverflow:"ellipsis",
                display:"flex", alignItems:"center", gap:5,
              }}>
                <span style={{fontSize:12}}>{bad?"🚫":"📍"}</span>
                <span>{addrLoad ? "מחפש..." : bad ? "מחוץ לאזור" : (address.split(",")[0]||"מיקום נבחר")}</span>
              </div>
              {/* little triangle */}
              <div style={{width:0,height:0,borderLeft:"6px solid transparent",borderRight:"6px solid transparent",borderTop:`8px solid ${bad?"#EF4444":"white"}`,margin:"0 auto",filter:"drop-shadow(0 1px 1px rgba(0,0,0,.07))"}}/>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div style={{position:"absolute",top:10,left:"50%",transform:"translateX(-50%)",zIndex:15,background:"rgba(17,24,39,.85)",backdropFilter:"blur(6px)",borderRadius:14,padding:"8px 18px",color:"white",fontSize:11,fontWeight:800,whiteSpace:"nowrap",boxShadow:"0 4px 20px rgba(0,0,0,.2)",animation:"addrSlide .25s both"}}>
            {toast}
          </div>
        )}

        {/* My location FAB */}
        <button onClick={goToMyLoc} style={{position:"absolute",right:12,bottom:48,zIndex:10,width:40,height:40,background:"white",border:"none",borderRadius:"50%",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 3px 14px rgba(0,0,0,.16)"}}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={R} strokeWidth="2.2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3" fill={R} stroke="none"/>
            <line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/>
            <line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/>
            <circle cx="12" cy="12" r="8"/>
          </svg>
        </button>

        {/* Zoom */}
        <div style={{position:"absolute",right:12,top:12,zIndex:10,display:"flex",flexDirection:"column",gap:4}}>
          {[["+",1],["-",-1]].map(([l,d])=>(
            <button key={l} onClick={()=> map.current?.setZoom((map.current.getZoom()||14)+d)} style={{width:34,height:34,background:"white",border:"1px solid rgba(0,0,0,.07)",borderRadius:9,fontSize:18,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(0,0,0,.09)",color:BLK}}>{l}</button>
          ))}
        </div>

        {/* Drag hint bar */}
        <div style={{position:"absolute",bottom:0,left:0,right:0,zIndex:10,background:"rgba(17,24,39,.72)",backdropFilter:"blur(5px)",padding:"7px 16px",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.6)" strokeWidth="1.8"><path d="M5 9l7-7 7 7M5 15l7 7 7-7"/></svg>
          <span style={{color:"white",fontSize:10,fontWeight:600}}>גרור את המפה למיקום המדויק</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.6)" strokeWidth="1.8"><path d="M5 9l7-7 7 7M5 15l7 7 7-7"/></svg>
        </div>
      </div>

      {/* ── FORM SHEET ── */}
      <div ref={formEl} style={{flex:1, overflowY:"auto", background:"white", borderRadius:"24px 24px 0 0", marginTop:-18, zIndex:2, boxShadow:"0 -6px 28px rgba(0,0,0,.08)", position:"relative"}}>

        {/* Handle */}
        <div style={{padding:"10px 0 2px", display:"flex", justifyContent:"center", position:"sticky", top:0, background:"white", zIndex:5, paddingBottom:6}}>
          <div style={{width:36,height:4,background:"#E5E7EB",borderRadius:2}}/>
        </div>

        {/* Sheet header */}
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"6px 16px 14px"}}>
          <div style={{width:34,height:34,background:"rgba(200,16,46,.07)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill={R}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:900,color:BLK}}>פרטי כתובת</div>
            <div style={{fontSize:10,color:GRY,marginTop:1}}>הזן את פרטי הכתובת שלך</div>
          </div>
          {!bad && (
            <div style={{background:"#DCFCE7",borderRadius:20,padding:"4px 11px",display:"flex",alignItems:"center",gap:4}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:"#16A34A"}}/>
              <span style={{fontSize:9,fontWeight:800,color:"#16A34A"}}>{zone.short.split("·")[0].trim()}</span>
            </div>
          )}
        </div>

        <div style={{padding:"0 16px 30px"}}>

          {/* Zone field */}
          <div style={{marginBottom:10}}>
            <div style={{fontSize:11,fontWeight:700,color:GRY,marginBottom:5}}>אזור</div>
            <button onClick={onChangeZone} style={{width:"100%",display:"flex",alignItems:"center",background:"#F9FAFB",border:"1.5px solid #E5E7EB",borderRadius:12,padding:"12px 14px",cursor:"pointer",fontFamily:"inherit",textAlign:"right"}}>
              <span style={{flex:1,fontSize:14,fontWeight:700,color:BLK}}>{zone.short}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={R} strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>

          {/* Street */}
          <div style={{marginBottom:10}}>
            <div style={{fontSize:11,fontWeight:700,color:GRY,marginBottom:5}}>שם רחוב</div>
            <input style={INP} value={street} onChange={e=>setStreet(e.target.value)} placeholder="שם הרחוב ומספר הבית" onFocus={focus} onBlur={blur}/>
          </div>

          {/* Building / Floor / Apt */}
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            {[
              {l:"מספר בניין",v:building,s:setBuilding,p:"בניין"},
              {l:"קומה",       v:floor,   s:setFloor,   p:"קומה", t:"number"},
              {l:"דירה",       v:apt,     s:setApt,     p:"דירה"},
            ].map(f=>(
              <div key={f.l} style={{flex:1}}>
                <div style={{fontSize:11,fontWeight:700,color:GRY,marginBottom:5}}>{f.l}</div>
                <input style={INP} value={f.v} type={f.t||"text"} onChange={e=>f.s(e.target.value)} placeholder={f.p} onFocus={focus} onBlur={blur}/>
              </div>
            ))}
          </div>

          {/* Location type */}
          <div style={{marginBottom:10}}>
            <div style={{fontSize:11,fontWeight:700,color:GRY,marginBottom:7}}>סוג מיקום</div>
            <div style={{display:"flex",gap:7}}>
              {[{k:"בית",e:"🏠"},{k:"משרד",e:"🏢"},{k:"מיקום אחר",e:"📍"}].map(t=>(
                <button key={t.k} onClick={()=>setLocType(t.k)} style={{flex:1,padding:"10px 4px",borderRadius:14,cursor:"pointer",border:`2px solid ${locType===t.k?R:"#E5E7EB"}`,background:locType===t.k?"rgba(200,16,46,.06)":"white",color:locType===t.k?R:GRY,fontSize:10,fontWeight:700,display:"flex",flexDirection:"column",alignItems:"center",gap:4,transition:"all .18s",fontFamily:"inherit"}}>
                  <span style={{fontSize:20}}>{t.e}</span>{t.k}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div style={{marginBottom:20}}>
            <div style={{fontSize:11,fontWeight:700,color:GRY,marginBottom:5}}>הוראות לשליח</div>
            <div style={{display:"flex",gap:8,background:"#F9FAFB",borderRadius:13,padding:"10px 13px",border:"1.5px solid #E5E7EB"}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GRY} strokeWidth="1.8" style={{flexShrink:0,marginTop:2}}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="לדוגמה: ליד סניף הדואר הראשי..." style={{flex:1,background:"none",border:"none",outline:"none",resize:"none",fontSize:12,fontFamily:"inherit",color:BLK,minHeight:42,textAlign:"right",direction:"rtl"}}/>
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            style={{
              width:"100%",
              background: !canSave ? "#D1D5DB" : saving ? GRY : `linear-gradient(135deg,${R},#9B0B22)`,
              border:"none", borderRadius:18, padding:"16px",
              color:"white", fontSize:15, fontWeight:900,
              cursor: !canSave||saving ? "not-allowed" : "pointer",
              boxShadow: canSave&&!saving ? `0 5px 22px rgba(200,16,46,.38)` : "none",
              display:"flex", alignItems:"center", justifyContent:"center", gap:10,
              transition:"all .22s", fontFamily:"inherit",
            }}
          >
            {saving
              ? <><div style={{width:18,height:18,borderRadius:"50%",border:"2.5px solid rgba(255,255,255,.4)",borderTopColor:"white",animation:"addrSpin .7s linear infinite"}}/>שומר...</>
              : bad ? "⛔ מחוץ לאזור השירות" : "להמשיך ←"
            }
          </button>
        </div>
      </div>

      {/* ── BOTTOM NAV ── */}
      <div style={{flexShrink:0,background:"white",borderTop:"1px solid #F0F0F0",zIndex:20}}>
        <BottomNav cartCount={cartCount}/>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ROOT EXPORT
══════════════════════════════════════════════════════════════════ */
export default function AddressPickerPage({ onAddressSave, initialZone, cartCount=0 }) {
  const navigate  = useNavigate();
  const startZone = resolve(initialZone);

  const [step, setStep] = useState(startZone ? 1 : 0);
  const [zone, setZone] = useState(startZone);

  /* auto-detect: GPS → save zone → jump to restaurants */
  function handleAutoDetect(la, lo) {
    const z = nearest(la, lo);
    onAddressSave?.({
      address:"", coords:{lat:la,lng:lo},
      zone:z, id:z.id, short:z.short, name:z.nameHe,
      lat:z.lat, lng:z.lng, radius:z.radius,
      type:"בית", notes:"",
    });
    navigate("/");
  }

  function handleManualPick(z) {
    setZone(z);
    setStep(1);
  }

  function handleChangeZone() {
    setStep(0);
  }

  function handleSave(data) {
    onAddressSave?.(data);
  }

  if (step === 0) {
    return <ZoneSelector onManual={handleManualPick} onAuto={handleAutoDetect}/>;
  }

  return (
    <MapPicker
      key={zone.id}
      zone={zone}
      cartCount={cartCount}
      onChangeZone={handleChangeZone}
      onSave={handleSave}
    />
  );
}
