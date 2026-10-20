import process from 'node:process';

import { resources } from '../src/i18n.js';

const english = resources.en.translation;
let failures = 0;

function visit(source, target, path = '') {
  for (const [key, sourceValue] of Object.entries(source)) {
    const currentPath = path ? `${path}.${key}` : key;
    const targetValue = target?.[key];
    if (targetValue === undefined) {
      console.error(`Missing locale key: ${currentPath}`);
      failures += 1;
    } else if (sourceValue && typeof sourceValue === 'object') {
      if (!targetValue || typeof targetValue !== 'object') {
        console.error(`Locale structure mismatch: ${currentPath}`);
        failures += 1;
      } else {
        visit(sourceValue, targetValue, currentPath);
      }
    }
  }
}

for (const [language, bundle] of Object.entries(resources)) {
  if (language === 'en') continue;
  const before = failures;
  visit(english, bundle.translation);
  const missing = failures - before;
  console.log(`${language}: ${missing} missing keys`);
}

if (failures > 0) process.exitCode = 1;
