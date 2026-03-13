import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";

const C = { red: "#C8102E", dark: "#111827", gray: "#6B7280" };

// إحداثيات حقيقية لكل منطقة
const ZONES = [
  { id: 1,  name: "ראמה",         lat: 32.9367, lng: 35.3647 },
  { id: 2,  name: "סאגור",        lat: 32.9261, lng: 35.3431 },
  { id: 3,  name: "מגאר",         lat: 32.9272, lng: 35.4025 },
  { id: 4,  name: "עין אל-אסד",   lat: 32.9503, lng: 35.3311 },
  { id: 5,  name: "פקיעין",       lat: 32.9797, lng: 35.3208 },
  { id: 6,  name: "כסרא-סמיע",    lat: 33.0114, lng: 35.3508 },
  { id: 7,  name: "חורפיש",       lat: 33.0000, lng: 35.3167 },
  { id: 8,  name: "יאנוח-ג'ת",    lat: 32.9633, lng: 35.2975 },
  { id: 9,  name: "כרמיאל",       lat: 32.9147, lng: 35.2969 },
  { id: 10, name: "נחף",          lat: 32.9408, lng: 35.3194 },
  { id: 11, name: "מגד אל-כרום",  lat: 32.9314, lng: 35.2592 },
  { id: 12, name: "בעינה",        lat: 32.8956, lng: 35.3089 },
  { id: 13, name: "דיר אל-אסד",   lat: 32.9036, lng: 35.3142 },
  { id: 14, name: "עראבה",        lat: 32.8547, lng: 35.3378 },
  { id: 15, name: "סחנין",        lat: 32.8614, lng: 35.2978 },
];

// حدود المنطقة الكاملة
const BOUNDS = {
  north: 33.065,
  south: 32.820,
  east:  35.445,
  west:  35.230,
};

const SVG_W = 340;
const SVG_H = 480;

function toSVG(lat, lng) {
  const x = ((lng - BOUNDS.west)  / (BOUNDS.east  - BOUNDS.west))  * SVG_W;
  const y = ((BOUNDS.north - lat) / (BOUNDS.north - BOUNDS.south)) * SVG_H;
  return { x, y };
}

// مضلعات تقريبية للمناطق (مرسومة يدوياً بناءً على الخريطة الحقيقية)
function ZonePolygon({ zone, isSelected, onClick }) {
  const c = toSVG(zone.lat, zone.lng);
  // دائرة كـ polygon مبسط
  const r = 18;
  return (
    <g onClick={onClick} style={{ cursor: "pointer" }}>
      <circle
        cx={c.x} cy={c.y} r={r}
        fill={isSelected ? C.red : "rgba(200,16,46,0.13)"}
        stroke={C.red}
        strokeWidth={isSelected ? 2.5 : 1.5}
        style={{ transition: "all 0.2s" }}
      />
    </g>
  );
}

export default function MapPage({ cartCount = 0, onAreaSelect }) {
  const navigate   = useNavigate();
  const [selected, setSelected] = useState(null);
  const [tooltip,  setTooltip]  = useState(null); // { x, y, zone }

  function handleSelect(zone) {
    const c = toSVG(zone.lat, zone.lng);
    if (selected?.id === zone.id) {
      setSelected(null);
      setTooltip(null);
    } else {
      setSelected(zone);
      setTooltip({ x: c.x, y: c.y, zone });
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0,
      fontFamily: "Arial,sans-serif", direction: "rtl",
      background: "#f5f0eb", display: "flex", flexDirection: "column",
    }}>
      <style>{`
        @keyframes slideUp { from{transform:translateY(110%);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes fadeIn  { from{opacity:0;transform:scale(0.9)} to{opacity:1;transform:scale(1)} }
        .mBtn:active { transform: scale(0.92); }
        .zone-circle { transition: all 0.18s ease; }
        .zone-circle:hover circle { fill: rgba(200,16,46,0.28) !important; }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        background: "white", boxShadow: "0 1px 0 rgba(0,0,0,0.07)",
        padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
        flexShrink: 0, zIndex: 10,
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
          <div style={{ fontSize: 11, marginTop: 1, color: selected ? C.red : C.gray, fontWeight: selected ? 800 : 400 }}>
            {selected ? `✓ ${selected.name}` : "לחץ על האזור שלך במפה"}
          </div>
        </div>
        <div style={{ width: 38 }}/>
      </div>

      {/* ── SVG Map ── */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>

        {/* خلفية خريطة بسيطة */}
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          width="100%"
          height="100%"
          style={{ display: "block", maxHeight: "100%" }}
        >
          {/* خلفية */}
          <rect width={SVG_W} height={SVG_H} fill="#e8e0d5" rx="0"/>

          {/* شبكة خفيفة */}
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={`h${i}`} x1={0} y1={i * 60} x2={SVG_W} y2={i * 60} stroke="#d4ccbf" strokeWidth="0.5"/>
          ))}
          {Array.from({ length: 7 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 57} y1={0} x2={i * 57} y2={SVG_H} stroke="#d4ccbf" strokeWidth="0.5"/>
          ))}

          {/* طرق رئيسية تقريبية */}
          {/* Route 85 - horizontal */}
          <path d="M 0,295 Q 170,280 340,295" stroke="#f5c842" strokeWidth="3" fill="none" opacity="0.7"/>
          {/* Route 70 - vertical ish */}
          <path d="M 130,480 Q 125,350 140,200 Q 150,100 160,0" stroke="#f5c842" strokeWidth="3" fill="none" opacity="0.7"/>
          {/* Route 805 */}
          <path d="M 180,480 Q 200,380 185,300 Q 175,230 190,150" stroke="#e8b84b" strokeWidth="2" fill="none" opacity="0.5"/>

          {/* تسميات الطرق */}
          <rect x="155" y="272" width="28" height="14" rx="3" fill="#f5c842"/>
          <text x="169" y="282" textAnchor="middle" fontSize="8" fontWeight="800" fill="#333">85</text>
          <rect x="122" y="380" width="24" height="14" rx="3" fill="#f5c842"/>
          <text x="134" y="390" textAnchor="middle" fontSize="8" fontWeight="800" fill="#333">70</text>

          {/* المناطق */}
          {ZONES.map(zone => {
            const c = toSVG(zone.lat, zone.lng);
            const isSelected = selected?.id === zone.id;
            return (
              <g
                key={zone.id}
                className="zone-circle"
                onClick={() => handleSelect(zone)}
                style={{ cursor: "pointer" }}
              >
                {/* ظل */}
                <circle cx={c.x+1} cy={c.y+2} r={isSelected ? 20 : 16} fill="rgba(0,0,0,0.12)"/>
                {/* الدائرة */}
                <circle
                  cx={c.x} cy={c.y} r={isSelected ? 20 : 16}
                  fill={isSelected ? C.red : "white"}
                  stroke={C.red}
                  strokeWidth={isSelected ? 0 : 2}
                />
                {/* أيقونة pin */}
                <text x={c.x} y={c.y + 5} textAnchor="middle" fontSize={isSelected ? 16 : 13} fill={isSelected ? "white" : C.red}>
                  ●
                </text>
                {/* اسم المنطقة تحت الدائرة */}
                <text
                  x={c.x} y={c.y + (isSelected ? 33 : 29)}
                  textAnchor="middle"
                  fontSize={isSelected ? 9 : 7.5}
                  fontWeight={isSelected ? "900" : "700"}
                  fill={isSelected ? C.red : C.dark}
                >
                  {zone.name}
                </text>
              </g>
            );
          })}

          {/* compass */}
          <g transform="translate(310, 30)">
            <circle cx="0" cy="0" r="16" fill="white" opacity="0.85"/>
            <text x="0" y="-5" textAnchor="middle" fontSize="9" fontWeight="900" fill={C.dark}>N</text>
            <text x="0" y="8"  textAnchor="middle" fontSize="7" fill={C.gray}>↑</text>
          </g>

          {/* logo منطقة الجليل */}
          <text x="14" y="20" fontSize="9" fill={C.gray} fontWeight="700" opacity="0.6">הגליל המערבי</text>
        </svg>
      </div>

      {/* ── Selected Card ── */}
      {selected && (
        <div style={{
          position: "absolute", bottom: 72, left: 0, right: 0, zIndex: 50,
          background: "white", borderRadius: "22px 22px 0 0",
          padding: "14px 20px 18px",
          boxShadow: "0 -6px 28px rgba(0,0,0,0.13)",
          animation: "slideUp 0.3s ease",
        }}>
          <div style={{ width: 36, height: 4, background: "#E5E7EB", borderRadius: 2, margin: "0 auto 14px" }}/>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: "rgba(200,16,46,0.08)", border: "1.5px solid rgba(200,16,46,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill={C.red}>
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 900, color: C.dark }}>{selected.name}</div>
              <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 700, marginTop: 2 }}>✓ אזור פעיל • משלוח זמין</div>
            </div>
            <button onClick={() => setSelected(null)} style={{
              background: "#F3F4F6", border: "none", borderRadius: "50%",
              width: 30, height: 30, cursor: "pointer", fontSize: 14, color: C.gray,
            }}>✕</button>
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

      {/* ── Bottom Nav ── */}
      <div style={{ flexShrink: 0, zIndex: 10 }}>
        <BottomNav cartCount={cartCount}/>
      </div>
    </div>
  );
}
