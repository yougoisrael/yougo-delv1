// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  AddressPickerPage.jsx
//  صفحة واحدة: خريطة فوق + نموذج من تحت
//  مثل HAAT بتصميم Yougo
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const RED  = "#C8102E";
const DARK = "#111827";
const GRAY = "#6B7280";
const LIGHT = "#F9FAFB";

const ZONES = [
  { id:"east",   nameHe:"ראמה, סאגור, שזור",    subHe:"עין אל-אסד, עראבה, סחנין, מגאר", lat:32.9078, lng:35.3524, radius:6500 },
  { id:"center", nameHe:"כרמיאל - נחף - בעינה", subHe:"דיר אל-אסד, מגד אל-כרום",        lat:32.9178, lng:35.2999, radius:5000 },
  { id:"north",  nameHe:"פקיעין - חורפיש - כסרה",subHe:"בית ג'ן, כסרה-סמיע",             lat:32.9873, lng:35.3220, radius:5500 },
];

function distM(a,b,c,d){
  const R=6371000,dL=((c-a)*Math.PI)/180,dG=((d-b)*Math.PI)/180;
  const x=Math.sin(dL/2)**2+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(dG/2)**2;
  return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}
const inZ=(lat,lng,z)=>distM(lat,lng,z.lat,z.lng)<=z.radius*1.15;

function getNearestZone(lat,lng){
  return ZONES.reduce((best,z)=>distM(lat,lng,z.lat,z.lng)<distM(lat,lng,best.lat,best.lng)?z:best,ZONES[0]);
}

function loadL(cb){
  if(window.L){cb();return;}
  const c=Object.assign(document.createElement("link"),{rel:"stylesheet",href:"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"});
  document.head.appendChild(c);
  const s=Object.assign(document.createElement("script"),{src:"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js",onload:cb});
  document.head.appendChild(s);
}

export default function AddressPickerPage({ onAddressSave, initialZone }) {
  const navigate = useNavigate();
  const mapRef   = useRef(null);
  const leafRef  = useRef(null);
  const debRef   = useRef(null);
  const coordsRef= useRef({ lat: initialZone?.lat || 32.9178, lng: initialZone?.lng || 35.2999 });

  const [ready,    setReady]    = useState(false);
  const [address,  setAddress]  = useState("מחפש כתובת...");
  const [zone,     setZone]     = useState(initialZone || null);
  const [loading,  setLoading]  = useState(false);
  const [outZone,  setOutZone]  = useState(false);
  const [shake,    setShake]    = useState(false);
  const [pinAnim,  setPinAnim]  = useState(false); // pin bounce on moveend
  const [searchQ,  setSearchQ]  = useState("");
  const [sugs,     setSugs]     = useState([]);
  const [searching,setSearching]= useState(false);
  const [sheetOpen,setSheetOpen]= useState(false); // bottom sheet expanded

  // form state
  const [street,   setStreet]   = useState("");
  const [building, setBuilding] = useState("");
  const [floor,    setFloor]    = useState("");
  const [apt,      setApt]      = useState("");
  const [notes,    setNotes]    = useState("");
  const [type,     setType]     = useState("בית");
  const [saving,   setSaving]   = useState(false);

  useEffect(() => { loadL(() => setReady(true)); }, []);

  useEffect(() => {
    if (!ready || !mapRef.current || leafRef.current) return;
    const L = window.L;
    const startLat = coordsRef.current.lat;
    const startLng = coordsRef.current.lng;

    const map = L.map(mapRef.current, {
      center: [startLat, startLng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 19, crossOrigin: true,
    }).addTo(map);

    leafRef.current = map;

    // Draw all zone circles (subtle)
    ZONES.forEach(z => {
      L.circle([z.lat, z.lng], {
        radius: z.radius,
        color: RED,
        weight: 1.5,
        opacity: 0.25,
        fillColor: RED,
        fillOpacity: 0.04,
        dashArray: "6,5",
      }).addTo(map);
    });

    // Get user location
    navigator.geolocation?.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        coordsRef.current = { lat, lng };
        map.setView([lat, lng], 16);
        const nearest = getNearestZone(lat, lng);
        setZone(nearest);
        const ok = inZ(lat, lng, nearest);
        setOutZone(!ok);
        if (ok) rev(lat, lng);
        else setAddress("מחוץ לאזור השירות");
      },
      () => rev(startLat, startLng)
    );

    map.on("movestart", () => setPinAnim(true));
    map.on("moveend", () => {
      const { lat, lng } = map.getCenter();
      coordsRef.current = { lat, lng };
      const nearest = getNearestZone(lat, lng);
      setZone(nearest);
      const ok = inZ(lat, lng, nearest);
      setOutZone(!ok);
      setPinAnim(false);
      if (ok) rev(lat, lng);
      else { doShake(); setAddress("מחוץ לאזור השירות"); }
    });

    return () => { map.remove(); leafRef.current = null; };
  }, [ready]);

  async function rev(lat, lng) {
    setLoading(true);
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { "Accept-Language": "he" } }
      );
      const d = await r.json(), a = d.address || {};
      const st  = a.road || a.pedestrian || a.suburb || "";
      const city = a.city || a.town || a.village || "";
      const num  = a.house_number || "";
      const full = `${st}${num ? " " + num : ""}${city ? ", " + city : ""}`.trim();
      const result = full || d.display_name?.split(",")[0] || "מיקום נבחר";
      setAddress(result);
      if (st) setStreet(`${st}${num ? " " + num : ""}`);
    } catch { setAddress("מיקום נבחר"); }
    setLoading(false);
  }

  function doShake() { setShake(true); setTimeout(() => setShake(false), 500); }

  function handleSearch(v) {
    setSearchQ(v);
    clearTimeout(debRef.current);
    if (!v.trim()) { setSugs([]); return; }
    debRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(v + " ישראל")}&format=json&limit=5&accept-language=he`
        );
        setSugs((await r.json()).slice(0, 4));
      } catch {}
      setSearching(false);
    }, 500);
  }

  function pickSug(s) {
    const lat = parseFloat(s.lat), lng = parseFloat(s.lon);
    setSugs([]); setSearchQ(s.display_name.split(",")[0]);
    if (!inZ(lat, lng, ZONES[0]) && !inZ(lat, lng, ZONES[1]) && !inZ(lat, lng, ZONES[2])) {
      doShake(); setOutZone(true); return;
    }
    leafRef.current?.setView([lat, lng], 17);
    coordsRef.current = { lat, lng };
    const nearest = getNearestZone(lat, lng);
    setZone(nearest); setOutZone(false);
    setAddress(s.display_name.split(",")[0]);
  }

  function myLoc() {
    navigator.geolocation?.getCurrentPosition(pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      leafRef.current?.setView([lat, lng], 17);
      coordsRef.current = { lat, lng };
      const nearest = getNearestZone(lat, lng);
      setZone(nearest);
      const ok = inZ(lat, lng, nearest);
      setOutZone(!ok);
      if (ok) rev(lat, lng); else { doShake(); setAddress("מחוץ לאזור השירות"); }
    });
  }

  async function handleSave() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 300));
    const addr = [street, building ? `בניין ${building}` : "", floor ? `קומה ${floor}` : "", apt ? `דירה ${apt}` : ""].filter(Boolean).join(", ");
    onAddressSave?.({ address: addr || address, coords: coordsRef.current, zone, type, notes });
    navigate(-1);
    setSaving(false);
  }

  const INP = {
    width: "100%", border: "1px solid #E5E7EB", borderRadius: 12,
    padding: "12px 14px", fontSize: 14, outline: "none",
    background: "white", textAlign: "right", fontFamily: "Arial,sans-serif",
    boxSizing: "border-box", color: DARK, direction: "rtl",
  };
  const fo = e => { e.target.style.borderColor = RED; e.target.style.boxShadow = `0 0 0 3px rgba(200,16,46,0.1)`; };
  const bl = e => { e.target.style.borderColor = "#E5E7EB"; e.target.style.boxShadow = "none"; };

  // Map height: taller when sheet is collapsed
  const MAP_H = sheetOpen ? "38vh" : "52vh";

  return (
    <div style={{ position: "fixed", inset: 0, background: "#F7F7F8", fontFamily: "Arial,sans-serif", direction: "rtl", display: "flex", flexDirection: "column", zIndex: 200, maxWidth: 430, margin: "0 auto" }}>

      {/* ── Header ── */}
      <div style={{ background: "white", padding: "10px 16px", borderBottom: "1px solid #F0F0F0", display: "flex", alignItems: "center", gap: 12, flexShrink: 0, zIndex: 600 }}>
        <button onClick={() => navigate(-1)} style={{ width: 38, height: 38, borderRadius: 12, background: LIGHT, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: DARK }}>פרטי מיקום</div>
          {zone && <div style={{ fontSize: 10, color: outZone ? "#EF4444" : "#16A34A", marginTop: 1, fontWeight: 700 }}>{outZone ? "⚠️ מחוץ לאזור" : `✓ ${zone.nameHe.split(",")[0]}`}</div>}
        </div>
        <div style={{ width: 38 }} />
      </div>

      {/* ── Search bar ── */}
      <div style={{ background: "white", padding: "8px 14px", borderBottom: "1px solid #F0F0F0", position: "relative", flexShrink: 0, zIndex: 500 }}>
        <div style={{ display: "flex", alignItems: "center", background: LIGHT, borderRadius: 14, padding: "0 14px", border: "1px solid #E5E7EB" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GRAY} strokeWidth="2"><circle cx="11" cy="11" r="7.5"/><path d="M17 17l3.5 3.5" strokeLinecap="round"/></svg>
          <input
            value={searchQ}
            onChange={e => handleSearch(e.target.value)}
            placeholder="חיפוש או הזנת כתובת"
            style={{ flex: 1, background: "none", border: "none", outline: "none", padding: "10px 10px", fontSize: 13, textAlign: "right", fontFamily: "Arial,sans-serif", color: DARK, direction: "rtl" }}
          />
          {searching
            ? <div style={{ width: 15, height: 15, borderRadius: "50%", border: `2px solid rgba(200,16,46,0.2)`, borderTopColor: RED, animation: "yg-spin 0.7s linear infinite", flexShrink: 0 }} />
            : searchQ
              ? <button onClick={() => { setSearchQ(""); setSugs([]); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: GRAY, fontSize: 14 }}>✕</button>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill={RED} style={{ flexShrink: 0 }}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          }
        </div>
        {sugs.length > 0 && (
          <div style={{ position: "absolute", top: "100%", left: 14, right: 14, background: "white", borderRadius: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.15)", border: "1px solid #E5E7EB", overflow: "hidden", zIndex: 1000 }}>
            {sugs.map((s, i) => {
              const slat = parseFloat(s.lat), slng = parseFloat(s.lon);
              const inside = ZONES.some(z => inZ(slat, slng, z));
              return (
                <button key={i} onClick={() => pickSug(s)} style={{ width: "100%", background: "none", border: "none", padding: "11px 16px", textAlign: "right", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, borderBottom: i < sugs.length - 1 ? "1px solid #F3F4F6" : "none", fontFamily: "Arial,sans-serif" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill={inside ? RED : GRAY} style={{ flexShrink: 0 }}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{s.display_name.split(",")[0]}</div>
                    <div style={{ fontSize: 10, color: GRAY }}>{s.display_name.split(",").slice(1, 3).join(",")}</div>
                  </div>
                  {!inside && <span style={{ fontSize: 9, color: "#EF4444", fontWeight: 700, background: "#FEF2F2", padding: "2px 6px", borderRadius: 6 }}>מחוץ לאזור</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Map ── */}
      <div style={{ position: "relative", height: MAP_H, flexShrink: 0, transition: "height 0.35s cubic-bezier(0.4,0,0.2,1)" }}>
        <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

        {!ready && (
          <div style={{ position: "absolute", inset: 0, background: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, zIndex: 200 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", border: `3px solid rgba(200,16,46,0.15)`, borderTopColor: RED, animation: "yg-spin 0.8s linear infinite" }} />
            <span style={{ color: GRAY, fontSize: 13 }}>טוען מפה...</span>
          </div>
        )}

        {/* Center pin */}
        {ready && (
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: `translate(-50%, ${pinAnim ? "-120%" : "-100%"})`, zIndex: 1000, pointerEvents: "none", transition: "transform 0.15s ease", filter: outZone ? "none" : "drop-shadow(0 4px 10px rgba(200,16,46,0.4))" }}>
            <div style={{ width: 44, height: 44, background: outZone ? "#EF4444" : "white", border: `3px solid ${outZone ? "#EF4444" : RED}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, animation: shake ? "yg-shake 0.45s ease" : "none", transition: "background 0.25s, border-color 0.25s" }}>
              {outZone ? "🚫" : "📍"}
            </div>
            <div style={{ width: 0, height: 0, borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderTop: `12px solid ${outZone ? "#EF4444" : RED}`, margin: "0 auto" }} />
            <div style={{ width: 12, height: 4, background: "rgba(0,0,0,0.15)", borderRadius: "50%", margin: "2px auto", filter: "blur(1.5px)" }} />
          </div>
        )}

        {/* "אתה כאן" label */}
        {ready && !outZone && (
          <div style={{ position: "absolute", top: "calc(50% - 72px)", left: "50%", transform: "translateX(-50%)", zIndex: 999, pointerEvents: "none" }}>
            <div style={{ background: RED, color: "white", fontSize: 12, fontWeight: 900, padding: "5px 14px", borderRadius: 20, whiteSpace: "nowrap", boxShadow: `0 3px 12px rgba(200,16,46,0.4)` }}>
              {loading ? "מחפש..." : address.split(",")[0]}
            </div>
            <div style={{ width: 0, height: 0, borderLeft: "7px solid transparent", borderRight: "7px solid transparent", borderTop: `8px solid ${RED}`, margin: "0 auto" }} />
          </div>
        )}

        {/* Out of zone banner */}
        {outZone && (
          <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 1000, background: "white", border: "1.5px solid #FCA5A5", borderRadius: 16, padding: "9px 16px", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 16px rgba(239,68,68,0.2)", whiteSpace: "nowrap" }}>
            <span style={{ fontSize: 16 }}>😕</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#DC2626" }}>אזור זה עדיין לא בשירות שלנו</div>
              <div style={{ fontSize: 10, color: GRAY, marginTop: 1 }}>גרור את המפה לאזור השירות</div>
            </div>
          </div>
        )}

        {/* My location button */}
        <button onClick={myLoc} style={{ position: "absolute", left: 12, bottom: 16, zIndex: 900, width: 42, height: 42, background: "white", border: "none", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.18)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>
            <circle cx="12" cy="12" r="9" strokeDasharray="2 2"/>
          </svg>
        </button>

        {/* Zoom */}
        <div style={{ position: "absolute", left: 12, top: 12, zIndex: 900, display: "flex", flexDirection: "column", gap: 5 }}>
          {[["+", 1], ["-", -1]].map(([l, d]) => (
            <button key={l} onClick={() => leafRef.current?.setZoom((leafRef.current.getZoom() || 14) + d)} style={{ width: 36, height: 36, background: "white", border: "1px solid #E5E7EB", borderRadius: 9, fontSize: 17, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.1)", color: DARK }}>{l}</button>
          ))}
        </div>

        {/* Drag hint */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 800, background: "rgba(17,24,39,0.82)", padding: "9px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ color: "white", fontSize: 12, fontWeight: 600 }}>גרור את הסיכה למיקום המדויק לשליחת ההזמנה</span>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5"><path d="M5 9l7-7 7 7M5 15l7 7 7-7"/></svg>
        </div>
      </div>

      {/* ── Bottom sheet — address form ── */}
      <div style={{ flex: 1, overflowY: "auto", background: "white", borderRadius: "20px 20px 0 0", marginTop: -20, position: "relative", zIndex: 300, boxShadow: "0 -6px 24px rgba(0,0,0,0.1)" }}>

        {/* Pull handle */}
        <div onClick={() => setSheetOpen(p => !p)} style={{ padding: "12px 0 0", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ width: 40, height: 4, background: "#E5E7EB", borderRadius: 2 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 4 }}>
            <div style={{ width: 32, height: 32, background: `rgba(200,16,46,0.08)`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill={RED}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, color: DARK }}>פרטי כתובת</div>
              <div style={{ fontSize: 10, color: GRAY }}>הזן את פרטי הכתובת שלך</div>
            </div>
          </div>
        </div>

        <div style={{ padding: "4px 16px 16px" }}>

          {/* Zone + street — read-only display */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {zone && (
              <div style={{ flex: 1, background: LIGHT, borderRadius: 12, padding: "10px 12px", border: "1px solid #E5E7EB" }}>
                <div style={{ fontSize: 9, color: GRAY, fontWeight: 700, marginBottom: 3 }}>אזור</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: DARK }}>{zone.nameHe.split(",")[0]}{zone.nameHe.includes(",") ? " - " + zone.nameHe.split(",")[1]?.trim() : ""}</div>
              </div>
            )}
          </div>

          {/* Street — auto-filled from geocoding */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: GRAY, marginBottom: 5 }}>שם רחוב</div>
            <input style={INP} value={street} onChange={e => setStreet(e.target.value)} placeholder="שם הרחוב ומספר הבית" onFocus={fo} onBlur={bl} />
          </div>

          {/* Building + Floor */}
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: GRAY, marginBottom: 5 }}>מספר בניין</div>
              <input style={INP} value={building} onChange={e => setBuilding(e.target.value)} placeholder="בניין" onFocus={fo} onBlur={bl} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: GRAY, marginBottom: 5 }}>קומה</div>
              <input style={INP} value={floor} type="number" onChange={e => setFloor(e.target.value)} placeholder="קומה" onFocus={fo} onBlur={bl} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: GRAY, marginBottom: 5 }}>דירה</div>
              <input style={INP} value={apt} onChange={e => setApt(e.target.value)} placeholder="דירה" onFocus={fo} onBlur={bl} />
            </div>
          </div>

          {/* Location type */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: GRAY, marginBottom: 7 }}>סוג מיקום</div>
            <div style={{ display: "flex", gap: 6 }}>
              {[{ k: "בית", e: "🏠" }, { k: "משרד", e: "🏢" }, { k: "מיקום אחר", e: "📍" }].map(t => (
                <button key={t.k} onClick={() => setType(t.k)} style={{ flex: 1, padding: "9px 4px", borderRadius: 12, cursor: "pointer", border: `1.5px solid ${type === t.k ? RED : "#E5E7EB"}`, background: type === t.k ? `rgba(200,16,46,0.06)` : "white", color: type === t.k ? RED : GRAY, fontSize: 10, fontWeight: 700, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, transition: "all 0.18s", fontFamily: "Arial,sans-serif" }}>
                  <span style={{ fontSize: 17 }}>{t.e}</span>{t.k}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: GRAY, marginBottom: 5 }}>הוראות לשליח</div>
            <div style={{ display: "flex", gap: 8, background: LIGHT, borderRadius: 12, padding: "9px 12px", border: "1px solid #E5E7EB" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GRAY} strokeWidth="1.8" style={{ flexShrink: 0, marginTop: 2 }}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="לדוגמה: ליד סניף הדואר הראשי..." style={{ flex: 1, background: "none", border: "none", outline: "none", resize: "none", fontSize: 12, fontFamily: "Arial,sans-serif", color: DARK, minHeight: 44, textAlign: "right", direction: "rtl" }} />
            </div>
          </div>

          {/* Save button */}
          <button onClick={handleSave} disabled={saving || outZone} style={{ width: "100%", background: (saving || outZone) ? "#9CA3AF" : `linear-gradient(135deg,${RED},#a00020)`, border: "none", borderRadius: 16, padding: "15px", color: "white", fontSize: 15, fontWeight: 900, cursor: (saving || outZone) ? "not-allowed" : "pointer", boxShadow: (saving || outZone) ? "none" : `0 4px 18px rgba(200,16,46,0.35)`, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, transition: "all 0.25s", letterSpacing: 0.3, marginBottom: 8 }}>
            {saving
              ? <><div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", animation: "yg-spin 0.7s linear infinite" }} />שומר...</>
              : outZone ? "⛔ מחוץ לאזור השירות" : "הוספת אזור ✓"
            }
          </button>

        </div>
      </div>

      <style>{`
        @keyframes yg-spin  { to { transform: rotate(360deg); } }
        @keyframes yg-shake { 0%,100%{transform:translate(-50%,-100%)} 20%{transform:translate(calc(-50% - 7px),-100%)} 40%{transform:translate(calc(-50% + 7px),-100%)} 60%{transform:translate(calc(-50% - 4px),-100%)} 80%{transform:translate(calc(-50% + 4px),-100%)} }
        input::placeholder, textarea::placeholder { color: #9CA3AF; }
        .leaflet-container { background: #EEE8DC !important; }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}
