import { useState, useEffect, useRef } from "react";

const SUPABASE_URL = "https://sfwrcqypezmriycekfsd.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmd3JjcXlwZXptcml5Y2VrZnNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MTI2MDcsImV4cCI6MjA5MDk4ODYwN30.QEVD7twXB0DWO36o805bQ7OtDnRAU_GQoP9H4Asev2c";

const hdrs = () => ({ apikey:ANON_KEY, Authorization:`Bearer ${ANON_KEY}`, "Content-Type":"application/json", Prefer:"return=representation" });
const dbGet   = async (t,q="") => { try { const r=await fetch(`${SUPABASE_URL}/rest/v1/${t}?${q}`,{headers:hdrs()}); const x=await r.text(); return x?JSON.parse(x):[]; } catch(e){return [];} };
const dbPost  = async (t,b)    => { try { const r=await fetch(`${SUPABASE_URL}/rest/v1/${t}`,{method:"POST",headers:hdrs(),body:JSON.stringify(b)}); const x=await r.text(); return x?JSON.parse(x):[]; } catch(e){return [];} };
const dbPatch = async (t,q,b)  => { try { const r=await fetch(`${SUPABASE_URL}/rest/v1/${t}?${q}`,{method:"PATCH",headers:{...hdrs(),Prefer:"return=representation"},body:JSON.stringify(b)}); const x=await r.text(); return x?JSON.parse(x):[]; } catch(e){return [];} };

const C = {
  bg:"#0F0A1E", card:"#1A1332", cardBorder:"#2D2250",
  pink:"#F472B6", pinkGlow:"rgba(244,114,182,0.25)",
  blue:"#60A5FA", blueGlow:"rgba(96,165,250,0.25)",
  green:"#4ADE80", greenGlow:"rgba(74,222,128,0.25)",
  yellow:"#FBBF24", text:"#F0EAFF", textMuted:"#7C6FA0",
  hot:"#FF6B6B",
};

const FORECAST = [
  {day:"Mon",f:38, b:42, zone:"Elmwood Ave",    peak:"2–4pm",  tx:312 },
  {day:"Tue",f:71, b:65, zone:"Lincoln Park",   peak:"3–6pm",  tx:548 },
  {day:"Wed",f:58, b:55, zone:"Riverside Dr",   peak:"4–7pm",  tx:421 },
  {day:"Thu",f:44, b:48, zone:"Oak Street",     peak:"2–5pm",  tx:389 },
  {day:"Fri",f:95, b:88, zone:"Westside Mall",  peak:"5–8pm",  tx:712 },
  {day:"Sat",f:134,b:120,zone:"Beachfront",     peak:"12–6pm", tx:1847},
  {day:"Sun",f:112,b:105,zone:"Farmers Market", peak:"10am–3pm",tx:934},
];

const DEMO_PINS = [
  {id:1,x:22,y:35,count:8, heat:"high",zone:"Riverside Dr"},
  {id:2,x:55,y:28,count:14,heat:"hot", zone:"Lincoln Park"},
  {id:3,x:68,y:52,count:5, heat:"med", zone:"Oak & 5th"},
  {id:4,x:35,y:60,count:11,heat:"high",zone:"Beachfront"},
  {id:5,x:80,y:38,count:3, heat:"low", zone:"Elm St"},
  {id:6,x:45,y:75,count:9, heat:"high",zone:"Westside"},
  {id:7,x:18,y:68,count:6, heat:"med", zone:"Maple Ave"},
];

const DEMO_MENU = [
  {id:1,name:"Classic Vanilla Cone",    price:3.50,emoji:"🍦",available:true, popular:true},
  {id:2,name:"Strawberry Shortcake Bar",price:4.00,emoji:"🍓",available:true, popular:true},
  {id:3,name:"Chocolate Dip Cone",      price:4.50,emoji:"🍫",available:true, popular:false},
  {id:4,name:"Cookie Sandwich",         price:5.00,emoji:"🍪",available:true, popular:true},
  {id:5,name:"Rainbow Popsicle",        price:2.50,emoji:"🌈",available:false,popular:false},
  {id:6,name:"Mango Sorbet Cup",        price:3.75,emoji:"🥭",available:true, popular:false},
];

function Counter({ target, prefix="$", decimals=0, duration=1200 }) {
  const [v,setV]=useState(0);
  const r=useRef();
  useEffect(()=>{
    const s=performance.now();
    const go=(n)=>{ const p=Math.min((n-s)/duration,1); setV((1-Math.pow(1-p,3))*target); if(p<1) r.current=requestAnimationFrame(go); };
    r.current=requestAnimationFrame(go);
    return ()=>cancelAnimationFrame(r.current);
  },[target]);
  return <span>{prefix}{decimals>0?v.toFixed(decimals):Math.floor(v)}</span>;
}

function Spark({ data, color }) {
  const max=Math.max(...data.map(d=>d.amount))||1, w=260, h=52;
  const pts=data.map((d,i)=>[(i/(data.length-1))*w, h-(d.amount/max)*(h-8)-4]);
  const poly=pts.map(p=>p.join(",")).join(" ");
  const area=`0,${h} ${poly} ${w},${h}`;
  const [lx,ly]=pts[pts.length-1];
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{overflow:"visible",display:"block"}}>
      <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".35"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      <polygon points={area} fill="url(#sg)"/>
      <polyline points={poly} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round"/>
      <circle cx={lx} cy={ly} r="4" fill={color} style={{filter:`drop-shadow(0 0 5px ${color})`}}/>
    </svg>
  );
}

function FBar({ day, f, b, zone, peak, tx, maxF, isToday, isBest }) {
  const [hov,setHov]=useState(false);
  const pct=Math.round((f/maxF)*100);
  const chg=Math.round(((f-b)/b)*100);
  const col=isBest?C.yellow:f>80?C.pink:f>55?C.blue:C.green;
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1,cursor:"pointer",position:"relative"}}>
      {hov&&<div style={{position:"absolute",bottom:"105%",left:"50%",transform:"translateX(-50%)",background:C.card,border:`1px solid ${col}66`,borderRadius:12,padding:"10px 12px",zIndex:20,width:130,boxShadow:"0 8px 24px rgba(0,0,0,.6)",pointerEvents:"none"}}>
        <div style={{fontSize:11,color:col,fontFamily:"'Fredoka One',cursive",marginBottom:3}}>{zone}</div>
        <div style={{fontSize:10,color:C.textMuted,fontFamily:"'Nunito',sans-serif",fontWeight:700}}>Peak: {peak}</div>
        <div style={{fontSize:10,color:chg>=0?C.green:C.hot,fontFamily:"'Nunito',sans-serif",fontWeight:800,marginTop:3}}>{chg>=0?`↑ +${chg}%`:`↓ ${chg}%`} vs avg</div>
        <div style={{fontSize:9,color:C.textMuted,fontFamily:"'Nunito',sans-serif",fontWeight:700,marginTop:3,borderTop:`1px solid ${C.cardBorder}`,paddingTop:4}}>📊 {tx.toLocaleString()} platform tx</div>
      </div>}
      <div style={{fontSize:9,color:chg>=0?C.green:C.hot,fontFamily:"'Nunito',sans-serif",fontWeight:800,marginBottom:4}}>{chg>=0?`+${chg}%`:`${chg}%`}</div>
      <div style={{width:"100%",height:80,background:`${C.bg}99`,borderRadius:8,display:"flex",flexDirection:"column",justifyContent:"flex-end",overflow:"hidden",border:isToday?`1px solid ${col}88`:`1px solid ${C.cardBorder}44`}}>
        <div style={{width:"100%",height:`${pct}%`,background:isBest?`linear-gradient(180deg,${C.yellow},${C.yellow}77)`:`linear-gradient(180deg,${col},${col}66)`,borderRadius:"5px 5px 0 0",boxShadow:(isToday||isBest)?`0 0 14px ${col}55`:"none"}}>
          {isBest&&<div style={{textAlign:"center",fontSize:11,marginTop:-14}}>🔥</div>}
        </div>
      </div>
      <div style={{fontSize:10,color:isToday?C.text:C.textMuted,fontFamily:"'Fredoka One',cursive",marginTop:5}}>{day}</div>
      <div style={{fontSize:9,color:col,fontFamily:"'Fredoka One',cursive"}}>${f}</div>
    </div>
  );
}

export default function IScreamDriver() {
  const [dash,setDash]           = useState("dashboard");
  const [isLive,setIsLive]       = useState(false);
  const [goingLive,setGoingLive] = useState(false);
  const [earnings,setEarnings]   = useState(237.50);
  const [orders,setOrders]       = useState([]);
  const [menu,setMenu]           = useState(DEMO_MENU);
  const [pins,setPins]           = useState(DEMO_PINS);
  const [confetti,setConfetti]   = useState([]);
  const [notif,setNotif]         = useState(null);
  const [hotAlert,setHotAlert]   = useState(false);
  const [dbOk,setDbOk]           = useState(false);
  const [driver,setDriver]       = useState(null);
  const [selectedDriver,setSelectedDriver] = useState(null);

  const maxF=Math.max(...FORECAST.map(d=>d.f));
  const totalTx=FORECAST.reduce((s,d)=>s+d.tx,0);
  const todayIdx=(new Date().getDay()+6)%7;
  const histData=[
    {time:"9am",amount:0},{time:"10am",amount:18},{time:"11am",amount:47},
    {time:"12pm",amount:89},{time:"1pm",amount:124},{time:"2pm",amount:156},
    {time:"3pm",amount:198},{time:"now",amount:earnings},
  ];

  useEffect(()=>{
    loadDrivers();
    setTimeout(()=>showNotif("👋 Welcome back! Tap GO LIVE to start earning."),1200);
  },[]);

  useEffect(()=>{
    if(!isLive)return;
    const iv=setInterval(()=>setEarnings(e=>+(e+Math.random()*.18).toFixed(2)),2800);
    return ()=>clearInterval(iv);
  },[isLive]);

  useEffect(()=>{
    if(!isLive)return;
    const iv=setInterval(()=>setPins(p=>p.map(x=>({...x,count:Math.random()>.65?x.count+1:x.count}))),4000);
    return ()=>clearInterval(iv);
  },[isLive]);

  useEffect(()=>{
    if(!isLive)return;
    const t=setTimeout(()=>{ setHotAlert(true); showNotif("🔥 SPIKE on Lincoln Park — 14 waiting!"); setTimeout(()=>setHotAlert(false),5000); },5000);
    return ()=>clearTimeout(t);
  },[isLive]);

  const loadDrivers=async()=>{
    const data=await dbGet("drivers","subscription_active=eq.true&select=*,menu_items(*)");
    if(data?.length>0){
      setDriver(data[0]);
      setSelectedDriver(data[0]);
      if(data[0].menu_items?.length>0) setMenu(data[0].menu_items);
      setDbOk(true);
    }
  };

  const showNotif=(m)=>{ setNotif(m); setTimeout(()=>setNotif(null),4000); };

  const fireConfetti=()=>{
    setConfetti(Array.from({length:28},(_,i)=>({id:i,x:25+Math.random()*50,color:[C.pink,C.blue,C.green,C.yellow][i%4],delay:Math.random()*.5,size:5+Math.random()*7})));
    setTimeout(()=>setConfetti([]),2500);
  };

  const handleGoLive=async()=>{
    setGoingLive(true);
    if(driver?.id){
      await dbPost("truck_locations",{driver_id:driver.id,lat:40.7128,lng:-74.006,is_live:true});
      setDbOk(true);
    }
    setTimeout(()=>{ setIsLive(true); setGoingLive(false); fireConfetti(); showNotif("🚀 You're LIVE! Customers can see you."); },1800);
  };

  const handleEndShift=async()=>{
    if(driver?.id) await dbPatch("truck_locations",`driver_id=eq.${driver.id}`,{is_live:false});
    setIsLive(false); showNotif("✅ Shift ended. Great work!");
  };

  const acceptOrder=async(order)=>{
    if(order.id&&!order.id.startsWith("demo")) await dbPatch("orders",`id=eq.${order.id}`,{status:"accepted"});
    const amt=Number(order.total||5);
    setOrders(p=>p.filter(o=>o.id!==order.id));
    setEarnings(e=>+(e+amt).toFixed(2));
    fireConfetti(); showNotif(`💰 +$${amt.toFixed(2)} locked in!`);
  };

  const declineOrder=async(order)=>{
    if(order.id&&!order.id.startsWith("demo")) await dbPatch("orders",`id=eq.${order.id}`,{status:"declined"});
    setOrders(p=>p.filter(o=>o.id!==order.id)); showNotif("Order declined.");
  };

  const toggleItem=async(item)=>{
    const next=!item.available;
    if(item.id&&typeof item.id==="string"&&item.id.length>5) await dbPatch("menu_items",`id=eq.${item.id}`,{available:next});
    setMenu(p=>p.map(m=>m.id===item.id?{...m,available:next}:m));
    showNotif(next?`✅ ${item.name} available`:`❌ ${item.name} sold out`);
  };

  const demoOrders=isLive?[
    {id:"demo-1",items:[{name:"Strawberry Shortcake Bar",emoji:"🍓"}],total:4.00,customer_id:"Sarah M.",urgent:true},
    {id:"demo-2",items:[{name:"Cookie Sandwich",emoji:"🍪"}],total:5.00,customer_id:"Tyler R.",urgent:false},
    {id:"demo-3",items:[{name:"Classic Vanilla Cone",emoji:"🍦"}],total:3.50,customer_id:"Jamie K.",urgent:true},
  ]:[];

  const displayOrders=orders.length>0?orders:demoOrders;
  const truckLabel=driver?.truck_name||"Your Truck";
  const streakDays=driver?.streak_days||6;

  return (
    <div style={{fontFamily:"'Fredoka One',cursive",background:C.bg,minHeight:"100vh",maxWidth:420,margin:"0 auto",position:"relative",overflow:"hidden",boxShadow:"0 0 80px rgba(0,0,0,.5)"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:0}
        @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes softPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.75;transform:scale(1.03)}}
        @keyframes liveRing{0%{transform:scale(1);opacity:.7}100%{transform:scale(2.8);opacity:0}}
        @keyframes confettiFall{0%{transform:translateY(-10px) rotate(0deg);opacity:1}100%{transform:translateY(130px) rotate(400deg);opacity:0}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
        @keyframes hotPulse{0%,100%{box-shadow:0 0 0 rgba(255,107,107,0)}50%{box-shadow:0 0 28px rgba(255,107,107,.45)}}
        @keyframes notifSlide{0%{transform:translateX(120%);opacity:0}12%{transform:translateX(0);opacity:1}78%{transform:translateX(0);opacity:1}100%{transform:translateX(120%);opacity:0}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .se{animation:slideUp .3s cubic-bezier(.34,1.2,.64,1)}
        .card{background:${C.card};border:1px solid ${C.cardBorder};border-radius:20px;padding:16px}
        .tab{flex:1;padding:10px 4px;border:none;background:transparent;font-family:'Fredoka One',cursive;font-size:12px;cursor:pointer;border-radius:12px;display:flex;flex-direction:column;align-items:center;gap:2px;color:${C.textMuted};transition:all .2s}
        .tab.on{background:${C.cardBorder};color:${C.pink}}
        .abtn{flex:1;background:linear-gradient(135deg,#4ADE80,#22C55E);color:#0a1a0f;border:none;border-radius:12px;padding:10px 0;font-family:'Fredoka One',cursive;font-size:14px;cursor:pointer;transition:transform .15s;box-shadow:0 4px 14px rgba(74,222,128,.3)}
        .abtn:active{transform:scale(.95)}
        .dbtn{background:${C.cardBorder};color:${C.textMuted};border:none;border-radius:12px;padding:10px 16px;font-family:'Fredoka One',cursive;font-size:14px;cursor:pointer}
        .ton{background:${C.green};color:#0a1a0f;border:none;border-radius:10px;padding:6px 14px;font-family:'Fredoka One',cursive;font-size:11px;cursor:pointer}
        .toff{background:${C.cardBorder};color:${C.textMuted};border:none;border-radius:10px;padding:6px 14px;font-family:'Fredoka One',cursive;font-size:11px;cursor:pointer}
      `}</style>

      {confetti.map(p=>(
        <div key={p.id} style={{position:"fixed",top:"18%",left:`${p.x}%`,width:p.size,height:p.size*.6,background:p.color,borderRadius:2,zIndex:999,pointerEvents:"none",animation:`confettiFall 2s ease-in forwards`,animationDelay:`${p.delay}s`,boxShadow:`0 0 5px ${p.color}`}}/>
      ))}

      {notif&&<div style={{position:"fixed",top:68,right:16,background:C.card,borderRadius:16,padding:"12px 16px",boxShadow:"0 8px 30px rgba(0,0,0,.6)",zIndex:1000,maxWidth:275,fontSize:13,fontFamily:"'Nunito',sans-serif",fontWeight:700,color:C.text,animation:"notifSlide 4s ease forwards",borderLeft:`4px solid ${C.pink}`}}>{notif}</div>}

      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#1A1332,#0F0A1E)",padding:"52px 20px 18px",borderBottom:`1px solid ${C.cardBorder}`,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-30,right:-30,width:140,height:140,borderRadius:"50%",background:`radial-gradient(circle,${C.pinkGlow},transparent 70%)`,pointerEvents:"none"}}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",position:"relative"}}>
          <div>
            <div style={{fontSize:10,color:C.textMuted,fontFamily:"'Nunito',sans-serif",fontWeight:700,letterSpacing:2,marginBottom:3,display:"flex",alignItems:"center",gap:6}}>
              DRIVER DASHBOARD
              {dbOk&&<span style={{background:`${C.green}22`,color:C.green,borderRadius:8,padding:"1px 6px",fontSize:9}}>● Live DB</span>}
            </div>
            <div style={{fontSize:22,color:C.text}}>🚐 {truckLabel}</div>
            {driver&&<div style={{fontSize:11,color:C.textMuted,fontFamily:"'Nunito',sans-serif",fontWeight:600,marginTop:2}}>{driver.specialty}</div>}
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:10,color:C.textMuted,fontFamily:"'Nunito',sans-serif",fontWeight:700}}>TODAY</div>
            <div style={{fontSize:22,color:C.green,textShadow:`0 0 18px ${C.green}`}}><Counter target={earnings} decimals={2}/></div>
            <div style={{fontSize:10,color:C.green,fontFamily:"'Nunito',sans-serif",fontWeight:800}}>↑ 18% vs yesterday</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginTop:14,background:`${C.cardBorder}66`,borderRadius:12,padding:"8px 12px"}}>
          <span style={{fontSize:16,animation:"float 2s ease-in-out infinite"}}>🔥</span>
          <div style={{flex:1}}>
            <div style={{fontSize:11,color:C.yellow,fontFamily:"'Fredoka One',cursive",marginBottom:5}}>{streakDays} Day Streak — don't break it!</div>
            <div style={{display:"flex",gap:4}}>
              {Array.from({length:7},(_,i)=>(
                <div key={i} style={{flex:1,height:5,borderRadius:3,background:i<streakDays?C.yellow:C.cardBorder,boxShadow:i<streakDays?`0 0 6px ${C.yellow}77`:"none"}}/>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* DASHBOARD */}
      {dash==="dashboard"&&(
        <div className="se" style={{padding:"14px 14px 100px",display:"flex",flexDirection:"column",gap:14}}>

          {/* Go Live */}
          <div style={{borderRadius:24,padding:20,textAlign:"center",position:"relative",overflow:"hidden",background:isLive?"linear-gradient(135deg,#0a2518,#0d2d1a)":"linear-gradient(135deg,#1E0F35,#0F0A1E)",border:isLive?`1.5px solid ${C.green}`:`1.5px solid ${C.pink}55`,boxShadow:isLive?`0 0 30px ${C.greenGlow}`:`0 0 20px ${C.pinkGlow}`,animation:isLive?"hotPulse 3s ease-in-out infinite":"none"}}>
            {isLive&&<>
              <div style={{position:"absolute",top:"50%",left:"50%",width:80,height:80,borderRadius:"50%",border:`2px solid ${C.green}`,opacity:.5,transform:"translate(-50%,-50%)",animation:"liveRing 2s ease-out infinite",pointerEvents:"none"}}/>
              <div style={{position:"absolute",top:"50%",left:"50%",width:80,height:80,borderRadius:"50%",border:`2px solid ${C.green}`,opacity:.3,transform:"translate(-50%,-50%)",animation:"liveRing 2s ease-out infinite",animationDelay:".7s",pointerEvents:"none"}}/>
            </>}
            <div style={{position:"relative"}}>
              <div style={{fontSize:38,marginBottom:6,animation:"float 2s ease-in-out infinite"}}>{isLive?"📡":"🚐"}</div>
              <div style={{fontFamily:"'Fredoka One',cursive",fontSize:20,color:isLive?C.green:C.text,marginBottom:4}}>{isLive?"YOU'RE LIVE":goingLive?"Connecting...":"Start Your Shift"}</div>
              <div style={{fontSize:12,color:C.textMuted,fontFamily:"'Nunito',sans-serif",fontWeight:700,marginBottom:16}}>{isLive?"Customers can see your location · Orders incoming":"Tap to broadcast your location & start earning"}</div>
              {!isLive&&<button onClick={handleGoLive} disabled={goingLive} style={{background:goingLive?C.cardBorder:`linear-gradient(135deg,${C.pink},${C.blue})`,color:"white",border:"none",borderRadius:16,padding:"14px 44px",fontFamily:"'Fredoka One',cursive",fontSize:18,cursor:goingLive?"default":"pointer",boxShadow:`0 6px 24px ${C.pinkGlow}`,opacity:goingLive?.6:1}}>{goingLive?"🔄 Connecting...":"GO LIVE →"}</button>}
              {isLive&&<button onClick={handleEndShift} style={{background:"transparent",color:C.textMuted,border:`1px solid ${C.cardBorder}`,borderRadius:12,padding:"8px 22px",fontFamily:"'Fredoka One',cursive",fontSize:13,cursor:"pointer"}}>End Shift</button>}
            </div>
          </div>

          {/* Stats */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            {[
              {label:"Orders",  value:"12",                      icon:"📦",color:C.blue,  delta:"+3 today"},
              {label:"Avg Sale",value:"$5.40",                   icon:"💰",color:C.yellow,delta:"+$0.80"},
              {label:"Rating",  value:`${driver?.rating||4.9}★`, icon:"⭐",color:C.pink,  delta:"Top 5%"},
            ].map(s=>(
              <div key={s.label} className="card" style={{textAlign:"center",border:`1px solid ${s.color}33`,padding:"12px 8px"}}>
                <div style={{fontSize:20,marginBottom:4}}>{s.icon}</div>
                <div style={{fontFamily:"'Fredoka One',cursive",fontSize:16,color:s.color,textShadow:`0 0 10px ${s.color}77`}}>{s.value}</div>
                <div style={{fontSize:9,color:C.textMuted,fontFamily:"'Nunito',sans-serif",fontWeight:700,marginTop:2}}>{s.label}</div>
                <div style={{fontSize:9,color:C.green,fontFamily:"'Nunito',sans-serif",fontWeight:800,marginTop:3}}>{s.delta}</div>
              </div>
            ))}
          </div>

          {/* Sparkline */}
          <div className="card" style={{border:`1px solid ${C.green}33`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div>
                <div style={{fontFamily:"'Fredoka One',cursive",fontSize:15,color:C.text}}>Today's Earnings</div>
                <div style={{fontSize:11,color:isLive?C.green:C.textMuted,fontFamily:"'Nunito',sans-serif",fontWeight:700}}>{isLive?"● Live · updating":"Go live to start"}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontFamily:"'Fredoka One',cursive",fontSize:22,color:C.green,textShadow:`0 0 14px ${C.green}`}}><Counter target={earnings} decimals={2}/></div>
              </div>
            </div>
            <Spark data={histData} color={C.green}/>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
              {histData.map(h=><div key={h.time} style={{fontSize:8,color:C.textMuted,fontFamily:"'Nunito',sans-serif",fontWeight:700}}>{h.time}</div>)}
            </div>
          </div>

          {/* Orders */}
          {displayOrders.length>0&&(
            <div className="card" style={{border:`1px solid ${C.pink}44`}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                <div style={{fontFamily:"'Fredoka One',cursive",fontSize:15,color:C.text}}>Incoming Pre-Orders</div>
                <div style={{background:C.pink,color:"white",borderRadius:50,width:22,height:22,fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Fredoka One',cursive",animation:"softPulse 1.5s ease-in-out infinite"}}>{displayOrders.length}</div>
              </div>
              {displayOrders.map(order=>{
                const item=order.items?.[0]||{};
                const amt=Number(order.total||5);
                return (
                  <div key={order.id} style={{background:`${C.bg}99`,borderRadius:14,padding:12,marginBottom:8,border:order.urgent?`1px solid ${C.hot}66`:`1px solid ${C.cardBorder}`,boxShadow:order.urgent?`0 0 14px rgba(255,107,107,.2)`:"none"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                      <span style={{fontSize:26}}>{item.emoji||"🍦"}</span>
                      <div style={{flex:1}}>
                        <div style={{fontFamily:"'Fredoka One',cursive",fontSize:13,color:C.text,display:"flex",alignItems:"center",gap:6}}>
                          {item.name||"Ice Cream Order"}
                          {order.urgent&&<span style={{fontSize:9,background:C.hot,color:"white",borderRadius:6,padding:"1px 6px"}}>URGENT</span>}
                        </div>
                        <div style={{fontSize:11,color:C.textMuted,fontFamily:"'Nunito',sans-serif",fontWeight:600,marginTop:2}}>{order.customer_id||"Customer"}</div>
                      </div>
                      <div style={{fontFamily:"'Fredoka One',cursive",fontSize:17,color:C.green,textShadow:`0 0 8px ${C.green}`}}>+${amt.toFixed(2)}</div>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <button className="abtn" onClick={()=>acceptOrder(order)}>✓ Accept</button>
                      <button className="dbtn" onClick={()=>declineOrder(order)}>✕ Decline</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Forecast */}
          <div className="card" style={{border:`1px solid ${C.yellow}33`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
              <div>
                <div style={{fontFamily:"'Fredoka One',cursive",fontSize:15,color:C.text}}>📊 Weekly Forecast</div>
                <div style={{fontSize:10,color:C.textMuted,fontFamily:"'Nunito',sans-serif",fontWeight:700}}>Based on {totalTx.toLocaleString()} platform transactions</div>
              </div>
              <div style={{fontSize:9,color:C.yellow,fontFamily:"'Nunito',sans-serif",fontWeight:800,background:`${C.yellow}22`,padding:"3px 8px",borderRadius:8,border:`1px solid ${C.yellow}44`}}>🔥 SAT IS HUGE</div>
            </div>
            <div style={{background:`linear-gradient(135deg,${C.blue}18,${C.green}11)`,border:`1px solid ${C.blue}33`,borderRadius:12,padding:"8px 12px",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:16}}>🌐</span>
              <div>
                <div style={{fontSize:11,color:C.blue,fontFamily:"'Fredoka One',cursive"}}>I Scream Platform Intelligence</div>
                <div style={{fontSize:10,color:C.textMuted,fontFamily:"'Nunito',sans-serif",fontWeight:700}}>All drivers · all zones · weather · events · updated daily</div>
              </div>
            </div>
            <div style={{background:`linear-gradient(135deg,${C.yellow}22,${C.pink}11)`,borderRadius:12,padding:"8px 12px",marginBottom:14,border:`1px solid ${C.yellow}44`,display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:18}}>📍</span>
              <div style={{flex:1}}>
                <div style={{fontSize:11,color:C.yellow,fontFamily:"'Fredoka One',cursive"}}>Today's Hot Zone: {FORECAST[todayIdx].zone}</div>
                <div style={{fontSize:10,color:C.textMuted,fontFamily:"'Nunito',sans-serif",fontWeight:700}}>Peak: {FORECAST[todayIdx].peak} · {FORECAST[todayIdx].tx.toLocaleString()} historical transactions</div>
              </div>
            </div>
            <div style={{display:"flex",gap:5,alignItems:"flex-end",padding:"0 2px"}}>
              {FORECAST.map((d,i)=><FBar key={d.day} day={d.day} f={d.f} b={d.b} zone={d.zone} peak={d.peak} tx={d.tx} maxF={maxF} isToday={i===todayIdx} isBest={d.f===maxF}/>)}
            </div>
            <div style={{marginTop:10,fontSize:9,color:C.textMuted,fontFamily:"'Nunito',sans-serif",fontWeight:700,textAlign:"center"}}>Hover bars for zone details · Updates every 24hrs</div>
          </div>

          {/* ROI */}
          <div style={{borderRadius:20,padding:16,textAlign:"center",background:`linear-gradient(135deg,${C.pinkGlow},${C.blueGlow})`,border:`1px solid ${C.pink}44`}}>
            <div style={{fontFamily:"'Fredoka One',cursive",fontSize:14,color:C.text,marginBottom:4}}>🍦 I Scream Pro · $20/mo</div>
            <div style={{fontSize:12,color:C.textMuted,fontFamily:"'Nunito',sans-serif",fontWeight:700,marginBottom:10}}>
              You've earned <span style={{color:C.green}}>${earnings.toFixed(2)}</span> today ·{" "}
              <span style={{color:C.yellow}}>{Math.round(earnings/20*100)}% ROI</span> on your subscription
            </div>
            <div style={{display:"flex",justifyContent:"center",gap:12,flexWrap:"wrap"}}>
              {["Live demand map","Pre-orders","Platform forecasts","Route planner"].map(f=>(
                <div key={f} style={{fontSize:9,color:C.green,fontFamily:"'Nunito',sans-serif",fontWeight:800}}>✓ {f}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MAP */}
      {dash==="map"&&(
        <div className="se">
          <div style={{position:"relative",height:380,background:"linear-gradient(160deg,#0d1f0f,#0a1520 50%,#1a0a1f)",overflow:"hidden"}}>
            {[20,40,60,80].map(p=><div key={`h${p}`} style={{position:"absolute",left:0,right:0,top:`${p}%`,height:1,background:"rgba(255,255,255,.06)"}}/>)}
            {[20,40,60,80].map(p=><div key={`v${p}`} style={{position:"absolute",top:0,bottom:0,left:`${p}%`,width:1,background:"rgba(255,255,255,.06)"}}/>)}
            {pins.map(pin=>{
              const col=pin.heat==="hot"?C.hot:pin.heat==="high"?C.pink:pin.heat==="med"?C.yellow:C.blue;
              return <div key={`h${pin.id}`} style={{position:"absolute",left:`${pin.x}%`,top:`${pin.y}%`,width:`${50+pin.count*10}px`,height:`${50+pin.count*10}px`,borderRadius:"50%",background:`radial-gradient(circle,${col}${pin.heat==="hot"?"55":"33"} 0%,transparent 70%)`,transform:"translate(-50%,-50%)",animation:"softPulse 2s ease-in-out infinite",animationDelay:`${pin.id*.4}s`,pointerEvents:"none"}}/>;
            })}
            {pins.map(pin=>{
              const col=pin.heat==="hot"?C.hot:pin.heat==="high"?C.pink:pin.heat==="med"?C.yellow:C.blue;
              return <div key={pin.id} style={{position:"absolute",left:`${pin.x}%`,top:`${pin.y}%`,transform:"translate(-50%,-110%)"}}>
                <div style={{background:col,color:"white",borderRadius:"50% 50% 50% 0",transform:"rotate(-45deg)",width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontFamily:"'Fredoka One',cursive",boxShadow:`0 0 12px ${col}88`}}>
                  <span style={{transform:"rotate(45deg)"}}>{pin.count}</span>
                </div>
              </div>;
            })}
            <div style={{position:"absolute",left:"50%",top:"50%",transform:"translate(-50%,-50%)"}}>
              <div style={{width:50,height:50,borderRadius:"50%",border:`3px solid ${C.green}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,background:`${C.green}22`,boxShadow:`0 0 20px ${C.green}55`,animation:"softPulse 2s ease-in-out infinite"}}>🚐</div>
              <div style={{position:"absolute",top:"50%",left:"50%",width:80,height:80,borderRadius:"50%",border:`1px solid ${C.green}44`,transform:"translate(-50%,-50%)",animation:"liveRing 2s ease-out infinite",pointerEvents:"none"}}/>
            </div>
            <div style={{position:"absolute",bottom:12,left:12,display:"flex",flexDirection:"column",gap:4}}>
              {[["hot",C.hot,"🔥 Hot"],["high",C.pink,"High"],["med",C.yellow,"Medium"],["low",C.blue,"Low"]].map(([k,c,l])=>(
                <div key={k} style={{display:"flex",alignItems:"center",gap:6,background:"rgba(0,0,0,.55)",borderRadius:8,padding:"3px 8px"}}>
                  <div style={{width:7,height:7,borderRadius:"50%",background:c,boxShadow:`0 0 5px ${c}`}}/>
                  <span style={{fontSize:10,color:C.text,fontFamily:"'Nunito',sans-serif",fontWeight:700}}>{l}</span>
                </div>
              ))}
            </div>
            {hotAlert&&<div style={{position:"absolute",top:12,left:12,right:12,background:`${C.hot}22`,border:`1px solid ${C.hot}`,borderRadius:14,padding:"10px 14px",display:"flex",alignItems:"center",gap:10,animation:"fadeIn .3s ease"}}>
              <span style={{fontSize:20}}>🔥</span>
              <div>
                <div style={{fontFamily:"'Fredoka One',cursive",fontSize:13,color:C.hot}}>DEMAND SPIKE</div>
                <div style={{fontSize:11,color:C.textMuted,fontFamily:"'Nunito',sans-serif",fontWeight:700}}>14 people waiting on Lincoln Park</div>
              </div>
            </div>}
          </div>
          <div style={{padding:"14px 14px 100px",display:"flex",flexDirection:"column",gap:10}}>
            <div style={{fontFamily:"'Fredoka One',cursive",fontSize:15,color:C.text}}>📍 Demand Zones — Sorted by Intensity</div>
            {[...pins].sort((a,b)=>b.count-a.count).map(pin=>{
              const col=pin.heat==="hot"?C.hot:pin.heat==="high"?C.pink:pin.heat==="med"?C.yellow:C.blue;
              return <div key={pin.id} className="card" style={{display:"flex",alignItems:"center",gap:12,border:`1px solid ${col}33`,padding:"12px 14px"}}>
                <div style={{width:42,height:42,borderRadius:"50%",background:`${col}22`,border:`2px solid ${col}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Fredoka One',cursive",fontSize:15,color:col,boxShadow:`0 0 10px ${col}44`,flexShrink:0}}>{pin.count}</div>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"'Fredoka One',cursive",fontSize:13,color:C.text}}>{pin.zone}</div>
                  <div style={{fontSize:11,color:C.textMuted,fontFamily:"'Nunito',sans-serif",fontWeight:600,marginTop:2}}>{pin.count} waiting · {(pin.id*.15+.2).toFixed(1)}mi away</div>
                </div>
                <div style={{fontSize:10,color:col,fontFamily:"'Fredoka One',cursive",textTransform:"uppercase",background:`${col}22`,padding:"3px 8px",borderRadius:8}}>{pin.heat}</div>
              </div>;
            })}
          </div>
        </div>
      )}

      {/* MENU */}
      {dash==="menu"&&(
        <div className="se" style={{padding:"14px 14px 100px",display:"flex",flexDirection:"column",gap:10}}>
          <div style={{fontFamily:"'Fredoka One',cursive",fontSize:18,color:C.text,marginBottom:4}}>📋 Menu Manager</div>
          <div style={{fontSize:12,color:C.textMuted,fontFamily:"'Nunito',sans-serif",fontWeight:700,marginBottom:8}}>Changes go live instantly — customers see this in real time</div>
          {menu.map(item=>(
            <div key={item.id} className="card" style={{display:"flex",alignItems:"center",gap:12,opacity:item.available?1:.55}}>
              <div style={{fontSize:28}}>{item.emoji}</div>
              <div style={{flex:1}}>
                <div style={{fontFamily:"'Fredoka One',cursive",fontSize:14,color:C.text}}>{item.name}</div>
                <div style={{fontFamily:"'Fredoka One',cursive",fontSize:13,color:C.green,marginTop:2}}>${Number(item.price).toFixed(2)}</div>
              </div>
              <button className={item.available?"ton":"toff"} onClick={()=>toggleItem(item)}>
                {item.available?"✓ Available":"✕ Sold Out"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* SETTINGS */}
      {dash==="settings"&&(
        <div className="se" style={{padding:"24px 16px 100px"}}>
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{fontSize:52,marginBottom:8}}>⚙️</div>
            <div style={{fontFamily:"'Fredoka One',cursive",fontSize:22,color:C.text}}>Settings</div>
            <div style={{fontSize:13,color:C.textMuted,fontFamily:"'Nunito',sans-serif",fontWeight:600,marginTop:4}}>{truckLabel}</div>
          </div>
          {[
            {icon:"🚐",label:"Truck Profile",sub:"Name, photo, specialty"},
            {icon:"💳",label:"Subscription",sub:"I Scream Pro · $20/mo"},
            {icon:"💰",label:"Payout Settings",sub:"Connect bank account"},
            {icon:"🔔",label:"Notifications",sub:"Demand alerts, order sounds"},
            {icon:"📍",label:"Service Radius",sub:"How far to show demand"},
            {icon:"🕐",label:"Operating Hours",sub:"Set your typical schedule"},
          ].map(item=>(
            <div key={item.label} style={{background:C.card,borderRadius:18,padding:"14px 16px",marginBottom:10,display:"flex",alignItems:"center",gap:14,boxShadow:`0 3px 12px rgba(0,0,0,.2)`,border:`1px solid ${C.cardBorder}`,cursor:"pointer"}}>
              <div style={{fontSize:26,width:44,height:44,background:`${C.pink}22`,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{item.icon}</div>
              <div style={{flex:1}}>
                <div style={{fontFamily:"'Fredoka One',cursive",fontSize:15,color:C.text}}>{item.label}</div>
                <div style={{fontSize:12,color:C.textMuted,fontFamily:"'Nunito',sans-serif",fontWeight:600,marginTop:2}}>{item.sub}</div>
              </div>
              <div style={{color:C.pink,fontSize:20}}>›</div>
            </div>
          ))}
        </div>
      )}

      {/* NAV */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:420,background:C.card,borderTop:`1px solid ${C.cardBorder}`,padding:"8px 14px 22px",display:"flex",gap:4,boxShadow:"0 -8px 30px rgba(0,0,0,.5)"}}>
        <button className={`tab ${dash==="dashboard"?"on":""}`} onClick={()=>setDash("dashboard")}><span style={{fontSize:20}}>📊</span><span>Dashboard</span></button>
        <button className={`tab ${dash==="map"?"on":""}`} onClick={()=>setDash("map")}><span style={{fontSize:20}}>🗺️</span><span>Demand Map</span></button>
        <button className={`tab ${dash==="menu"?"on":""}`} onClick={()=>setDash("menu")}><span style={{fontSize:20}}>📋</span><span>Menu</span></button>
        <button className={`tab ${dash==="settings"?"on":""}`} onClick={()=>setDash("settings")}><span style={{fontSize:20}}>⚙️</span><span>Settings</span></button>
      </div>
    </div>
  );
}
