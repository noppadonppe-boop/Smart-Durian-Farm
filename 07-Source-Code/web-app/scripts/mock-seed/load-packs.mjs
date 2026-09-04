import { readFile } from 'node:fs/promises'

async function loadJson(relativePath) {
  return JSON.parse(await readFile(new URL(relativePath, import.meta.url), 'utf8'))
}

export async function loadMockPacks() {
  const [
    foundation,
    annualCycles,
    work,
    commercial,
    operations,
    diseaseAnalysis,
    managementReporting,
  ] = await Promise.all([
    loadJson('../seed-data/phase2-demo-seed.json'),
    loadJson('../seed-data/annual-cycle-mock-data-pack-v1.0.json'),
    loadJson('../seed-data/phase4-mock-data-pack-v1.0.json'),
    loadJson('../seed-data/phase5-mock-data-pack-v1.0.json'),
    loadJson('../seed-data/phase6-mock-data-pack-v1.0.json'),
    loadJson('../seed-data/disease-analysis-p1-mock-data-pack-v1.0.json'),
    loadJson('../seed-data/management-reporting-mock-data-pack-v1.0.json'),
  ])
  return {
    foundation,
    annualCycles,
    work,
    commercial,
    operations,
    diseaseAnalysis,
    managementReporting,
  }
}
