import test from "node:test";
import assert from "node:assert/strict";
import {normalizeKp,normalizeImf,freshness,parseUtc,HISTORICAL_SWARM,historicalDelta,auditProtocol,exportProtocol} from "../src/observatory.mjs";

test("NOAA 2026 Kp object array format is parsed and ordered in UTC",()=>{
 const kp=normalizeKp([{time_tag:"2026-10-24T15:00:00",Kp:1.67,a_running:6,station_count:8},{time_tag:"2026-10-24T12:00:00",Kp:2,station_count:8}]);
 assert.equal(kp.at(-1).kp,1.67);assert.equal(new Date(kp.at(-1).time).toISOString(),"2026-10-24T15:00:00.000Z");
});
test("legacy NOAA array format supported without confusing units",()=>{
 const rows=[["time_tag","Kp","station_count"],["2026-10-24T12:00:00","2.67","8"]];
 assert.equal(normalizeKp(rows)[0].kp,2.67);
});
test("IMF Bz in nanotesla parsed from 2026 NOAA summary",()=>{
 const row=normalizeImf([{bt:3,bz_gsm:-2,time_tag:"2026-10-24T20:02:00Z"}]);
 assert.deepEqual([row.bt,row.bz],[3,-2]);
});
test("refuse invalid feed values, empty cells, and impossible timestamps",()=>{
 assert.throws(()=>normalizeKp([{time_tag:"n/a",Kp:1}]));
 assert.throws(()=>normalizeKp([{time_tag:"2026-10-24T12:00:00",Kp:99}]));
 assert.throws(()=>normalizeImf([{time_tag:"2026-10-24T12:00:00Z",bt:null,bz_gsm:1}]));
 assert.equal(parseUtc("invalid"),null);
});
test("time freshness is explicit and future timestamps rejected",()=>{
 const t=Date.parse("2026-10-24T10:00:00Z");
 assert.equal(freshness(t,t+60*60*1000,240).status,"current");
 assert.equal(freshness(t,t+6*60*60*1000,240).status,"stale");
 assert.equal(freshness(t,t-60*60*1000,240).status,"future timestamp");
});
test("historical Swarm summary anchors are exactly two epochs",()=>{
 assert.equal(HISTORICAL_SWARM.length,3);
 assert.equal(historicalDelta(HISTORICAL_SWARM[0]).delta,-0.336);
 assert.equal(historicalDelta(HISTORICAL_SWARM[1]).delta,-0.801);
 assert.equal(historicalDelta(HISTORICAL_SWARM[2]).delta,0.260);
 for(const s of HISTORICAL_SWARM)assert.deepEqual(s.points.map(p=>p.year),[2014,2025]);
});
const valid={
 proposal:"replication-nsc",system:"cultured mouse cells",treatment:0.29,control:55.26,
 replicates:8,prediction:"decrease",outcome:"Mouse neural stem-cell proliferation count",
 falsification:"If the predefined proliferation metric does not decrease relative to the randomized matched control, the directional hypothesis is rejected.",
 blinding:true,randomization:true
};
test("protocol audit accepts preregistration without inventing results",()=>{
 assert.equal(auditProtocol(valid).ok,true);
 const p=exportProtocol(valid,"2026-10-24T00:00:00.000Z");
 assert.equal(p.lifecycle,"PROPOSED_NOT_EXECUTED");
 assert.equal(p.provenance,"INFERRED");assert.equal(p.evidenceLevel,"HYPOTHESIS_ONLY");
 assert.equal(p.exposures.treatment_uT,0.29);
 assert.equal(p.declaredSources[0],"zhang2021");
});
test("protocol audit blocks invalid controls and misclassified computational models",()=>{
 assert.equal(auditProtocol({...valid,treatment:55.26}).ok,false);
 assert.equal(auditProtocol({...valid,proposal:"nbg-dcf",system:"mouse"}).ok,false);
 assert.equal(auditProtocol({...valid,replicates:1}).ok,false);
 assert.equal(auditProtocol({...valid,falsification:"no"}).ok,false);
});
test("computational hypothesis demands held-out baseline criterion",()=>{
 const cmp={...valid,proposal:"nbg-dcf",system:"computational / geophysical",prediction:"outperform",outcome:"Held-out forecast error in nanotesla"};
 const result=auditProtocol(cmp);assert.equal(result.ok,true);
 const p=exportProtocol(cmp,"2026-10-24T00:00:00Z");assert.equal(p.category,"COMPUTATIONAL_ANALOGY");
});
