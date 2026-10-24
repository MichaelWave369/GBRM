/** Pure calculation functions. No biological outcome predictions. */
export const CONTROL_UT = 55.26;
export const EXPERIMENT_UT = 0.29;
export const HMF_DEFINITION_UT = 5;
export const MIN_INPUT_UT = 0.01;
export const MAX_INPUT_UT = 80;

export function round(value, digits = 2) {
  return Number(value.toFixed(digits));
}
export function isFiniteField(value) {
  return Number.isFinite(value) && value >= MIN_INPUT_UT && value <= MAX_INPUT_UT;
}
export function compareField(value) {
  if (!isFiniteField(value)) throw new RangeError("Field must be between 0.01 and 80 µT.");
  return {
    selected_uT: value,
    versusExperimental: value / EXPERIMENT_UT,
    versusControl: value / CONTROL_UT,
    fractionOfControl: 100 * value / CONTROL_UT,
    isHypomagneticDefinition: value < HMF_DEFINITION_UT,
  };
}
export function logPosition(value) {
  if (!isFiniteField(value)) throw new RangeError("Field outside supported logarithmic scale.");
  const min = Math.log10(MIN_INPUT_UT);
  const max = Math.log10(MAX_INPUT_UT);
  return 100 * (Math.log10(value) - min) / (max - min);
}
export function sliderValueToField(position) {
  if (!Number.isFinite(position) || position < 0 || position > 100) throw new RangeError("Invalid slider percentage.");
  const min = Math.log10(MIN_INPUT_UT);
  const max = Math.log10(MAX_INPUT_UT);
  return Number((10 ** (min + (max - min) * position / 100)).toPrecision(5));
}
export function snapshotDelta(records) {
  if (!Array.isArray(records) || records.length < 2) throw new Error("At least two epochs required.");
  const ordered = [...records].sort((a,b) => a.epoch - b.epoch);
  for (const row of ordered) {
    if (!Number.isFinite(row.epoch) || !Number.isFinite(row.field_uT) || row.field_uT < 0) {
      throw new Error("Invalid snapshot.");
    }
  }
  const first = ordered[0], last = ordered[ordered.length-1];
  return {first,last,delta_uT:round(last.field_uT-first.field_uT,3),percentage:round(100*(last.field_uT-first.field_uT)/first.field_uT,3)};
}
/** CSV import is deliberately local and never assigns VERIFIED provenance. */
export function parseFieldCSV(csv) {
  if (typeof csv !== "string" || csv.length > 200_000) throw new Error("CSV must be text under 200 KB.");
  const lines = csv.replace(/^\uFEFF/, "").trim().split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  if (lines.length < 2 || lines.length > 1001) throw new Error("Supply a header and 1–1000 rows.");
  const columns = lines[0].toLowerCase().replace(/\s+/g,"").split(",");
  if (columns.join(",") !== "year,intensity_ut,source") throw new Error("Expected header: year,intensity_ut,source");
  return lines.slice(1).map((line, i) => {
    const parts = line.split(",").map(s => s.trim());
    if (parts.length !== 3) throw new Error("Invalid columns at row "+(i+2));
    const year = Number(parts[0]), intensity_uT = Number(parts[1]), source = parts[2];
    if (!parts[0] || !Number.isInteger(year) || year < 1800 || year > 2100 ||
        !parts[1] || !Number.isFinite(intensity_uT) || intensity_uT < 0 || intensity_uT > 1000 ||
        !source || source.length > 160 || /[<>]/.test(source)) throw new Error("Invalid record at row "+(i+2));
    return {year,intensity_uT,source,provenance:"USER_SUPPLIED_UNVERIFIED"};
  });
}
export function toCsv(rows) {
  const header = "year,intensity_ut,source,provenance";
  const escapeCell = (s) => { const raw = String(s); const safe = /^[=+@-]/.test(raw) ? "\x27" + raw : raw; return '"' + safe.replaceAll('"','""') + '"'; };
  return [header, ...rows.map(r=>[r.year,r.intensity_uT,r.source,r.provenance].map(escapeCell).join(","))].join("\n")+"\n";
}
