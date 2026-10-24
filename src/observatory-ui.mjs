import { K_INDEX_URL, IMF_URL, normalizeKp, normalizeImf, freshness, HISTORICAL_SWARM, historicalDelta, PROPOSALS, auditProtocol, exportProtocol } from "./observatory.mjs";

const $ = id => document.getElementById(id);
const dateUTC = ms => new Date(ms).toISOString().replace("T"," ").replace(".000Z"," UTC");
const fmt = (n,d=2) => Number(n).toFixed(d);
const paths = [
 [[-166,63],[-152,70],[-136,69],[-125,61],[-130,55],[-123,49],[-124,42],[-117,33],[-112,29],[-106,22],[-97,16],[-88,20],[-83,27],[-80,32],[-67,45],[-62,51],[-80,59],[-91,63],[-112,70],[-135,70],[-166,63]],
 [[-82,12],[-77,9],[-80,0],[-77,-12],[-72,-18],[-70,-30],[-73,-42],[-70,-54],[-62,-55],[-56,-48],[-49,-25],[-43,-17],[-37,-10],[-35,-3],[-50,4],[-61,10],[-70,12],[-82,12]],
 [[-10,36],[-9,44],[-5,50],[7,56],[14,56],[20,60],[29,69],[40,68],[52,55],[66,55],[80,52],[100,54],[116,50],[132,44],[140,51],[164,59],[179,62]],
 [[-10,36],[5,37],[14,32],[23,36],[30,33],[34,27],[42,11],[51,12],[51,3],[43,-12],[35,-18],[33,-25],[18,-35],[15,-34],[12,-23],[8,-5],[0,5],[-9,8],[-16,16],[-17,25],[-10,36]],
 [[32,31],[43,40],[60,32],[71,22],[78,9],[80,5],[88,20],[94,23],[100,17],[105,7],[116,1],[125,-4],[131,-3],[142,5],[149,-5]],
 [[112,-12],[130,-11],[137,-16],[144,-14],[153,-27],[151,-36],[141,-39],[128,-34],[116,-25],[112,-12]],
 [[-52,60],[-43,60],[-42,73],[-48,83],[-62,81],[-58,69],[-52,60]],
 [[-180,-70],[-145,-72],[-100,-70],[-55,-73],[-15,-70],[30,-73],[70,-71],[113,-73],[156,-72],[180,-70]],
 [[45,-12],[50,-16],[49,-25],[45,-26],[43,-17],[45,-12]],
 [[130,33],[135,35],[139,40],[141,45],[145,42]],
 [[-9,52],[-5,57],[-3,54],[-7,51]]
];
function rad(n) { return n*Math.PI/180; }
function project(lon,lat,rot) {
  const phi=rad(lat),d=rad(lon-rot),phi0=rad(12);
  const z=Math.sin(phi0)*Math.sin(phi)+Math.cos(phi0)*Math.cos(phi)*Math.cos(d);
  if(z<=0) return null;
  return [270+165*Math.cos(phi)*Math.sin(d),211-165*(Math.cos(phi0)*Math.sin(phi)-Math.sin(phi0)*Math.cos(phi)*Math.cos(d))];
}
function polyline(coords,rot) {
  let path="",drawing=false;
  for(const [lon,lat] of coords){
    const p=project(lon,lat,rot);
    if(!p){drawing=false;continue;}
    path+=(drawing?" L":" M")+p[0].toFixed(1)+" "+p[1].toFixed(1);
    drawing=true;
  }
  return path.trim();
}
function drawGlobe(rot) {
  const graticules=[];
  for(let lat=-75;lat<=75;lat+=15) {
    const coords=[];for(let lon=-180;lon<=180;lon+=3)coords.push([lon,lat]);
    graticules.push('<path d="'+polyline(coords,rot)+'"/>');
  }
  for(let lon=-180;lon<180;lon+=15){
    const coords=[];for(let lat=-90;lat<=90;lat+=3)coords.push([lon,lat]);
    graticules.push('<path d="'+polyline(coords,rot)+'"/>');
  }
  const coastlines=paths.map(path=>'<path d="'+polyline(path,rot)+'"/>').join("");
  const points=[
    {lon:-40,lat:-25,label:"SOUTH ATLANTIC",extra:"SCHEMATIC REGION",color:"#efbf8a"},
    {lon:-105.24,lat:40.02,label:"BOULDER",extra:"GEOGRAPHIC MARKER",color:"#8af4db"},
    {lon:19.23,lat:-34.42,label:"HERMANUS",extra:"GEOGRAPHIC MARKER",color:"#8af4db"},
    {lon:140.19,lat:36.23,label:"KAKIOKA",extra:"GEOGRAPHIC MARKER",color:"#8af4db"}
  ].map(item=>{
    const p=project(item.lon,item.lat,rot);
    if(!p)return "";
    return '<g><circle cx="'+p[0]+'" cy="'+p[1]+'" r="8" fill="none" stroke="'+item.color+'" stroke-opacity=".35"/>'+
    '<circle cx="'+p[0]+'" cy="'+p[1]+'" r="3.8" fill="'+item.color+'"/>'+
    '<text x="'+(p[0]+10)+'" y="'+(p[1]-9)+'" fill="'+item.color+'" font-size="10" font-family="monospace">'+item.label+'</text>'+
    '<text x="'+(p[0]+10)+'" y="'+(p[1]+4)+'" fill="#8bafae" font-size="7.5" font-family="monospace">'+item.extra+'</text></g>';
  }).join("");
  $("earth-globe").innerHTML=
    '<defs><radialGradient id="ocean-g" cx="33%" cy="22%" r="90%"><stop offset="0%" stop-color="#1d5258"/><stop offset="65%" stop-color="#0e323f"/><stop offset="100%" stop-color="#06181f"/></radialGradient>'+
    '<radialGradient id="earth-light"><stop offset="0%" stop-color="#65d3c5" stop-opacity=".32"/><stop offset="100%" stop-color="#65d3c5" stop-opacity="0"/></radialGradient>'+
    '<clipPath id="globe-clip"><circle cx="270" cy="211" r="165"/></clipPath></defs>'+
    '<circle cx="270" cy="211" r="190" fill="url(#earth-light)"/>'+
    '<ellipse cx="270" cy="211" rx="225" ry="74" transform="rotate(-27 270 211)" fill="none" stroke="#489f9a" stroke-opacity=".21" stroke-width="1"/>'+
    '<ellipse cx="270" cy="211" rx="225" ry="74" transform="rotate(27 270 211)" fill="none" stroke="#d0af77" stroke-opacity=".15" stroke-width="1"/>'+
    '<circle cx="270" cy="211" r="165" fill="url(#ocean-g)" stroke="#6ddac9" stroke-width="1" stroke-opacity=".48"/>'+
    '<g clip-path="url(#globe-clip)"><g fill="none" stroke="#73c0b8" stroke-opacity=".20" stroke-width=".85">'+graticules.join("")+'</g>'+
    '<g fill="none" stroke="#9fddd0" stroke-opacity=".77" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8">'+coastlines+'</g>'+
    points+'</g><text x="21" y="31" font-size="10" fill="#7fada9" font-family="monospace">ORTHOGRAPHIC / 12° N</text>'+
    '<text x="21" y="411" font-size="9" fill="#7fada9" font-family="monospace">ILLUSTRATIVE COASTLINES + REFERENCE MARKERS</text>';
}
const longitude=$("globe-longitude");
longitude.addEventListener("input",()=>{
  const rot=Number(longitude.value);$("globe-longitude-value").textContent=(rot>0?"+":"")+rot+"°";drawGlobe(rot);
});
document.querySelectorAll("[data-globe]").forEach(b=>b.addEventListener("click",()=>{
  longitude.value=b.dataset.globe;longitude.dispatchEvent(new Event("input"));
}));
drawGlobe(Number(longitude.value));

function drawHistory() {
  const series=HISTORICAL_SWARM.find(x=>x.id===$("history-region").value)||HISTORICAL_SWARM[0];
  const [first,last]=series.points;
  const delta=historicalDelta(series);
  $("history-first").innerHTML=fmt(first.value,3)+' <small>µT</small>';
  $("history-last").innerHTML=fmt(last.value,3)+' <small>µT</small>';
  $("history-delta").textContent=(delta.delta>0?"+":"")+fmt(delta.delta,3)+" µT · "+(delta.percent>0?"+":"")+fmt(delta.percent,2)+"% between published epochs";
  const max=70, w=430;
  const bars=[first,last].map((p,i)=>{
    const y=35+i*83;
    const len=w*p.value/max;
    return '<text x="13" y="'+(y+15)+'" fill="#b7d0c9" font-size="11" font-family="monospace">'+p.year+'</text>'+
      '<rect x="90" y="'+y+'" width="'+w+'" height="28" fill="#16373b"/>'+
      '<rect x="90" y="'+y+'" width="'+len+'" height="28" rx="2" fill="'+(i?"#d0ad7a":"#70d8c6")+'"/>'+
      '<text x="'+(98+len)+'" y="'+(y+19)+'" fill="#f7f8e9" font-size="12" font-family="monospace">'+fmt(p.value,3)+' µT</text>';
  }).join("");
  $("history-visual").innerHTML='<svg viewBox="0 0 625 195" role="img" aria-label="Two separate field strength values measured on a zero-baseline 0 to 70 microtesla axis">'+
    bars+'<g stroke="#45666b" stroke-width="1"><line x1="90" y1="171" x2="520" y2="171"/></g>'+
    '<g fill="#94b2ae" font-size="10" font-family="monospace"><text x="90" y="187">0 µT</text><text x="490" y="187">70 µT</text></g></svg>';
}
$("history-region").addEventListener("change",drawHistory);
drawHistory();

function kpGraph(rows) {
  const tail=rows.slice(-18),width=510;
  const coords=tail.map((x,i)=>[35+i*(width-65)/(Math.max(tail.length-1,1)),140-x.kp/9*117]);
  let line=coords.map((p,i)=>(i?"L":"M")+p[0].toFixed(1)+","+p[1].toFixed(1)).join(" ");
  const label=tail.length?new Date(tail.at(-1).time).toISOString().slice(0,16).replace("T"," ")+" UTC":"";
  $("kp-chart").innerHTML='<svg role="img" aria-label="Last '+tail.length+' observed planetary three-hour Kp index values, plotted from 0 to 9" viewBox="0 0 510 174">'+
    '<g stroke="#3c6263" stroke-dasharray="3 5"><line x1="35" y1="140" x2="480" y2="140"/><line x1="35" y1="75" x2="480" y2="75"/><line x1="35" y1="23" x2="480" y2="23"/></g>'+
    '<g fill="#86a9a5" font-size="10" font-family="monospace"><text x="8" y="145">0</text><text x="8" y="80">5</text><text x="8" y="28">9</text><text x="35" y="162">OLDER</text><text x="480" y="162" text-anchor="end">LATEST · '+label+'</text></g>'+
    '<path d="'+line+'" stroke="#6ee1cc" stroke-width="2" fill="none"/>'+
    coords.map(p=>'<circle cx="'+p[0]+'" cy="'+p[1]+'" r="2.8" fill="#8bf3db"/>').join("")+'</svg>';
}
function setFeedState(name,status) {
  const node=$(name+"-status");
  node.textContent=status.toUpperCase();
  node.dataset.state=status;
}
async function fetchNoaa(url) {
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),12000);
  try {
    const response=await fetch(url,{cache:"no-store",signal:controller.signal});
    if(!response.ok)throw new Error("HTTP "+response.status);
    return await response.json();
  } finally {clearTimeout(timer);}
}
let loading=false;
async function refresh() {
  if(loading)return;
  loading=true;$("refresh-feeds").disabled=true;$("feed-updated").textContent="Contacting NOAA endpoints; cached examples are not displayed.";
  const tasks=await Promise.allSettled([fetchNoaa(K_INDEX_URL),fetchNoaa(IMF_URL)]);
  const info=[];
  if(tasks[0].status==="fulfilled"){
    try {
      const series=normalizeKp(tasks[0].value),latest=series.at(-1),age=freshness(latest.time,Date.now(),360);
      setFeedState("kp",age.status);
      $("kp-current").textContent=fmt(latest.kp,2);
      $("kp-observation").textContent=dateUTC(latest.time)+(latest.stationCount===null?"":" · "+latest.stationCount+" stations");
      kpGraph(series);
      info.push("Kp received ("+age.status+")");
    }catch(e){setFeedState("kp","unavailable");$("kp-current").textContent="—";$("kp-chart").textContent="NOAA Kp feed unusable: "+e.message;info.push("Kp unavailable");}
  } else {
    setFeedState("kp","unavailable");$("kp-current").textContent="—";
    $("kp-observation").textContent="No verified recent Kp observation";
    $("kp-chart").textContent="Feed not reachable; retry or open the NOAA source.";
    info.push("Kp unavailable");
  }
  if(tasks[1].status==="fulfilled"){
    try {
      const latest=normalizeImf(tasks[1].value),age=freshness(latest.time,Date.now(),120);
      setFeedState("imf",age.status);
      $("imf-bz").textContent=(latest.bz>=0?"+":"")+fmt(latest.bz,1);
      $("imf-bt").textContent=fmt(latest.bt,1);
      $("imf-observation").textContent=dateUTC(latest.time)+" · NOAA summary";
      info.push("IMF received ("+age.status+")");
    }catch(e){setFeedState("imf","unavailable");$("imf-bz").textContent="—";$("imf-bt").textContent="—";$("imf-observation").textContent="NOAA IMF feed unusable";info.push("IMF unavailable");}
  } else {
    setFeedState("imf","unavailable");$("imf-bz").textContent="—";$("imf-bt").textContent="—";
    $("imf-observation").textContent="No verified recent upstream observation";
    info.push("IMF unavailable");
  }
  $("feed-updated").textContent=info.join(" · ")+" · checked "+new Date().toISOString().replace("T"," ").slice(0,19)+" UTC.";
  $("refresh-feeds").disabled=false;loading=false;
}
$("refresh-feeds").addEventListener("click",refresh);
refresh();

const proposal=$("hyp-proposal");
const inputIds=["hyp-proposal","hyp-system","hyp-prediction","hyp-treatment","hyp-control","hyp-replicates","hyp-outcome","hyp-falsification","hyp-blinding","hyp-randomization","hyp-baseline"];
let frozen=null;
function invalidate(){
  frozen=null;$("hyp-download").disabled=true;$("hyp-json").value="";
  $("hyp-audit").textContent="Design edited. Run a fresh audit before exporting.";
  $("hyp-audit").dataset.ok="";
}
for(const id of inputIds)$(id).addEventListener("input",invalidate);
function setFamily(){
  const key=proposal.value,item=PROPOSALS[key],comp=key==="nbg-dcf";
  $("proposal-description").textContent=item.design;
  $("hyp-baseline-wrap").hidden=!comp;
  $("hyp-treatment").disabled=comp;$("hyp-control").disabled=comp;
  document.querySelector('label[for="hyp-treatment"]').textContent=comp?"FIELD TREATMENT · NOT APPLICABLE":"TREATMENT · µT";
  document.querySelector('label[for="hyp-control"]').textContent=comp?"FIELD COMPARATOR · NOT APPLICABLE":"COMPARATOR · µT";
  $("hyp-replicates-label").textContent=comp?"INDEPENDENT HELD-OUT EVALUATION WINDOWS":"PLANNED INDEPENDENT REPLICATES / CONDITION";
  $("hyp-system").value=comp?"computational / geophysical":"cultured mouse cells";
  $("hyp-prediction").value=comp?"outperform":key==="mitochondria"?"change":"decrease";
  $("hyp-outcome").value=comp?"Held-out forecast error on geophysical intensity data":key==="mitochondria"?"Mitochondrial respiration assay outcome":"Mouse neural stem-cell proliferation count";
  $("hyp-falsification").value=comp
   ?"The frozen NBG or DCF model fails if its held-out prediction error is not lower than the preregistered persistence baseline, with no post-hoc parameter adjustment."
   :key==="mitochondria"?"The proposed mediation is rejected if independently specified mitochondrial changes are absent or a mediator-targeted intervention fails to change the preregistered outcome."
   :"The directional hypothesis is rejected if the matched randomized comparison fails to show the preregistered decrease in neural stem-cell proliferation.";
  invalidate();
}
proposal.addEventListener("change",setFamily);
setFamily();
function formData(){
  return {
    proposal:proposal.value,system:$("hyp-system").value,prediction:$("hyp-prediction").value,
    treatment:$("hyp-treatment").value,control:$("hyp-control").value,replicates:$("hyp-replicates").value,
    baseline:$("hyp-baseline").value,outcome:$("hyp-outcome").value,falsification:$("hyp-falsification").value,
    blinding:$("hyp-blinding").checked,randomization:$("hyp-randomization").checked
  };
}
$("hypothesis-form").addEventListener("submit",ev=>{
  ev.preventDefault();const input=formData(),audit=auditProtocol(input);
  $("hyp-audit").dataset.ok=String(audit.ok);
  if(!audit.ok){
    frozen=null;$("hyp-download").disabled=true;$("hyp-json").value="";
    $("hyp-audit").textContent="NOT READY · "+audit.errors.join(" · ")+(audit.warnings.length?" · Notes: "+audit.warnings.join(" · "):"");
    return;
  }
  frozen=exportProtocol(input,new Date().toISOString());
  $("hyp-json").value=JSON.stringify(frozen,null,2);
  $("hyp-download").disabled=false;
  $("hyp-audit").textContent="FORM CHECKS PASSED · Protocol is still an untested proposal. "+(audit.warnings.join(" ")||"No optional checklist warnings.")+" No results were generated.";
});
$("hyp-download").addEventListener("click",()=>{
  if(!frozen)return;
  const blob=new Blob([JSON.stringify(frozen,null,2)+"\n"],{type:"application/json"});
  const url=URL.createObjectURL(blob),link=document.createElement("a");
  link.href=url;link.download="gbrm-proposed-"+frozen.hypothesis+"-"+frozen.createdAtUTC.slice(0,10)+".json";
  link.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
});
