# GBRM · Geomagnetic Biology Research Module

**The invisible field. Visible evidence.**

GBRM is a dependency-free, static research workbench for studying relationships between geomagnetic intensity, published hypomagnetic experiments and competing biological hypotheses. It is designed to enforce provenance, distinguish laboratory exposure from terrestrial magnetic-field estimates, and keep limits explicit.

## v0.1.0 capabilities

- **Field Explorer:** logarithmic field-intensity scenario slider, exact numeric control and four cited reference presets. Ratio calculations are strictly arithmetic.
- **South Atlantic comparison:** exact two-epoch, source-reported, Swarm-derived surface minimum (2014.0 and 2025.0), with a transparent -0.336 µT change. Not live data.
- **Biology Lab:** scope-labeled 2021 mouse results, cell-specific ROS findings, candidate mitochondrial mechanisms and limits on human generalization.
- **Evidence Ledger:** 10 machine-readable, sourced claims with OBSERVED / VERIFIED / INFERRED / UNKNOWN provenance and explicit limitations.
- **Data Studio:** private, local CSV inspection, validation, export and immutable USER_SUPPLIED_UNVERIFIED labels. No upload.
- **Testing:** Node built-in test runner checks field arithmetic, provenance invariants and dataset handling. No runtime dependencies, accounts or API keys.

## Run locally

The site uses ES modules and fetches local JSON files. Run any HTTP server at repo root:

```sh
python -m http.server 8000
```

Open http://localhost:8000. The site also works on GitHub Pages.

Test pure logic / research data:

```sh
node --test
```

Node 22 or higher recommended for CI; the website itself needs only a modern browser.

## Publish on GitHub Pages

After merging the first PR, in GitHub open **Settings → Pages → Build and deployment**, select **Deploy from a branch**, then choose **main / (root)**. This repo contains a static `index.html` at the root, so no build step or deployment secrets are required.

Expected URL after Pages is enabled: https://michaelwave369.github.io/GBRM/

The GitHub Actions workflow in `.github/workflows/ci.yml` validates tests independently of Pages configuration. The site is **not live** until Pages is actually enabled and GitHub finishes publishing.

## Source data and labels

- `data/sources.json`: citable source registry with DOI/publisher links and source types.
- `data/ledger.json`: claim-by-claim provenance, scope, limitation and source IDs.
- `data/field-snapshots.json`: two published SAA minimum epochs from Finlay et al. (2025).
- `src/logic.mjs`: pure calculations and CSV validation.
- `docs/METHODS.md`: methodology, units, epistemic constraints and future adapter policies.

### Scientific anchors

- [Zhang et al., Nature Communications (2021)](https://doi.org/10.1038/s41467-021-21468-x) reports lab exposure at 0.29 ± 0.01 µT versus local control at 55.26 ± 0.05 µT in adult male mice.
- [Finlay et al., Physics of the Earth and Planetary Interiors (2025)](https://doi.org/10.1016/j.pepi.2025.107447) reports Swarm-derived SAA minimum surface intensity changing from 22,430 nT (2014) to 22,094 nT (2025).
- [NOAA NCEI, WMM2025](https://www.ncei.noaa.gov/products/world-magnetic-model) documents an Earth main-field model, not a real-time local sensor.
- [Ren et al., iScience (2026)](https://doi.org/10.1016/j.isci.2025.114389) reviews candidate mitochondrial mechanisms.
- [Ren et al., EGU General Assembly (2026)](https://doi.org/10.5194/egusphere-egu26-15577) is a conference abstract, not equivalent to a full peer-reviewed experimental publication.

## Nonclaims

GBRM does **not** infer a human brain-safety threshold; calculate ROS, neurogenesis, inflammation, or cognitive decline from a microtesla input; equate geomagnetic activity Kp with total surface intensity F; or assert that global field weakening is causing human illness. A 2021 mouse exposure and a 2025 model-derived SAA minimum differ in far more than their scalar intensity.

## Next milestones

1. Data adapters with provenance, metadata, timestamps and proper model-versus-observation distinctions.
2. Plotting and unit-normalizing imported multi-epoch data with uncertainties and quality flags.
3. Hypothesis registry and preregistered falsification tests, including optional separate NBG/DCF exploratory modeling.
4. Independent source review, reproducible ingestion scripts and validation fixtures.

**License:** MIT. Research and learning software only, not medical advice.

## v0.2 — The Living Geomagnetic Observatory

The v0.2 module introduces two new tabs:

- **05 / Live Observatory**: a source-connected NOAA SWPC **Kp** (unitless) chart and upstream solar-wind **IMF Bt/Bz** (nT) card; per-record UTC timestamps and stale/unavailable signals; an interactive **schematic** Earth globe with geographic reference markers; and a three-region **two-epoch** (2014 and 2025) Swarm comparison of South Atlantic/Canada/Siberia surface-field extrema. No fabricated interpolation, global intensity map, or forecast is shown.
- **06 / Hypothesis Engine**: scoped preregistration templates for mouse neural-stem-cell replication, mitochondrial mediation, and an explicitly exploratory NBG/DCF held-out forecasting challenge. Audits check template completeness only; JSON downloads say `INFERRED` / `PROPOSED_NOT_EXECUTED`.

The site can use NOAA endpoints directly from the browser without a paid service, API key or GitHub secrets. Live data naturally requires connectivity. If endpoints are unavailable, the UI displays an unavailable state instead of placeholder data.

**Validation:** `node --test` and `node --check src/observatory-ui.mjs`. Scientific limits, field/time/units distinctions and source URLs are documented in [METHODS](docs/METHODS.md).

**Deployment:** No new Pages settings are needed once the site is already using `main / (root)`. Merge the PR to update the existing published site.

**Current official feeds:** [planetary Kp](https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json), [solar wind IMF summary](https://services.swpc.noaa.gov/products/summary/solar-wind-mag-field.json). Historic [Finlay et al., 2025](https://doi.org/10.1016/j.pepi.2025.107447).
