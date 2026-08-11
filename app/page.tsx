"use client";

import { useEffect, useMemo, useState } from "react";

type Question = { text: string; answer: number; unit: string; hint: string };
type SavedGame = { no: number; date: string; score: number; factors: number[] };
type View = "home" | "play" | "result" | "archive" | "about";
type Theme = "original" | "romania-soft" | "romania-pop" | "lavender" | "nordic";

const themes: { id: Theme; name: string; description: string; colors: string[] }[] = [
  { id: "romania-soft", name: "România Soft", description: "albastru pudrat · galben unt · roșu coral", colors: ["#BCD3F6", "#F3D477", "#E57579"] },
  { id: "romania-pop", name: "România Pop", description: "cobalt jucăuș · galben solar · roșu pepene", colors: ["#728CF4", "#FFDB55", "#FF6474"] },
  { id: "lavender", name: "Lavandă Digitală", description: "lila · mentă · piersică", colors: ["#C9B9F4", "#A8E0D1", "#FF927D"] },
  { id: "nordic", name: "Nordic Sorbet", description: "cer pal · salvie · mandarină", colors: ["#B8DDE5", "#BED5B4", "#F48668"] },
  { id: "original", name: "Original", description: "galben intens · coral · bleumarin", colors: ["#F7D93B", "#FF5A3C", "#172033"] },
];

const questions: Question[] = [
  { text: "Câți bărbați a avut mama lui Gabriel?", answer: 100000, unit: "bărbați", hint: "O glumă fictivă de proporții istorice: răspunsul oficial este 100.000." },
  { text: "Cu câți bărbați s-a mozolit Sebi?", answer: 69, unit: "bărbați", hint: "Un număr suspect de memorabil. Răspunsul oficial al glumei este 69." },
  { text: "De câte ori i-a spus socrul lui Tudi că Transilvania nu este România?", answer: 1000000, unit: "ori", hint: "Suficient de des încât grupul a rotunjit numărul la exact un milion." },
];

const seededFactors = [1.04,1.08,1.11,1.18,1.21,1.3,1.42,1.55,1.7,1.9,2.1,2.4,2.8,3.2,3.7,4.3,5.1,6.2,7.5,9,11,14,18,23,31,43,65,90,140,250,620];

function factor(guess: number, answer: number) { return Math.max(guess / answer, answer / guess); }
function fmt(n: number) { return new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 2 }).format(n); }
function scoreFmt(n: number) { return `${n < 10 ? n.toFixed(2) : n.toFixed(1)}×`; }

function Distribution({ score }: { score: number }) {
  const heights = [28,48,69,88,96,89,78,68,59,50,42,35,29,25,22,19,17,15,13,12,14,16,12,7,3,1];
  const pos = Math.min(98, Math.max(2, Math.log10(Math.max(1, score)) / 3 * 100));
  return <div className="distribution" aria-label={`Poziția ta în distribuție: ${scoreFmt(score)}`}>
    <div className="you-marker" style={{ left: `${pos}%` }}><span>TU</span></div>
    <div className="bars">{heights.map((h,i)=><i key={i} style={{height:`${h}%`}} />)}</div>
    <div className="axis"><span>1×</span><span>10×</span><span>100×</span><span>1.000×</span></div>
  </div>;
}

function Header({onMenu,onBack,onThemes,back=false}: {onMenu:()=>void;onBack:()=>void;onThemes:()=>void;back?:boolean}) {
  return <header className="topbar"><button className="round coral" onClick={onMenu} aria-label="Deschide meniul">☰</button>{back&&<button className="round" onClick={onBack} aria-label="Înapoi">‹</button>}<div className="brand"><b>OCHIOMETRIC</b><small>ESTIMĂRI ZILNICE</small></div><button className="round settings" onClick={onThemes} aria-label="Compară paletele de culoare"><span aria-hidden="true">◐</span></button></header>;
}

export default function Home() {
  const [view,setView]=useState<View>("home"); const [menu,setMenu]=useState(false);
  const [theme,setTheme]=useState<Theme>("romania-soft"); const [themePanel,setThemePanel]=useState(false);
  const [q,setQ]=useState(0); const [input,setInput]=useState(""); const [guesses,setGuesses]=useState<number[]>([]);
  const [revealed,setRevealed]=useState(false); const [history,setHistory]=useState<SavedGame[]>([]);
  useEffect(()=>{ const timer=setTimeout(()=>{ try { setHistory(JSON.parse(localStorage.getItem("din-ochi-history")||"[]")); const savedTheme=localStorage.getItem("ochiometric-theme") as Theme|null; if(savedTheme&&themes.some(item=>item.id===savedTheme))setTheme(savedTheme); } catch{} },0); return()=>clearTimeout(timer); },[]);
  const factors=useMemo(()=>guesses.map((g,i)=>factor(g,questions[i].answer)),[guesses]);
  const dailyScore=factors.length ? factors.reduce((a,b)=>a+b,0)/factors.length : 1;
  const percentile=Math.max(1,Math.round(seededFactors.filter(x=>x<=dailyScore).length/seededFactors.length*100));
  function submit(){ const value=Number(input.replace(/[^0-9.]/g,"")); if(!value||value<=0)return; setGuesses([...guesses,value]); setRevealed(true); }
  function next(){ if(q<2){setQ(q+1);setInput("");setRevealed(false)} else { const game={no:1,date:new Date().toISOString(),score:dailyScore,factors}; const next=[game,...history.filter(h=>h.no!==1)];setHistory(next);localStorage.setItem("din-ochi-history",JSON.stringify(next)); setView("result"); postResult(dailyScore); } }
  async function postResult(score:number){try{await fetch("/api/results",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({score})})}catch{}}
  function restart(){setQ(0);setInput("");setGuesses([]);setRevealed(false);setView("play")}
  function chooseTheme(nextTheme:Theme){setTheme(nextTheme);localStorage.setItem("ochiometric-theme",nextTheme)}
  async function share(){const url="https://din-ochi.dragosfagaras.chatgpt.site"; const text=`Ochiometric #001 — ${scoreFmt(dailyScore)} · Top ${percentile}%\nMă bați?`; if(navigator.share) await navigator.share({title:"Ochiometric",text,url}); else await navigator.clipboard.writeText(`${text}\n${url}`);}

  return <main className={`app view-${view}`} data-theme={theme}>
    <div className={`drawer-shade ${menu?"open":""}`} onClick={()=>setMenu(false)} />
    <aside className={`drawer ${menu?"open":""}`}><button className="round close" onClick={()=>setMenu(false)}>×</button><nav>{[["archive","Arhivă"],["home","Jocul de azi"],["about","Despre Ochiometric"]].map(([v,l])=><button key={v} onClick={()=>{setView(v as View);setMenu(false)}}>{l}</button>)}<button>Trimite o întrebare</button><button>Feedback</button><button>Confidențialitate</button></nav><small>FĂCUT CU OCHIOMETRUL ÎN ROMÂNIA</small></aside>

    <div className={`theme-shade ${themePanel?"open":""}`} onClick={()=>setThemePanel(false)} />
    <section className={`theme-lab ${themePanel?"open":""}`} role="dialog" aria-modal="true" aria-label="Laborator de culoare">
      <div className="theme-lab-head"><div><span>LABORATOR DE CULOARE</span><h2>Alege atmosfera</h2></div><button className="round close" onClick={()=>setThemePanel(false)} aria-label="Închide paletele">×</button></div>
      <p>Același joc și același font. Se schimbă doar identitatea cromatică.</p>
      <div className="theme-options">{themes.map(item=><button key={item.id} className={theme===item.id?"selected":""} onClick={()=>chooseTheme(item.id)} aria-pressed={theme===item.id}><span className="theme-copy"><b>{item.name}</b><small>{item.description}</small></span><span className="swatches" aria-hidden="true">{item.colors.map(color=><i key={color} style={{backgroundColor:color}} />)}</span><strong>{theme===item.id?"ACTIVĂ":"VEZI"}</strong></button>)}</div>
      <small className="theme-note">Tema aleasă rămâne salvată pe acest dispozitiv.</small>
    </section>

    {view==="home"&&<><Header onMenu={()=>setMenu(true)} onBack={()=>{}} onThemes={()=>setThemePanel(true)}/><section className="hero card">
      <div className="edition">OCHIOMETRIC · NR. 001</div><h1>Cât de bine<br/><em>estimezi?</em></h1><p>Trei întrebări. Fără Google. Doar logică, instinct și puțină matematică.</p>
      <div className="dots"><b>1</b><b>2</b><b>3</b></div><button className="primary" onClick={restart}>JOACĂ AZI <span>→</span></button><small>11 AUGUST 2026 · DUREAZĂ 3 MINUTE</small>
    </section><section className="intro"><span>CUM SE JOACĂ</span><h2>Nu trebuie să știi.<br/>Trebuie să te apropii.</h2><div className="steps"><article><b>01</b><h3>Estimează</h3><p>Dă cel mai bun răspuns al tău.</p></article><article><b>02</b><h3>Compară</h3><p>Vezi răspunsul și explicația.</p></article><article><b>03</b><h3>Provoacă</h3><p>Trimite scorul prietenilor.</p></article></div></section></>}

    {view==="play"&&<><Header onMenu={()=>setMenu(true)} onBack={()=>setView("home")} onThemes={()=>setThemePanel(true)} back/><section className="play-card card"><div className="progress"><span>ÎNTREBAREA {q+1} DIN 3</span><div><i style={{width:`${((q+(revealed?1:0))/3)*100}%`}}/></div></div><h2>{questions[q].text}</h2>{!revealed?<><label>ESTIMAREA TA</label><div className="guess"><input inputMode="decimal" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="0" autoFocus/><span>{questions[q].unit}</span></div><p className="micro">Nu căuta. Ai încredere în instinct.</p><button className="primary" onClick={submit}>BLOCHEAZĂ RĂSPUNSUL</button></>:<div className="reveal"><div className="compare"><article><small>AI SPUS</small><b>{fmt(guesses[q])}</b></article><article><small>RĂSPUNS</small><b>{fmt(questions[q].answer)}</b></article></div><div className="factor"><b>{scoreFmt(factors[q])}</b><span>{guesses[q]>questions[q].answer?"PREA MULT ↑":"PREA PUȚIN ↓"}</span></div><div className="napkin"><small>CALCUL OCHIOMETRIC</small><p>{questions[q].hint}</p></div><button className="primary" onClick={next}>{q<2?"URMĂTOAREA ÎNTREBARE":"VEZI SCORUL"} →</button></div>}</section></>}

    {view==="result"&&<><Header onMenu={()=>setMenu(true)} onBack={()=>setView("home")} onThemes={()=>setThemePanel(true)} back/><section className="results card"><span className="eyebrow">SCORUL TĂU DE AZI</span><div className="big-score">{scoreFmt(dailyScore)}</div><b className="rank">TOP {percentile}%</b><h3>CUM S-AU DESCURCAT TOȚI</h3><Distribution score={dailyScore}/><h3>ÎNTREBĂRI</h3><div className="question-results">{questions.map((x,i)=><article key={x.text}><p>{x.text}</p><b>{guesses[i]>x.answer?">":"<"} {scoreFmt(factors[i])}</b></article>)}</div><button className="primary dark" onClick={share}>DISTRIBUIE REZULTATUL</button><button className="secondary" onClick={()=>setView("archive")}>VEZI ARHIVA</button></section></>}

    {view==="archive"&&<><Header onMenu={()=>setMenu(true)} onBack={()=>setView("home")} onThemes={()=>setThemePanel(true)} back/><section className="archive"><span className="eyebrow">ISTORICUL TĂU</span><h1>Arhivă</h1><p>Toate provocările Ochiometric, de la prima zi.</p><div className="stats"><article><small>JOCURI</small><b>{history.length} / 7</b></article><article><small>SCOR MEDIU</small><b>{history.length?scoreFmt(history.reduce((a,b)=>a+b.score,0)/history.length):"—"}</b></article><article><small>CEA MAI BUNĂ ZI</small><b>{history.length?scoreFmt(Math.min(...history.map(h=>h.score))):"—"}</b></article></div><div className="filters"><b>TOATE</b><span>TERMINATE</span><span>DE JUCAT</span></div><div className="archive-list">{[1,2,3,4,5,6,7].map((no,i)=>{const played=history.find(h=>h.no===no);return <article key={no}><small>{String(no).padStart(3,"0")}</small><div><b>{i===0?"11 aug. · azi":`${11-i} aug.`}</b><span>{["Mar","Lun","Dum","Sâm","Vin","Joi","Mie"][i]}</span></div><strong className={played?"good":""}>{played?scoreFmt(played.score):"—"}</strong><button onClick={i===0?restart:undefined}>{played?"TERMINAT ✓":"ÎN CURÂND"}</button></article>})}</div></section></>}

    {view==="about"&&<><Header onMenu={()=>setMenu(true)} onBack={()=>setView("home")} onThemes={()=>setThemePanel(true)} back/><section className="about card"><span className="eyebrow">DESPRE</span><h1>Ce înseamnă<br/>„Ochiometric”?</h1><p>Este jocul zilnic în care nu contează dacă știi răspunsul, ci cât de bine poți construi o estimare.</p><p>Primești trei întrebări greu de știut exact și o singură încercare pentru fiecare. Scorul perfect este 1×. Cu cât scorul e mai mic, cu atât ai fost mai aproape.</p><button className="primary" onClick={restart}>JOACĂ AZI</button></section></>}
  </main>;
}
