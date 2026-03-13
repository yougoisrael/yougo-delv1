import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";

const RED  = "#C8102E";
const DARK = "#111827";
const GRAY = "#6B7280";

const AREAS = [
  { id:"rame",    name:"ראמה - סגור - בית ג׳ן",        emoji:"🏡", lat:32.9386, lng:35.3731, r:5500 },
  { id:"karmiel", name:"כרמיאל - נחף - שזור - חורפיש", emoji:"🏙️", lat:32.9500, lng:35.3050, r:9000 },
  { id:"magar",   name:"מג׳אר",                         emoji:"🌿", lat:32.8980, lng:35.4028, r:2200 },
  { id:"peki",    name:"פקיעין - כסרא-סומיע",           emoji:"🌲", lat:32.9630, lng:35.3200, r:4500 },
];

export default function MapPage({ cartCount = 0, onAreaSelect }) {
  const navigate    = useNavigate();
  const mapRef      = useRef(null);
  const leafRef     = useRef(null);
  const markersRef  = useRef({});
  const circlesRef  = useRef([]);
  const selectedRef = useRef(null);
  const [ready,    setReady]    = useState(false);
  const [selected, setSelected] = useState(null);

  // ── Load Leaflet ──────────────────────────────────────────
  useEffect(() => {
    if (window.L) { setReady(true); return; }
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
    document.head.appendChild(css);
    const js = document.createElement("script");
    js.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    js.onload = () => setReady(true);
    document.head.appendChild(js);
  }, []);

  // ── Init Map ──────────────────────────────────────────────
  useEffect(() => {
    if (!ready || !mapRef.current || leafRef.current) return;
    const L = window.L;
    const map = L.map(mapRef.current, {
      center: [32.930, 35.345], zoom: 11,
      zoomControl: false, attributionControl: false,
      minZoom: 9, maxZoom: 16,
    });
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      { maxZoom: 19 }
    ).addTo(map);
    leafRef.current = map;

    AREAS.forEach(area => {
      const m = L.marker([area.lat, area.lng], {
        icon: pinIcon(false), zIndexOffset: 1000,
      }).addTo(map);
      m.on("click", e => {
        L.DomEvent.stopPropagation(e);
        if (selectedRef.current === area.id) return; // منع التكرار
        onTap(area, map, L);
      });
      markersRef.current[area.id] = m;
    });

    map.on("click", deselect);
    return () => { map.remove(); leafRef.current = null; };
  }, [ready]);

  // ── Pin Icon ──────────────────────────────────────────────
  function pinIcon(active) {
    return window.L.divIcon({
      html: `
        <div style="display:flex;flex-direction:column;align-items:center">
          <div style="
            width:44px;height:44px;border-radius:50%;
            background:${active ? RED : "white"};
            border:2.5px solid ${RED};
            display:flex;align-items:center;justify-content:center;
            box-shadow:0 4px 16px rgba(200,16,46,${active ? "0.45" : "0.25"});
            transition:all 0.2s ease;
          ">
            <svg width="22" height="22" viewBox="0 0 24 24">
              <path fill="${active ? "white" : RED}"
                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75
                   7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12
                   -2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5
                   2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <div style="
            width:0;height:0;
            border-left:7px solid transparent;
            border-right:7px solid transparent;
            border-top:10px solid ${RED};
            margin-top:-1px;
          "></div>
        </div>`,
      className: "",
      iconSize: [44, 56],
      iconAnchor: [22, 56],
    });
  }

  // ── Clear Circles ─────────────────────────────────────────
  function clearCircles() {
    circlesRef.current.forEach(c => leafRef.current?.removeLayer(c));
    circlesRef.current = [];
  }

  // ── Deselect ──────────────────────────────────────────────
  function deselect() {
    clearCircles();
    AREAS.forEach(a => markersRef.current[a.id]?.setIcon(pinIcon(false)));
    selectedRef.current = null;
    setSelected(null);
  }

  // ── On Tap ────────────────────────────────────────────────
  function onTap(area, map, L) {
    // reset all pins
    AREAS.forEach(a => markersRef.current[a.id]?.setIcon(pinIcon(false)));
    // activate tapped pin
    markersRef.current[area.id]?.setIcon(pinIcon(true));
    // clear old circles
    clearCircles();
    // update state
    selectedRef.current = area.id;
    setSelected(area);

    // دائرة خارجية ناعمة
    const outer = L.circle([area.lat, area.lng], {
      radius: area.r,
      color: RED, weight: 1.5, opacity: 0.5,
      fillColor: RED, fillOpacity: 0.07,
    }).addTo(map);

    // دائرة داخلية أكثف
    const inner = L.circle([area.lat, area.lng], {
      radius: area.r * 0.45,
      color: RED, weight: 0,
      fillColor: RED, fillOpacity: 0.12,
    }).addTo(map);

    circlesRef.current.push(outer, inner);

    // zoom مرة وحدة بس
    map.flyToBounds(outer.getBounds(), {
      padding: [55, 55], maxZoom: 13, duration: 0.85,
    });
  }

  return (
    <div style={{ position:"fixed", inset:0, fontFamily:"Arial,sans-serif", direction:"rtl" }}>
      <style>{`
        @keyframes spin    { to { transform:rotate(360deg) } }
        @keyframes slideUp { from{transform:translateY(110%);opacity:0} to{transform:translateY(0);opacity:1} }
        .leaflet-container { background:#ede9e0 !important }
        .mBtn:active { transform:scale(0.92) }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        position:"absolute", top:0, left:0, right:0, zIndex:1000,
        background:"white", boxShadow:"0 1px 0 rgba(0,0,0,0.07)",
        padding:"12px 16px", display:"flex", alignItems:"center", gap:12,
      }}>
        <button className="mBtn" onClick={()=>navigate(-1)} style={{
          background:"#F3F4F6", border:"none", borderRadius:12,
          width:38, height:38, cursor:"pointer", flexShrink:0,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="#111" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div style={{ flex:1, textAlign:"center" }}>
          <div style={{ fontSize:16, fontWeight:900, color:DARK }}>בחר אזור משלוח</div>
          <div style={{
            fontSize:11, marginTop:2,
            fontWeight: selected ? 800 : 400,
            color: selected ? RED : GRAY,
            transition:"color 0.3s",
          }}>
            {selected ? `✓ ${selected.name}` : "לחץ על סמן האזור שלך"}
          </div>
        </div>
        <div style={{ width:38 }}/>
      </div>

      {/* ── Map ── */}
      <div ref={mapRef} style={{
        position:"absolute", top:62, left:0, right:0,
        bottom: selected ? 168 : 80,
        transition:"bottom 0.35s cubic-bezier(0.34,1.1,0.64,1)",
      }}/>

      {/* ── Loading ── */}
      {!ready && (
        <div style={{
          position:"absolute", inset:0, zIndex:600, background:"white",
          display:"flex", flexDirection:"column", alignItems:"center",
          justifyContent:"center", gap:14,
        }}>
          <div style={{
            width:44, height:44, borderRadius:"50%",
            border:"3px solid rgba(200,16,46,0.15)",
            borderTopColor:RED, animation:"spin 0.8s linear infinite",
          }}/>
          <div style={{ color:GRAY, fontSize:13, fontWeight:700 }}>טוען מפה...</div>
        </div>
      )}

      {/* ── Zoom ── */}
      <div style={{
        position:"absolute", left:12, top:"50%",
        transform:"translateY(-50%)", zIndex:900,
        display:"flex", flexDirection:"column", gap:6,
      }}>
        {[["+",1],["-",-1]].map(([l,d]) => (
          <button key={l} className="mBtn"
            onClick={() => leafRef.current?.setZoom((leafRef.current.getZoom()||11)+d)}
            style={{
              background:"white", border:"1px solid #E5E7EB",
              borderRadius:10, width:36, height:36,
              color:DARK, fontSize:18, fontWeight:700,
              cursor:"pointer", display:"flex",
              alignItems:"center", justifyContent:"center",
              boxShadow:"0 2px 8px rgba(0,0,0,0.1)",
            }}>
            {l}
          </button>
        ))}
      </div>

      {/* ── Bottom Card ── */}
      {selected && (
        <div style={{
          position:"absolute", bottom:80, left:0, right:0, zIndex:1000,
          background:"white", borderRadius:"22px 22px 0 0",
          padding:"14px 20px 18px",
          boxShadow:"0 -6px 28px rgba(0,0,0,0.12)",
          animation:"slideUp 0.32s cubic-bezier(0.34,1.1,0.64,1)",
        }}>
          <div style={{ width:36, height:4, background:"#E5E7EB", borderRadius:2, margin:"0 auto 14px" }}/>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
            <div style={{
              width:48, height:48, borderRadius:14,
              background:"rgba(200,16,46,0.07)",
              border:"1.5px solid rgba(200,16,46,0.18)",
              display:"flex", alignItems:"center",
              justifyContent:"center", fontSize:22, flexShrink:0,
            }}>{selected.emoji}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:16, fontWeight:900, color:DARK }}>{selected.name}</div>
              <div style={{ fontSize:12, marginTop:2, fontWeight:700, color:"#16a34a" }}>
                ✓ אזור פעיל • משלוח זמין
              </div>
            </div>
            <button className="mBtn" onClick={deselect} style={{
              background:"#F3F4F6", border:"none", borderRadius:"50%",
              width:30, height:30, cursor:"pointer",
              display:"flex", alignItems:"center",
              justifyContent:"center", fontSize:14, color:GRAY,
            }}>✕</button>
          </div>
          <button className="mBtn"
            onClick={() => { onAreaSelect?.(selected); navigate("/"); }}
            style={{
              width:"100%",
              background:`linear-gradient(135deg, ${RED}, #a00020)`,
              border:"none", borderRadius:16, padding:"15px",
              color:"white", fontSize:15, fontWeight:900,
              cursor:"pointer",
              boxShadow:"0 4px 18px rgba(200,16,46,0.35)",
            }}>
            {`בחר ${selected.name} ←`}
          </button>
        </div>
      )}

      {/* ── Bottom Nav ── */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, zIndex:999 }}>
        <BottomNav cartCount={cartCount}/>
      </div>
    </div>
  );
}
