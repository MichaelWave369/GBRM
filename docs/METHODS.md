# GBRM methods and provenance policy

## Purpose
GBRM is a **research visualization and evidence management interface**. It is not a diagnostic tool, exposure recommendation, biological dose-response model, or forecast of human cognitive health.

## Categories
- `OBSERVED`: result reported by an experiment or scientific analysis, scoped to its method. A result from a *model* is named as a model-derived estimate.
- `VERIFIED`: accurately documented property or publication that is directly verifiable.
- `INFERRED`: mechanism, interpretation, review proposal, or abstract-level synthesis beyond directly demonstrated effects.
- `UNKNOWN`: unestablished claim, unknown human relevance, or explicit evidence gap.
- User-provided CSV is always `USER_SUPPLIED_UNVERIFIED`, independent of the text in the source column.

## Units and apples-to-apples checks
- All selectable intensities are in **microtesla (µT)**. Conversion: 1 µT = 1,000 nT.
- `F`, total field intensity, is a *scalar* magnitude. Do not confuse it with a directional component, the geomagnetic activity Kp index, radiation flux, or brain electrical signal.
- The 2021 mouse lab treatment (0.29 ± 0.01 µT) and matched local control (55.26 ± 0.05 µT) are from Zhang et al. (2021).
- The two Swarm-era minima (2014.0: 22.430 µT; 2025.0: 22.094 µT) come from Finlay et al. (2025), an inferred **Earth surface core-field minimum**, not a live magnetometer.
- Their difference is -0.336 µT over eleven years (approximately -1.50% relative to the 2014 minimum). It is **not** a linear forecast.
- Values cannot be compared as equivalent exposures: spatial location, temporal changes, vector orientation, variability, intensity, animal model, and exposure duration differ.
- `<5 µT` is a literature-specific operational description of hypomagnetic experimental conditions, **not** a human safety threshold.

## Boundaries
A selected field changes only arithmetic comparisons. It **never** estimates cognitive function, mitochondria, ROS, oxidative stress, disease risk, neurons, or a probability of an effect. The app intentionally has no health score.

## Inputs
CSV: `year,intensity_ut,source`. Imported records remain local in your browser and are not uploaded or silently merged into curated evidence. Treat source strings as user assertions, not authenticated citations.

## Future data integration policy
NOAA WMM is a model, not a live magnetic sensor. Its calculator requires registration for programmatic access. Later adapters must validate license, coordinate/altitude, timestamp, units, provenance, spatial resolution, observational vs. modeled designation, coverage, error and update cadence. Do not automatically label Kp as µT or mix satellite-altitude measurements with ground surface data.

## Research extensions
Modeling connections to NBG/DCF are computational analogies until independent, preregistered predictions and tests are completed. No claimed validation by proximity, resonance, or common vocabulary.
