import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";

const C = { red: "#C8102E", dark: "#111827", gray: "#6B7280" };

// ── מناטק השירות ──────────────────────────────────
const AREAS = [
  {
    id: "rame",
    name: "ראמה",
    nameAr: "ראמה",
    active: true,
    center: [32.9386, 35.3731],
    polygon: [
      [32.955, 35.355], [32.958, 35.388], [32.945, 35.400],
      [32.930, 35.398], [32.920, 35.380], [32.925, 35.358],
      [32.938, 35.348],
    ],
  },
  {
    id: "karmiel",
    name: "כרמיאל - שאג׳ור",
    nameAr: "כרמיאל - שאג׳ור",
    active: true,
    center: [32.9144, 35.2963],
    polygon: [
      [32.930, 35.268], [32.932, 35.310], [32.920, 35.322],
      [32.905, 35.318], [32.898, 35.295], [32.905, 35.268],
      [32.918, 35.260],
    ],
  },
  {
    id: "nahef",
    name: "נחף - ג׳דיידה",
    nameAr: "נחף - ג׳דיידה",
    active: true,
    center: [32.9580, 35.3200],
    polygon: [
      [32.970, 35.302], [32.972, 35.338], [32.960, 35.345],
      [32.948, 35.338], [32.945, 35.315], [32.952, 35.298],
    ],
  },
  {
    id: "sakhnin",
    name: "סח׳נין - עראבה",
    nameAr: "סח׳נין - עראבה",
    active: false,
    center: [32.8650, 35.3050],
    polygon: [
      [32.878, 35.282], [32.880, 35.328], [32.862, 35.335],
      [32.850, 35.325], [32.848, 35.292], [32.858, 35.278],
    ],
  },
  {
    id: "akko",
    name: "עכו - נהריה",
    nameAr: "עכו - נהריה",
    active: false,
    center: [32.9281, 35.0818],
    polygon: [
      [32.960, 35.055], [32.962, 35.108], [32.940, 35.115],
      [32.920, 35.105], [32.915, 35.068], [32.930, 35.050],
    ],
  },
  {
    id: "beitjan",
    name: "בית ג׳ן - יאנוח",
    nameAr: "בית ג׳ן - יאנוח",
    active: false,
    center: [32.9700, 35.4000],
    polygon: [
      [32.982, 35.382], [32.984, 35.418], [32.968, 35.425],
      [32.955, 35.415], [32.953, 35.390], [32.965, 35.378],
    ],
  },
];

export default function MapPage({ cartCount = 0, onAreaSelect }) {
  const navigate     = useNavigate();
  const mapRef       = useRef(null);
  const leafRef      = useRef(null);
  const layersRef    = useRef([]);
  const [ready,      setReady]      = useState(false);
  const [selected,   setSelected]   = useState(null);
  const [confirmed,  setConfirmed]  = useState(null);

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
      minZoom: 9,
      maxZoom: 15,
    });

    // Clean light tile style
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map);

    leafRef.current = map;

    // Draw areas
    AREAS.forEach(area => {
      const isActive = area.active;

      // Polygon
      const poly = L.polygon(area.polygon, {
        color:       isActive ? C.red : "#9CA3AF",
        weight:      isActive ? 2     : 1.5,
        opacity:     isActive ? 0.8   : 0.5,
        fillColor:   isActive ? C.red : "#9CA3AF",
        fillOpacity: isActive ? 0.12  : 0.06,
        dashArray:   isActive ? null  : "5,4",
      }).addTo(map);

      // Label marker
      const label = L.divIcon({
        html: `
          <div style="
            background: ${isActive ? C.red : "#6B7280"};
            color: white;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 900;
            white-space: nowrap;
            box-shadow: 0 2px 8px rgba(0,0,0,0.25);
            font-family: Arial, sans-serif;
            display: flex;
            align-items: center;
            gap: 5px;
          ">
            ${isActive ? "●" : "○"} ${area.name}
            ${!isActive ? '<span style="font-size:9px;opacity:0.8;margin-right:3px">• בקרוב</span>' : ""}
          </div>
        `,
        className: "",
        iconAnchor: [60, 16],
      });

      const marker = L.marker(area.center, { icon: label }).addTo(map);

      // Click handlers
      const onClick = () => {
        if (!area.active) return;
        setSelected(area);
        map.flyTo(area.center, 12, { duration: 0.8 });

        // Highlight selected
        layersRef.current.forEach(l => {
          if (l._areaId === area.id) {
            l.setStyle({ fillOpacity: 0.22, weight: 2.5 });
          } else if (l._areaId && AREAS.find(a=>a.id===l._areaId)?.active) {
            l.setStyle({ fillOpacity: 0.12, weight: 2 });
          }
        });
      };

      poly.on("click", onClick);
      marker.on("click", onClick);

      poly._areaId   = area.id;
      marker._areaId = area.id;

      layersRef.current.push(poly, marker);
    });

    return () => { map.remove(); leafRef.current = null; layersRef.current = []; };
  }, [ready]);

  function handleConfirm() {
    if (!selected) return;
    setConfirmed(selected);
    onAreaSelect?.(selected);
    navigate("/");
  }

  return (
    <div style={{
      position: "fixed", inset: 0,
      fontFamily: "Arial, sans-serif", direction: "rtl",
      background: "#f0ece4",
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .leaflet-container { background: #f0ece4 !important; }
        .mBtn:active { transform: scale(0.92); }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 1000,
        background: "white",
        boxShadow: "0 1px 0 rgba(0,0,0,0.07)",
        padding: "12px 16px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <button className="mBtn" onClick={() => navigate(-1)} style={{
          background: "#F3F4F6", border: "none", borderRadius: 12,
          width: 38, height: 38, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: C.dark }}>בחר אזור משלוח</div>
          <div style={{ fontSize: 11, color: C.gray, marginTop: 1 }}>
            {selected ? `✓ ${selected.name}` : "לחץ על האזור שלך"}
          </div>
        </div>

        <div style={{ width: 38 }} />
      </div>

      {/* ── Map ── */}
      <div ref={mapRef} style={{
        position: "absolute", inset: 0,
        top: 62,
        bottom: selected ? 160 : 80,
        transition: "bottom 0.3s ease",
      }} />

      {/* ── Loading ── */}
      {!ready && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 500,
          background: "white", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 14,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            border: `3px solid rgba(200,16,46,0.15)`,
            borderTopColor: C.red,
            animation: "spin 0.8s linear infinite",
          }}/>
          <div style={{ color: C.gray, fontSize: 13 }}>טוען מפה...</div>
        </div>
      )}

      {/* ── Legend ── */}
      {ready && (
        <div style={{
          position: "absolute", top: 74, right: 12, zIndex: 900,
          background: "white", borderRadius: 12, padding: "8px 12px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          display: "flex", flexDirection: "column", gap: 5,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: C.dark, fontWeight: 700 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: C.red, opacity: 0.8 }}/>
            אזור פעיל
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: C.gray }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: "#9CA3AF", opacity: 0.5 }}/>
            בקרוב
          </div>
        </div>
      )}

      {/* ── Zoom buttons ── */}
      <div style={{
        position: "absolute", left: 12,
        top: "50%", transform: "translateY(-50%)",
        zIndex: 900, display: "flex", flexDirection: "column", gap: 6,
      }}>
        {[["+", 1], ["-", -1]].map(([l, d]) => (
          <button key={l} className="mBtn"
            onClick={() => leafRef.current?.setZoom((leafRef.current.getZoom() || 10) + d)}
            style={{
              background: "white", border: "1px solid #E5E7EB",
              borderRadius: 10, width: 36, height: 36, color: C.dark,
              fontSize: 18, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}>
            {l}
          </button>
        ))}
      </div>

      {/* ── Selected area card ── */}
      {selected && (
        <div style={{
          position: "absolute", bottom: 80, left: 0, right: 0, zIndex: 1000,
          background: "white", borderRadius: "24px 24px 0 0",
          padding: "16px 20px 20px",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
          animation: "slideUp 0.3s cubic-bezier(0.34,1.2,0.64,1)",
        }}>
          {/* Handle */}
          <div style={{ width: 36, height: 4, background: "#E5E7EB", borderRadius: 2, margin: "0 auto 14px" }}/>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 46, height: 46, borderRadius: 14,
              background: `rgba(200,16,46,0.08)`,
              border: `1.5px solid rgba(200,16,46,0.2)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22,
            }}>📍</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 900, color: C.dark }}>{selected.name}</div>
              <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 700, marginTop: 2 }}>
                ✓ אזור פעיל • משלוח זמין
              </div>
            </div>
          </div>

          <button className="mBtn" onClick={handleConfirm} style={{
            width: "100%",
            background: `linear-gradient(135deg, ${C.red}, #a00020)`,
            border: "none", borderRadius: 16, padding: "15px",
            color: "white", fontSize: 15, fontWeight: 900, cursor: "pointer",
            boxShadow: "0 4px 16px rgba(200,16,46,0.35)",
          }}>
            בחר {selected.name} ←
          </button>
        </div>
      )}

      {/* ── Bottom Nav ── */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 999 }}>
        <BottomNav cartCount={cartCount} />
      </div>
    </div>
  );
}
