// AddressPickerPage.jsx — v4 Final
import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";

const RED  = "#C8102E";
const DARK = "#111827";
const GRAY = "#6B7280";

const ZONES = [
  { id:"east",   short:"ראמה · מגאר · עראבה",   nameHe:"ראמה, סאגור, שזור",    cities:"ראמה, סאגור, שזור, עראבה, סחנין, מגאר", lat:32.9078, lng:35.3524, radius:6500, emoji:"🌿", color:"#0D6E3F", bg:"#ECFDF5" },
  { id:"center", short:"כרמיאל · נחף · בעינה",  nameHe:"כרמיאל - נחף - בעינה", cities:"כרמיאל, נחף, דיר אל-אסד, בעינה, מגד אל-כרום", lat:32.9178, lng:35.2999, radius:5000, emoji:"🏙️", color:"#1D4ED8", bg:"#EFF6FF" },
  { id:"north",  short:"פקיעין · חורפיש · כסרה", nameHe:"פקיעין - חורפיש - כסרה", cities:"פקיעין, חורפיש, בית ג'ן, כסרה-סמיע", lat:32.9873, lng:35.3220, radius:5500, emoji:"⛰️", color:"#7C3AED", bg:"#F5F3FF" },
];

function distM(la,lo,la2,lo2){
  const R=6371000,dl=((la2-la)*Math.PI)/180,dg=((lo2-lo)*Math.PI)/180;
  const a=Math.sin(dl/2)**2+Math.cos(la*Math.PI/180)*Math.cos(la2*Math.PI/180)*Math.sin(dg/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
const inZone  = (la,lo,z) => distM(la,lo,z.lat,z.lng) <= z.radius*1.15;
const bestZone = (la,lo) => ZONES.reduce((b,z)=>distM(la,lo,z.lat,z.lng)<distM(la,lo,b.lat,b.lng)?z:b, ZONES[0]);
const resolveZone = (iz) => !iz?null: ZONES.find(z=>z.id===iz.id)||(iz.lat&&iz.lng?bestZone(iz.lat,iz.lng):null);

/* ─────────────────────────────────────────────
   STEP 0 — Zone Picker
───────────────────────────────────────────── */
function ZonePicker({ onPick, onAutoDetect }) {
  const [hovered,   setHovered]   = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [error,     setError]     = useState("");

  function handleAutoDetect() {
    setDetecting(true);
    setError("");
    if (!navigator.geolocation) {
      setError("المتصفح لا يدعم تحديد الموقع");
      setDetecting(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setDetecting(false);
        onAutoDetect(pos.coords.latitude, pos.coords.longitude);
      },
      err => {
        setDetecting(false);
        setError(err.code===1 ? "لم تسمح بالوصول للموقع — يرجى السماح من إعدادات المتصفح" : "تعذر تحديد الموقع، جرّب يدوياً");
      },
      { enableHighAccuracy:true, timeout:8000, maximumAge:0 }
    );
  }

  return (
    <div style={{ position:"fixed",inset:0,background:"#F7F7F8",display:"flex",flexDirection:"column",fontFamily:"'Segoe UI',Arial,sans-serif",direction:"rtl",maxWidth:430,margin:"0 auto",zIndex:200 }}>

      {/* Hero header */}
      <div style={{ background:`linear-gradient(145deg,#C8102E 0%,#6B0716 100%)`,padding:"32px 24px 28px",position:"relative",overflow:"hidden" }}>
        {/* Decorative circles */}
        <div style={{ position:"absolute",width:200,height:200,borderRadius:"50%",border:"1px solid rgba(255,255,255,0.08)",top:-80,right:-60,pointerEvents:"none" }}/>
        <div style={{ position:"absolute",width:140,height:140,borderRadius:"50%",border:"1px solid rgba(255,255,255,0.06)",bottom:-50,left:-40,pointerEvents:"none" }}/>

        <div style={{ position:"relative" }}>
          <div style={{ fontSize:40,marginBottom:10,filter:"drop-shadow(0 4px 12px rgba(0,0,0,0.3))" }}>🗺️</div>
          <div style={{ fontSize:22,fontWeight:900,color:"white",letterSpacing:0.2 }}>بחר את האזור שלך</div>
          <div style={{ fontSize:13,color:"rgba(255,255,255,0.68)",marginTop:5,lineHeight:1.5 }}>כדי להציג לך מסעדות ומשלוחים זמינים</div>
        </div>
      </div>

      {/* Auto detect — premium button */}
      <div style={{ padding:"20px 20px 4px" }}>
        <button
          onClick={handleAutoDetect}
          disabled={detecting}
          style={{
            width:"100%",padding:"0",border:"none",borderRadius:20,
            background:detecting?"#F3F4F6":`linear-gradient(135deg,${RED} 0%,#9B0B22 100%)`,
            cursor:detecting?"default":"pointer",
            overflow:"hidden",
            boxShadow:detecting?"none":"0 6px 24px rgba(200,16,46,0.35)",
            transition:"all .25s",
            transform:detecting?"scale(1)":"scale(1)",
          }}
        >
          <div style={{ padding:"16px 20px",display:"flex",alignItems:"center",gap:14 }}>
            {/* Icon container */}
            <div style={{ width:46,height:46,borderRadius:14,background:detecting?"#E5E7EB":"rgba(255,255,255,0.18)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .2s" }}>
              {detecting
                ? <div style={{ width:20,height:20,borderRadius:"50%",border:"2.5px solid #D1D5DB",borderTopColor:RED,animation:"ygSpin .7s linear infinite" }}/>
                : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="3" fill="white" stroke="none"/>
                    <path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>
                    <circle cx="12" cy="12" r="8"/>
                  </svg>
              }
            </div>
            <div style={{ flex:1,textAlign:"right" }}>
              <div style={{ fontSize:15,fontWeight:900,color:detecting?DARK:"white",lineHeight:1.2 }}>
                {detecting ? "מאתר מיקום..." : "זיהוי אוטומטי של האזור שלי"}
              </div>
              <div style={{ fontSize:11,color:detecting?GRAY:"rgba(255,255,255,0.72)",marginTop:3 }}>
                {detecting ? "אנא המתן..." : "מיקום מדויק • מעבר מיידי למסעדות"}
              </div>
            </div>
            {!detecting && (
              <div style={{ width:32,height:32,borderRadius:10,background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            )}
          </div>
          {/* Bottom accent */}
          {!detecting && <div style={{ height:3,background:"rgba(255,255,255,0.2)" }}/>}
        </button>

        {error && (
          <div style={{ marginTop:10,background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:12,padding:"10px 14px",display:"flex",gap:8,alignItems:"flex-start" }}>
            <span style={{ fontSize:14 }}>⚠️</span>
            <div style={{ fontSize:12,color:"#DC2626",fontWeight:600,lineHeight:1.4 }}>{error}</div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ display:"flex",alignItems:"center",gap:10,padding:"16px 20px 10px" }}>
        <div style={{ flex:1,height:1,background:"#E5E7EB" }}/>
        <span style={{ fontSize:11,color:GRAY,fontWeight:700,background:"white",padding:"0 6px" }}>או בחר אזור ידנית</span>
        <div style={{ flex:1,height:1,background:"#E5E7EB" }}/>
      </div>

      {/* Zone cards */}
      <div style={{ flex:1,overflowY:"auto",padding:"2px 20px 30px",display:"flex",flexDirection:"column",gap:10 }}>
        {ZONES.map((z,i)=>(
          <button key={z.id} onClick={()=>onPick(z)}
            onMouseEnter={()=>setHovered(z.id)} onMouseLeave={()=>setHovered(null)}
            style={{ width:"100%",background:hovered===z.id?z.bg:"white",border:`2px solid ${hovered===z.id?z.color:"#E9EAEB"}`,borderRadius:18,padding:"14px 16px",cursor:"pointer",textAlign:"right",fontFamily:"inherit",display:"flex",alignItems:"center",gap:12,boxShadow:hovered===z.id?"0 8px 28px rgba(0,0,0,0.10)":"0 1px 6px rgba(0,0,0,0.04)",transform:hovered===z.id?"translateY(-2px)":"none",transition:"all .2s cubic-bezier(.34,1.2,.64,1)",animation:`ygCardIn .38s ${i*0.07}s both` }}>
            <div style={{ width:46,height:46,borderRadius:13,flexShrink:0,background:z.bg,border:`1.5px solid ${z.color}25`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22 }}>{z.emoji}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14,fontWeight:900,color:DARK,marginBottom:3 }}>{z.short}</div>
              <div style={{ fontSize:11,color:GRAY,lineHeight:1.4 }}>{z.cities}</div>
            </div>
            <div style={{ width:28,height:28,borderRadius:9,background:hovered===z.id?z.color:"#F3F4F6",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s",flexShrink:0 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={hovered===z.id?"white":"#9CA3AF"} strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </button>
        ))}
      </div>

      <style>{`
        @keyframes ygSpin   { to { transform:rotate(360deg); } }
        @keyframes ygCardIn { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN
───────────────────────────────────────────── */
export default function AddressPickerPage({ onAddressSave, initialZone, cartCount=0 }) {
  const navigate   = useNavigate();
  const mapDiv     = useRef(null);
  const mapRef     = useRef(null);
  const userMark   = useRef(null);
  const circleRef  = useRef(null);
  const bounceT    = useRef(null);
  const searchT    = useRef(null);
  const initDone   = useRef(false);
  const formRef    = useRef(null);

  const startZone  = resolveZone(initialZone);
  const pinLat     = useRef(startZone?.lat || 32.9178);
  const pinLng     = useRef(startZone?.lng || 35.2999);
  const lockedZ    = useRef(startZone);

  const [step,      setStep]      = useState(startZone ? 1 : 0);
  const [mapReady,  setMapReady]  = useState(false);
  const [address,   setAddress]   = useState("מחפש כתובת...");
  const [zone,      setZone]      = useState(startZone);
  const [outZone,   setOutZone]   = useState(false);
  const [dragging,  setDragging]  = useState(false);
  const [bouncing,  setBouncing]  = useState(false);
  const [geoLoad,   setGeoLoad]   = useState(false);
  const [searchQ,   setSearchQ]   = useState("");
  const [sugs,      setSugs]      = useState([]);
  const [searching, setSearching] = useState(false);
  const [toast,     setToast]     = useState("");
  const [street,    setStreet]    = useState("");
  const [building,  setBuilding]  = useState("");
  const [floor,     setFloor]     = useState("");
  const [apt,       setApt]       = useState("");
  const [notes,     setNotes]     = useState("");
  const [locType,   setLocType]   = useState("בית");
  const [saving,    setSaving]    = useState(false);
  // Map height — expands/shrinks on scroll
  const [mapH,      setMapH]      = useState(290);
  const MIN_MAP_H = 140;
  const MAX_MAP_H = 290;

  /* ── Load Leaflet ── */
  useEffect(()=>{
    if(step!==1) return;
    function tryInit(){ if(initDone.current||!window.L||!mapDiv.current) return; initDone.current=true; initMap(window.L); }
    tryInit();
    if(!document.querySelector('link[href*="leaflet"]')){ const c=document.createElement("link"); c.rel="stylesheet"; c.href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"; document.head.appendChild(c); }
    if(!window.L&&!document.querySelector('script[src*="leaflet"]')){ const s=document.createElement("script"); s.src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"; s.crossOrigin=""; s.onload=()=>tryInit(); document.head.appendChild(s); }
    const poll=setInterval(()=>{ if(window.L||initDone.current){clearInterval(poll);tryInit();} },150);
    return ()=>{ clearInterval(poll); clearTimeout(bounceT.current); clearTimeout(searchT.current); if(mapRef.current){mapRef.current.remove();mapRef.current=null;} initDone.current=false; };
  },[step]);

  /* ── Scroll → shrink map ── */
  useEffect(()=>{
    const el = formRef.current;
    if(!el) return;
    const onScroll = ()=>{
      const scrolled = el.scrollTop;
      const newH = Math.max(MIN_MAP_H, MAX_MAP_H - scrolled * 1.4);
      setMapH(Math.round(newH));
    };
    el.addEventListener("scroll", onScroll, { passive:true });
    return ()=>el.removeEventListener("scroll", onScroll);
  },[step, mapReady]);

  // Invalidate map when height changes
  useEffect(()=>{
    if(mapRef.current) setTimeout(()=>mapRef.current?.invalidateSize(),50);
  },[mapH]);

  function initMap(L){
    if(!mapDiv.current) return;
    const lz = lockedZ.current;
    const map = L.map(mapDiv.current,{ center:[pinLat.current,pinLng.current],zoom:15,zoomControl:false,attributionControl:false,tap:false,fadeAnimation:true,zoomAnimation:true });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",{ maxZoom:19,crossOrigin:true,updateWhenIdle:false }).addTo(map);
    mapRef.current=map;

    // Draw only the locked zone circle
    if(lz) drawZoneCircle(L, map, lz);

    setMapReady(true);
    doReverseGeo(pinLat.current, pinLng.current);

    map.on("movestart",()=>setDragging(true));
    map.on("moveend",()=>{
      setDragging(false);
      const c=map.getCenter(),la=c.lat,lo=c.lng,lz=lockedZ.current;
      if(lz&&!inZone(la,lo,lz)){
        setBouncing(true); setOutZone(true);
        showToast("↩ חוזר לאזור "+lz.short.split("·")[0].trim());
        const d=distM(la,lo,lz.lat,lz.lng),ratio=(lz.radius*1.05)/d;
        const bLat=lz.lat+(la-lz.lat)*ratio,bLng=lz.lng+(lo-lz.lng)*ratio;
        bounceT.current=setTimeout(()=>{
          map.flyTo([bLat,bLng],map.getZoom(),{animate:true,duration:0.55,easeLinearity:0.25});
          pinLat.current=bLat; pinLng.current=bLng;
          setTimeout(()=>{ setOutZone(false);setBouncing(false);doReverseGeo(bLat,bLng); },600);
        },60);
      } else {
        pinLat.current=la; pinLng.current=lo; setOutZone(false);
        const nz=bestZone(la,lo); setZone(nz); if(!lz) lockedZ.current=nz;
        doReverseGeo(la,lo);
      }
    });

    // GPS user location
    navigator.geolocation?.getCurrentPosition(pos=>{
      const {latitude:ulat,longitude:ulng}=pos.coords;
      addUserMarker(ulat,ulng,L,map);
      map.flyTo([ulat,ulng],16,{animate:true,duration:1});
      pinLat.current=ulat; pinLng.current=ulng;
      const nz=bestZone(ulat,ulng); setZone(nz); lockedZ.current=nz;
      // Update zone circle
      if(circleRef.current){map.removeLayer(circleRef.current);circleRef.current=null;}
      drawZoneCircle(L,map,nz);
      doReverseGeo(ulat,ulng);
    },()=>{});
  }

  function drawZoneCircle(L, map, z){
    if(circleRef.current){map.removeLayer(circleRef.current);circleRef.current=null;}
    circleRef.current = L.circle([z.lat,z.lng],{
      radius:z.radius, color:RED, weight:2.5, opacity:0.35,
      fillColor:RED, fillOpacity:0.06, dashArray:"8,5", interactive:false,
    }).addTo(map);
  }

  function addUserMarker(lat,lng,L,map){
    if(userMark.current){userMark.current.remove();userMark.current=null;}
    const icon = L.divIcon({
      className:"",
      html:`
        <div style="position:relative;display:flex;flex-direction:column;align-items:center;pointer-events:none">
          <div style="
            background:${RED};
            color:white;
            font-size:11px;
            font-weight:900;
            font-family:'Segoe UI',Arial,sans-serif;
            padding:5px 10px;
            border-radius:20px;
            white-space:nowrap;
            box-shadow:0 4px 16px rgba(200,16,46,0.45);
            display:flex;align-items:center;gap:5px;
            border:2px solid rgba(255,255,255,0.6);
            animation:ygBadgePop .4s cubic-bezier(.34,1.5,.64,1) both;
          ">
            <span style="font-size:13px">🧭</span>
            <span>אני כאן</span>
          </div>
          <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid ${RED};margin-top:-1px;filter:drop-shadow(0 2px 3px rgba(200,16,46,0.3))"></div>
          <div style="width:10px;height:10px;background:#3B82F6;border-radius:50%;border:2.5px solid white;box-shadow:0 2px 8px rgba(59,130,246,0.6);margin-top:2px;position:relative">
            <div style="position:absolute;inset:-4px;border-radius:50%;background:rgba(59,130,246,0.2);animation:ygPulse 2s ease-out infinite"></div>
          </div>
        </div>
      `,
      iconSize:[90,60], iconAnchor:[45,58],
    });
    userMark.current = L.marker([lat,lng],{icon,zIndexOffset:600,interactive:false}).addTo(map);
  }

  async function doReverseGeo(lat,lng){
    setGeoLoad(true);
    try{
      const r=await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,{headers:{"Accept-Language":"he"}});
      const d=await r.json(),a=d.address||{};
      const st=a.road||a.pedestrian||a.suburb||"",city=a.city||a.town||a.village||"",num=a.house_number||"";
      const full=`${st}${num?" "+num:""}${city?", "+city:""}`.trim();
      setAddress(full||d.display_name?.split(",")[0]||"מיקום נבחר");
      if(st) setStreet(`${st}${num?" "+num:""}`);
    }catch{ setAddress("מיקום נבחר"); }
    setGeoLoad(false);
  }

  function showToast(msg){ setToast(msg); setTimeout(()=>setToast(""),2400); }

  function goMyLocation(){
    navigator.geolocation?.getCurrentPosition(pos=>{
      const {latitude:lat,longitude:lng}=pos.coords;
      if(window.L&&mapRef.current) addUserMarker(lat,lng,window.L,mapRef.current);
      mapRef.current?.flyTo([lat,lng],17,{animate:true,duration:0.7});
      pinLat.current=lat; pinLng.current=lng;
      const nz=bestZone(lat,lng); setZone(nz); lockedZ.current=nz;
      if(window.L&&mapRef.current) drawZoneCircle(window.L,mapRef.current,nz);
      setOutZone(false); doReverseGeo(lat,lng);
    });
  }

  function handleSearch(v){
    setSearchQ(v); clearTimeout(searchT.current);
    if(!v.trim()){setSugs([]);return;}
    searchT.current=setTimeout(async()=>{
      setSearching(true);
      try{ const r=await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(v+" ישראל")}&format=json&limit=5&accept-language=he`); setSugs((await r.json()).slice(0,4)); }catch{}
      setSearching(false);
    },450);
  }

  function pickSug(s){
    const lat=parseFloat(s.lat),lng=parseFloat(s.lon);
    setSugs([]); setSearchQ(s.display_name.split(",")[0]);
    if(!ZONES.some(z=>inZone(lat,lng,z))){ showToast("🚫 כתובת זו מחוץ לאזורי השירות"); return; }
    mapRef.current?.flyTo([lat,lng],17,{animate:true,duration:0.6});
    pinLat.current=lat; pinLng.current=lng;
    const nz=bestZone(lat,lng); setZone(nz); lockedZ.current=nz; setOutZone(false);
    setAddress(s.display_name.split(",")[0]);
  }

  async function handleSave(){
    setSaving(true);
    await new Promise(r=>setTimeout(r,300));
    const addr=[street,building?`בניין ${building}`:"",floor?`קומה ${floor}`:"",apt?`דירה ${apt}`:""].filter(Boolean).join(", ");
    const saveZone=zone||lockedZ.current;
    onAddressSave?.({ address:addr||address,coords:{lat:pinLat.current,lng:pinLng.current},zone:saveZone,id:saveZone?.id,short:saveZone?.short,name:saveZone?.nameHe,lat:saveZone?.lat,lng:saveZone?.lng,radius:saveZone?.radius,type:locType,notes });
    navigate(-1); setSaving(false);
  }

  /* Auto-detect: GPS → skip zone picker → go straight to restaurants */
  function handleAutoDetect(lat, lng) {
    const nz = bestZone(lat, lng);
    // Save zone + coords immediately
    onAddressSave?.({
      address: "", coords:{lat,lng}, zone:nz,
      id:nz.id, short:nz.short, name:nz.nameHe,
      lat:nz.lat, lng:nz.lng, radius:nz.radius,
      type:"בית", notes:"",
    });
    // Navigate to home/restaurants
    navigate("/");
  }

  function resetAndPickZone(){
    setStep(0); setMapReady(false); initDone.current=false;
    if(mapRef.current){mapRef.current.remove();mapRef.current=null;}
    if(circleRef.current){circleRef.current=null;}
  }

  function handleZonePick(z){
    lockedZ.current=z; pinLat.current=z.lat; pinLng.current=z.lng; setZone(z); setStep(1);
  }

  const canSave = !outZone&&!bouncing&&mapReady;
  const pinOOZ  = outZone||bouncing;
  const zoneName = (zone||lockedZ.current)?.short||"";

  const INP={ width:"100%",border:"1.5px solid #E9EAEB",borderRadius:12,padding:"12px 14px",fontSize:14,outline:"none",background:"white",textAlign:"right",fontFamily:"'Segoe UI',Arial,sans-serif",boxSizing:"border-box",color:DARK,direction:"rtl",transition:"border-color .18s,box-shadow .18s" };
  const fo=e=>{e.target.style.borderColor=RED;e.target.style.boxShadow=`0 0 0 3px rgba(200,16,46,0.09)`;};
  const bl=e=>{e.target.style.borderColor="#E9EAEB";e.target.style.boxShadow="none";};

  if(step===0) return <ZonePicker onPick={handleZonePick} onAutoDetect={handleAutoDetect}/>;

  return (
    <>
      <div style={{ position:"fixed",inset:0,display:"flex",flexDirection:"column",fontFamily:"'Segoe UI',Arial,sans-serif",direction:"rtl",background:"#F7F7F8",zIndex:200,maxWidth:430,margin:"0 auto",overflow:"hidden" }}>

        {/* HEADER */}
        <div style={{ background:"white",flexShrink:0,padding:"10px 16px",borderBottom:"1px solid #F0F0F0",display:"flex",alignItems:"center",gap:12,zIndex:10 }}>
          <button onClick={()=>navigate(-1)} style={{ width:38,height:38,borderRadius:12,background:"#F3F4F6",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{ flex:1,textAlign:"center" }}>
            <div style={{ fontSize:15,fontWeight:900,color:DARK }}>פרטי מיקום</div>
            <div style={{ fontSize:10,fontWeight:700,marginTop:2,color:pinOOZ?"#EF4444":zoneName?"#16A34A":GRAY,transition:"color .3s" }}>
              {bouncing?"↩ חוזר לאזור...":outZone?"⚠️ מחוץ לאזור":zoneName?`✓ ${zoneName.split("·")[0].trim()}`:"בחר מיקום"}
            </div>
          </div>
          <button onClick={resetAndPickZone} style={{ fontSize:10,fontWeight:800,color:RED,background:"rgba(200,16,46,0.07)",border:"none",borderRadius:10,padding:"5px 10px",cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap" }}>שנה אזור</button>
        </div>

        {/* SEARCH */}
        <div style={{ background:"white",flexShrink:0,padding:"8px 14px 10px",borderBottom:"1px solid #F0F0F0",position:"relative",zIndex:9 }}>
          <div style={{ display:"flex",alignItems:"center",background:"#F3F4F6",borderRadius:14,padding:"0 14px",border:"1.5px solid #E9EAEB" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GRAY} strokeWidth="2"><circle cx="11" cy="11" r="7.5"/><path d="M17 17l3.5 3.5" strokeLinecap="round"/></svg>
            <input value={searchQ} onChange={e=>handleSearch(e.target.value)} placeholder="חיפוש או הזנת כתובת" style={{ flex:1,background:"none",border:"none",outline:"none",padding:"10px 10px",fontSize:13,textAlign:"right",fontFamily:"inherit",color:DARK,direction:"rtl" }}/>
            {searching
              ? <div style={{ width:15,height:15,borderRadius:"50%",border:"2px solid #eee",borderTopColor:RED,animation:"ygSpin .7s linear infinite",flexShrink:0 }}/>
              : searchQ ? <button onClick={()=>{setSearchQ("");setSugs([]);}} style={{ background:"none",border:"none",cursor:"pointer",padding:4,color:GRAY,fontSize:14,lineHeight:1 }}>✕</button> : null
            }
          </div>
          {sugs.length>0&&(
            <div style={{ position:"absolute",top:"100%",left:14,right:14,background:"white",borderRadius:16,boxShadow:"0 10px 40px rgba(0,0,0,0.13)",border:"1px solid #E5E7EB",overflow:"hidden",zIndex:1000 }}>
              {sugs.map((s,i)=>{
                const sl=parseFloat(s.lat),sg=parseFloat(s.lon),ok=ZONES.some(z=>inZone(sl,sg,z));
                return (
                  <button key={i} onClick={()=>pickSug(s)} style={{ width:"100%",background:"none",border:"none",padding:"11px 16px",textAlign:"right",cursor:"pointer",display:"flex",alignItems:"center",gap:10,borderBottom:i<sugs.length-1?"1px solid #F3F4F6":"none",fontFamily:"inherit" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill={ok?RED:"#D1D5DB"} style={{ flexShrink:0 }}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13,fontWeight:700,color:DARK }}>{s.display_name.split(",")[0]}</div>
                      <div style={{ fontSize:10,color:GRAY }}>{s.display_name.split(",").slice(1,3).join(",")}</div>
                    </div>
                    {!ok&&<span style={{ fontSize:9,color:"#EF4444",fontWeight:700,background:"#FEF2F2",padding:"2px 7px",borderRadius:6 }}>מחוץ לאזור</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* MAP — height shrinks on scroll */}
        <div style={{ position:"relative",height:mapH,flexShrink:0,transition:"height .25s ease" }}>
          <div ref={mapDiv} style={{ position:"absolute",inset:0,background:"#EEE8DC" }}/>

          {!mapReady&&(
            <div style={{ position:"absolute",inset:0,background:"rgba(255,255,255,0.94)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,zIndex:5 }}>
              <div style={{ width:38,height:38,borderRadius:"50%",border:`3px solid rgba(200,16,46,0.15)`,borderTopColor:RED,animation:"ygSpin .8s linear infinite" }}/>
              <span style={{ color:GRAY,fontSize:13,fontWeight:600 }}>טוען מפה...</span>
            </div>
          )}

          {/* CENTER CROSSHAIR PIN */}
          {mapReady&&(
            <div style={{ position:"absolute",top:"50%",left:"50%",zIndex:4,pointerEvents:"none",transform:"translate(-50%,-50%)" }}>
              {/* Crosshair lines */}
              <div style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:40,height:40,opacity:pinOOZ?0.3:0.7,transition:"opacity .2s" }}>
                <div style={{ position:"absolute",top:"50%",left:0,right:0,height:1.5,background:RED,transform:"translateY(-50%)" }}/>
                <div style={{ position:"absolute",left:"50%",top:0,bottom:0,width:1.5,background:RED,transform:"translateX(-50%)" }}/>
                <div style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:8,height:8,borderRadius:"50%",background:"white",border:`2px solid ${RED}`,boxShadow:`0 0 0 3px rgba(200,16,46,0.2)` }}/>
              </div>
              {/* Address label */}
              <div style={{ position:"absolute",bottom:"calc(100% + 8px)",left:"50%",transform:`translateX(-50%) ${dragging?"scale(.92)":"scale(1)"}`,transition:"transform .2s cubic-bezier(.34,1.4,.64,1)",whiteSpace:"nowrap",pointerEvents:"none" }}>
                <div style={{ background:pinOOZ?"#EF4444":"white",border:`1.5px solid ${pinOOZ?"#EF4444":"rgba(200,16,46,.18)"}`,borderRadius:18,padding:"5px 13px",fontSize:11,fontWeight:800,color:pinOOZ?"white":DARK,boxShadow:"0 3px 14px rgba(0,0,0,0.11)",maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",display:"flex",alignItems:"center",gap:5 }}>
                  <span style={{ fontSize:13 }}>{pinOOZ?"🚫":"📍"}</span>
                  {geoLoad?<span style={{ color:GRAY }}>מחפש...</span>: pinOOZ?"מחוץ לאזור":address.split(",")[0]}
                </div>
                <div style={{ width:0,height:0,borderLeft:"6px solid transparent",borderRight:"6px solid transparent",borderTop:`8px solid ${pinOOZ?"#EF4444":"white"}`,margin:"0 auto",filter:"drop-shadow(0 1px 1px rgba(0,0,0,.06))" }}/>
              </div>
            </div>
          )}

          {/* Toast */}
          {toast&&(
            <div style={{ position:"absolute",top:10,left:"50%",transform:"translateX(-50%)",zIndex:6,background:"rgba(17,24,39,.88)",backdropFilter:"blur(6px)",borderRadius:14,padding:"8px 16px",display:"flex",alignItems:"center",gap:8,boxShadow:"0 4px 20px rgba(0,0,0,.22)",whiteSpace:"nowrap",animation:"ygToast .3s cubic-bezier(.34,1.4,.64,1)" }}>
              <div style={{ fontSize:11,fontWeight:800,color:"white" }}>{toast}</div>
            </div>
          )}

          {/* My location */}
          <button onClick={goMyLocation} style={{ position:"absolute",left:12,bottom:12,zIndex:5,width:40,height:40,background:"white",border:"none",borderRadius:"50%",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 3px 14px rgba(0,0,0,.15)" }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="3" fill={RED} stroke="none"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/><circle cx="12" cy="12" r="8"/></svg>
          </button>

          {/* Zoom */}
          <div style={{ position:"absolute",left:12,top:12,zIndex:5,display:"flex",flexDirection:"column",gap:4 }}>
            {[["+",1],["-",-1]].map(([l,d])=>(
              <button key={l} onClick={()=>mapRef.current?.setZoom((mapRef.current.getZoom()||14)+d)} style={{ width:34,height:34,background:"white",border:"1px solid rgba(0,0,0,.07)",borderRadius:9,fontSize:17,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(0,0,0,.09)",color:DARK }}>{l}</button>
            ))}
          </div>

          {/* Drag hint */}
          <div style={{ position:"absolute",bottom:0,left:0,right:0,zIndex:5,background:"rgba(17,24,39,.75)",backdropFilter:"blur(4px)",padding:"7px 16px",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
            <span style={{ color:"white",fontSize:10,fontWeight:600 }}>גרור את המפה למיקום המדויק שלך</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="1.8"><path d="M5 9l7-7 7 7M5 15l7 7 7-7"/></svg>
          </div>
        </div>

        {/* SCROLLABLE FORM */}
        <div ref={formRef} style={{ flex:1,overflowY:"auto",background:"white",borderRadius:"22px 22px 0 0",marginTop:-14,position:"relative",zIndex:2,boxShadow:"0 -8px 30px rgba(0,0,0,.08)" }}>
          <div style={{ padding:"10px 0 4px",display:"flex",justifyContent:"center",position:"sticky",top:0,background:"white",zIndex:3 }}>
            <div style={{ width:36,height:4,background:"#E5E7EB",borderRadius:2 }}/>
          </div>

          {/* Form header */}
          <div style={{ display:"flex",alignItems:"center",gap:10,padding:"4px 16px 14px" }}>
            <div style={{ width:34,height:34,background:"rgba(200,16,46,.07)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill={RED}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14,fontWeight:900,color:DARK }}>פרטי כתובת</div>
              <div style={{ fontSize:10,color:GRAY,marginTop:1 }}>הזן את פרטי הכתובת שלך</div>
            </div>
            {zoneName&&!pinOOZ&&(
              <div style={{ background:"#DCFCE7",borderRadius:20,padding:"3px 11px",display:"flex",alignItems:"center",gap:4 }}>
                <div style={{ width:5,height:5,borderRadius:"50%",background:"#16A34A" }}/>
                <span style={{ fontSize:9,fontWeight:800,color:"#16A34A" }}>{zoneName.split("·")[0].trim()}</span>
              </div>
            )}
          </div>

          <div style={{ padding:"0 16px 30px" }}>

            {/* Zone readonly */}
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:11,fontWeight:700,color:GRAY,marginBottom:5 }}>אזור</div>
              <div style={{ display:"flex",alignItems:"center",background:"#F9FAFB",border:"1.5px solid #E9EAEB",borderRadius:12,padding:"11px 14px" }}>
                <button onClick={resetAndPickZone} style={{ background:"none",border:"none",cursor:"pointer",padding:0,color:RED,fontSize:14,marginLeft:6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
                <span style={{ flex:1,fontSize:14,fontWeight:700,color:DARK,textAlign:"right" }}>{zoneName||"לא נבחר"}</span>
              </div>
            </div>

            {/* Street */}
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:11,fontWeight:700,color:GRAY,marginBottom:5 }}>שם רחוב</div>
              <input style={INP} value={street} onChange={e=>setStreet(e.target.value)} placeholder="שם הרחוב ומספר הבית" onFocus={fo} onBlur={bl}/>
            </div>

            {/* Building / Floor / Apt */}
            <div style={{ display:"flex",gap:8,marginBottom:10 }}>
              {[{label:"מספר בניין",val:building,set:setBuilding,ph:"בניין"},{label:"קומה",val:floor,set:setFloor,ph:"קומה",t:"number"},{label:"דירה",val:apt,set:setApt,ph:"דירה"}].map(f=>(
                <div key={f.label} style={{ flex:1 }}>
                  <div style={{ fontSize:11,fontWeight:700,color:GRAY,marginBottom:5 }}>{f.label}</div>
                  <input style={INP} value={f.val} type={f.t||"text"} onChange={e=>f.set(e.target.value)} placeholder={f.ph} onFocus={fo} onBlur={bl}/>
                </div>
              ))}
            </div>

            {/* Location type */}
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:11,fontWeight:700,color:GRAY,marginBottom:7 }}>סוג מיקום</div>
              <div style={{ display:"flex",gap:7 }}>
                {[{k:"בית",e:"🏠"},{k:"משרד",e:"🏢"},{k:"מיקום אחר",e:"📍"}].map(t=>(
                  <button key={t.k} onClick={()=>setLocType(t.k)} style={{ flex:1,padding:"10px 4px",borderRadius:14,cursor:"pointer",border:`2px solid ${locType===t.k?RED:"#E5E7EB"}`,background:locType===t.k?"rgba(200,16,46,.06)":"white",color:locType===t.k?RED:GRAY,fontSize:10,fontWeight:700,display:"flex",flexDirection:"column",alignItems:"center",gap:4,transition:"all .18s",fontFamily:"inherit" }}>
                    <span style={{ fontSize:20 }}>{t.e}</span>{t.k}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom:18 }}>
              <div style={{ fontSize:11,fontWeight:700,color:GRAY,marginBottom:5 }}>הוראות לשליח</div>
              <div style={{ display:"flex",gap:8,background:"#F9FAFB",borderRadius:14,padding:"10px 13px",border:"1.5px solid #E9EAEB" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GRAY} strokeWidth="1.8" style={{ flexShrink:0,marginTop:2 }}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="דוגמה: ליד סניף הדואר הראשי..." style={{ flex:1,background:"none",border:"none",outline:"none",resize:"none",fontSize:12,fontFamily:"inherit",color:DARK,minHeight:44,textAlign:"right",direction:"rtl" }}/>
              </div>
            </div>

            {/* Save */}
            <button onClick={handleSave} disabled={!canSave||saving} style={{ width:"100%",background:!canSave?"#D1D5DB":saving?GRAY:`linear-gradient(135deg,${RED},#9B0B22)`,border:"none",borderRadius:18,padding:"16px",color:"white",fontSize:15,fontWeight:900,cursor:!canSave||saving?"not-allowed":"pointer",boxShadow:canSave&&!saving?`0 5px 22px rgba(200,16,46,.38)`:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:10,transition:"all .25s",letterSpacing:0.3,fontFamily:"inherit" }}>
              {saving?<><div style={{ width:18,height:18,borderRadius:"50%",border:"2.5px solid rgba(255,255,255,.4)",borderTopColor:"white",animation:"ygSpin .7s linear infinite" }}/>שומר...</>:pinOOZ?"⛔ מחוץ לאזור":"להמשיך ←"}
            </button>
          </div>
        </div>

        {/* BOTTOM NAV */}
        <div style={{ background:"white",borderTop:"1px solid #F0F0F0",zIndex:10,flexShrink:0 }}>
          <BottomNav cartCount={cartCount}/>
        </div>
      </div>

      <style>{`
        @keyframes ygSpin    { to { transform:rotate(360deg); } }
        @keyframes ygPulse   { 0%,100%{transform:scale(1);opacity:.6} 50%{transform:scale(2.5);opacity:0} }
        @keyframes ygToast   { from{opacity:0;transform:translateX(-50%) translateY(-6px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes ygBadgePop{ from{opacity:0;transform:scale(.6)}to{opacity:1;transform:scale(1)} }
        input::placeholder, textarea::placeholder { color:#9CA3AF; }
        ::-webkit-scrollbar { display:none; }
        .leaflet-container { background:#f0ece4 !important; }
      `}</style>
    </>
  );
}
