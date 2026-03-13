// MapPage.jsx — بدون Leaflet، يعمل 100% على Vercel
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import BottomNav from "../components/BottomNav";

const C = { red: "#C8102E", dark: "#111827", gray: "#6B7280" };

// خريطة ثابتة للمنطقة بدون أي مكتبة خارجية
const MAP_CENTER = { lat: 32.935, lng: 35.350 };
const ZOOM = 11;

// تحويل lat/lng لموضع على الصورة (Mercator بسيط)
function latLngToPercent(lat, lng, bounds) {
  const x = ((lng - bounds.west) / (bounds.east - bounds.west)) * 100;
  const y = ((bounds.north - lat) / (bounds.north - bounds.south)) * 100;
  return { x, y };
}

const MAP_BOUNDS = { north: 33.35, south: 32.50, west: 34.85, east: 35.85 };

export default function MapPage({ cartCount = 0, onAreaSelect }) {
  const navigate = useNavigate();
  const [areas, setAreas] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    supabase
      .from("delivery_zones")
      .select("id, name, lat, lng, color, is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data, error: err }) => {
        if (err) setError("לא ניתן לטעון אזורים. נסה שוב.");
        else setAreas(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, fontFamily: "Arial,sans-serif", direction: "rtl", background: "white" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { transform: translateY(110%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes pinPop { 0%{transform:scale(0) translateY(0);opacity:0} 70%{transform:scale(1.2) translateY(-4px)} 100%{transform:scale(1) translateY(0);opacity:1} }
        .mBtn:active { transform: scale(0.92); }
        .zone-pin { cursor: pointer; transition: transform 0.2s; }
        .zone-pin:hover { transform: scale(1.15) translateY(-3px); }
      `}</style>

      {/* Header */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 100,
        background: "white", boxShadow: "0 1px 0 rgba(0,0,0,0.07)",
        padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
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
          <div style={{ fontSize: 11, marginTop: 1, fontWeight: selected ? 800 : 400, color: selected ? C.red : C.gray }}>
            {selected ? `✓ ${selected.name}` : "לחץ על סמן האזור שלך"}
          </div>
        </div>
        <div style={{ width: 38 }}/>
      </div>

      {/* Map Area */}
      <div style={{
        position: "absolute", top: 62, left: 0, right: 0,
        bottom: selected ? 162 : 80,
        overflow: "hidden", background: "#e8e0d8",
        transition: "bottom 0.35s ease",
      }}>
        {/* OpenStreetMap tile via iframe — أبسط حل ومضمون 100% */}
        <iframe
          title="map"
          width="100%"
          height="100%"
          style={{ border: "none", display: "block" }}
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${MAP_BOUNDS.west}%2C${MAP_BOUNDS.south}%2C${MAP_BOUNDS.east}%2C${MAP_BOUNDS.north}&layer=mapnik`}
        />

        {/* Zone pins فوق الـ iframe */}
        {!loading && !error && areas.map(area => {
          const pos = latLngToPercent(area.lat, area.lng, MAP_BOUNDS);
          const isSelected = selected?.id === area.id;
          return (
            <div
              key={area.id}
              className="zone-pin"
              onClick={() => setSelected(isSelected ? null : area)}
              style={{
                position: "absolute",
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: `translate(-50%, -100%) ${isSelected ? "scale(1.2)" : "scale(1)"}`,
                zIndex: isSelected ? 10 : 5,
                animation: "pinPop 0.35s ease",
              }}
            >
              {/* Pin shape */}
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: isSelected ? C.red : "white",
                border: `3px solid ${C.red}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: isSelected
                  ? "0 4px 16px rgba(200,16,46,0.5)"
                  : "0 3px 12px rgba(0,0,0,0.25)",
                transition: "all 0.2s",
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill={isSelected ? "white" : C.red}>
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </div>
              {/* Tail */}
              <div style={{
                width: 0, height: 0,
                borderLeft: "7px solid transparent",
                borderRight: "7px solid transparent",
                borderTop: `10px solid ${C.red}`,
                margin: "0 auto",
              }}/>
              {/* Label */}
              <div style={{
                position: "absolute", top: "110%", left: "50%",
                transform: "translateX(-50%)",
                background: isSelected ? C.red : "white",
                color: isSelected ? "white" : C.dark,
                fontSize: 10, fontWeight: 800,
                padding: "3px 7px", borderRadius: 8,
                whiteSpace: "nowrap",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                border: `1px solid ${isSelected ? C.red : "#E5E7EB"}`,
                marginTop: 2,
              }}>
                {area.name}
              </div>
            </div>
          );
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ position: "absolute", inset: 0, zIndex: 60, background: "rgba(255,255,255,0.9)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", border: "3px solid rgba(200,16,46,0.15)", borderTopColor: C.red, animation: "spin 0.8s linear infinite" }}/>
          <div style={{ color: C.gray, fontSize: 13, fontWeight: 700 }}>טוען אזורים...</div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div style={{ position: "absolute", inset: 0, zIndex: 60, background: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 24 }}>
          <div style={{ fontSize: 40 }}>⚠️</div>
          <div style={{ color: C.dark, fontSize: 15, fontWeight: 700, textAlign: "center" }}>{error}</div>
          <button onClick={() => window.location.reload()} style={{ background: C.red, color: "white", border: "none", borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
            נסה שוב
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && areas.length === 0 && (
        <div style={{ position: "absolute", inset: 0, zIndex: 60, background: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <div style={{ fontSize: 40 }}>🗺️</div>
          <div style={{ color: C.dark, fontSize: 15, fontWeight: 700 }}>אין אזורים פעילים כרגע</div>
        </div>
      )}

      {/* Selected Card */}
      {selected && (
        <div style={{
          position: "absolute", bottom: 80, left: 0, right: 0, zIndex: 50,
          background: "white", borderRadius: "22px 22px 0 0",
          padding: "14px 20px 18px",
          boxShadow: "0 -6px 28px rgba(0,0,0,0.13)",
          animation: "slideUp 0.32s cubic-bezier(0.34,1.1,0.64,1)",
        }}>
          <div style={{ width: 36, height: 4, background: "#E5E7EB", borderRadius: 2, margin: "0 auto 14px" }}/>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(200,16,46,0.07)", border: "1.5px solid rgba(200,16,46,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill={C.red}>
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: C.dark }}>{selected.name}</div>
              <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 700, marginTop: 2 }}>✓ אזור פעיל • משלוח זמין</div>
            </div>
            <button onClick={() => setSelected(null)} style={{ background: "#F3F4F6", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", fontSize: 14, color: C.gray }}>✕</button>
          </div>
          <button className="mBtn" onClick={() => { onAreaSelect?.(selected); navigate("/"); }} style={{
            width: "100%", background: `linear-gradient(135deg, ${C.red}, #a00020)`,
            border: "none", borderRadius: 16, padding: "15px",
            color: "white", fontSize: 15, fontWeight: 900, cursor: "pointer",
            boxShadow: "0 4px 18px rgba(200,16,46,0.35)",
          }}>
            בחר {selected.name} ←
          </button>
        </div>
      )}

      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 99 }}>
        <BottomNav cartCount={cartCount}/>
      </div>
    </div>
  );
}
