const MAX_TICKS = 6;

/**
 * Compute Y-axis ticks for net-worth / range-based charts.
 * Adds 12% breathing room above and below the data range so data never pins to edges.
 */
export function niceTicks(dataMin: number, dataMax: number): number[] {
  if (dataMin === dataMax) {
    const base = dataMin || 1000;
    return [base * 0.8, base * 0.9, base, base * 1.1, base * 1.2].map(Math.round);
  }
  const buf      = (dataMax - dataMin) * 0.12;
  const lo       = dataMin - buf;
  const hi       = dataMax + buf;
  const rawStep  = (hi - lo) / 4;
  const mag      = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const niceStep = [1, 2, 2.5, 5, 10]
    .map(m => m * mag)
    .find(s => s >= rawStep) ?? mag * 10;
  const start = Math.floor(lo / niceStep) * niceStep;
  const ticks: number[] = [];
  for (let v = start; ticks.length < MAX_TICKS && v <= hi + niceStep * 0.01; v += niceStep) {
    ticks.push(Math.round(v));
  }
  return ticks;
}

/**
 * Compute Y-axis ticks for spending/income charts.
 * Always starts at 0; produces up to MAX_TICKS nice round-number ticks that cover dataMax.
 * Rounds tick values to the nearest ₱1,000 — safe for this app's money domain.
 */
export function spendingTicks(dataMax: number): number[] {
  if (dataMax <= 0) return [0, 1000, 2000, 3000, 4000];
  const rawStep  = dataMax / 5;
  const mag      = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const niceStep = [1, 2, 2.5, 5, 10]
    .map(m => m * mag)
    .find(s => s >= rawStep) ?? mag * 10;
  const ticks: number[] = [];
  for (let i = 0; ticks.length < MAX_TICKS && i * niceStep <= dataMax + niceStep * 0.5; i++) {
    ticks.push(Math.round(i * niceStep / 1000) * 1000);
  }
  return ticks;
}
