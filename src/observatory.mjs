/**
 * GBRM live-data adapters.
 * NOAA Kp is a unitless planetary activity INDEX.
 * IMF Bt/Bz are near-Earth upstream solar-wind nT, not surface-field F in µT.
 * There is intentionally NO conversion from Kp/Bz to human effects or surface F.
 */
export const K_INDEX_URL = "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json";
export const IMF_URL = "https://services.swpc.noaa.gov/products/summary/solar-wind-mag-field.json";
export const SOURCES = Object.freeze({
  kp: {source:"NOAA SWPC",type:"observational planetary activity index",units:"unitless Kp",url:K_INDEX_URL},
  imf: {source:"NOAA SWPC",type:"upstream solar-wind magnetic-field summary",units:"nT",url:IMF_URL}
});

function numberInRange(raw, low, high) {
  if (raw === null || raw === undefined || raw === "" || typeof raw === "boolean") return null;
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) && n>=low && n<=high ? n : null;
}
export function parseUtc(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(value)) return null;
  const normalized = value.trim().replace(" ","T");
  const ms = Date.parse(/(?:Z|[+-]\d\d:\d\d)$/i.test(normalized) ? normalized : normalized+"Z");
  return Number.isFinite(ms) ? ms : null;
}
function rowsFromNoaa(payload) {
  if (!Array.isArray(payload) || !payload.length) throw new Error("NOAA data has no records");
  if (Array.isArray(payload[0])) {
    const headers = payload[0].map(v=>String(v));
    return payload.slice(1).map(row=>Object.fromEntries(headers.map((k,i)=>[k,row[i]])));
  }
  if (!payload.every(row=>row && typeof row==="object" && !Array.isArray(row))) throw new Error("Unrecognized NOAA record format");
  return payload;
}
export function normalizeKp(payload) {
  const rows = rowsFromNoaa(payload);
  const valid=rows.map(row=>{
    const time=parseUtc(row.time_tag??row.time);
    const kp=numberInRange(row.Kp??row.kp,0,9);
    if(time===null||kp===null) return null;
    return {time, kp, stationCount:numberInRange(row.station_count,0,100)};
  }).filter(Boolean).sort((a,b)=>a.time-b.time);
  if(!valid.length) throw new Error("No valid observed Kp values");
  const unique = new Map(valid.map(row=>[row.time,row]));
  return [...unique.values()].sort((a,b)=>a.time-b.time).slice(-80);
}
export function normalizeImf(payload) {
  const candidates = Array.isArray(payload) ? (Array.isArray(payload[0]) ? rowsFromNoaa(payload):payload) : [payload];
  const valid = candidates.map(row=>{
    if(!row||typeof row!=="object") return null;
    const time=parseUtc(row.time_tag??row.time);
    const bt=numberInRange(row.bt??row.Bt,0,200);
    const bz=numberInRange(row.bz_gsm??row.Bz??row.bz,-200,200);
    if(time===null||bt===null||bz===null) return null;
    return {time,bt,bz};
  }).filter(Boolean).sort((a,b)=>a.time-b.time);
  if(!valid.length) throw new Error("No valid upstream IMF values");
  return valid.at(-1);
}
export function freshness(time,now=Date.now(),maxMinutes=240) {
  if(!Number.isFinite(time)||!Number.isFinite(now)) return {status:"unavailable",minutes:null};
  const minutes=Math.round((now-time)/60000);
  if(minutes< -10) return {status:"future timestamp",minutes};
  return {status:minutes>maxMinutes?"stale":"current",minutes};
}
export const HISTORICAL_SWARM = Object.freeze([
 {id:"saa",label:"South Atlantic minimum",latBand:"global minimum",unit:"µT",points:[{year:2014,value:22.430},{year:2025,value:22.094}],source:"Finlay et al. 2025"},
 {id:"canada",label:"Canada northern maximum",latBand:"regional maximum",unit:"µT",points:[{year:2014,value:58.832},{year:2025,value:58.031}],source:"Finlay et al. 2025"},
 {id:"siberia",label:"Siberia northern maximum",latBand:"regional maximum",unit:"µT",points:[{year:2014,value:61.359},{year:2025,value:61.619}],source:"Finlay et al. 2025"}
]);
export function historicalDelta(series) {
  const [a,b]=series.points;
  if(!Number.isFinite(a.value)||!Number.isFinite(b.value)) throw new Error("Invalid historical values");
  return {delta: Number((b.value-a.value).toFixed(3)),percent: Number(((b.value-a.value)/a.value*100).toFixed(2))};
}
export const PROPOSALS = Object.freeze({
 "replication-nsc": {label:"Mouse neural stem-cell replication",category:"EXPERIMENTAL",outcome:"Neural stem-cell proliferation",prediction:"decrease",design:"Replicate the specific published mouse/cell assay, blinded and randomized with controlled exposure duration.",sources:["zhang2021"]},
 "mitochondria": {label:"Mitochondrial mediation",category:"MECHANISTIC",outcome:"Pre-specified mitochondrial assay",prediction:"change",design:"Pre-register a mediator-specific intervention and independent oxidative/metabolic assays; distinguish mediation from correlation.",sources:["ren2026","zhang2021"]},
 "nbg-dcf": {label:"NBG / DCF predictive challenge",category:"COMPUTATIONAL_ANALOGY",outcome:"Held-out geophysical measurement error",prediction:"outperform",design:"Freeze model parameters, preregister blind held-out observations and evaluate against persistence/seasonal baselines.",sources:["finlay2025","noaa2025"]}
});
const SPECIES=["mouse","cultured mouse cells","computational / geophysical"];
const PREDICTIONS=["decrease","increase","change","no directional claim","outperform"];
export function auditProtocol(input) {
  const errors=[], warnings=[];
  if(!Object.hasOwn(PROPOSALS,input.proposal)) errors.push("Choose a registered hypothesis.");
  if(!SPECIES.includes(input.system)) errors.push("Choose a listed study system.");
  const treatment=Number(input.treatment),control=Number(input.control);
  if(!Number.isFinite(treatment)||treatment<0.01||treatment>80) errors.push("Treatment must be 0.01–80 µT.");
  if(!Number.isFinite(control)||control<0.01||control>80) errors.push("Comparator must be 0.01–80 µT.");
  if(Number.isFinite(treatment)&&Number.isFinite(control)&&Math.abs(treatment-control)<0.0001) errors.push("Treatment and comparator must differ.");
  const replicates=Number(input.replicates);
  if(!Number.isInteger(replicates)||replicates<3||replicates>10000) errors.push("Plan 3–10,000 independent replicates per condition.");
  if(!PREDICTIONS.includes(input.prediction)) errors.push("Select a directional prediction.");
  const outcome=String(input.outcome??"").trim();
  if(outcome.length<10||outcome.length>220) errors.push("Define a measurable outcome (10–220 characters).");
  const criterion=String(input.falsification??"").trim();
  if(criterion.length<25||criterion.length>1000) errors.push("Predefine what would falsify your claim (25–1,000 characters).");
  if(!Boolean(input.blinding)) warnings.push("Blinding is not marked as planned.");
  if(!Boolean(input.randomization)) warnings.push("Randomization is not marked as planned.");
  if(input.proposal==="nbg-dcf") {
    if(input.system!=="computational / geophysical") errors.push("NBG/DCF challenge must use a computational/geophysical system.");
    if(input.prediction!=="outperform") errors.push("NBG/DCF challenge requires an outperform-baseline prediction.");
    warnings.push("A protocol is not an executed out-of-sample model test.");
  } else if(input.system==="computational / geophysical") {
    errors.push("Biological protocols require an appropriate biological model.");
  }
  if(input.system==="mouse"||input.system==="cultured mouse cells") {
    warnings.push("Ethics approvals, biological controls and proper statistical power must be independently established.");
  }
  return {ok:errors.length===0,errors,warnings};
}
export function exportProtocol(input,createdAtUTC) {
  const audit=auditProtocol(input);
  if(!audit.ok) throw new Error("Protocol did not pass validation");
  const proposal=PROPOSALS[input.proposal];
  return {
    schema:"gbrm.preregistration.v0.2",
    createdAtUTC,
    provenance:"INFERRED",
    lifecycle:"PROPOSED_NOT_EXECUTED",
    evidenceLevel:"HYPOTHESIS_ONLY",
    hypothesis:input.proposal,
    category:proposal.category,
    modelSystem:input.system,
    exposures:{treatment_uT:Number(input.treatment),comparator_uT:Number(input.control)},
    replicatesPerCondition:Number(input.replicates),
    outcome:String(input.outcome).trim(),
    prediction:input.prediction,
    preregisteredFalsification:String(input.falsification).trim(),
    safeguards:{blindingPlanned:Boolean(input.blinding),randomizationPlanned:Boolean(input.randomization)},
    declaredSources:proposal.sources,
    limitations:[...audit.warnings,"The protocol contains no experimental results. It must not be cited as evidence of a biological effect."]
  };
}
