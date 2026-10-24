import { compareField, logPosition, sliderValueToField, isFiniteField, snapshotDelta, parseFieldCSV, toCsv } from "./logic.mjs";

const byId = (id) => document.getElementById(id);
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (ch) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[ch]));
const nice = (value, digits = 2) => Number(value).toLocaleString("en-US", { maximumFractionDigits:digits, minimumFractionDigits:digits });
let sources = [];
let ledger = [];
let rows = [];
let current = 22.094;

function activateTab(name) {
  document.querySelectorAll("[data-panel]").forEach(panel => { panel.hidden = panel.dataset.panel !== name; });
  document.querySelectorAll("[data-tab]").forEach(button => {
    const selected = button.dataset.tab === name;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-selected", String(selected));
  });
}
document.querySelectorAll("[data-tab], [data-goto]").forEach(button => button.addEventListener("click", () => {
  activateTab(button.dataset.tab || button.dataset.goto);
  document.querySelector(".tabs").scrollIntoView({block:"start",behavior:"smooth"});
}));

const fieldSlider = byId("field-range");
const fieldInput = byId("field-input");
function setField(value) {
  if (!isFiniteField(value)) {
    byId("field-input-error").textContent = "Enter a value from 0.01 to 80 µT.";
    fieldInput.value = String(current);
    return;
  }
  byId("field-input-error").textContent = "";
  current = value;
  const comparison = compareField(value);
  byId("field-value").textContent = value < 1 ? nice(value,3) : nice(value, 3).replace(/0+$/,"").replace(/\.$/,"");
  fieldInput.value = String(value);
  fieldSlider.value = String(logPosition(value));
  byId("experimental-ratio").textContent = nice(comparison.versusExperimental, 2) + "×";
  byId("control-percent").textContent = nice(comparison.fractionOfControl, 2) + "%";
  byId("scenario-marker").style.left = logPosition(value) + "%";
  byId("scenario-marker-label").textContent = "SCENARIO\n" + nice(value, 3);
  byId("scenario-marker-label").style.whiteSpace = "pre-line";
  byId("definition-note").textContent = comparison.isHypomagneticDefinition
    ? "This value falls within the literature's experimental hypomagnetic designation (<5 µT). This is not a human health threshold."
    : "This value is outside the literature's <5 µT experimental hypomagnetic designation. That distinction is not a safety assessment.";
  byId("field-interpretation").innerHTML = "<strong>" + nice(value,3) + " µT</strong> is " + nice(comparison.versusExperimental,2) +
    " times the field intensity used in the 2021 mouse hypomagnetic treatment. The ratio expresses only magnetic intensity; it cannot be used to calculate cognitive, neurological, or mitochondrial outcomes.";
  document.querySelectorAll("[data-field]").forEach(button => button.classList.toggle("active",Math.abs(Number(button.dataset.field)-value)<0.00001));
}
fieldSlider.addEventListener("input", () => setField(sliderValueToField(Number(fieldSlider.value))));
fieldInput.addEventListener("change", () => setField(Number(fieldInput.value)));
document.querySelectorAll("[data-field]").forEach(button => button.addEventListener("click", () => setField(Number(button.dataset.field))));

function drawEpochChart(records) {
  const delta = snapshotDelta(records);
  const first = delta.first, last = delta.last;
  const min = Math.min(first.field_uT,last.field_uT)-0.18;
  const max = Math.max(first.field_uT,last.field_uT)+0.18;
  const y = (v) => 125-(v-min)/(max-min)*83;
  const y1=y(first.field_uT),y2=y(last.field_uT);
  byId("epoch-chart").innerHTML =
    '<svg viewBox="0 0 500 155" role="img" aria-label="Modelled SAA minimum field '+
    escapeHtml(first.epoch) + ': ' + escapeHtml(first.field_uT) + ' microtesla; ' +
    escapeHtml(last.epoch) + ': ' + escapeHtml(last.field_uT) + ' microtesla; change minus 0.336 microtesla">' +
    '<g stroke="#2b4a4c" stroke-dasharray="3 7"><line x1="30" x2="470" y1="42" y2="42"/><line x1="30" x2="470" y1="83" y2="83"/><line x1="30" x2="470" y1="125" y2="125"/></g>' +
    '<path d="M96 '+y1+' L404 '+y2+'" stroke="#73dece" stroke-width="2.5" fill="none"/>' +
    '<circle cx="96" cy="'+y1+'" r="6" fill="#8eead9"/><circle cx="404" cy="'+y2+'" r="6" fill="#e2ba87"/>' +
    '<g fill="#e2f5ec" font-size="18" font-family="monospace"><text x="96" y="'+(y1-17)+'" text-anchor="middle">'+nice(first.field_uT,3)+'</text><text x="404" y="'+(y2-17)+'" text-anchor="middle">'+nice(last.field_uT,3)+'</text></g>' +
    '<g fill="#85aaa4" font-size="12" font-family="monospace"><text x="96" y="150" text-anchor="middle">'+escapeHtml(first.epoch)+'</text><text x="404" y="150" text-anchor="middle">'+escapeHtml(last.epoch)+'</text></g>' +
    '</svg>';
}
function sourceLinks(ids) {
  return ids.map(id => {
    const item = sources.find(s => s.id === id);
    return item ? '<a href="'+escapeHtml(item.url)+'" target="_blank" rel="noopener noreferrer" title="'+escapeHtml(item.title)+'">'+escapeHtml(item.authors)+" ↗</a>" : "";
  }).join("");
}
function renderLedger() {
  const query = byId("ledger-search").value.trim().toLowerCase();
  const filter = byId("ledger-filter").value;
  const subset = ledger.filter(item => (filter === "ALL" || item.provenance === filter) &&
    [item.id,item.title,item.claim,item.limits,item.domain,item.species].join(" ").toLowerCase().includes(query));
  byId("ledger-count").textContent = subset.length + " / " + ledger.length + " CLAIMS";
  byId("ledger-list").innerHTML = subset.length ? subset.map(item =>
    '<article class="ledger-item"><div class="ledger-head"><span class="ledger-id">'+escapeHtml(item.id)+'</span><span class="ledger-state '+item.provenance.toLowerCase()+'">'+escapeHtml(item.provenance)+'</span></div>' +
    '<h3>'+escapeHtml(item.title)+'</h3><p>'+escapeHtml(item.claim)+'</p>' +
    '<div class="ledger-limit"><strong>LIMIT: </strong>'+escapeHtml(item.limits)+'</div>' +
    '<div class="ledger-bottom"><span>'+escapeHtml(item.domain.toUpperCase())+' / '+escapeHtml(item.species.toUpperCase())+'</span><div>'+sourceLinks(item.sources)+'</div></div></article>'
  ).join("") : '<p class="fallback">No matching evidence claims. Try a different filter.</p>';
}
byId("ledger-search").addEventListener("input", renderLedger);
byId("ledger-filter").addEventListener("change", renderLedger);

function renderRows() {
  const count = rows.length;
  byId("dataset-preview").classList.remove("empty-preview");
  byId("dataset-preview").innerHTML = '<div class="preview-table-wrap"><table class="preview-table"><thead><tr><th>YEAR</th><th>INTENSITY / µT</th><th>SOURCE STRING</th><th>PROVENANCE</th></tr></thead><tbody>' +
    rows.slice(0, 30).map(row => '<tr><td>'+escapeHtml(row.year)+'</td><td>'+escapeHtml(nice(row.intensity_uT,4))+'</td><td>'+escapeHtml(row.source)+'</td><td>'+escapeHtml(row.provenance)+'</td></tr>').join("") +
    '</tbody></table></div><p class="file-hint">'+count+' rows validated; showing first '+Math.min(count,30)+' rows. Data remains unverified and local.</p>';
  byId("download-csv").disabled = !rows.length;
}
byId("csv-upload").addEventListener("change", async (event) => {
  const file = event.target.files?.[0]; if(!file) return;
  rows = [];
  byId("download-csv").disabled = true;
  try {
    if(file.size > 200000) throw new Error("File is larger than 200 KB.");
    rows = parseFieldCSV(await file.text());
    renderRows();
    byId("upload-status").textContent = rows.length + " unverified rows accepted for local inspection.";
  } catch(error) {
    byId("dataset-preview").className = "empty-preview";
    byId("dataset-preview").textContent = "No dataset loaded. Please correct the CSV and import again.";
    byId("upload-status").textContent = "Import refused: "+error.message;
  }
  event.target.value = "";
});
byId("download-csv").addEventListener("click", () => {
  if(!rows.length) return;
  const blob = new Blob([toCsv(rows)],{type:"text/csv;charset=utf-8"});
  const url = URL.createObjectURL(blob), anchor = document.createElement("a");
  anchor.href=url; anchor.download="gbrm-user-supplied-unverified.csv"; anchor.click();
  URL.revokeObjectURL(url);
});

async function loadData() {
  try {
    const paths = ["./data/sources.json","./data/ledger.json","./data/field-snapshots.json"];
    const results = await Promise.all(paths.map(async url => {
      const response = await fetch(url);
      if(!response.ok) throw new Error("Fetch "+url+" returned "+response.status);
      return response.json();
    }));
    [sources,ledger] = results;
    drawEpochChart(results[2].records);
    renderLedger();
  } catch(error) {
    byId("ledger-list").textContent = "Evidence files could not be loaded: "+error.message+". Serve the repository using a local HTTP server or GitHub Pages.";
    byId("ledger-count").textContent = "UNAVAILABLE";
    byId("epoch-chart").textContent = "Published epochs: 2014.0 · 22.430 µT; 2025.0 · 22.094 µT. Data file unavailable.";
  }
}
for(const [id,field] of [["scenario-marker",current],["saa-marker",22.094]]){
  byId(id).style.left = logPosition(field)+"%";
}
document.querySelector(".spectrum-marker.exp").style.left = logPosition(0.29)+"%";
document.querySelector(".spectrum-marker.ctrl").style.left = logPosition(55.26)+"%";
document.querySelector(".spectrum-zone").style.width = logPosition(5)+"%";
setField(current);
loadData();
