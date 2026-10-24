import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const root = new URL("../",import.meta.url);
const html = readFileSync(new URL("index.html",root),"utf8");
const ui = readFileSync(new URL("src/observatory-ui.mjs",root),"utf8");
const source = JSON.parse(readFileSync(new URL("data/sources.json",root)));
const ledger = JSON.parse(readFileSync(new URL("data/ledger.json",root)));

test("new observatory and hypothesis tabs have matching panels",()=>{
 for(const panel of ["observatory","hypotheses"]){
  assert.ok(html.includes('data-tab="'+panel+'"'));
  assert.ok(html.includes('data-panel="'+panel+'"'));
  assert.ok(html.includes('id="panel-'+panel+'"'));
 }
 assert.ok(html.includes('src="./src/observatory-ui.mjs"'));
});
test("observable browser control IDs exist and are unique",()=>{
 const names=[
 "earth-globe","globe-longitude","globe-longitude-value","history-region","history-first","history-last",
 "history-delta","history-visual","kp-status","imf-status","kp-current","kp-chart",
 "kp-observation","imf-bz","imf-bt","imf-observation","refresh-feeds","feed-updated",
 "hypothesis-form","hyp-proposal","hyp-system","hyp-prediction","hyp-treatment","hyp-control",
 "hyp-replicates","hyp-replicates-label","hyp-baseline","hyp-baseline-wrap","hyp-outcome",
 "hyp-falsification","hyp-blinding","hyp-randomization","hyp-audit","hyp-json","hyp-download","proposal-description"
 ];
 for(const id of names){
  const uses=html.split('id="'+id+'"').length-1;
  assert.equal(uses,1,id+" exists exactly once");
 }
 assert.ok(ui.includes('normalizeKp'));
 assert.ok(ui.includes('normalizeImf'));
});
test("ledger source IDs resolve and hypothesis-only claims remain inferred",()=>{
 const ids=new Set(source.map(s=>s.id));
 for(const entry of ledger)for(const key of entry.sources)assert.ok(ids.has(key),entry.id+" missing "+key);
 const h=ledger.find(x=>x.id==="MOD-001");
 assert.equal(h.provenance,"INFERRED");
 assert.ok(source.some(x=>x.id==="swpc-kp"));
 assert.ok(source.some(x=>x.id==="swpc-imf"));
});
test("Pages bypass and no external build dependencies required",()=>{
 const nojekyll=readFileSync(new URL(".nojekyll",root),"utf8");
 assert.equal(nojekyll,"");
 assert.ok(html.includes("./styles.css"));
 assert.ok(html.includes("./src/app.mjs"));
});
