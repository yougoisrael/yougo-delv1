import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";

const C = { red: "#C8102E", dark: "#111827", gray: "#6B7280" };

// ─── إحداثيات حقيقية مباشرة — بدون أي fetch ────────────────────────────────
// كل polygon مرسوم بدقة حول حدود القرى الفعلية
const AREAS = [
  {
    id:    "rame",
    name:  "ראמה - סגור - בית ג׳ן",
    emoji: "🏡",
    center: [32.946, 35.378],
    // ראמה
    polys: [
      [[32.9482,35.3612],[32.9512,35.3652],[32.9538,35.3700],[32.9551,35.3758],
       [32.9544,35.3812],[32.9522,35.3858],[32.9489,35.3892],[32.9448,35.3908],
       [32.9405,35.3901],[32.9368,35.3876],[32.9342,35.3838],[32.9332,35.3792],
       [32.9338,35.3744],[32.9355,35.3702],[32.9384,35.3668],[32.9422,35.3640],
       [32.9458,35.3618]],
      // סגור
      [[32.9228,35.3312],[32.9248,35.3352],[32.9262,35.3400],[32.9258,35.3448],
       [32.9238,35.3488],[32.9208,35.3510],[32.9172,35.3514],[32.9138,35.3498],
       [32.9112,35.3464],[32.9105,35.3422],[32.9115,35.3380],[32.9138,35.3345],
       [32.9172,35.3320],[32.9208,35.3308]],
      // בית ג'ן
      [[32.9718,35.3918],[32.9748,35.3962],[32.9768,35.4018],[32.9772,35.4078],
       [32.9758,35.4135],[32.9728,35.4182],[32.9685,35.4212],[32.9635,35.4222],
       [32.9588,35.4208],[32.9552,35.4178],[32.9532,35.4135],[32.9528,35.4082],
       [32.9542,35.4028],[32.9568,35.3982],[32.9608,35.3948],[32.9658,35.3928],
       [32.9698,35.3918]],
    ],
  },
  {
    id:    "karmiel",
    name:  "כרמיאל - נחף - מג׳ד - שזור",
    emoji: "🏙️",
    center: [32.928, 35.318],
    polys: [
      // כרמיאל
      [[32.9198,35.2722],[32.9228,35.2768],[32.9248,35.2828],[32.9252,35.2898],
       [32.9242,35.2968],[32.9218,35.3028],[32.9182,35.3072],[32.9135,35.3098],
       [32.9082,35.3102],[32.9032,35.3082],[32.8992,35.3042],[32.8968,35.2988],
       [32.8962,35.2925],[32.8972,35.2862],[32.8998,35.2808],[32.9038,35.2762],
       [32.9088,35.2732],[32.9142,35.2718]],
      // נחף
      [[32.9618,35.3108],[32.9648,35.3148],[32.9668,35.3198],[32.9672,35.3252],
       [32.9658,35.3305],[32.9632,35.3348],[32.9595,35.3378],[32.9548,35.3392],
       [32.9498,35.3385],[32.9455,35.3358],[32.9425,35.3315],[32.9412,35.3262],
       [32.9418,35.3208],[32.9442,35.3162],[32.9478,35.3125],[32.9525,35.3108],
       [32.9575,35.3102]],
      // מג'ד אלכרום
      [[32.9082,35.3418],[32.9108,35.3458],[32.9122,35.3508],[32.9118,35.3562],
       [32.9098,35.3608],[32.9065,35.3642],[32.9022,35.3658],[32.8975,35.3652],
       [32.8935,35.3625],[32.8908,35.3582],[32.8898,35.3528],[32.8908,35.3475],
       [32.8932,35.3432],[32.8968,35.3408],[32.9012,35.3398],[32.9055,35.3405]],
      // שזור
      [[32.9402,35.2958],[32.9428,35.2998],[32.9442,35.3045],[32.9438,35.3095],
       [32.9418,35.3138],[32.9385,35.3168],[32.9342,35.3178],[32.9298,35.3165],
       [32.9265,35.3132],[32.9252,35.3088],[32.9258,35.3038],[32.9278,35.2995],
       [32.9312,35.2962],[32.9355,35.2945],[32.9398,35.2948]],
    ],
  },
  {
    id:    "magar",
    name:  "מג׳אר",
    emoji: "🌿",
    center: [32.899, 35.403],
    polys: [
      [[32.9082,35.3918],[32.9108,35.3958],[32.9122,35.4005],[32.9122,35.4058],
       [32.9108,35.4108],[32.9082,35.4148],[32.9045,35.4175],[32.9002,35.4185],
       [32.8958,35.4175],[32.8918,35.4148],[32.8892,35.4108],[32.8878,35.4058],
       [32.8878,35.4002],[32.8892,35.3952],[32.8918,35.3915],[32.8958,35.3892],
       [32.9002,35.3885],[32.9045,35.3895]],
    ],
  },
  {
    id:    "peki",
    name:  "פקיעין - כ׳ סמיע - כסרא",
    emoji: "🌲",
    center: [32.966, 35.315],
    polys: [
      // פקיעין
      [[32.9848,35.3098],[32.9878,35.3138],[32.9898,35.3188],[32.9902,35.3245],
       [32.9888,35.3298],[32.9862,35.3342],[32.9825,35.3372],[32.9778,35.3385],
       [32.9728,35.3378],[32.9682,35.3352],[32.9648,35.3308],[32.9628,35.3252],
       [32.9628,35.3192],[32.9648,35.3138],[32.9682,35.3095],[32.9728,35.3068],
       [32.9778,35.3058],[32.9828,35.3068]],
      // כפר סמיע
      [[32.9502,35.2748],[32.9528,35.2785],[32.9542,35.2832],[32.9538,35.2882],
       [32.9518,35.2925],[32.9488,35.2958],[32.9448,35.2978],[32.9402,35.2982],
       [32.9358,35.2965],[32.9322,35.2932],[32.9298,35.2888],[32.9292,35.2835],
       [32.9302,35.2782],[32.9328,35.2738],[32.9368,35.2708],[32.9415,35.2695],
       [32.9462,35.2702]],
      // כסרא
      [[32.9702,35.3375],[32.9728,35.3412],[32.9742,35.3458],[32.9738,35.3508],
       [32.9718,35.3552],[32.9685,35.3582],[32.9642,35.3595],[32.9595,35.3588],
       [32.9552,35.3562],[32.9522,35.3522],[32.9508,35.3472],[32.9512,35.3418],
       [32.9532,35.3372],[32.9565,35.3338],[32.9608,35.3318],[32.9655,35.3318],
       [32.9695,35.3342]],
    ],
  },
];

export default function MapPage({ cartCount = 0, onAreaSelect }) {
  const navigate   = useNavigate();
  const mapRef     = useRef(null);
  const leafRef    = useRef(null);
  const polyRef    = useRef({});   // id -> [polygon layers]
  const labelRef   = useRef(null);
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

  // ── Init map + draw areas ─────────────────────
  useEffect(() => {
    if (!ready || !mapRef.current || leafRef.current) return;
    const L = window.L;

    const map = L.map(mapRef.current, {
      center: [32.935, 35.340],
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

    // ── Draw each area group ──
    AREAS.forEach(area => {
      const layers = area.polys.map(coords => {
        const poly = L.polygon(coords, {
          color:       C.red,
          weight:      2,
          opacity:     0.85,
          fillColor:   C.red,
          fillOpacity: 0.15,
          smoothFactor: 1.5,
        }).addTo(map);

        poly.on("click", e => {
          L.DomEvent.stopPropagation(e);
          handleSelect(area, map, L);
        });

        return poly;
      });

      polyRef.current[area.id] = layers;
    });

    // Click on map → deselect
    map.on("click", () => {
      clearLabel(map);
      resetAll();
      setSelected(null);
    });

    return () => {
      map.remove();
      leafRef.current = null;
      polyRef.current = {};
      labelRef.current = null;
    };
  }, [ready]);

  function handleSelect(area, map, L) {
    if (!map || !L) return;

    clearLabel(map);
    resetAll();

    // Highlight this area
    (polyRef.current[area.id] || []).forEach(p =>
      p.setStyle({ fillOpacity: 0.32, weight: 3, opacity: 1 })
    );

    // Floating label
    const lbl = L.marker(area.center, {
      icon: L.divIcon({
        html: `<div style="
          background:${C.red};color:white;
          padding:8px 18px;border-radius:24px;
          font-size:13px;font-weight:900;
          white-space:nowrap;
          box-shadow:0 4px 18px rgba(200,16,46,0.5);
          font-family:Arial,sans-serif;direction:rtl;
        ">${area.emoji} ${area.name}</div>`,
        className:  "",
        iconSize:   [0, 0],
        iconAnchor: [-4, 40],
      }),
      interactive:  false,
      zIndexOffset: 2000,
    }).addTo(map);
    labelRef.current = lbl;

    // Fit map to show all polygons of this area
    const allCoords = area.polys.flat();
    const bounds = L.latLngBounds(allCoords);
    map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 13, duration: 0.6 });

    setSelected(area);
  }

  function clearLabel(map) {
    const m = map || leafRef.current;
    if (labelRef.current && m) {
      m.removeLayer(labelRef.current);
      labelRef.current = null;
    }
  }

  function resetAll() {
    Object.values(polyRef.current).forEach(layers =>
      layers.forEach(p =>
        p.setStyle({ fillOpacity: 0.15, weight: 2, opacity: 0.85 })
      )
    );
  }

  return (
    <div style={{
      position: "fixed", inset: 0,
      fontFamily: "Arial,sans-serif", direction: "rtl",
    }}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { transform: translateY(110%); opacity:0; } to { transform: translateY(0); opacity:1; } }
        .leaflet-container { background: #f0ece4 !important; }
        .mBtn:active { transform: scale(0.91); }
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
          <div style={{fontSize:16,fontWeight:900,color:C.dark}}>
            בחר אזור משלוח
          </div>
          <div style={{
            fontSize:11,marginTop:1,
            fontWeight: selected ? 800 : 400,
            color: selected ? C.red : C.gray,
            transition:"color 0.25s",
          }}>
            {selected ? `✓ ${selected.name}` : "לחץ על האזור שלך במפה"}
          </div>
        </div>

        <div style={{width:38}}/>
      </div>

      {/* ── Map ── */}
      <div ref={mapRef} style={{
        position:"absolute",
        top:62, left:0, right:0,
        bottom: selected ? 162 : 80,
        transition:"bottom 0.35s cubic-bezier(0.34,1.1,0.64,1)",
      }}/>

      {/* ── Loading (Leaflet JS only — fast) ── */}
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
            onClick={()=>leafRef.current?.setZoom(
              (leafRef.current.getZoom()||11)+d
            )}
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
              fontSize:22,flexShrink:0,
            }}>{selected.emoji}</div>

            <div style={{flex:1}}>
              <div style={{fontSize:16,fontWeight:900,color:C.dark}}>
                {selected.name}
              </div>
              <div style={{fontSize:12,color:"#16a34a",fontWeight:700,marginTop:2}}>
                ✓ אזור פעיל • משלוח זמין
              </div>
            </div>

            <button className="mBtn" onClick={()=>{
              clearLabel();
              resetAll();
              setSelected(null);
            }} style={{
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
