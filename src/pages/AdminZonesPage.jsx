// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  AdminZonesPage.jsx — ✅ Fixed v3
//  - Leaflet via npm (no CDN script tag)
//  - Zones loaded from Supabase (not hardcoded!)
//  - Dark mode tile layer
//  - Add / Edit / Delete zones from UI
//  - All drawing tools preserved
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "../lib/supabase";

const RED  = "#C8102E";
const DARK = "#0f172a";

const TOOLS = [
  { id: "polygon", icon: "✏️", label: "מצולע חופשי" },
  { id: "circle",  icon: "⭕", label: "עיגול" },
  { id: "rect",    icon: "▭",  label: "מלבן" },
  { id: "edit",    icon: "🔧", label: "עריכת נקודות" },
];

const COLORS = ["#C8102E","#2563eb","#16a34a","#9333ea","#f97316","#0891b2","#be123c","#4338ca"];

const TILE_LIGHT = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const TILE_DARK  = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

export default function AdminZonesPage() {
  const navigate = useNavigate();
  const mapRef   = useRef(null);
  const leafRef  = useRef(null);
  const tileRef  = useRef(null);
  const stateRef = useRef({
    tool: "polygon", zoneId: null, drawing: false,
    points: [], tempMarkers: [], tempPoly: null,
    allLayers: {}, history: [],
    circleCenter: null, circleMarker: null, circleLayer: null,
    rectStart: null, rectLayer: null,
  });

  const [zones,      setZones]      = useState([]);  // loaded from Supabase
  const [activeZone, setActiveZone] = useState(null);
  const [activeTool, setActiveTool] = useState("polygon");
  const [savedIds,   setSavedIds]   = useState(new Set());
  const [saving,     setSaving]     = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [msg,        setMsg]        = useState(null);
  const [pointCount, setPointCount] = useState(0);
  const [opacity,    setOpacity]    = useState(0.3);
  const [strokeW,    setStrokeW]    = useState(2.5);
  const [darkMode,   setDarkMode]   = useState(false);

  // New zone form
  const [newZoneName,  setNewZoneName]  = useState("");
  const [newZoneColor, setNewZoneColor] = useState(RED);
  const [showAddForm,  setShowAddForm]  = useState(false);

  // ── Load zones from Supabase ──────────────────────
  useEffect(() => {
    async function fetchZones() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("delivery_zones")
          .select("*")
          .order("sort_order", { ascending: true });
        if (error) throw error;
        setZones(data || []);
        const ids = new Set((data || []).filter(z => z.polygon).map(z => z.id));
        setSavedIds(ids);
      } catch (e) {
        showMsg("שגיאה בטעינת אזורים: " + e.message, "error");
      } finally {
        setLoading(false);
      }
    }
    fetchZones();
  }, []);

  // ── Init map ──────────────────────────────────────
  useEffect(() => {
    if (loading || !mapRef.current || leafRef.current) return;
    const map = L.map(mapRef.current, {
      center: [32.930, 35.345], zoom: 11,
      zoomControl: false, attributionControl: false,
    });

    const tile = L.tileLayer(TILE_LIGHT, { maxZoom: 19 });
    tile.addTo(map);
    tileRef.current = tile;
    leafRef.current = map;

    map.on("click",     onMapClick);
    map.on("dblclick",  onMapDblClick);
    map.on("mousemove", onMapMouseMove);

    return () => { map.remove(); leafRef.current = null; tileRef.current = null; };
  }, [loading]);

  // ── Sync dark tile ────────────────────────────────
  useEffect(() => {
    tileRef.current?.setUrl(darkMode ? TILE_DARK : TILE_LIGHT);
  }, [darkMode]);

  // ── Helpers ───────────────────────────────────────
  function showMsg(text, type = "success") {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3500);
  }

  function getActiveColor() {
    const z = zones.find(z => z.id === stateRef.current.zoneId);
    return z?.color || RED;
  }

  function clearTemp() {
    const map = leafRef.current;
    if (!map) return;
    const s = stateRef.current;
    s.tempMarkers.forEach(m => map.removeLayer(m));
    s.tempMarkers = [];
    if (s.tempPoly)    { map.removeLayer(s.tempPoly);    s.tempPoly    = null; }
    if (s.circleMarker){ map.removeLayer(s.circleMarker); s.circleMarker = null; }
    if (s.circleLayer) { map.removeLayer(s.circleLayer);  s.circleLayer  = null; }
    if (s.rectLayer)   { map.removeLayer(s.rectLayer);    s.rectLayer    = null; }
    s.points       = [];
    s.drawing      = false;
    s.circleCenter = null;
    s.rectStart    = null;
    setPointCount(0);
  }

  function onMapClick(e) {
    const s = stateRef.current;
    if (!s.zoneId) { showMsg("בחר אזור תחילה", "error"); return; }
    const map   = leafRef.current;
    const color = getActiveColor();

    if (s.tool === "polygon") {
      s.drawing = true;
      s.points.push([e.latlng.lat, e.latlng.lng]);
      setPointCount(s.points.length);
      const dot = L.circleMarker(e.latlng, { radius: 5, color, fillColor: color, fillOpacity: 1, weight: 2 }).addTo(map);
      s.tempMarkers.push(dot);
      if (s.points.length >= 2) {
        if (s.tempPoly) map.removeLayer(s.tempPoly);
        s.tempPoly = L.polygon(s.points, { color, weight: strokeW, fillOpacity: opacity, dashArray: "6,3" }).addTo(map);
      }
    } else if (s.tool === "circle") {
      if (!s.circleCenter) {
        s.circleCenter = e.latlng;
        const m = L.circleMarker(e.latlng, { radius: 7, color, fillColor: color, fillOpacity: 1 }).addTo(map);
        s.circleMarker = m;
        showMsg("לחץ על נקודה שנייה לקביעת הרדיוס", "info");
      } else {
        const radius = s.circleCenter.distanceTo(e.latlng);
        if (s.circleMarker) map.removeLayer(s.circleMarker);
        if (s.circleLayer)  map.removeLayer(s.circleLayer);
        const circle = L.circle(s.circleCenter, { radius, color, weight: strokeW, fillOpacity: opacity }).addTo(map);
        s.circleLayer  = circle;
        s.circleCenter = null;
        setPointCount(1);
      }
    } else if (s.tool === "rect") {
      if (!s.rectStart) {
        s.rectStart = e.latlng;
        showMsg("לחץ על פינה שנייה", "info");
      } else {
        if (s.rectLayer) map.removeLayer(s.rectLayer);
        const bounds = L.latLngBounds(s.rectStart, e.latlng);
        const rect   = L.rectangle(bounds, { color, weight: strokeW, fillOpacity: opacity }).addTo(map);
        s.rectLayer = rect;
        s.rectStart = null;
        setPointCount(1);
      }
    }
  }

  function onMapDblClick(e) {
    const s = stateRef.current;
    if (s.tool !== "polygon" || s.points.length < 3) return;
    L.DomEvent.stopPropagation(e);
    finishPolygon();
  }

  function onMapMouseMove(e) {
    const s = stateRef.current;
    if (s.tool !== "polygon" || !s.drawing || s.points.length < 1) return;
    const preview = [...s.points, [e.latlng.lat, e.latlng.lng]];
    if (s.tempPoly) { leafRef.current?.removeLayer(s.tempPoly); }
    s.tempPoly = L.polygon(preview, {
      color: getActiveColor(), weight: strokeW, fillOpacity: opacity * 0.5, dashArray: "6,3",
    }).addTo(leafRef.current);
  }

  function finishPolygon() {
    const s   = stateRef.current;
    const map = leafRef.current;
    if (!map || s.points.length < 3) { showMsg("נדרשות לפחות 3 נקודות", "error"); return; }
    const color = getActiveColor();
    if (s.tempPoly) map.removeLayer(s.tempPoly);
    s.tempMarkers.forEach(m => map.removeLayer(m));
    const poly = L.polygon(s.points, { color, weight: strokeW, fillOpacity: opacity }).addTo(map);
    storeLayer(poly);
    s.points      = [];
    s.tempMarkers = [];
    s.tempPoly    = null;
    s.drawing     = false;
    setPointCount(0);
    showMsg("מצולע נוצר! לחץ שמור לשמירה.");
  }

  function storeLayer(layer) {
    const s  = stateRef.current;
    const id = s.zoneId;
    if (!id) return;
    const map = leafRef.current;
    if (stateRef.current.allLayers[id]) map.removeLayer(stateRef.current.allLayers[id]);
    stateRef.current.allLayers[id] = layer;
    layer.on("click", () => {
      setActiveZone(id);
      stateRef.current.zoneId = id;
    });
  }

  // ── Save zone to Supabase ──────────────────────────
  async function saveZone() {
    const s   = stateRef.current;
    const id  = s.zoneId;
    if (!id) { showMsg("בחר אזור תחילה", "error"); return; }
    const layer = stateRef.current.allLayers[id];
    if (!layer)  { showMsg("צייר אזור תחילה", "error"); return; }
    setSaving(true);
    try {
      let polygon = null;
      if (layer instanceof L.Polygon) {
        const latlngs = layer.getLatLngs()[0];
        polygon = { type: "Polygon", coordinates: [latlngs.map(p => [p.lng, p.lat])] };
      } else if (layer instanceof L.Circle) {
        polygon = { type: "Circle", center: [layer.getLatLng().lng, layer.getLatLng().lat], radius: layer.getRadius() };
      } else if (layer instanceof L.Rectangle) {
        const b = layer.getBounds();
        polygon = { type: "Rectangle", bounds: [[b.getSouthWest().lat, b.getSouthWest().lng], [b.getNorthEast().lat, b.getNorthEast().lng]] };
      }

      const { error } = await supabase
        .from("delivery_zones")
        .update({ polygon, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
      setSavedIds(prev => new Set([...prev, id]));
      showMsg("✅ האזור נשמר בהצלחה!");
    } catch (e) {
      showMsg("שגיאה בשמירה: " + e.message, "error");
    } finally {
      setSaving(false);
    }
  }

  // ── Add new zone ──────────────────────────────────
  async function addZone() {
    if (!newZoneName.trim()) { showMsg("הכנס שם לאזור", "error"); return; }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("delivery_zones")
        .insert({
          name: newZoneName.trim(),
          color: newZoneColor,
          is_active: true,
          sort_order: zones.length,
        })
        .select()
        .single();
      if (error) throw error;
      setZones(prev => [...prev, data]);
      setNewZoneName("");
      setShowAddForm(false);
      showMsg("✅ אזור חדש נוצר!");
    } catch (e) {
      showMsg("שגיאה ביצירת אזור: " + e.message, "error");
    } finally {
      setSaving(false);
    }
  }

  // ── Toggle zone active ────────────────────────────
  async function toggleZone(zone) {
    try {
      const { error } = await supabase
        .from("delivery_zones")
        .update({ is_active: !zone.is_active })
        .eq("id", zone.id);
      if (error) throw error;
      setZones(prev => prev.map(z => z.id === zone.id ? { ...z, is_active: !z.is_active } : z));
      showMsg(zone.is_active ? "אזור הושהה" : "אזור הופעל");
    } catch (e) {
      showMsg("שגיאה: " + e.message, "error");
    }
  }

  // ── Delete zone ───────────────────────────────────
  async function deleteZone(zoneId) {
    if (!confirm("למחוק אזור זה?")) return;
    try {
      const { error } = await supabase.from("delivery_zones").delete().eq("id", zoneId);
      if (error) throw error;
      const map = leafRef.current;
      if (map && stateRef.current.allLayers[zoneId]) {
        map.removeLayer(stateRef.current.allLayers[zoneId]);
        delete stateRef.current.allLayers[zoneId];
      }
      setZones(prev => prev.filter(z => z.id !== zoneId));
      if (activeZone === zoneId) { setActiveZone(null); stateRef.current.zoneId = null; }
      showMsg("🗑️ האזור נמחק");
    } catch (e) {
      showMsg("שגיאה: " + e.message, "error");
    }
  }

  function undo() {
    const s = stateRef.current;
    if (s.points.length > 0) {
      s.points.pop();
      setPointCount(s.points.length);
      const last = s.tempMarkers.pop();
      if (last) leafRef.current?.removeLayer(last);
      if (s.tempPoly) { leafRef.current?.removeLayer(s.tempPoly); s.tempPoly = null; }
      if (s.points.length >= 2) {
        s.tempPoly = L.polygon(s.points, { color: getActiveColor(), weight: strokeW, fillOpacity: opacity, dashArray: "6,3" }).addTo(leafRef.current);
      }
    }
  }

  // ── Render ────────────────────────────────────────
  return (
    <div style={{ position: "fixed", inset: 0, fontFamily: "Arial,sans-serif", direction: "rtl", display: "flex", background: "#F8FAFC" }}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .zBtn:active { transform: scale(0.93); }
        .leaflet-container { background: #e8e4dc !important; }
      `}</style>

      {/* ── Sidebar ── */}
      <div style={{ width: 280, background: "white", borderLeft: "1px solid #E5E7EB", display: "flex", flexDirection: "column", zIndex: 100, overflowY: "auto" }}>

        {/* Header */}
        <div style={{ padding: "16px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 10 }}>
          <button className="zBtn" onClick={() => navigate(-1)} style={{ background: "#F3F4F6", border: "none", borderRadius: 10, width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: DARK }}>ניהול אזורים</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>{zones.length} אזורים בסה״כ</div>
          </div>
          <button className="zBtn" onClick={() => setDarkMode(d => !d)} style={{ background: "#F3F4F6", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ padding: 24, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid #E5E7EB", borderTopColor: RED, animation: "spin 0.8s linear infinite" }}/>
            <span style={{ fontSize: 13, color: "#64748b" }}>טוען אזורים...</span>
          </div>
        )}

        {/* Zones list */}
        {!loading && zones.map(zone => (
          <div
            key={zone.id}
            onClick={() => { setActiveZone(zone.id); stateRef.current.zoneId = zone.id; clearTemp(); }}
            style={{
              padding: "12px 16px", cursor: "pointer",
              background: activeZone === zone.id ? "rgba(200,16,46,0.05)" : "transparent",
              borderBottom: "1px solid #F1F5F9",
              borderRight: activeZone === zone.id ? `3px solid ${zone.color || RED}` : "3px solid transparent",
              transition: "all 0.15s",
            }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: zone.color || RED, flexShrink: 0 }}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{zone.name}</div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2, display: "flex", gap: 6 }}>
                  {savedIds.has(zone.id) && <span style={{ color: "#16a34a" }}>✓ שמור</span>}
                  <span style={{ color: zone.is_active ? "#16a34a" : "#ef4444" }}>
                    {zone.is_active ? "פעיל" : "מושהה"}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <button className="zBtn" onClick={e => { e.stopPropagation(); toggleZone(zone); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, padding: "2px 4px" }} title="הפעל/השהה">
                  {zone.is_active ? "⏸" : "▶️"}
                </button>
                <button className="zBtn" onClick={e => { e.stopPropagation(); deleteZone(zone.id); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, padding: "2px 4px" }} title="מחק">
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Add zone form */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid #F1F5F9", marginTop: "auto" }}>
          {showAddForm ? (
            <div style={{ animation: "fadeIn 0.2s ease" }}>
              <input
                value={newZoneName}
                onChange={e => setNewZoneName(e.target.value)}
                placeholder="שם האזור החדש"
                onKeyDown={e => e.key === "Enter" && addZone()}
                style={{ width: "100%", border: "1px solid #E5E7EB", borderRadius: 10, padding: "10px 12px", fontSize: 13, outline: "none", marginBottom: 10, textAlign: "right" }}
              />
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                {COLORS.map(c => (
                  <div key={c} onClick={() => setNewZoneColor(c)} style={{ width: 22, height: 22, borderRadius: "50%", background: c, cursor: "pointer", border: newZoneColor === c ? "2px solid #000" : "2px solid transparent", transition: "transform 0.1s", transform: newZoneColor === c ? "scale(1.2)" : "scale(1)" }}/>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="zBtn" onClick={addZone} disabled={saving} style={{ flex: 1, background: RED, color: "white", border: "none", borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
                  {saving ? "..." : "צור אזור"}
                </button>
                <button className="zBtn" onClick={() => { setShowAddForm(false); setNewZoneName(""); }} style={{ background: "#F1F5F9", color: "#64748b", border: "none", borderRadius: 10, padding: "10px 14px", cursor: "pointer" }}>
                  ביטול
                </button>
              </div>
            </div>
          ) : (
            <button className="zBtn" onClick={() => setShowAddForm(true)} style={{ width: "100%", background: "rgba(200,16,46,0.07)", border: `1px dashed rgba(200,16,46,0.3)`, borderRadius: 12, padding: "11px", color: RED, fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
              + הוסף אזור חדש
            </button>
          )}
        </div>
      </div>

      {/* ── Map area ── */}
      <div style={{ flex: 1, position: "relative" }}>
        <div ref={mapRef} style={{ width: "100%", height: "100%" }}/>

        {/* Loading overlay */}
        {loading && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #E5E7EB", borderTopColor: RED, animation: "spin 0.8s linear infinite" }}/>
          </div>
        )}

        {/* Top toolbar */}
        <div style={{ position: "absolute", top: 12, right: 12, zIndex: 1000, display: "flex", gap: 6 }}>
          {TOOLS.map(t => (
            <button key={t.id} className="zBtn"
              onClick={() => { setActiveTool(t.id); stateRef.current.tool = t.id; clearTemp(); }}
              title={t.label}
              style={{
                padding: "7px 12px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700,
                background: activeTool === t.id ? RED : "white",
                color: activeTool === t.id ? "white" : DARK,
                border: activeTool === t.id ? `1px solid ${RED}` : "1px solid #E5E7EB",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                display: "flex", alignItems: "center", gap: 5,
              }}>
              <span>{t.icon}</span>
              <span style={{ display: window.innerWidth > 600 ? "inline" : "none" }}>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Opacity / stroke controls */}
        <div style={{ position: "absolute", top: 60, right: 12, zIndex: 1000, background: "white", borderRadius: 12, padding: "10px 14px", boxShadow: "0 2px 12px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", gap: 8, minWidth: 160 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "#64748b" }}>
            <span>שקיפות</span>
            <span style={{ fontWeight: 700 }}>{Math.round(opacity * 100)}%</span>
          </div>
          <input type="range" min="0" max="100" value={Math.round(opacity * 100)}
            onChange={e => setOpacity(e.target.value / 100)}
            style={{ width: "100%", accentColor: RED }}/>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "#64748b" }}>
            <span>עובי קו</span>
            <span style={{ fontWeight: 700 }}>{strokeW}px</span>
          </div>
          <input type="range" min="1" max="8" step="0.5" value={strokeW}
            onChange={e => setStrokeW(parseFloat(e.target.value))}
            style={{ width: "100%", accentColor: RED }}/>
        </div>

        {/* Zoom controls */}
        <div style={{ position: "absolute", left: 12, bottom: 100, zIndex: 1000, display: "flex", flexDirection: "column", gap: 6 }}>
          {[["+", 1], ["-", -1]].map(([l, d]) => (
            <button key={l} className="zBtn"
              onClick={() => leafRef.current?.setZoom((leafRef.current.getZoom() || 11) + d)}
              style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 10, width: 36, height: 36, fontSize: 18, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", color: DARK }}>
              {l}
            </button>
          ))}
        </div>

        {/* Bottom action bar */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 1000, background: "white", borderTop: "1px solid #E5E7EB", padding: "10px 16px", display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ flex: 1, fontSize: 12, color: "#64748b" }}>
            {!activeZone
              ? "בחר אזור מהרשימה לציור"
              : activeTool === "polygon" && pointCount > 0
              ? `${pointCount} נקודות — לחץ פעמיים לסיום`
              : activeTool === "polygon"
              ? "לחץ על המפה להוספת נקודות"
              : activeTool === "circle"
              ? "לחץ על מרכז העיגול"
              : activeTool === "rect"
              ? "לחץ על פינה ראשונה"
              : "מצב עריכה"}
          </div>

          {activeTool === "polygon" && pointCount >= 3 && (
            <button className="zBtn" onClick={finishPolygon} style={{ background: "#2563eb", color: "white", border: "none", borderRadius: 10, padding: "9px 14px", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
              סיים מצולע ✓
            </button>
          )}
          {pointCount > 0 && (
            <button className="zBtn" onClick={undo} style={{ background: "#F1F5F9", color: DARK, border: "none", borderRadius: 10, padding: "9px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              ↩ בטל
            </button>
          )}
          <button className="zBtn" onClick={clearTemp} style={{ background: "#FEF2F2", color: "#ef4444", border: "none", borderRadius: 10, padding: "9px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            נקה
          </button>
          <button className="zBtn" onClick={saveZone} disabled={saving || !activeZone} style={{ background: saving ? "#94a3b8" : RED, color: "white", border: "none", borderRadius: 10, padding: "9px 18px", fontSize: 13, fontWeight: 900, cursor: saving ? "default" : "pointer", opacity: !activeZone ? 0.5 : 1 }}>
            {saving ? "שומר..." : "💾 שמור"}
          </button>
        </div>

        {/* Toast message */}
        {msg && (
          <div style={{
            position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 2000,
            background: msg.type === "error" ? "#FEF2F2" : msg.type === "info" ? "#EFF6FF" : "#ECFDF5",
            border: `1px solid ${msg.type === "error" ? "#FECACA" : msg.type === "info" ? "#BFDBFE" : "#A7F3D0"}`,
            color: msg.type === "error" ? "#DC2626" : msg.type === "info" ? "#2563EB" : "#059669",
            borderRadius: 12, padding: "10px 18px", fontSize: 13, fontWeight: 700,
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)", animation: "fadeIn 0.2s ease",
            whiteSpace: "nowrap",
          }}>
            {msg.text}
          </div>
        )}
      </div>
    </div>
  );
}
