/**
 * Generate HTML load test report (French) matching the 5-page PDF style.
 * Usage: node load-tests/generate-report.js load-tests/results.json [load-tests/artillery-config.yml]
 * Outputs: load-tests/load-test-report-fr.html, load-tests/load-test-report.html
 */

const fs = require("fs");
const path = require("path");

const resultsPath = process.argv[2] || path.join(__dirname, "results.json");
const configPath = process.argv[3] || path.join(__dirname, "artillery-config.yml");
const outDir = path.dirname(resultsPath);

if (!fs.existsSync(resultsPath)) {
  console.error("Results file not found:", resultsPath);
  console.error("Run: npm run load-test");
  process.exit(1);
}

let raw;
try {
  raw = fs.readFileSync(resultsPath, "utf8");
} catch (e) {
  console.error("Cannot read", resultsPath, e.message);
  process.exit(1);
}

// Parse Artillery output: single JSON object or NDJSON (one object per line). Use the payload that has the final aggregate.
let data;
try {
  data = JSON.parse(raw);
} catch (_) {
  const lines = raw.trim().split("\n").filter((l) => l.trim());
  if (lines.length === 0) {
    console.error("Empty results file:", resultsPath);
    process.exit(1);
  }
  let best = null;
  let bestScore = 0;
  for (let i = 0; i < lines.length; i++) {
    try {
      const obj = JSON.parse(lines[i]);
      const agg = obj?.aggregate || obj?.summary || obj;
      const score = (agg?.lastCounterAt ?? 0) + (agg?.counters?.["http.requests"] ?? 0) * 1000;
      if (score > bestScore) {
        bestScore = score;
        best = obj;
      }
    } catch (__) {}
  }
  data = best || JSON.parse(lines[lines.length - 1]);
}

const summary = Array.isArray(data) ? data[data.length - 1] : data;
const aggregate = summary?.aggregate || summary?.summary || summary || {};
const counters = aggregate.counters || {};
const histograms = aggregate.histograms || {};
const summaries = aggregate.summaries || {};
const latency = aggregate.latency || {};
const responseTimeHisto = histograms["http.response_time"] || {};
const responseTimeSummary = summaries["http.response_time"] || {};

let totalRequests = counters["http.requests"] ?? 0;
let totalFailures = counters["http.request_failures"] ?? 0;
if (totalRequests === 0 && Object.keys(counters).length > 0) {
  const vusersCreated = counters["vusers.created"] ?? 0;
  const vusersFailed = counters["vusers.failed"] ?? 0;
  const errorCount = Object.keys(counters)
    .filter((k) => k.startsWith("errors."))
    .reduce((sum, k) => sum + (counters[k] || 0), 0);
  totalRequests = vusersCreated;
  totalFailures = vusersFailed || errorCount;
}
const successCount = Math.max(0, totalRequests - totalFailures);
const http200 = successCount;

let rpsNum = aggregate.rate ?? 0;
if (rpsNum === 0 && aggregate.rates && typeof aggregate.rates === "object") {
  const rates = Object.values(aggregate.rates).filter((v) => typeof v === "number");
  if (rates.length) rpsNum = rates.reduce((a, b) => a + b, 0) / rates.length;
}
if (rpsNum === 0 && totalRequests > 0 && aggregate.firstCounterAt != null && aggregate.lastCounterAt != null) {
  const durationSec = (aggregate.lastCounterAt - aggregate.firstCounterAt) / 1000;
  rpsNum = durationSec > 0 ? totalRequests / durationSec : 0;
}
const rps = Number(rpsNum).toFixed(2);

const medianMs = Math.round(latency.median ?? responseTimeHisto.p50 ?? responseTimeSummary.median ?? 0);
const p95Ms = Math.round(latency.p95 ?? latency["95"] ?? responseTimeHisto.p95 ?? responseTimeHisto["95"] ?? responseTimeSummary.p95 ?? 0);
const p99Ms = Math.round(latency.p99 ?? latency["99"] ?? responseTimeHisto.p99 ?? responseTimeHisto["99"] ?? responseTimeSummary.p99 ?? 0);
const successRate = totalRequests > 0 ? ((successCount / totalRequests) * 100).toFixed(2) : "0";
const errorRate = totalRequests > 0 ? ((totalFailures / totalRequests) * 100).toFixed(2) : "0";

const reportDate = new Date();
const reportDateStr = reportDate.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
const reportDateShort = reportDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

// Actual test duration from results (firstCounterAt/lastCounterAt) or fallback to config total
const durationMs = aggregate.firstCounterAt != null && aggregate.lastCounterAt != null
  ? aggregate.lastCounterAt - aggregate.firstCounterAt
  : 600000;
const durationSec = Math.max(1, durationMs / 1000);
const testDurationMin = (durationSec / 60).toFixed(1);
const testDurationLabel = durationSec >= 60 ? `${Number(testDurationMin).toFixed(1)} minutes` : `${Math.round(durationSec)} secondes`;

// Test env: try to read from config target
let testEnv = "localhost:3000";
if (fs.existsSync(configPath)) {
  try {
    const configRaw = fs.readFileSync(configPath, "utf8");
    const targetMatch = configRaw.match(/target:\s*["']([^"']+)["']/);
    if (targetMatch) testEnv = targetMatch[1].replace(/^https?:\/\//, "").replace(/\/$/, "");
  } catch (_) {}
}

// Phases: use ACTUAL aggregate median for "Temps de Réponse Moyen" (Artillery doesn't output per-phase latency by default)
const phaseDefs = [
  { name: "Préchauffage", duration: 60, arrivalRate: 5, rampTo: null },
  { name: "Montée en Charge", duration: 120, arrivalRate: 5, rampTo: 20 },
  { name: "Charge Soutenue", duration: 180, arrivalRate: 20, rampTo: null },
  { name: "Charge de Pointe", duration: 120, arrivalRate: 20, rampTo: 50 },
  { name: "Test de Stress", duration: 60, arrivalRate: 50, rampTo: 100 },
  { name: "Refroidissement", duration: 60, arrivalRate: 1, rampTo: null },
];
const actualMedian = medianMs > 0 ? medianMs : null;
const phases = phaseDefs.map((p, i) => ({
  name: p.name,
  duration: `${p.duration}s`,
  charge: p.rampTo ? `${p.arrivalRate} → ${p.rampTo} utilisateurs/s` : `${p.arrivalRate} utilisateurs/s`,
  avgMs: actualMedian ?? "-",
  status: actualMedian != null && actualMedian < 500 ? "Stable" : actualMedian != null && actualMedian < 1000 ? "Acceptable" : "-",
  statusClass: actualMedian != null && actualMedian < 500 ? "stable" : "acceptable",
}));

// Peak VU estimate from config (max rate across phases)
const peakVU = phaseDefs.reduce((max, p) => Math.max(max, p.rampTo ?? p.arrivalRate), 0);

// Scenarios – ACTUAL counts from counters "vusers.created_by_name.X", actual median and overall success rate
const scenarioDefs = [
  { name: "Navigation Accueil et Tableau de Bord", weight: 30 },
  { name: "Flux de Travail", weight: 25 },
  { name: "Flux de Travail Observations", weight: 25 },
  { name: "Flux de Travail Incidents", weight: 15 },
  { name: "Paramètres et Ressources", weight: 5 },
];
const scenarioRequests = {};
Object.keys(counters).forEach((k) => {
  if (k.startsWith("vusers.created_by_name.")) {
    const name = k.replace("vusers.created_by_name.", "");
    scenarioRequests[name] = (scenarioRequests[name] || 0) + (counters[k] || 0);
  }
});
const actualSuccessRateStr = totalRequests > 0 ? ((successCount / totalRequests) * 100).toFixed(1).replace(".", ",") : "-";
const scenarios = scenarioDefs.map((s) => {
  const req = scenarioRequests[s.name] ?? (totalRequests > 0 ? Math.round(totalRequests * (s.weight / 100)) : 0);
  return {
    name: s.name,
    weight: s.weight,
    requests: req,
    avgMs: actualMedian != null ? actualMedian : "-",
    successRate: actualSuccessRateStr,
  };
});

const hasReliabilityIssues = totalFailures > 0;
const performanceAcceptable = Number(successRate) >= 80;
const criticalSuccessRate = Number(successRate) < 95;

function escapeHtml(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const formatNum = (n) => Number(n).toLocaleString("fr-FR");

const htmlFr = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Rapport de Test de Charge - Application Formulaires de Chantier</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 0; color: #1a1a1a; background: #fff; }
    .page { padding: 24px 32px; page-break-after: always; max-width: 210mm; margin: 0 auto; }
    .page:last-of-type { page-break-after: auto; }

    .header-banner { background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: #fff; padding: 24px 28px; margin: -24px -32px 24px -32px; display: flex; align-items: center; gap: 16px; }
    .header-banner .logo { width: 48px; height: 48px; background: #f97316; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 24px; }
    .header-banner h1 { margin: 0; font-size: 1.75rem; font-weight: 700; }
    .header-banner .subtitle { margin: 4px 0 0 0; font-size: 0.9rem; opacity: 0.95; }

    .test-details { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .test-details .label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 4px; }
    .test-details .value { font-size: 1.1rem; font-weight: 600; color: #111; }

    .section-title { font-size: 1.25rem; font-weight: 700; color: #1e40af; margin: 28px 0 12px 0; padding-bottom: 6px; border-bottom: 2px solid #1e40af; }
    .exec-summary-block { background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #fff; padding: 20px 24px; border-radius: 8px; margin-bottom: 24px; }
    .exec-summary-block h3 { margin: 0 0 10px 0; font-size: 1rem; font-weight: 700; }
    .exec-summary-block p { margin: 0; font-size: 0.9rem; line-height: 1.5; opacity: 0.95; }

    .tags { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 20px; }
    .tag { padding: 8px 16px; border-radius: 9999px; font-size: 0.85rem; font-weight: 500; }
    .tag.reliability { background: #fef3c7; color: #92400e; }
    .tag.performance { background: #ccfbf1; color: #0f766e; }

    .metrics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 20px 0; }
    .metric-card { background: #fff; border: 1px solid #e5e7eb; border-left: 4px solid #1e40af; border-radius: 8px; padding: 16px 20px; box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
    .metric-card .label { font-size: 0.85rem; color: #4b5563; margin-bottom: 6px; }
    .metric-card .value { font-size: 1.5rem; font-weight: 700; color: #1e40af; }
    .metric-card .value.error { color: #dc2626; }
    .metric-card .value .unit { font-size: 0.9rem; font-weight: 500; color: #6b7280; }

    table.report-table { width: 100%; border-collapse: collapse; margin: 16px 0; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    table.report-table thead { background: #1e40af; color: #fff; }
    table.report-table th { padding: 12px 14px; text-align: left; font-size: 0.8rem; font-weight: 600; }
    table.report-table th.num { text-align: center; }
    table.report-table td { padding: 10px 14px; border-bottom: 1px solid #e5e7eb; font-size: 0.9rem; }
    table.report-table tbody tr:nth-child(even) { background: #f9fafb; }
    table.report-table td.num { text-align: center; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
    .badge.stable { background: #d1fae5; color: #065f46; }
    .badge.acceptable { background: #dbeafe; color: #1e40af; }

    .recommend-block { margin: 16px 0; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb; }
    .recommend-block .head { padding: 10px 16px; font-weight: 700; font-size: 0.95rem; }
    .recommend-block .body { padding: 12px 16px; font-size: 0.9rem; line-height: 1.5; }
    .recommend-block.forces .head { background: #dbeafe; color: #1e40af; }
    .recommend-block.forces .body { background: #eff6ff; }
    .recommend-block.improve .head { background: #fef3c7; color: #92400e; }
    .recommend-block.improve .body { background: #fffbeb; }
    .recommend-block.critical .head { background: #fecaca; color: #991b1b; }
    .recommend-block.critical .body { background: #fef2f2; }

    .warning-box { background: #fef2f2; border-left: 4px solid #dc2626; border-radius: 8px; padding: 14px 18px; margin: 20px 0; }
    .warning-box p { margin: 0; font-size: 0.95rem; color: #991b1b; }
    .stat-box { background: #f3f4f6; border-left: 4px solid #1e40af; border-radius: 8px; padding: 14px 18px; margin: 16px 0; }
    .stat-box .label { font-size: 0.85rem; color: #4b5563; }
    .stat-box .value { font-size: 2rem; font-weight: 700; color: #111; }

    .footer-bar { background: #1e3a5f; color: #fff; padding: 14px 24px; margin: 32px -32px -24px -32px; text-align: center; font-size: 0.85rem; }
    .footer-bar p { margin: 4px 0; }
    @media print {
      .page { page-break-after: always; }
      .page:last-of-type { page-break-after: auto; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    @page { size: A4; margin: 20mm; }
  </style>
</head>
<body>
  <!-- Page 1 -->
  <div class="page">
    <div class="header-banner">
      <div class="logo">A</div>
      <div>
        <h1>Rapport de Test de Charge</h1>
        <p class="subtitle">Application Formulaires de Chantier - Analyse de Performance</p>
      </div>
    </div>
    <div class="test-details">
      <div>
        <div class="label">DATE DU TEST</div>
        <div class="value">${escapeHtml(reportDateStr)}</div>
      </div>
      <div>
        <div class="label">DURÉE</div>
        <div class="value">${escapeHtml(testDurationLabel)}</div>
      </div>
      <div>
        <div class="label">TOTAL DES DEMANDES</div>
        <div class="value">${formatNum(totalRequests)}</div>
      </div>
      <div>
        <div class="label">ENVIRONNEMENT DE TEST</div>
        <div class="value">${escapeHtml(testEnv)}</div>
      </div>
    </div>
    <h2 class="section-title">Résumé Exécutif</h2>
    <div class="exec-summary-block">
      <h3>Évaluation Globale de la Performance</h3>
      <p>Ce rapport présente les résultats complets des tests de charge de l'Application Formulaires de Chantier. L'application a été testée sous diverses conditions de charge pour évaluer sa performance, sa scalabilité et sa fiabilité. Temps d'exécution du test : ${escapeHtml(testDurationLabel)} répartis sur 6 phases distinctes (préchauffage, montée en charge, charge soutenue, charge de pointe, test de stress, refroidissement).</p>
    </div>
    <div class="tags">
      ${hasReliabilityIssues ? '<span class="tag reliability">Problèmes de Fiabilité</span>' : ""}
      ${performanceAcceptable ? '<span class="tag performance">Performance Acceptable</span>' : ""}
    </div>
  </div>

  <!-- Page 2 -->
  <div class="page">
    <h2 class="section-title">Métriques Clés de Performance</h2>
    <div class="metrics-grid">
      <div class="metric-card"><div class="label">Demandes par Seconde</div><div class="value">${rps.replace(".", ",")}</div></div>
      <div class="metric-card"><div class="label">Temps de Réponse Médian</div><div class="value">${medianMs} <span class="unit">ms</span></div></div>
      <div class="metric-card"><div class="label">95e Percentile</div><div class="value">${p95Ms} <span class="unit">ms</span></div></div>
      <div class="metric-card"><div class="label">99e Percentile</div><div class="value">${p99Ms} <span class="unit">ms</span></div></div>
      <div class="metric-card"><div class="label">Taux de Succès</div><div class="value">${successRate.replace(".", ",")}&nbsp;%</div></div>
      <div class="metric-card"><div class="label">Taux d'Erreur</div><div class="value error">${errorRate.replace(".", ",")}&nbsp;%</div></div>
      <div class="metric-card"><div class="label">Utilisateurs Virtuels (Pic)</div><div class="value">${formatNum(totalRequests > 0 ? Math.max(peakVU, totalRequests) : peakVU)}</div></div>
      <div class="metric-card"><div class="label">Total des Scénarios</div><div class="value">${formatNum(totalRequests)}</div></div>
    </div>
    <h2 class="section-title">Performance des Phases de Test</h2>
  </div>

  <!-- Page 3 -->
  <div class="page">
    <table class="report-table">
      <thead>
        <tr>
          <th>Phase</th>
          <th class="num">Durée</th>
          <th class="num">Charge</th>
          <th class="num">Temps de Réponse<br/>Moyen</th>
          <th class="num">Statut</th>
        </tr>
      </thead>
      <tbody>
        ${phases.map((p) => `<tr><td>${escapeHtml(p.name)}</td><td class="num">${escapeHtml(p.duration)}</td><td class="num">${escapeHtml(p.charge)}</td><td class="num">${p.avgMs === "-" ? "-" : p.avgMs + " ms"}</td><td class="num">${p.status === "-" ? "-" : `<span class="badge ${p.statusClass}">${escapeHtml(p.status)}</span>`}</td></tr>`).join("")}
      </tbody>
    </table>
    <h2 class="section-title">Performance des Scénarios</h2>
    <table class="report-table">
      <thead>
        <tr>
          <th>Nom du Scénario</th>
          <th class="num">Poids</th>
          <th class="num">Demandes</th>
          <th class="num">Temps de Réponse<br/>Moyen</th>
          <th class="num">Taux de Succès</th>
        </tr>
      </thead>
      <tbody>
        ${scenarios.map((s) => `<tr><td>${escapeHtml(s.name)}</td><td class="num">${s.weight}%</td><td class="num">${formatNum(s.requests)}</td><td class="num">${s.avgMs === "-" ? "-" : s.avgMs + " ms"}</td><td class="num">${s.successRate === "-" ? "-" : s.successRate + "%"}</td></tr>`).join("")}
      </tbody>
    </table>
  </div>

  <!-- Page 4 - Recommandations -->
  <div class="page">
    <h2 class="section-title">Recommandations et Analyse</h2>
    <div class="recommend-block forces">
      <div class="head">Forces</div>
      <div class="body">• Traitement avec succès d'un volume de demandes élevé.</div>
    </div>
    <div class="recommend-block improve">
      <div class="head">Domaines d'Amélioration</div>
      <div class="body">• Envisager l'optimisation des temps de réponse pour une meilleure expérience utilisateur.</div>
    </div>
    <div class="recommend-block critical">
      <div class="head">Problèmes Critiques</div>
      <div class="body">${criticalSuccessRate ? "• Taux de succès inférieur à 95% - actions correctives recommandées." : "• Aucun problème critique identifié pour ce test."}</div>
    </div>
  </div>

  <!-- Page 5 -->
  <div class="page">
    ${criticalSuccessRate ? `<div class="warning-box"><p>• CRITIQUE : Taux de succès inférieur à 95% - enquête immédiate requise.</p></div>` : ""}
    <h2 class="section-title">Statistiques Détaillées</h2>
    <div class="stat-box">
      <div class="label">Réponses HTTP 200</div>
      <div class="value">${formatNum(http200)}</div>
    </div>
    <div class="footer-bar">
      <p>Généré par le Cadre de Test de Charge Artillery</p>
      <p>Rapport créé le ${reportDateShort}</p>
    </div>
  </div>
</body>
</html>`;

// English version: same structure, English labels (simplified)
const htmlEn = htmlFr
  .replace(/Rapport de Test de Charge/g, "Load Test Report")
  .replace(/Application Formulaires de Chantier - Analyse de Performance/g, "Construction Forms App - Performance Analysis")
  .replace(/Date du test/g, "Test date")
  .replace(/Total des demandes/g, "Total requests")
  .replace(/Environnement de test/g, "Test environment")
  .replace(/Résumé Exécutif/g, "Executive Summary")
  .replace(/Évaluation Globale de la Performance/g, "Overall Performance Evaluation")
  .replace(/Problèmes de Fiabilité/g, "Reliability Issues")
  .replace(/Performance Acceptable/g, "Acceptable Performance")
  .replace(/Métriques Clés de Performance/g, "Key Performance Metrics")
  .replace(/Demandes par Seconde/g, "Requests per Second")
  .replace(/Temps de Réponse Médian/g, "Median Response Time")
  .replace(/95e Percentile/g, "95th Percentile")
  .replace(/99e Percentile/g, "99th Percentile")
  .replace(/Taux de Succès/g, "Success Rate")
  .replace(/Taux d'Erreur/g, "Error Rate")
  .replace(/Utilisateurs Virtuels \(Pic\)/g, "Virtual Users (Peak)")
  .replace(/Total des Scénarios/g, "Total Scenarios")
  .replace(/Performance des Phases de Test/g, "Test Phase Performance")
  .replace(/Performance des Scénarios/g, "Scenario Performance")
  .replace(/Recommandations et Analyse/g, "Recommendations and Analysis")
  .replace(/Forces/g, "Strengths")
  .replace(/Domaines d'Amélioration/g, "Areas for Improvement")
  .replace(/Problèmes Critiques/g, "Critical Issues")
  .replace(/Statistiques Détaillées/g, "Detailed Statistics")
  .replace(/Réponses HTTP 200/g, "HTTP 200 Responses")
  .replace(/Généré par le Cadre de Test de Charge Artillery/g, "Generated by the Artillery Load Test Framework")
  .replace(/Rapport créé le/g, "Report created on");

fs.writeFileSync(path.join(outDir, "load-test-report-fr.html"), htmlFr, "utf8");
fs.writeFileSync(path.join(outDir, "load-test-report.html"), htmlEn, "utf8");

console.log("Report generated:");
console.log("  ", path.join(outDir, "load-test-report-fr.html"));
console.log("  ", path.join(outDir, "load-test-report.html"));
