import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";

const C = { red: "#C8102E", dark: "#111827", gray: "#6B7280" };

// إحداثيات دقيقة محددة يدوياً من Google Maps
const AREAS = [
  {
    id: "rame",
    name: "ראמה - סגור - בית ג׳ן",
    emoji: "🏡",
    lat: 32.9386, lng: 35.3650,
    polygons: [
      // ראמה
      [[32.9520,35.3480],[32.9545,35.3560],[32.9535,35.3650],[32.9505,35.3720],
       [32.9465,35.3770],[32.9425,35.3790],[32.9390,35.3775],[32.9355,35.3730],
       [32.9330,35.3660],[32.9335,35.3580],[32.9365,35.3510],[32.9405,35.3470],
       [32.9455,35.3460],[32.9495,35.3465],[32.9520,35.3480]],
      // סגור
      [[32.9300,35.3570],[32.9320,35.3640],[32.9305,35.3710],[32.9275,35.3740],
       [32.9240,35.3720],[32.9225,35.3660],[32.9235,35.3590],[32.9265,35.3560],
       [32.9300,35.3570]],
      // בית ג'ן
      [[32.9555,35.3910],[32.9580,35.3990],[32.9565,35.4065],[32.9530,35.4105],
       [32.9490,35.4095],[32.9460,35.4050],[32.9450,35.3980],[32.9470,35.3920],
       [32.9510,35.3895],[32.9540,35.3895],[32.9555,35.3910]],
    ],
  },
  {
    id: "karmiel",
    name: "כרמיאל - נחף - שזור - חורפיש",
    emoji: "🏙️",
    lat: 32.9200, lng: 35.3050,
    polygons: [
      // כרמיאל
      [[32.9280,35.2870],[32.9305,35.2960],[32.9295,35.3050],[32.9260,35.3140],
       [32.9215,35.3185],[32.9165,35.3195],[32.9125,35.3160],[32.9105,35.3085],
       [32.9115,35.3005],[32.9150,35.2930],[32.9195,35.2880],[32.9240,35.2860],
       [32.9270,35.2865],[32.9280,35.2870]],
      // נחף — مستطيل صغير شمال كرميئيل
      [[32.9330,35.3155],[32.9350,35.3230],[32.9330,35.3310],[32.9295,35.3335],
       [32.9260,35.3315],[32.9245,35.3245],[32.9265,35.3170],[32.9295,35.3145],
       [32.9330,35.3155]],
      // שזור — شرق كرميئيل
      [[32.9255,35.3320],[32.9275,35.3400],[32.9255,35.3470],[32.9220,35.3495],
       [32.9185,35.3470],[32.9175,35.3395],[32.9195,35.3320],[32.9230,35.3295],
       [32.9255,35.3320]],
      // חורפיש — شمال غرب المنطقة
      [[33.0005,35.2880],[33.0030,35.2960],[33.0020,35.3045],[32.9990,35.3095],
       [32.9955,35.3095],[32.9925,35.3060],[32.9915,35.2985],[32.9935,35.2915],
       [32.9970,35.2875],[33.0000,35.2870],[33.0005,35.2880]],
    ],
  },
  {
    id: "magar",
    name: "מג׳אר",
    emoji: "🌿",
    lat: 32.8980, lng: 35.4028,
    polygons: [
      // מג'אר — من الصورة شكل واضح ممتد للشمال والغرب
      [[32.9085,35.3840],[32.9105,35.3930],[32.9095,35.4020],[32.9060,35.4110],
       [32.9015,35.4170],[32.8975,35.4195],[32.8935,35.4185],[32.8895,35.4145],
       [32.8865,35.4070],[32.8855,35.3990],[32.8865,35.3910],[32.8895,35.3855],
       [32.8940,35.3815],[32.8990,35.3805],[32.9045,35.3815],[32.9085,35.3840]],
    ],
  },
  {
    id: "peki",
    name: "פקיעין - כסרא-סומיע",
    emoji: "🌲",
    lat: 32.9750, lng: 35.3280,
    polygons: [
      // פקיעין — شكل مثلث من الصورة
      [[32.9825,35.3215],[32.9845,35.3300],[32.9825,35.3385],[32.9790,35.3425],
       [32.9750,35.3435],[32.9710,35.3405],[32.9690,35.3340],[32.9700,35.3265],
       [32.9730,35.3215],[32.9770,35.3195],[32.9805,35.3200],[32.9825,35.3215]],
      // כסרא-סומיע — جنوب פקיעין من الصورة
      [[32.9645,35.3095],[32.9665,35.3195],[32.9655,35.3300],[32.9620,35.3385],
       [32.9580,35.3415],[32.9540,35.3390],[32.9510,35.3320],[32.9510,35.3225],
       [32.9540,35.3145],[32.9580,35.3105],[32.9620,35.3085],[32.9645,35.3095]],
    ],
  },
];

export default function MapPage({ cartCount = 0, onAreaSelect }) {
  const navigate   = useNavigate();
  const mapRef     = useRef(null);
  const leafRef    = useRef(null);
  const markersRef = useRef({});
  const polysRef   = useRef([]);
  const [ready,    setReady]    = useState(false);
  const [selected, setSelected] = useState(null);

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

  useEffect(() => {
    if (!ready || !mapRef.current || leafRef.current) return;
    const L = window.L;
    const map = L.map(mapRef.current, {
      center: [32.940, 35.345], zoom: 11,
      zoomControl: false, attributionControl: false,
      minZoom: 9, maxZoom: 16,
    });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      { maxZoom: 19 }).addTo(map);
    leafRef.current = map;
    AREAS.forEach(area => {
      const m = L.marker([area.lat, area.lng], {
        icon: makeIcon(area.id, false), zIndexOffset: 1000,
      }).addTo(map);
      m.on("click", e => { L.DomEvent.stopPropagation(e); onTap(area, map, L); });
      markersRef.current[area.id] = m;
    });
    map.on("click", deselect);
    return () => { map.remove(); leafRef.current = null; markersRef.current = {}; polysRef.current = []; };
  }, [ready]);

  function makeIcon(id, active) {
    return window.L.divIcon({
      html: `<div class="yg-pin"><div class="yg-pin-circle" style="background:${active?C.red:"white"}">
        <svg width="22" height="22" viewBox="0 0 24 24">
          <path fill="${active?"white":C.red}" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg></div><div class="yg-pin-tail"></div></div>`,
      className: "", iconSize: [44, 56], iconAnchor: [22, 56],
    });
  }

  function setPinActive(id, active) {
    const m = markersRef.current[id];
    if (m && window.L) m.setIcon(makeIcon(id, active));
  }

  function clearPolys() {
    polysRef.current.forEach(p => leafRef.current?.removeLayer(p));
    polysRef.current = [];
  }

  function deselect() {
    clearPolys();
    AREAS.forEach(a => setPinActive(a.id, false));
    setSelected(null);
  }

  function onTap(area, map, L) {
    AREAS.forEach(a => setPinActive(a.id, false));
    setPinActive(area.id, true);
    clearPolys();
    setSelected(area);
    const allPts = [];
    area.polygons.forEach(coords => {
      const poly = L.polygon(coords, {
        color: C.red, weight: 2.5, opacity: 0.9,
        fillColor: C.red, fillOpacity: 0.18, smoothFactor: 2,
      }).addTo(map);
      polysRef.current.push(poly);
      allPts.push(...coords);
    });
    map.flyToBounds(L.latLngBounds(allPts), { padding: [60,60], maxZoom: 14, duration: 0.8 });
  }

  return (
    <div style={{position:"fixed",inset:0,fontFamily:"Arial,sans-serif",direction:"rtl"}}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideUp{from{transform:translateY(110%);opacity:0}to{transform:translateY(0);opacity:1}}
        .leaflet-container{background:#e8e0d8!important}
        .mBtn:active{transform:scale(0.9)}
        .yg-pin{display:flex;flex-direction:column;align-items:center}
        .yg-pin-circle{width:44px;height:44px;border-radius:50%;border:2.5px solid ${C.red};display:flex;align-items:center;justify-content:center;box-shadow:0 3px 14px rgba(200,16,46,0.4);transition:all 0.2s ease;cursor:pointer}
        .yg-pin-tail{width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:10px solid ${C.red};margin-top:-1px}
      `}</style>

      <div style={{position:"absolute",top:0,left:0,right:0,zIndex:1000,background:"white",boxShadow:"0 1px 0 rgba(0,0,0,0.08)",padding:"12px 16px",display:"flex",alignItems:"center",gap:12}}>
        <button className="mBtn" onClick={()=>navigate(-1)} style={{background:"#F3F4F6",border:"none",borderRadius:12,width:38,height:38,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{flex:1,textAlign:"center"}}>
          <div style={{fontSize:16,fontWeight:900,color:C.dark}}>בחר אזור משלוח</div>
          <div style={{fontSize:11,marginTop:2,fontWeight:selected?800:400,color:selected?C.red:C.gray,transition:"color 0.25s"}}>
            {selected?`✓ ${selected.name}`:"לחץ על סמן האזור שלך"}
          </div>
        </div>
        <div style={{width:38}}/>
      </div>

      <div ref={mapRef} style={{position:"absolute",top:62,left:0,right:0,bottom:selected?162:80,transition:"bottom 0.35s cubic-bezier(0.34,1.1,0.64,1)"}}/>

      {!ready&&<div style={{position:"absolute",inset:0,zIndex:600,background:"white",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14}}>
        <div style={{width:44,height:44,borderRadius:"50%",border:"3px solid rgba(200,16,46,0.15)",borderTopColor:C.red,animation:"spin 0.8s linear infinite"}}/>
        <div style={{color:C.gray,fontSize:13,fontWeight:700}}>טוען מפה...</div>
      </div>}

      <div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",zIndex:900,display:"flex",flexDirection:"column",gap:6}}>
        {[["+",1],["-",-1]].map(([l,d])=>(
          <button key={l} className="mBtn" onClick={()=>leafRef.current?.setZoom((leafRef.current.getZoom()||11)+d)}
            style={{background:"white",border:"1px solid #E5E7EB",borderRadius:10,width:36,height:36,color:C.dark,fontSize:18,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.1)"}}>
            {l}
          </button>
        ))}
      </div>

      {selected&&(
        <div style={{position:"absolute",bottom:80,left:0,right:0,zIndex:1000,background:"white",borderRadius:"22px 22px 0 0",padding:"14px 20px 18px",boxShadow:"0 -6px 28px rgba(0,0,0,0.13)",animation:"slideUp 0.32s cubic-bezier(0.34,1.1,0.64,1)"}}>
          <div style={{width:36,height:4,background:"#E5E7EB",borderRadius:2,margin:"0 auto 14px"}}/>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
            <div style={{width:48,height:48,borderRadius:14,background:"rgba(200,16,46,0.07)",border:"1.5px solid rgba(200,16,46,0.18)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>
              {selected.emoji}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:16,fontWeight:900,color:C.dark}}>{selected.name}</div>
              <div style={{fontSize:12,marginTop:2,fontWeight:700,color:"#16a34a"}}>✓ אזור פעיל • משלוח זמין</div>
            </div>
            <button className="mBtn" onClick={deselect} style={{background:"#F3F4F6",border:"none",borderRadius:"50%",width:30,height:30,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:C.gray}}>✕</button>
          </div>
          <button className="mBtn" onClick={()=>{onAreaSelect?.(selected);navigate("/");}}
            style={{width:"100%",background:`linear-gradient(135deg,${C.red},#a00020)`,border:"none",borderRadius:16,padding:"15px",color:"white",fontSize:15,fontWeight:900,cursor:"pointer",boxShadow:"0 4px 18px rgba(200,16,46,0.35)"}}>
            {`בחר ${selected.name} ←`}
          </button>
        </div>
      )}

      <div style={{position:"absolute",bottom:0,left:0,right:0,zIndex:999}}>
        <BottomNav cartCount={cartCount}/>
      </div>
    </div>
  );
}
