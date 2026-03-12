import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";

const C = { red: "#C8102E", dark: "#111827", gray: "#6B7280" };

// إحداثيات حقيقية ودقيقة لكل منطقة
const AREAS = [
  {
    id: "rame",
    name: "ראמה",
    active: true,
    center: [32.9386, 35.3731],
    // ראמה polygon — 3km radius approx
    polygon: [
      [32.955, 35.358],[32.958, 35.378],[32.952, 35.395],
      [32.940, 35.400],[32.928, 35.395],[32.922, 35.380],
      [32.924, 35.360],[32.935, 35.350],
    ],
  },
  {
    id: "karmiel",
    name: "כרמיאל - שאג׳ור",
    active: true,
    center: [32.9144, 35.2963],
    polygon: [
      [32.928, 35.272],[32.930, 35.308],[32.922, 35.322],
      [32.908, 35.320],[32.900, 35.305],[32.902, 35.278],
      [32.914, 35.268],
    ],
  },
  {
    id: "nahef",
    name: "נחף - ג׳דיידה",
    active: true,
    center: [32.9570, 35.3240],
    polygon: [
      [32.968, 35.308],[32.970, 35.335],[32.960, 35.342],
      [32.948, 35.336],[32.944, 35.318],[32.950, 35.305],
    ],
  },
  {
    id: "sakhnin",
    name: "סח׳נין - עראבה",
    active: false,
    center: [32.8650, 35.3050],
    polygon: [
      [32.878, 35.285],[32.880, 35.325],[32.865, 35.332],
      [32.852, 35.322],[32.850, 35.292],[32.860, 35.280],
    ],
  },
  {
    id: "akko",
    name: "עכו - נהריה",
    active: false,
    center: [32.9281, 35.0818],
    polygon: [
      [32.955, 35.058],[32.957, 35.105],[32.938, 35.112],
      [32.918, 35.100],[32.915, 35.065],[32.928, 35.052],
    ],
  },
  {
    id: "beitjan",
    name: "בית ג׳ן - יאנוח",
    active: false,
    center: [32.9680, 35.4060],
    polygon: [
      [32.980, 35.390],[32.982, 35.420],[32.968, 35.426],
      [32.956, 35.416],[32.954, 35.394],[32.964, 35.382],
    ],
  },
];

export default function MapPage({ cartCount = 0, onAreaSelect }) {
  const navigate   = useNavigate();
  const mapRef     = useRef(null);
  const leafRef    = useRef(null);
  const polyRef    = useRef({});   // id -> polygon layer
  const popupRef   = useRef({});   // id -> popup layer
  const [ready,    setReady]   = useState(false);
  const [selected, setSelected] = useState(null);

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
      center: [32.93, 35.28],
      zoom: 10,
      zoomControl: false,
      attributionControl: false,
      minZoom: 9, maxZoom: 15,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map);

    leafRef.current = map;

    AREAS.forEach(area => {
      const isActive = area.active;

      // Polygon — NO label by default
      const poly = L.polygon(area.polygon, {
        color:       isActive ? C.red    : "#9CA3AF",
        weight:      isActive ? 2        : 1.5,
        opacity:     isActive ? 0.9      : 0.5,
        fillColor:   isActive ? C.red    : "#9CA3AF",
        fillOpacity: isActive ? 0.14     : 0.06,
        dashArray:   isActive ? null     : "5,4",
      }).addTo(map);

      polyRef.current[area.id] = poly;

      // Click — show label + highlight
      poly.on("click", () => {
        if (!isActive) {
          // Flash grey popup for inactive
          const p = L.popup({ closeButton: false, className: "yg-popup-grey" })
            .setLatLng(area.center)
            .setContent(`<div style="font-family:Arial;font-size:12px;font-weight:800;color:#6B7280;padding:4px 10px">${area.name} • בקרוב</div>`)
            .openOn(map);
          setTimeout(() => map.closePopup(p), 1800);
          return;
        }

        // Close previous popups
        map.eachLayer(l => { if (l._isYgLabel) map.removeLayer(l); });

        // Reset all polys
        Object.entries(polyRef.current).forEach(([id, p]) => {
          const a = AREAS.find(x => x.id === id);
          p.setStyle({
            fillOpacity: a.active ? 0.14 : 0.06,
            weight:      a.active ? 2    : 1.5,
          });
        });

        // Highlight selected
        poly.setStyle({ fillOpacity: 0.28, weight: 3 });

        // Show label marker
        const label = L.marker(area.center, {
          icon: L.divIcon({
            html: `<div style="
              background:${C.red};color:white;
              padding:7px 16px;border-radius:20px;
              font-size:13px;font-weight:900;
              white-space:nowrap;
              box-shadow:0 3px 12px rgba(200,16,46,0.4);
              font-family:Arial,sans-serif;
            ">${area.name}</div>`,
            className: "",
            iconAnchor: [60, 16],
          }),
          interactive: false,
          zIndexOffset: 1000,
        }).addTo(map);
        label._isYgLabel = true;

        map.flyTo(area.center, 12, { duration: 0.7 });
        setSelected(area);
      });
    });

    // Click on map (not polygon) → deselect
    map.on("click", () => {
      map.eachLayer(l => { if (l._isYgLabel) map.removeLayer(l); });
      Object.entries(polyRef.current).forEach(([id, p]) => {
        const a = AREAS.find(x => x.id === id);
        p.setStyle({ fillOpacity: a.active ? 0.14 : 0.06, weight: a.active ? 2 : 1.5 });
      });
      setSelected(null);
    });

    return () => { map.remove(); leafRef.current = null; polyRef.current = {}; };
  }, [ready]);

  function handleConfirm() {
    if (!selected) return;
    onAreaSelect?.(selected);
    navigate("/");
  }

  return (
    <div style={{
      position: "fixed", inset: 0,
      fontFamily: "Arial,sans-serif", direction: "rtl",
    }}>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes slideUp { from { transform:translateY(100%);opacity:0; } to { transform:translateY(0);opacity:1; } }
        .leaflet-container { background: #f0ece4 !important; }
        .mBtn:active { transform:scale(0.92); }
        .yg-popup-grey .leaflet-popup-content-wrapper { background:rgba(100,100,100,0.9);border-radius:12px;box-shadow:none;padding:0; }
        .yg-popup-grey .leaflet-popup-tip { background:rgba(100,100,100,0.9); }
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
          width:38,height:38,cursor:"pointer",
          display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        <div style={{flex:1,textAlign:"center"}}>
          <div style={{fontSize:16,fontWeight:900,color:C.dark}}>בחר אזור משלוח</div>
          <div style={{fontSize:11,color:selected ? C.red : C.gray,marginTop:1,fontWeight:selected?800:400,transition:"color 0.2s"}}>
            {selected ? `✓ ${selected.name} נבחר` : "לחץ על האזור שלך במפה"}
          </div>
        </div>

        <div style={{width:38}}/>
      </div>

      {/* ── Map ── */}
      <div ref={mapRef} style={{
        position:"absolute",
        top:62, left:0, right:0,
        bottom: selected ? 158 : 80,
        transition:"bottom 0.35s cubic-bezier(0.34,1.1,0.64,1)",
      }}/>

      {/* ── Loading ── */}
      {!ready && (
        <div style={{
          position:"absolute",inset:0,zIndex:500,
          background:"white",display:"flex",flexDirection:"column",
          alignItems:"center",justifyContent:"center",gap:14,
        }}>
          <div style={{
            width:44,height:44,borderRadius:"50%",
            border:`3px solid rgba(200,16,46,0.15)`,
            borderTopColor:C.red,animation:"spin 0.8s linear infinite",
          }}/>
          <div style={{color:C.gray,fontSize:13}}>טוען מפה...</div>
        </div>
      )}

      {/* ── Zoom ── */}
      <div style={{
        position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",
        zIndex:900,display:"flex",flexDirection:"column",gap:6,
      }}>
        {[["+",1],["-",-1]].map(([l,d])=>(
          <button key={l} className="mBtn"
            onClick={()=>leafRef.current?.setZoom((leafRef.current.getZoom()||10)+d)}
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
          background:"white",borderRadius:"24px 24px 0 0",
          padding:"14px 20px 18px",
          boxShadow:"0 -4px 24px rgba(0,0,0,0.13)",
          animation:"slideUp 0.35s cubic-bezier(0.34,1.1,0.64,1)",
        }}>
          <div style={{width:36,height:4,background:"#E5E7EB",borderRadius:2,margin:"0 auto 14px"}}/>

          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
            <div style={{
              width:46,height:46,borderRadius:14,
              background:"rgba(200,16,46,0.08)",
              border:"1.5px solid rgba(200,16,46,0.2)",
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,
            }}>📍</div>
            <div>
              <div style={{fontSize:17,fontWeight:900,color:C.dark}}>{selected.name}</div>
              <div style={{fontSize:12,color:"#16a34a",fontWeight:700,marginTop:2}}>
                ✓ אזור פעיל • משלוח זמין
              </div>
            </div>
            <button className="mBtn" onClick={()=>{
              map?.eachLayer?.(l=>{if(l._isYgLabel)map.removeLayer(l)});
              setSelected(null);
            }} style={{
              marginRight:"auto",background:"#F3F4F6",border:"none",
              borderRadius:"50%",width:30,height:30,cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:C.gray,
            }}>✕</button>
          </div>

          <button className="mBtn" onClick={handleConfirm} style={{
            width:"100%",
            background:`linear-gradient(135deg,${C.red},#a00020)`,
            border:"none",borderRadius:16,padding:"15px",
            color:"white",fontSize:15,fontWeight:900,cursor:"pointer",
            boxShadow:"0 4px 16px rgba(200,16,46,0.35)",
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
