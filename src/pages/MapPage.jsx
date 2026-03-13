import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";

const C = { red: "#C8102E", dark: "#111827", gray: "#6B7280" };

const AREAS = [
  { id: "rame",    name: "ראמה - סגור - בית ג׳ן",          lat: 32.946, lng: 35.378 },
  { id: "karmiel", name: "כרמיאל - נחף - מג׳ד - שזור",     lat: 32.928, lng: 35.310 },
  { id: "magar",   name: "מג׳אר",                           lat: 32.899, lng: 35.403 },
  { id: "peki",    name: "פקיעין - כ׳ סמיע - כסרא",         lat: 32.969, lng: 35.322 },
];

export default function MapPage({ cartCount = 0, onAreaSelect }) {
  const navigate    = useNavigate();
  const mapRef      = useRef(null);
  const leafRef     = useRef(null);
  const markersRef  = useRef({});
  const circleRef   = useRef(null);
  const [ready,     setReady]    = useState(false);
  const [selected,  setSelected] = useState(null);

  // ── Load Leaflet ──────────────────────────────
  useEffect(() => {
    if (window.L) { setReady(true); return; }
    const css = Object.assign(document.createElement("link"), {
      rel: "stylesheet",
      href: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css",
    });
    document.head.appendChild(css);
    const js = Object.assign(document.createElement("script"), {
      src: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js",
      onload: () => setReady(true),
    });
    document.head.appendChild(js);
  }, []);

  // ── Init map ──────────────────────────────────
  useEffect(() => {
    if (!ready || !mapRef.current || leafRef.current) return;
    const L = window.L;

    const map = L.map(mapRef.current, {
      center: [32.935, 35.350],
      zoom: 11,
      zoomControl: false,
      attributionControl: false,
      minZoom: 9, maxZoom: 15,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      { maxZoom: 19 }
    ).addTo(map);

    leafRef.current = map;

    // Draw pin for each area
    AREAS.forEach(area => {
      const icon = L.divIcon({
        html: `
          <div class="yg-pin" id="pin-${area.id}">
            <div class="yg-pin-circle">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="${C.red}">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            <div class="yg-pin-tail"></div>
          </div>
        `,
        className:  "",
        iconSize:   [44, 54],
        iconAnchor: [22, 54],
      });

      const marker = L.marker([area.lat, area.lng], { icon })
        .addTo(map)
        .on("click", e => {
          L.DomEvent.stopPropagation(e);
          selectArea(area, map, L);
        });

      markersRef.current[area.id] = marker;
    });

    // Click map → deselect
    map.on("click", () => deselect(map));

    return () => {
      map.remove();
      leafRef.current  = null;
      markersRef.current = {};
      circleRef.current  = null;
    };
  }, [ready]);

  function selectArea(area, map, L) {
    // Remove old circle
    if (circleRef.current) { map.removeLayer(circleRef.current); circleRef.current = null; }

    // Reset all pins
    AREAS.forEach(a => setPinActive(a.id, false));

    // Activate this pin
    setPinActive(area.id, true);

    // Draw circle around area
    const circle = L.circle([area.lat, area.lng], {
      radius:      4500,
      color:       C.red,
      weight:      2,
      opacity:     0.6,
      fillColor:   C.red,
      fillOpacity: 0.10,
      dashArray:   "6,4",
    }).addTo(map);
    circleRef.current = circle;

    map.flyTo([area.lat, area.lng], 12, { duration: 0.6 });
    setSelected(area);
  }

  function deselect(map) {
    if (circleRef.current && map) { map.removeLayer(circleRef.current); circleRef.current = null; }
    AREAS.forEach(a => setPinActive(a.id, false));
    setSelected(null);
  }

  function setPinActive(id, active) {
    const el = document.getElementById(`pin-${id}`);
    if (!el) return;
    const circle = el.querySelector(".yg-pin-circle");
    const tail   = el.querySelector(".yg-pin-tail");
    if (circle) {
      circle.style.background     = active ? C.red : "white";
      circle.style.border         = active ? `3px solid ${C.red}` : `3px solid ${C.red}`;
      circle.style.transform      = active ? "scale(1.2)" : "scale(1)";
      circle.querySelector("svg path").setAttribute("fill", active ? "white" : C.red);
    }
    if (tail) {
      tail.style.borderTopColor = C.red;
    }
  }

  return (
    <div style={{ position:"fixed", inset:0, fontFamily:"Arial,sans-serif", direction:"rtl" }}>
      <style>{`
        @keyframes spin    { to { transform:rotate(360deg); } }
        @keyframes slideUp { from { transform:translateY(110%);opacity:0; } to { transform:translateY(0);opacity:1; } }
        @keyframes pinPop  { 0%{transform:scale(0.5);opacity:0} 70%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
        .leaflet-container { background:#f0ece4!important; }
        .mBtn:active { transform:scale(0.91); }

        .yg-pin { display:flex; flex-direction:column; align-items:center; animation:pinPop 0.35s ease; }
        .yg-pin-circle {
          width:44px; height:44px; border-radius:50%;
          background:white; border:3px solid ${C.red};
          display:flex; align-items:center; justify-content:center;
          box-shadow:0 3px 12px rgba(200,16,46,0.35);
          transition:all 0.2s ease;
          cursor:pointer;
        }
        .yg-pin-tail {
          width:0; height:0;
          border-left:7px solid transparent;
          border-right:7px solid transparent;
          border-top:10px solid ${C.red};
          margin-top:-1px;
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        position:"absolute",top:0,left:0,right:0,zIndex:1000,
        background:"white",boxShadow:"0 1px 0 rgba(0,0,0,0.07)",
        padding:"12px 16px",
        display:"flex",alignItems:"center",gap:12,
      }}>
        <button className="mBtn" onClick={() => navigate(-1)} style={{
          background:"#F3F4F6",border:"none",borderRadius:12,
          width:38,height:38,cursor:"pointer",flexShrink:0,
          display:"flex",alignItems:"center",justifyContent:"center",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="#111" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        <div style={{flex:1,textAlign:"center"}}>
          <div style={{fontSize:16,fontWeight:900,color:C.dark}}>בחר אזור משלוח</div>
          <div style={{
            fontSize:11,marginTop:1,
            fontWeight:selected?800:400,
            color:selected?C.red:C.gray,
            transition:"color 0.25s",
          }}>
            {selected ? `✓ ${selected.name}` : "לחץ על סמן האזור שלך"}
          </div>
        </div>

        <div style={{width:38}}/>
      </div>

      {/* ── Map ── */}
      <div ref={mapRef} style={{
        position:"absolute",
        top:62,left:0,right:0,
        bottom:selected ? 162 : 80,
        transition:"bottom 0.35s cubic-bezier(0.34,1.1,0.64,1)",
      }}/>

      {/* ── Loading ── */}
      {!ready && (
        <div style={{
          position:"absolute",inset:0,zIndex:600,background:"white",
          display:"flex",flexDirection:"column",
          alignItems:"center",justifyContent:"center",gap:14,
        }}>
          <div style={{
            width:44,height:44,borderRadius:"50%",
            border:"3px solid rgba(200,16,46,0.15)",
            borderTopColor:C.red,
            animation:"spin 0.8s linear infinite",
          }}/>
          <div style={{color:C.gray,fontSize:13,fontWeight:700}}>טוען מפה...</div>
        </div>
      )}

      {/* ── Zoom ── */}
      <div style={{
        position:"absolute",left:12,top:"50%",
        transform:"translateY(-50%)",zIndex:900,
        display:"flex",flexDirection:"column",gap:6,
      }}>
        {[["+",1],["-",-1]].map(([l,d])=>(
          <button key={l} className="mBtn"
            onClick={()=>leafRef.current?.setZoom((leafRef.current.getZoom()||11)+d)}
            style={{
              background:"white",border:"1px solid #E5E7EB",
              borderRadius:10,width:36,height:36,
              color:C.dark,fontSize:18,fontWeight:700,cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",
              boxShadow:"0 2px 8px rgba(0,0,0,0.1)",
            }}>{l}
          </button>
        ))}
      </div>

      {/* ── Selected card ── */}
      {selected && (
        <div style={{
          position:"absolute",bottom:80,left:0,right:0,zIndex:1000,
          background:"white",borderRadius:"22px 22px 0 0",
          padding:"14px 20px 18px",
          boxShadow:"0 -6px 28px rgba(0,0,0,0.13)",
          animation:"slideUp 0.32s cubic-bezier(0.34,1.1,0.64,1)",
        }}>
          <div style={{width:36,height:4,background:"#E5E7EB",borderRadius:2,margin:"0 auto 14px"}}/>

          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
            <div style={{
              width:48,height:48,borderRadius:14,
              background:"rgba(200,16,46,0.07)",
              border:"1.5px solid rgba(200,16,46,0.18)",
              display:"flex",alignItems:"center",justifyContent:"center",
              flexShrink:0,
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill={C.red}>
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>

            <div style={{flex:1}}>
              <div style={{fontSize:16,fontWeight:900,color:C.dark}}>{selected.name}</div>
              <div style={{fontSize:12,color:"#16a34a",fontWeight:700,marginTop:2}}>
                ✓ אזור פעיל • משלוח זמין
              </div>
            </div>

            <button className="mBtn" onClick={()=>deselect(leafRef.current)} style={{
              background:"#F3F4F6",border:"none",borderRadius:"50%",
              width:30,height:30,cursor:"pointer",flexShrink:0,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:14,color:C.gray,
            }}>✕</button>
          </div>

          <button className="mBtn"
            onClick={()=>{ onAreaSelect?.(selected); navigate("/"); }}
            style={{
              width:"100%",
              background:`linear-gradient(135deg,${C.red},#a00020)`,
              border:"none",borderRadius:16,padding:"15px",
              color:"white",fontSize:15,fontWeight:900,cursor:"pointer",
              boxShadow:"0 4px 18px rgba(200,16,46,0.35)",
            }}>
            בחר {selected.name} ←
          </button>
        </div>
      )}

      {/* ── BottomNav ── */}
      <div style={{position:"absolute",bottom:0,left:0,right:0,zIndex:999}}>
        <BottomNav cartCount={cartCount}/>
      </div>
    </div>
  );
}
