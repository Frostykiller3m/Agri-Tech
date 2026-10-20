/**
 * Rule thresholds (units: pH is unitless; N/P/K in mg/kg; moisture and organic carbon in %):
 * pH < 5.5 acidic; 5.5–7.5 suitable; > 7.5 alkaline.
 * Nitrogen < 280, phosphorus < 10, potassium < 120, moisture < 20, and organic carbon < 0.5
 * are treated as low. Values on each lower bound are considered adequate.
 */
export const SOIL_THRESHOLDS = Object.freeze({
  pH: { low: 5.5, high: 7.5 },
  nitrogen: { low: 280 },
  phosphorus: { low: 10 },
  potassium: { low: 120 },
  moisture: { low: 20 },
  organicCarbon: { low: 0.5 },
});

const rules = [
  {
    parameter: 'pH',
    evaluate: (value) => value < SOIL_THRESHOLDS.pH.low
      ? { status: 'low', advice: 'Apply agricultural lime according to a soil test to raise acidic pH.' }
      : value > SOIL_THRESHOLDS.pH.high
        ? { status: 'high', advice: 'Use a soil-test-guided amendment and avoid excess alkaline inputs.' }
        : { status: 'optimal', advice: 'pH is in the target range for many crops.' },
  },
  {
    parameter: 'nitrogen',
    evaluate: (value) => value < SOIL_THRESHOLDS.nitrogen.low
      ? { status: 'low', advice: 'Consider a nitrogen source such as compost or a suitable nitrogen fertilizer.' }
      : { status: 'optimal', advice: 'Nitrogen is at or above the guidance threshold.' },
  },
  {
    parameter: 'phosphorus',
    evaluate: (value) => value < SOIL_THRESHOLDS.phosphorus.low
      ? { status: 'low', advice: 'Consider a phosphorus source guided by the crop plan and local soil advice.' }
      : { status: 'optimal', advice: 'Phosphorus is at or above the guidance threshold.' },
  },
  {
    parameter: 'potassium',
    evaluate: (value) => value < SOIL_THRESHOLDS.potassium.low
      ? { status: 'low', advice: 'Consider adding a potassium source based on crop demand and soil guidance.' }
      : { status: 'optimal', advice: 'Potassium is at or above the guidance threshold.' },
  },
  {
    parameter: 'moisture',
    evaluate: (value) => value < SOIL_THRESHOLDS.moisture.low
      ? { status: 'low', advice: 'Check irrigation timing and soil cover to reduce moisture stress.' }
      : { status: 'optimal', advice: 'Moisture is at or above the guidance threshold.' },
  },
  {
    parameter: 'organicCarbon',
    evaluate: (value) => value < SOIL_THRESHOLDS.organicCarbon.low
      ? { status: 'low', advice: 'Add mature compost or retain crop residues to build soil organic matter.' }
      : { status: 'optimal', advice: 'Organic carbon is at or above the guidance threshold.' },
  },
];

export function soilRecommendations(report) {
  return rules.map(({ parameter, evaluate }) => ({
    parameter,
    ...evaluate(report[parameter]),
  }));
}
