// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  AddressPickerPage.jsx — ✅ Fixed v3
//  - Leaflet via npm (no CDN script tag)
//  - Nominatim debounce (600ms) + cache (no duplicate calls)
//  - Dark mode tile layer
//  - Pin bounce animation on drag
//  - Geolocation with better error handling
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const C = { red: "#C8102E", dark: "#111827", gray: "#6B7280", light: "#F9FAFB" };

const TILE_LIGHT = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const TILE_DARK  = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

// ── Nominatim cache — persists for the session ───
const geocodeCache = new Map();

export default function AddressPickerPage({ onAddressSave }) {
  const navigate  = useNavigate();
  const mapRef    = useRef(null);
  const leafRef   = useRef(null);
  const tileRef   = useRef(null);
  const debounceRef = useRef(null);
  const [step,    setStep]    = useState("map");
  const [address, setAddress] = useState("מחפש כתובת...");
  const [coords,  setCoords]  = useState({ lat: 32.93, lng: 35.28 });
  const [details, setDetails] = useState({ street: "", building: "", floor: "", apt: "", notes: "", type: "בית" });
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [darkMode, setDarkMode] = useState(
    () => window.matchMedia?.("(prefers-color-scheme: dark)").matches
  );

  // ── Nominatim reverse geocode with debounce + cache ──
  const reverseGeocode = useCallback(async (lat, lng) => {
    const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;

    // Return from cache immediately
    if (geocodeCache.has(key)) {
      const cached = geocodeCache.get(key);
      setAddress(cached.display);
      setDetails(p => ({ ...p, street: cached.street }));
      return;
    }

    setLoading(true);
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=he`,
        { headers: { "Accept-Language": "he" } }
      );
      const d = await r.json();
      const a = d.address || {};
      const street = a.road || a.pedestrian || a.suburb || "";
      const city   = a.city || a.town || a.village || a.county || "";
      const num    = a.house_number || "";
      const streetFull = `${street}${num ? " " + num : ""}`;
      const display = `${streetFull}${city ? ", " + city : ""}` || d.display_name?.split(",")[0] || "מיקום נבחר";

      // Save to cache
      geocodeCache.set(key, { display, street: streetFull });

      setAddress(display);
      if (streetFull) setDetails(p => ({ ...p, street: streetFull }));
    } catch {
      setAddress("מיקום נבחר");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Debounced version ─────────────────────────────
  const debouncedGeocode = useCallback((lat, lng) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      reverseGeocode(lat, lng);
    }, 600);
  }, [reverseGeocode]);

  // ── Init map ──────────────────────────────────────
  useEffect(() => {
    if (step !== "map" || !mapRef.current || leafRef.current) return;

    const map = L.map(mapRef.current, {
      center: [coords.lat, coords.lng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    });

    const tile = L.tileLayer(darkMode ? TILE_DARK : TILE_LIGHT, { maxZoom: 19 });
    tile.addTo(map);
    tileRef.current = tile;
    leafRef.current = map;

    // Try to get current location
    navigator.geolocation?.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCoords({ lat, lng });
        map.setView([lat, lng], 16);
        reverseGeocode(lat, lng);
      },
      () => {
        // Fallback: geocode the default center
        reverseGeocode(coords.lat, coords.lng);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );

    // Drag events for pin bounce
    map.on("movestart", () => setDragging(true));
    map.on("moveend",   () => {
      setDragging(false);
      const { lat, lng } = map.getCenter();
      setCoords({ lat, lng });
      debouncedGeocode(lat, lng);
    });

    return () => {
      clearTimeout(debounceRef.current);
      map.remove();
      leafRef.current = null;
      tileRef.current = null;
    };
  }, [step]);

  // ── Sync dark/light tile ──────────────────────────
  useEffect(() => {
    tileRef.current?.setUrl(darkMode ? TILE_DARK : TILE_LIGHT);
  }, [darkMode]);

  // ── Save handler ──────────────────────────────────
  function handleSave() {
    const full = [
      details.street,
      details.building && `בניין ${details.building}`,
      details.floor    && `קומה ${details.floor}`,
      details.apt      && `דירה ${details.apt}`,
    ].filter(Boolean).join(", ");

    onAddressSave?.({ address: full || address, coords, type: details.type, notes: details.notes });
    navigate(-1);
  }

  const INPUT_STYLE = {
    width: "100%", border: "1px solid #E5E7EB", borderRadius: 12,
    padding: "13px 14px", fontSize: 14, outline: "none",
    background: "white", textAlign: "right", fontFamily: "Arial,sans-serif",
    boxSizing: "border-box", color: C.dark,
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "white", fontFamily: "Arial,sans-serif", direction: "rtl", display: "flex", flexDirection: "column", zIndex: 200 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .addr-btn:active { transform: scale(0.95); }
        input:focus, textarea:focus { border-color: ${C.red} !important; box-shadow: 0 0 0 3px rgba(200,16,46,0.1); }
        .shimmer { background: linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%); background-size: 200% 100%; animation: shimmer 1.2s infinite; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        background: "white", padding: "12px 16px",
        borderBottom: "1px solid #F3F4F6",
        display: "flex", alignItems: "center", gap: 12, flexShrink: 0,
      }}>
        <button className="addr-btn" onClick={() => step === "details" ? setStep("map") : navigate(-1)} style={{
          background: "none", border: "none", cursor: "pointer",
          width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: 10, backgroundColor: C.light,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.dark} strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: C.dark }}>
            {step === "map" ? "בחר מיקום" : "פרטי מיקום"}
          </div>
        </div>

        {step === "map" ? (
          <button className="addr-btn" onClick={() => setDarkMode(d => !d)} style={{
            background: C.light, border: "none", borderRadius: 10,
            width: 36, height: 36, cursor: "pointer", fontSize: 16,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {darkMode ? "☀️" : "🌙"}
          </button>
        ) : (
          <button className="addr-btn" onClick={handleSave} style={{
            background: C.red, border: "none", borderRadius: 10,
            padding: "7px 14px", color: "white", fontSize: 13, fontWeight: 800, cursor: "pointer",
          }}>שמור</button>
        )}
      </div>

      {/* ══ STEP 1: MAP ══ */}
      {step === "map" && (
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <div ref={mapRef} style={{ width: "100%", height: "100%" }}/>

          {/* Center pin — bounces while dragging */}
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: `translate(-50%, ${dragging ? "-115%" : "-100%"})`,
            transition: "transform 0.15s cubic-bezier(0.34,1.56,0.64,1)",
            zIndex: 1000, pointerEvents: "none",
            filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))",
          }}>
            <div style={{
              width: 44, height: 44, background: "white",
              border: `3.5px solid ${C.red}`, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22,
            }}>📍</div>
            <div style={{
              width: 0, height: 0,
              borderLeft: "8px solid transparent",
              borderRight: "8px solid transparent",
              borderTop: `12px solid ${C.red}`,
              margin: "0 auto",
              opacity: dragging ? 0 : 1,
              transition: "opacity 0.15s",
            }}/>
          </div>

          {/* My location button */}
          <button className="addr-btn"
            onClick={() => navigator.geolocation?.getCurrentPosition(p => {
              leafRef.current?.setView([p.coords.latitude, p.coords.longitude], 17);
            })}
            style={{
              position: "absolute", left: 16, top: 16, zIndex: 1000,
              background: "white", border: "none", borderRadius: "50%",
              width: 44, height: 44, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
            }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>
              <circle cx="12" cy="12" r="9" strokeDasharray="2 2"/>
            </svg>
          </button>

          {/* Zoom controls */}
          <div style={{
            position: "absolute", left: 16, bottom: 180, zIndex: 1000,
            display: "flex", flexDirection: "column", gap: 6,
          }}>
            {[["+", 1], ["-", -1]].map(([l, d]) => (
              <button key={l} className="addr-btn"
                onClick={() => leafRef.current?.setZoom((leafRef.current.getZoom() || 15) + d)}
                style={{
                  background: "white", border: "1px solid #E5E7EB", borderRadius: 10,
                  width: 36, height: 36, fontSize: 18, fontWeight: 700, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)", color: C.dark,
                }}>{l}
              </button>
            ))}
          </div>

          {/* Bottom address bar */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 1000,
            background: "white", borderRadius: "20px 20px 0 0",
            padding: "16px 16px 24px",
            boxShadow: "0 -4px 20px rgba(0,0,0,0.1)",
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: C.light, borderRadius: 14, padding: "12px 14px", marginBottom: 14,
            }}>
              <div style={{ width: 36, height: 36, background: C.red, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {loading ? (
                  <div className="shimmer" style={{ height: 14, borderRadius: 7, width: "70%" }}/>
                ) : (
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.dark, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {address}
                  </div>
                )}
                <div style={{ fontSize: 11, color: C.gray, marginTop: 3 }}>גרור את המפה לבחירת מיקום מדויק</div>
              </div>
            </div>

            <button className="addr-btn" onClick={() => setStep("details")} style={{
              width: "100%", background: `linear-gradient(135deg, ${C.red}, #a00020)`,
              border: "none", borderRadius: 16, padding: "15px",
              color: "white", fontSize: 15, fontWeight: 900, cursor: "pointer",
              boxShadow: "0 4px 16px rgba(200,16,46,0.35)",
              opacity: loading ? 0.7 : 1,
            }}>
              {loading ? "מחפש כתובת..." : "אשר מיקום ←"}
            </button>
          </div>
        </div>
      )}

      {/* ══ STEP 2: DETAILS ══ */}
      {step === "details" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>

          {/* Address preview */}
          <div style={{ background: `rgba(200,16,46,0.05)`, border: `1px solid rgba(200,16,46,0.15)`, borderRadius: 14, padding: "12px 14px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, background: C.red, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{address}</div>
              <button onClick={() => setStep("map")} style={{ background: "none", border: "none", color: C.red, fontSize: 11, fontWeight: 700, cursor: "pointer", padding: 0, marginTop: 2 }}>
                שנה מיקום
              </button>
            </div>
          </div>

          {/* Address type */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.dark, marginBottom: 10 }}>סוג המיקום</div>
            <div style={{ display: "flex", gap: 8 }}>
              {["בית", "משרד", "מיקום אחר"].map(t => (
                <button key={t} onClick={() => setDetails(p => ({ ...p, type: t }))} style={{
                  flex: 1, padding: "10px 8px", borderRadius: 12, cursor: "pointer",
                  border: `1.5px solid ${details.type === t ? C.red : "#E5E7EB"}`,
                  background: details.type === t ? `rgba(200,16,46,0.06)` : "white",
                  color: details.type === t ? C.red : C.gray,
                  fontSize: 12, fontWeight: 700,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  transition: "all 0.15s",
                }}>
                  <span style={{ fontSize: 18 }}>{t === "בית" ? "🏠" : t === "משרד" ? "🏢" : "📍"}</span>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Street */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.gray, marginBottom: 6 }}>שם רחוב</div>
            <input style={INPUT_STYLE} value={details.street}
              onChange={e => setDetails(p => ({ ...p, street: e.target.value }))}
              placeholder="שם הרחוב ומספר הבית"/>
          </div>

          {/* Building + Floor */}
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.gray, marginBottom: 6 }}>בניין</div>
              <input style={INPUT_STYLE} value={details.building}
                onChange={e => setDetails(p => ({ ...p, building: e.target.value }))}
                placeholder="מס׳ בניין"/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.gray, marginBottom: 6 }}>קומה</div>
              <input style={INPUT_STYLE} value={details.floor} type="number" min="0"
                onChange={e => setDetails(p => ({ ...p, floor: e.target.value }))}
                placeholder="קומה"/>
            </div>
          </div>

          {/* Apartment */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.gray, marginBottom: 6 }}>דירה (אופציונלי)</div>
            <input style={INPUT_STYLE} value={details.apt}
              onChange={e => setDetails(p => ({ ...p, apt: e.target.value }))}
              placeholder="מספר דירה"/>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.gray, marginBottom: 6 }}>הוראות לשליח</div>
            <textarea style={{ ...INPUT_STYLE, minHeight: 70, resize: "none" }}
              value={details.notes}
              onChange={e => setDetails(p => ({ ...p, notes: e.target.value }))}
              placeholder="לדוגמה: ליד סניף הדואר הראשי..."/>
          </div>

          {/* Save */}
          <button className="addr-btn" onClick={handleSave} style={{
            width: "100%", background: `linear-gradient(135deg, ${C.red}, #a00020)`,
            border: "none", borderRadius: 16, padding: "16px",
            color: "white", fontSize: 15, fontWeight: 900, cursor: "pointer",
            boxShadow: "0 4px 16px rgba(200,16,46,0.35)",
            marginBottom: 32,
          }}>
            שמור מיקום ✓
          </button>
        </div>
      )}
    </div>
  );
}
