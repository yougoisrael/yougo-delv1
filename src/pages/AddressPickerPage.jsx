// AddressPickerPage.jsx — 3-step flow: Zone → Pin → Details
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const RED="#C8102E",DARK="#111827",GRAY="#6B7280",LIGHT="#F9FAFB",BG="#F7F7F8";
const ZONES=[
  {id:"east",nameHe:"ראמה, סאגור, שזור",subHe:"עין אל-אסד, עראבה, סחנין, מגאר",emoji:"🌄",lat:32.9078,lng:35.3524,radius:6500},
  {id:"center",nameHe:"כרמיאל - נחף - בעינה",subHe:"דיר אל-אסד, מגד אל-כרום",emoji:"🏙️",lat:32.9178,lng:35.2999,radius:5000},
  {id:"north",nameHe:"פקיעין - חורפיש - כסרה",subHe:"בית ג'ן, כסרה-סמיע",emoji:"🏔️",lat:32.9873,lng:35.3220,radius:5500},
];
function distM(a,b,c,d){const R=6371000,dL=((c-a)*Math.PI)/180,dG=((d-b)*Math.PI)/180,x=Math.sin(dL/2)**2+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(dG/2)**2;return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));}
const inZ=(lat,lng,z)=>distM(lat,lng,z.lat,z.lng)<=z.radius*1.15;
function loadL(cb){if(window.L){cb();return;}const c=Object.assign(document.createElement("link"),{rel:"stylesheet",href:"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"});document.head.appendChild(c);const s=Object.assign(document.createElement("script"),{src:"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js",onload:cb});document.head.appendChild(s);}

function ZoneStep({onSelect}){
  const mR=useRef(),lR=useRef(),cR=useRef();
  const[ready,setR]=useState(false),[sel,setSel]=useState(null);
  useEffect(()=>{loadL(()=>setR(true));},[]);
  useEffect(()=>{
    if(!ready||!mR.current||lR.current)return;
    const L=window.L,map=L.map(mR.current,{center:[32.945,35.325],zoom:10,zoomControl:false,attributionControl:false,minZoom:9,maxZoom:13,preferCanvas:true});
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",{maxZoom:19,crossOrigin:true}).addTo(map);
    lR.current=map;
    ZONES.forEach(z=>{
      const icon=L.divIcon({html:`<div class="ygz-pin" id="ygz-${z.id}"><div class="ygz-circle"><svg width="18" height="18" viewBox="0 0 24 24" fill="${RED}"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div><div class="ygz-tail"></div><div class="ygz-badge">${z.nameHe.split(",")[0]}</div></div>`,className:"",iconSize:[40,68],iconAnchor:[20,50]});
      L.marker([z.lat,z.lng],{icon}).addTo(map).on("click",e=>{L.DomEvent.stopPropagation(e);pick(z,map,L);});
    });
    map.on("click",()=>{if(cR.current){map.removeLayer(cR.current);cR.current=null;}ZONES.forEach(x=>pa(x.id,false));setSel(null);});
    return()=>{map.remove();lR.current=null;cR.current=null;};
  },[ready]);
  function pick(z,map,L){
    if(cR.current){map.removeLayer(cR.current);cR.current=null;}
    ZONES.forEach(x=>pa(x.id,false));pa(z.id,true);
    cR.current=L.circle([z.lat,z.lng],{radius:z.radius,color:RED,weight:2,opacity:0.6,fillColor:RED,fillOpacity:0.07,dashArray:"8,5"}).addTo(map);
    const pt=map.latLngToContainerPoint([z.lat,z.lng]);
    map.panTo(map.containerPointToLatLng(L.point(pt.x,pt.y+95)),{animate:true,duration:0.3});
    setSel(z);
  }
  function pa(id,active){
    const el=document.getElementById(`ygz-${id}`);if(!el)return;
    const c=el.querySelector(".ygz-circle"),b=el.querySelector(".ygz-badge");
    if(c){c.style.background=active?RED:"white";c.style.transform=active?"scale(1.3)":"scale(1)";c.style.boxShadow=active?`0 6px 20px rgba(200,16,46,0.5)`:"0 2px 10px rgba(200,16,46,0.2)";const p=c.querySelector("svg path");if(p)p.setAttribute("fill",active?"white":RED);}
    if(b){b.style.background=active?RED:"white";b.style.color=active?"white":DARK;b.style.fontWeight=active?"900":"700";}
  }
  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{background:`linear-gradient(135deg,${RED},#7B0D1E)`,padding:"22px 20px 30px",flexShrink:0,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",width:220,height:220,borderRadius:"50%",border:"1px solid rgba(255,255,255,0.07)",top:-90,right:-70,pointerEvents:"none"}}/>
        <div style={{color:"white",fontSize:22,fontWeight:900,marginBottom:4}}>📍 בחר את האזור שלך</div>
        <div style={{color:"rgba(255,255,255,0.72)",fontSize:13}}>לחץ על הסמן שקרוב אליך</div>
      </div>
      <div style={{position:"relative",flex:1,overflow:"hidden"}}>
        <div ref={mR} style={{width:"100%",height:"100%"}}/>
        {!ready&&<div style={{position:"absolute",inset:0,background:"white",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14,zIndex:100}}><div style={{width:42,height:42,borderRadius:"50%",border:`3px solid rgba(200,16,46,0.15)`,borderTopColor:RED,animation:"yg-spin 0.8s linear infinite"}}/><span style={{color:GRAY,fontSize:13}}>טוען מפה...</span></div>}
        <div style={{position:"absolute",left:14,top:14,zIndex:900,display:"flex",flexDirection:"column",gap:6}}>
          {[["+",1],["-",-1]].map(([l,d])=><button key={l} onClick={()=>lR.current?.setZoom((lR.current.getZoom()||10)+d)} style={{width:38,height:38,background:"white",border:"1px solid #E5E7EB",borderRadius:10,fontSize:18,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.1)",color:DARK}}>{l}</button>)}
        </div>
        {sel&&(
          <div style={{position:"absolute",bottom:0,left:0,right:0,zIndex:1000,background:"white",borderRadius:"22px 22px 0 0",padding:"16px 20px 24px",boxShadow:"0 -8px 32px rgba(0,0,0,0.14)",animation:"yg-slideUp 0.32s cubic-bezier(0.34,1.1,0.64,1)"}}>
            <div style={{width:36,height:4,background:"#E5E7EB",borderRadius:2,margin:"0 auto 16px"}}/>
            <div style={{display:"flex",gap:14,marginBottom:18,alignItems:"center"}}>
              <div style={{width:52,height:52,borderRadius:16,background:"rgba(200,16,46,0.07)",border:"1.5px solid rgba(200,16,46,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{sel.emoji}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:16,fontWeight:900,color:DARK}}>{sel.nameHe}</div>
                <div style={{fontSize:12,color:GRAY,marginTop:3}}>{sel.subHe}</div>
                <div style={{display:"inline-flex",alignItems:"center",gap:5,marginTop:5,background:"#DCFCE7",borderRadius:20,padding:"2px 10px"}}><div style={{width:6,height:6,borderRadius:"50%",background:"#16A34A"}}/><span style={{fontSize:10,fontWeight:800,color:"#16A34A"}}>אזור פעיל • משלוח זמין</span></div>
              </div>
              <button onClick={()=>{if(lR.current){if(cR.current){lR.current.removeLayer(cR.current);cR.current=null;}ZONES.forEach(x=>pa(x.id,false));}setSel(null);}} style={{width:30,height:30,borderRadius:"50%",background:"#F3F4F6",border:"none",cursor:"pointer",fontSize:13,color:GRAY,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✕</button>
            </div>
            <button onClick={()=>onSelect(sel)} style={{width:"100%",background:`linear-gradient(135deg,${RED},#a00020)`,border:"none",borderRadius:16,padding:"16px",color:"white",fontSize:15,fontWeight:900,cursor:"pointer",boxShadow:`0 4px 18px rgba(200,16,46,0.38)`,letterSpacing:0.3}}>המשך לבחירת כתובת ←</button>
          </div>
        )}
      </div>
      <style>{`.ygz-pin{display:flex;flex-direction:column;align-items:center;animation:yg-pinPop 0.35s ease;cursor:pointer}.ygz-circle{width:40px;height:40px;border-radius:50%;background:white;border:2.5px solid ${RED};display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(200,16,46,0.2);transition:all 0.22s cubic-bezier(0.34,1.3,0.64,1)}.ygz-tail{width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:9px solid ${RED};margin-top:-1px}.ygz-badge{margin-top:4px;background:white;color:${DARK};font-size:9px;font-weight:700;padding:3px 8px;border-radius:8px;white-space:nowrap;border:1.5px solid ${RED};box-shadow:0 1px 5px rgba(0,0,0,0.12);transition:all 0.2s;font-family:Arial,sans-serif}@keyframes yg-spin{to{transform:rotate(360deg)}}@keyframes yg-slideUp{from{transform:translateY(110%);opacity:0}to{transform:translateY(0);opacity:1}}@keyframes yg-pinPop{0%{transform:scale(0.3);opacity:0}70%{transform:scale(1.2)}100%{transform:scale(1);opacity:1}}.leaflet-container{background:#EEE8DC !important}`}</style>
    </div>
  );
}

function PinStep({zone,onConfirm,onBack}){
  const mR=useRef(),lR=useRef(),dR=useRef(),cR=useRef({lat:zone.lat,lng:zone.lng});
  const[ready,setR]=useState(false),[addr,setA]=useState("מחפש כתובת..."),[loading,setL]=useState(false);
  const[outZ,setOut]=useState(false),[shake,setShk]=useState(false);
  const[sq,setSq]=useState(""),[sugs,setSugs]=useState([]),[searching,setSrch]=useState(false);
  useEffect(()=>{loadL(()=>setR(true));},[]);
  useEffect(()=>{
    if(!ready||!mR.current||lR.current)return;
    const L=window.L,map=L.map(mR.current,{center:[zone.lat,zone.lng],zoom:14,zoomControl:false,attributionControl:false});
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",{maxZoom:19,crossOrigin:true}).addTo(map);
    L.circle([zone.lat,zone.lng],{radius:zone.radius,color:RED,weight:2,opacity:0.4,fillColor:RED,fillOpacity:0.05,dashArray:"8,6"}).addTo(map);
    lR.current=map;
    navigator.geolocation?.getCurrentPosition(p=>{const{latitude:lat,longitude:lng}=p.coords;if(inZ(lat,lng,zone)){map.setView([lat,lng],16);cR.current={lat,lng};rev(lat,lng);}else rev(zone.lat,zone.lng);},()=>rev(zone.lat,zone.lng));
    map.on("moveend",()=>{const{lat,lng}=map.getCenter();cR.current={lat,lng};const ok=inZ(lat,lng,zone);setOut(!ok);if(ok)rev(lat,lng);else{shk();setA("מחוץ לאזור השירות");}});
    return()=>{map.remove();lR.current=null;};
  },[ready]);
  async function rev(lat,lng){setL(true);try{const r=await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,{headers:{"Accept-Language":"he"}});const d=await r.json(),a=d.address||{};const st=a.road||a.pedestrian||a.suburb||"",city=a.city||a.town||a.village||"",num=a.house_number||"";setA(`${st}${num?" "+num:""}${city?", "+city:""}`.trim()||d.display_name?.split(",")[0]||"מיקום נבחר");}catch{setA("מיקום נבחר");}setL(false);}
  function shk(){setShk(true);setTimeout(()=>setShk(false),600);}
  function handleSrch(v){setSq(v);clearTimeout(dR.current);if(!v.trim()){setSugs([]);return;}dR.current=setTimeout(async()=>{setSrch(true);try{const r=await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(v+" ישראל")}&format=json&limit=5&accept-language=he`);setSugs((await r.json()).slice(0,4));}catch{}setSrch(false);},500);}
  function pickS(s){const lat=parseFloat(s.lat),lng=parseFloat(s.lon);setSugs([]);setSq(s.display_name.split(",")[0]);if(!inZ(lat,lng,zone)){shk();setOut(true);return;}lR.current?.setView([lat,lng],17);cR.current={lat,lng};setOut(false);setA(s.display_name.split(",")[0]);}
  function myLoc(){navigator.geolocation?.getCurrentPosition(p=>{const{latitude:lat,longitude:lng}=p.coords;if(!inZ(lat,lng,zone)){shk();setOut(true);return;}lR.current?.setView([lat,lng],17);cR.current={lat,lng};setOut(false);rev(lat,lng);});}
  function confirm(){if(outZ){shk();return;}onConfirm({coords:cR.current,address:addr,zone});}
  const inp={flex:1,background:"none",border:"none",outline:"none",padding:"11px 10px",fontSize:13,textAlign:"right",fontFamily:"Arial,sans-serif",color:DARK,direction:"rtl"};
  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{background:"white",padding:"10px 16px",borderBottom:"1px solid #F0F0F0",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
        <button onClick={onBack} style={{width:38,height:38,borderRadius:12,background:LIGHT,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg></button>
        <div style={{flex:1,textAlign:"center"}}><div style={{fontSize:15,fontWeight:900,color:DARK}}>📍 בחר מיקום מדויק</div><div style={{fontSize:10,color:GRAY,marginTop:1}}>{zone.nameHe.split(",")[0]}</div></div>
        <div style={{width:38}}/>
      </div>
      <div style={{background:"white",padding:"10px 14px 8px",borderBottom:"1px solid #F0F0F0",position:"relative",flexShrink:0,zIndex:500}}>
        <div style={{display:"flex",alignItems:"center",background:LIGHT,borderRadius:14,padding:"0 14px",border:"1px solid #E5E7EB"}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GRAY} strokeWidth="2"><circle cx="11" cy="11" r="7.5"/><path d="M17 17l3.5 3.5" strokeLinecap="round"/></svg>
          <input value={sq} onChange={e=>handleSrch(e.target.value)} placeholder="חפש כתובת..." style={inp}/>
          {searching&&<div style={{width:15,height:15,borderRadius:"50%",border:`2px solid rgba(200,16,46,0.2)`,borderTopColor:RED,animation:"yg-spin 0.7s linear infinite",flexShrink:0}}/>}
          {sq&&!searching&&<button onClick={()=>{setSq("");setSugs([]);}} style={{background:"none",border:"none",cursor:"pointer",padding:4,color:GRAY,fontSize:13}}>✕</button>}
        </div>
        {sugs.length>0&&(
          <div style={{position:"absolute",top:"100%",left:14,right:14,background:"white",borderRadius:14,boxShadow:"0 8px 32px rgba(0,0,0,0.15)",border:"1px solid #E5E7EB",overflow:"hidden",zIndex:1000}}>
            {sugs.map((s,i)=>(
              <button key={i} onClick={()=>pickS(s)} style={{width:"100%",background:"none",border:"none",padding:"12px 16px",textAlign:"right",cursor:"pointer",display:"flex",alignItems:"center",gap:10,borderBottom:i<sugs.length-1?"1px solid #F3F4F6":"none",fontFamily:"Arial,sans-serif"}}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill={RED} style={{flexShrink:0}}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
                <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:DARK}}>{s.display_name.split(",")[0]}</div><div style={{fontSize:10,color:GRAY}}>{s.display_name.split(",").slice(1,3).join(",")}</div></div>
                {!inZ(parseFloat(s.lat),parseFloat(s.lon),zone)&&<span style={{fontSize:9,color:"#EF4444",fontWeight:700,background:"#FEF2F2",padding:"2px 6px",borderRadius:6}}>מחוץ לאזור</span>}
              </button>
            ))}
          </div>
        )}
      </div>
      <div style={{position:"relative",flex:1,overflow:"hidden"}}>
        <div ref={mR} style={{width:"100%",height:"100%"}}/>
        {!ready&&<div style={{position:"absolute",inset:0,background:"white",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,zIndex:200}}><div style={{width:40,height:40,borderRadius:"50%",border:`3px solid rgba(200,16,46,0.15)`,borderTopColor:RED,animation:"yg-spin 0.8s linear infinite"}}/><span style={{color:GRAY,fontSize:13}}>טוען מפה...</span></div>}
        {ready&&(
          <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-100%)",zIndex:1000,pointerEvents:"none",filter:outZ?"none":`drop-shadow(0 4px 12px rgba(200,16,46,0.4))`}}>
            <div style={{width:46,height:46,background:outZ?"#EF4444":"white",border:`3.5px solid ${outZ?"#EF4444":RED}`,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,animation:shake?"yg-shake 0.5s ease":"none",transition:"background 0.3s,border-color 0.3s"}}>{outZ?"🚫":"📍"}</div>
            <div style={{width:0,height:0,borderLeft:"9px solid transparent",borderRight:"9px solid transparent",borderTop:`14px solid ${outZ?"#EF4444":RED}`,margin:"0 auto"}}/>
            <div style={{width:14,height:5,background:"rgba(0,0,0,0.15)",borderRadius:"50%",margin:"2px auto 0",filter:"blur(2px)"}}/>
          </div>
        )}
        <button onClick={myLoc} style={{position:"absolute",left:14,top:14,zIndex:900,width:44,height:44,background:"white",border:"none",borderRadius:"50%",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 12px rgba(0,0,0,0.18)"}}><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/><circle cx="12" cy="12" r="9" strokeDasharray="2 2"/></svg></button>
        <div style={{position:"absolute",left:14,top:70,zIndex:900,display:"flex",flexDirection:"column",gap:6}}>
          {[["+",1],["-",-1]].map(([l,d])=><button key={l} onClick={()=>lR.current?.setZoom((lR.current.getZoom()||14)+d)} style={{width:38,height:38,background:"white",border:"1px solid #E5E7EB",borderRadius:10,fontSize:18,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.1)",color:DARK}}>{l}</button>)}
        </div>
        {outZ&&<div style={{position:"absolute",top:14,left:"50%",transform:"translateX(-50%)",zIndex:1000,background:"#FEF2F2",border:"1.5px solid #FCA5A5",borderRadius:16,padding:"10px 18px",display:"flex",alignItems:"center",gap:8,boxShadow:"0 4px 16px rgba(239,68,68,0.18)",whiteSpace:"nowrap"}}><span style={{fontSize:18}}>😕</span><div><div style={{fontSize:12,fontWeight:800,color:"#DC2626"}}>אזור זה עדיין לא בשירות שלנו</div><div style={{fontSize:10,color:"#EF4444",marginTop:1}}>חזור לאזור {zone.nameHe.split(",")[0]}</div></div></div>}
        <div style={{position:"absolute",bottom:0,left:0,right:0,zIndex:900,background:"white",borderRadius:"20px 20px 0 0",padding:"14px 16px 20px",boxShadow:"0 -4px 20px rgba(0,0,0,0.1)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,background:LIGHT,borderRadius:14,padding:"11px 14px",marginBottom:12}}>
            <div style={{width:34,height:34,background:outZ?"#EF4444":RED,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"background 0.3s"}}><svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>
            <div style={{flex:1}}>{loading?<div style={{height:14,background:"#E5E7EB",borderRadius:7,width:"60%",animation:"yg-pulse 1.2s ease infinite"}}/>:<div style={{fontSize:13,fontWeight:700,color:outZ?"#DC2626":DARK,transition:"color 0.3s"}}>{addr}</div>}<div style={{fontSize:10,color:GRAY,marginTop:2}}>{outZ?"גרור למיקום בתוך האזור":"גרור את המפה לכיוון הנכון"}</div></div>
          </div>
          <button onClick={confirm} style={{width:"100%",background:outZ?"#9CA3AF":`linear-gradient(135deg,${RED},#a00020)`,border:"none",borderRadius:16,padding:"15px",color:"white",fontSize:14,fontWeight:900,cursor:outZ?"not-allowed":"pointer",boxShadow:outZ?"none":`0 4px 16px rgba(200,16,46,0.35)`,transition:"all 0.3s",letterSpacing:0.3}}>{outZ?"⛔ מחוץ לאזור השירות":"אשר מיקום ←"}</button>
        </div>
      </div>
      <style>{`@keyframes yg-spin{to{transform:rotate(360deg)}}@keyframes yg-shake{0%,100%{transform:translate(-50%,-100%)}20%{transform:translate(calc(-50% - 8px),-100%)}40%{transform:translate(calc(-50% + 8px),-100%)}60%{transform:translate(calc(-50% - 5px),-100%)}80%{transform:translate(calc(-50% + 5px),-100%)}}@keyframes yg-pulse{0%,100%{opacity:.5}50%{opacity:1}}.leaflet-container{background:#EEE8DC !important}input::placeholder{color:#9CA3AF}`}</style>
    </div>
  );
}

function DetailsStep({loc,onSave,onBack}){
  const[f,setF]=useState({street:loc.address||"",building:"",floor:"",apt:"",buildingName:"",notes:"",type:"בית"});
  const[saving,setSv]=useState(false);
  const I={width:"100%",border:"1px solid #E5E7EB",borderRadius:12,padding:"12px 14px",fontSize:14,outline:"none",background:"white",textAlign:"right",fontFamily:"Arial,sans-serif",boxSizing:"border-box",color:DARK,direction:"rtl"};
  const fo=e=>{e.target.style.borderColor=RED;e.target.style.boxShadow=`0 0 0 3px rgba(200,16,46,0.1)`;};
  const bl=e=>{e.target.style.borderColor="#E5E7EB";e.target.style.boxShadow="none";};
  async function save(){setSv(true);await new Promise(r=>setTimeout(r,300));const a=[f.street,f.building?`בניין ${f.building}`:"",f.floor?`קומה ${f.floor}`:"",f.apt?`דירה ${f.apt}`:""].filter(Boolean).join(", ");onSave({address:a||loc.address,coords:loc.coords,zone:loc.zone,type:f.type,notes:f.notes,building:f.building,floor:f.floor,apt:f.apt,buildingName:f.buildingName});setSv(false);}
  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:BG}}>
      <div style={{background:"white",padding:"10px 16px",borderBottom:"1px solid #F0F0F0",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
        <button onClick={onBack} style={{width:38,height:38,borderRadius:12,background:LIGHT,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg></button>
        <div style={{flex:1,textAlign:"center"}}><div style={{fontSize:15,fontWeight:900,color:DARK}}>פרטי מיקום</div><div style={{fontSize:10,color:GRAY,marginTop:1}}>הזן את פרטי הכתובת</div></div>
        <button onClick={save} style={{background:RED,border:"none",borderRadius:11,padding:"8px 14px",color:"white",fontSize:12,fontWeight:900,cursor:"pointer"}}>שמור</button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"14px 16px 32px"}}>
        <div style={{background:"rgba(200,16,46,0.04)",border:"1px solid rgba(200,16,46,0.13)",borderRadius:16,padding:"12px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:11}}>
          <div style={{width:36,height:36,background:RED,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><svg width="17" height="17" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:800,color:DARK}}>{loc.address}</div><div style={{fontSize:11,color:GRAY,marginTop:2}}>{loc.zone?.nameHe}</div></div>
          <button onClick={onBack} style={{background:"rgba(200,16,46,0.07)",border:"none",color:RED,fontSize:11,fontWeight:800,cursor:"pointer",padding:"4px 10px",borderRadius:8}}>שנה</button>
        </div>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:12,fontWeight:800,color:DARK,marginBottom:10}}>מהו סוג המיקום?</div>
          <div style={{display:"flex",gap:8}}>
            {[{k:"בית",e:"🏠"},{k:"משרד",e:"🏢"},{k:"מיקום אחר",e:"📍"}].map(t=>(
              <button key={t.k} onClick={()=>setF(p=>({...p,type:t.k}))} style={{flex:1,padding:"11px 6px",borderRadius:14,cursor:"pointer",border:`2px solid ${f.type===t.k?RED:"#E5E7EB"}`,background:f.type===t.k?`rgba(200,16,46,0.06)`:"white",color:f.type===t.k?RED:GRAY,fontSize:11,fontWeight:700,display:"flex",flexDirection:"column",alignItems:"center",gap:5,transition:"all 0.2s",fontFamily:"Arial,sans-serif"}}>
                <span style={{fontSize:20}}>{t.e}</span>{t.k}
              </button>
            ))}
          </div>
        </div>
        <div style={{background:"white",borderRadius:16,padding:"16px",marginBottom:12,boxShadow:"0 1px 6px rgba(0,0,0,0.05)"}}>
          <div style={{fontSize:12,fontWeight:800,color:DARK,marginBottom:12}}>פרטי כתובת</div>
          <div style={{marginBottom:10}}><div style={{fontSize:11,fontWeight:700,color:GRAY,marginBottom:6}}>שם רחוב</div><input style={I} value={f.street} onChange={e=>setF(p=>({...p,street:e.target.value}))} placeholder="שם הרחוב ומספר הבית" onFocus={fo} onBlur={bl}/></div>
          <div style={{display:"flex",gap:10,marginBottom:10}}>
            <div style={{flex:1}}><div style={{fontSize:11,fontWeight:700,color:GRAY,marginBottom:6}}>מספר בניין</div><input style={I} value={f.building} onChange={e=>setF(p=>({...p,building:e.target.value}))} placeholder="בניין" onFocus={fo} onBlur={bl}/></div>
            <div style={{flex:1}}><div style={{fontSize:11,fontWeight:700,color:GRAY,marginBottom:6}}>קומה</div><input style={I} value={f.floor} type="number" onChange={e=>setF(p=>({...p,floor:e.target.value}))} placeholder="קומה" onFocus={fo} onBlur={bl}/></div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <div style={{flex:1}}><div style={{fontSize:11,fontWeight:700,color:GRAY,marginBottom:6}}>דירה (אופציונלי)</div><input style={I} value={f.apt} onChange={e=>setF(p=>({...p,apt:e.target.value}))} placeholder="דירה" onFocus={fo} onBlur={bl}/></div>
            <div style={{flex:1}}><div style={{fontSize:11,fontWeight:700,color:GRAY,marginBottom:6}}>שם הבניין (אופציונלי)</div><input style={I} value={f.buildingName} onChange={e=>setF(p=>({...p,buildingName:e.target.value}))} placeholder="שם הבניין" onFocus={fo} onBlur={bl}/></div>
          </div>
        </div>
        <div style={{background:"white",borderRadius:16,padding:"16px",marginBottom:24,boxShadow:"0 1px 6px rgba(0,0,0,0.05)"}}>
          <div style={{fontSize:12,fontWeight:800,color:DARK,marginBottom:3}}>הוראות לשליח</div>
          <div style={{fontSize:11,color:GRAY,marginBottom:10}}>כדי לעזור לשליח לשלוח אותך</div>
          <div style={{display:"flex",gap:8,background:LIGHT,borderRadius:12,padding:"10px 12px",border:"1px solid #E5E7EB"}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GRAY} strokeWidth="1.8" style={{flexShrink:0,marginTop:2}}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            <textarea value={f.notes} onChange={e=>setF(p=>({...p,notes:e.target.value}))} placeholder="לדוגמה: ליד סניף הדואר הראשי..." style={{flex:1,background:"none",border:"none",outline:"none",resize:"none",fontSize:13,fontFamily:"Arial,sans-serif",color:DARK,minHeight:52,textAlign:"right",direction:"rtl"}}/>
          </div>
        </div>
        <button onClick={save} disabled={saving} style={{width:"100%",background:saving?GRAY:`linear-gradient(135deg,${RED},#a00020)`,border:"none",borderRadius:16,padding:"16px",color:"white",fontSize:15,fontWeight:900,cursor:saving?"not-allowed":"pointer",boxShadow:saving?"none":`0 4px 18px rgba(200,16,46,0.35)`,display:"flex",alignItems:"center",justifyContent:"center",gap:10,transition:"all 0.3s",letterSpacing:0.3}}>
          {saving?(<><div style={{width:18,height:18,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.4)",borderTopColor:"white",animation:"yg-spin 0.7s linear infinite"}}/>שומר...</>):"שמור מיקום ✓"}
        </button>
      </div>
      <style>{`@keyframes yg-spin{to{transform:rotate(360deg)}}textarea::placeholder,input::placeholder{color:#9CA3AF}`}</style>
    </div>
  );
}

export default function AddressPickerPage({onAddressSave,initialZone}){
  const navigate=useNavigate();
  const[step,setStep]=useState(initialZone?"pin":"zone");
  const[zone,setZone]=useState(initialZone||null);
  const[loc,setLoc]=useState(null);
  const si={zone:0,pin:1,details:2}[step];
  return(
    <div style={{position:"fixed",inset:0,background:"white",fontFamily:"Arial,sans-serif",direction:"rtl",display:"flex",flexDirection:"column",zIndex:200,maxWidth:430,margin:"0 auto"}}>
      <div style={{position:"absolute",top:68,left:"50%",transform:"translateX(-50%)",zIndex:2000,display:"flex",gap:5,pointerEvents:"none"}}>
        {[0,1,2].map(i=><div key={i} style={{width:i===si?22:8,height:8,borderRadius:4,background:i<si?`rgba(200,16,46,0.45)`:i===si?RED:"#E5E7EB",transition:"all 0.35s ease"}}/>)}
      </div>
      {step==="zone"&&<ZoneStep onSelect={z=>{setZone(z);setStep("pin");}}/>}
      {step==="pin"&&zone&&<PinStep zone={zone} onConfirm={d=>{setLoc(d);setStep("details");}} onBack={()=>setStep("zone")}/>}
      {step==="details"&&loc&&<DetailsStep loc={loc} onSave={d=>{onAddressSave?.(d);navigate(-1);}} onBack={()=>setStep("pin")}/>}
    </div>
  );
}
