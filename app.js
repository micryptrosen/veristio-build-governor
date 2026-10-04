const phases = ["Discover", "Plan", "Implement", "Verify", "Commit", "Closeout"];
const statuses = ["Not started", "In progress", "Passed", "Hold", "Blocked"];

const sample = {
  projectName: "Release Notes Assistant",
  repoPath: "D:\\Projects\\release-notes-assistant",
  buildGoal: "Create a local tool that drafts release notes from a maintainer-approved change summary without publishing anything externally.",
  riskLevel: "Moderate",
  ownerGates: [
    "Creating a public repository",
    "Uploading demo video or screenshots",
    "Changing license or privacy language",
    "Sending release notes to external services"
  ],
  forbiddenActions: [
    "No push, deploy, publish, or upload",
    "No paid service activation",
    "No private customer data in sample content"
  ],
  requiredEvidence: [
    "Before/after screenshots or local notes",
    "Verification command output",
    "Final commit and tree hash",
    "Known limitations and next action"
  ],
  requiredChecks: [
    "git status --short --branch before and after work",
    "syntax or lint check for changed code",
    "manual preview at desktop and mobile widths",
    "confirm forbidden actions were not taken"
  ],
  gateStatuses: {
    Discover: "Passed",
    Plan: "Passed",
    Implement: "In progress",
    Verify: "Not started",
    Commit: "Not started",
    Closeout: "Not started"
  }
};

const fields = {
  projectName: document.querySelector("#project-name"),
  repoPath: document.querySelector("#repo-path"),
  buildGoal: document.querySelector("#build-goal"),
  riskLevel: document.querySelector("#risk-level"),
  ownerGates: document.querySelector("#owner-gates"),
  forbiddenActions: document.querySelector("#forbidden-actions"),
  requiredEvidence: document.querySelector("#required-evidence"),
  requiredChecks: document.querySelector("#required-checks")
};

const gateGrid = document.querySelector("#gate-grid");
const generateButton = document.querySelector("#generate-button");
const sampleButton = document.querySelector("#sample-button");
const resetButton = document.querySelector("#reset-button");
const copyButton = document.querySelector("#copy-button");
const reportOutput = document.querySelector("#report-output");
const backlogOutput = document.querySelector("#backlog-output");
const ownerDecisionsOutput = document.querySelector("#owner-decisions-output");
const statusOutput = document.querySelector("#status-output");
const decisionCount = document.querySelector("#decision-count");
const holdCount = document.querySelector("#hold-count");
const readinessOutput = document.querySelector("#readiness-output");
const phaseReadinessOutput = document.querySelector("#phase-readiness-output");
const ownerReadinessOutput = document.querySelector("#owner-readiness-output");
const expectationOutput = document.querySelector("#expectation-output");
const ownerReviewConfirmed = document.querySelector("#owner-review-confirmed");
const highRiskConfirmed = document.querySelector("#high-risk-confirmed");
let reportSnapshot = null;
let copyOperation = 0;

function inputSnapshot() {
  return JSON.stringify({
    fields: Object.values(fields).map((field) => field.value),
    gates: getGateSelections(),
    ownerReviewConfirmed: ownerReviewConfirmed.checked,
    highRiskConfirmed: highRiskConfirmed.checked
  });
}

function reportIsCurrent() {
  return reportSnapshot && reportSnapshot.inputs === inputSnapshot()
    && reportSnapshot.report === reportOutput.textContent;
}

function splitLines(value) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function listOrDefault(items, fallback) {
  return items.length ? items : [fallback];
}

function bulletList(items) {
  return items.map((item) => `- ${item}`);
}

function renderGateControls() {
  gateGrid.innerHTML = "";

  phases.forEach((phase) => {
    const row = document.createElement("div");
    row.className = "gate-row";

    const label = document.createElement("label");
    const selectId = `gate-${phase.toLowerCase()}`;
    label.setAttribute("for", selectId);
    label.textContent = phase;

    const select = document.createElement("select");
    select.id = selectId;
    select.dataset.phase = phase;

    statuses.forEach((status) => {
      const option = document.createElement("option");
      option.value = status;
      option.textContent = status;
      select.appendChild(option);
    });

    row.appendChild(label);
    row.appendChild(select);
    gateGrid.appendChild(row);
  });
}

function getGateSelections() {
  return phases.map((phase) => {
    const select = document.querySelector(`[data-phase="${phase}"]`);
    return { phase, status: select.value };
  });
}

function setGateSelections(values) {
  phases.forEach((phase) => {
    const select = document.querySelector(`[data-phase="${phase}"]`);
    select.value = values[phase] || "Not started";
  });
}

function getFormData() {
  return {
    projectName: fields.projectName.value.trim(),
    repoPath: fields.repoPath.value.trim(),
    buildGoal: fields.buildGoal.value.trim(),
    riskLevel: fields.riskLevel.value,
    ownerGates: splitLines(fields.ownerGates.value),
    forbiddenActions: splitLines(fields.forbiddenActions.value),
    requiredEvidence: splitLines(fields.requiredEvidence.value),
    requiredChecks: splitLines(fields.requiredChecks.value),
    gateSelections: getGateSelections(),
    ownerReviewConfirmed: ownerReviewConfirmed.checked,
    highRiskConfirmed: highRiskConfirmed.checked
  };
}

function getReadiness(gates, ownerGates) {
  if (gates.some((gate) => gate.status === "Blocked")) {
    return { label: "Blocked", className: "blocked" };
  }

  if (gates.some((gate) => gate.status === "Hold")) {
    return { label: "Hold", className: "hold" };
  }

  if (ownerGates.length) {
    return { label: "Owner review needed", className: "hold" };
  }

  if (gates.every((gate) => gate.status === "Passed")) {
    return { label: "Ready to close", className: "ready" };
  }

  return { label: "In progress", className: "" };
}

function buildOwnerDecisionList(data) {
  const decisions = [...data.ownerGates];
  if (!data.projectName || !data.repoPath || !data.buildGoal) {
    decisions.push("Supply project name, repo/path and build goal before closeout");
  }
  if (!data.ownerReviewConfirmed) {
    decisions.push("Owner must confirm the outstanding decision list is complete");
  }
  const heldGates = data.gateSelections.filter((gate) => gate.status === "Hold" || gate.status === "Blocked");

  heldGates.forEach((gate) => {
    decisions.push(`Resolve ${gate.phase} phase marked ${gate.status}`);
  });

  if (data.riskLevel === "High" && !data.highRiskConfirmed) {
    decisions.push("Confirm high-risk build may proceed under current scope");
  }

  return decisions;
}

function generateReport() {
  const data = getFormData();
  const ownerDecisions = buildOwnerDecisionList(data);
  // Owner-decision projection; no resolution or authority admission.
  ownerDecisionsOutput.innerHTML = "";
  (ownerDecisions.length ? ownerDecisions : ["No outstanding owner decisions declared; this is not proof of approval."]).forEach((decision) => {
    const li = document.createElement("li");
    li.textContent = decision;
    ownerDecisionsOutput.appendChild(li);
  });
  // End owner-decision projection.
  const heldOrBlocked = data.gateSelections.filter((gate) => gate.status === "Hold" || gate.status === "Blocked");
  const readiness = getReadiness(data.gateSelections, ownerDecisions);
  const phaseReadiness = getReadiness(data.gateSelections, []);
  const ownerReadiness = ownerDecisions.length ? "Owner review needed" : "No outstanding decisions declared";

  const projectName = data.projectName || "Untitled governed build";
  const repoPath = data.repoPath || "Repo/path not supplied";
  const buildGoal = data.buildGoal || "No build goal supplied yet.";
  const evidence = listOrDefault(data.requiredEvidence, "Capture final status, checks performed, and remaining blockers.");
  const checks = listOrDefault(data.requiredChecks, "Run a local verification check appropriate to the project.");
  const forbidden = listOrDefault(data.forbiddenActions, "No forbidden actions supplied.");
  const decisions = listOrDefault(ownerDecisions, "No owner decisions currently listed.");
  const expectationReview = [
    `Evidence requirements: ${data.requiredEvidence.length ? "User-supplied expectations" : "Not supplied; app-default expectations"}.`,
    `Check requirements: ${data.requiredChecks.length ? "User-supplied expectations" : "Not supplied; app-default expectations"}.`,
    "Listed requirements and Passed phases do not establish that checks ran or evidence was verified. Readiness is user-declared, not tool-verified."
  ];

  // Declared backlog is a projection, not verification or owner-decision resolution.
  const backlog = data.gateSelections.filter((gate) => gate.status !== "Passed")
    .map((gate) => `${gate.phase}: ${gate.status}`);
  if (!backlog.length) backlog.push("No unfinished phases declared; completion is not tool-verified.");
  backlogOutput.textContent = backlog.join("\n");
  // End declared backlog projection.

  const report = [
    "Build Governor report",
    "",
    "Project:",
    `- Name: ${projectName}`,
    `- Repo/path: ${repoPath}`,
    `- Risk level: ${data.riskLevel}`,
    "",
    "Build goal:",
    buildGoal,
    "",
    "Phase gate status:",
    ...data.gateSelections.map((gate) => `- ${gate.phase}: ${gate.status}`),
    "",
    "Owner-decision list:",
    ...bulletList(decisions),
    "",
    "Declared phase work remaining (not completed verification):",
    ...bulletList(backlog),
    "",
    "Forbidden actions:",
    ...bulletList(forbidden),
    "",
    "Required evidence:",
    ...bulletList(evidence),
    "",
    "Required verification checks:",
    ...bulletList(checks),
    "",
    "Expectation sources and verification limits:",
    ...bulletList(expectationReview),
    "",
    "Closeout checklist:",
    "- Confirm every phase gate has an honest final status.",
    "- Record verification checks and any checks that could not run.",
    "- Record commit hash, tree hash, files changed, and final worktree/index status when applicable.",
    "- Confirm forbidden actions were not taken.",
    "- Name remaining blockers and the next safe action.",
    "",
    "Closeout status:",
    `- Declared phase readiness: ${phaseReadiness.label}`,
    `- Owner-decision readiness: ${ownerReadiness}`,
    `- Declared closeout readiness: ${readiness.label}`,
    `- Hold or blocked phases: ${heldOrBlocked.length ? heldOrBlocked.map((gate) => `${gate.phase} (${gate.status})`).join(", ") : "none"}`,
    `- Open owner decisions: ${ownerDecisions.length}`,
    `- Owner decision list reviewed: ${data.ownerReviewConfirmed ? "Confirmed by user" : "Not confirmed"}`,
    `- High-risk scope confirmation: ${data.riskLevel !== "High" ? "Not applicable" : data.highRiskConfirmed ? "Confirmed by user" : "Missing"}`,
    "- Readiness uses user declarations, not verified approvals or evidence. This standalone tool grants no permission."
  ].join("\n");

  reportOutput.textContent = report;
  decisionCount.textContent = String(ownerDecisions.length);
  holdCount.textContent = String(heldOrBlocked.length);
  readinessOutput.textContent = readiness.label;
  readinessOutput.className = readiness.className;
  phaseReadinessOutput.textContent = phaseReadiness.label;
  ownerReadinessOutput.textContent = ownerReadiness;
  expectationOutput.textContent = expectationReview.join(" ");
  statusOutput.textContent = "Report generated";
  reportSnapshot = { inputs: inputSnapshot(), report };
}

// Sample replacement protection: compare raw values, not authorship or approval.
let sampleLoadBaseline;
function sampleProtectedState(target = false) {
  return JSON.stringify({
    fields: Object.keys(fields).map((key) => target
      ? Array.isArray(sample[key]) ? sample[key].join("\n") : sample[key]
      : fields[key].value),
    gates: target ? phases.map((phase) => ({ phase, status: sample.gateStatuses[phase] })) : getGateSelections(),
    ownerReviewConfirmed: target ? false : ownerReviewConfirmed.checked,
    highRiskConfirmed: target ? false : highRiskConfirmed.checked
  });
}
function sampleReplacementAllowed() {
  const current = sampleProtectedState();
  if (current === sampleLoadBaseline || current === sampleProtectedState(true)) return true;
  try {
    return typeof window.confirm === "function" && window.confirm("Replace your edited project setup and phase states with the sample? Confirmations will be cleared. Cancel to keep your work.") === true;
  } catch {
    return false;
  }
}
// End sample replacement protection.

function loadSample() {
  if (!sampleReplacementAllowed()) return;
  ownerReviewConfirmed.checked = false;
  highRiskConfirmed.checked = false;
  fields.projectName.value = sample.projectName;
  fields.repoPath.value = sample.repoPath;
  fields.buildGoal.value = sample.buildGoal;
  fields.riskLevel.value = sample.riskLevel;
  fields.ownerGates.value = sample.ownerGates.join("\n");
  fields.forbiddenActions.value = sample.forbiddenActions.join("\n");
  fields.requiredEvidence.value = sample.requiredEvidence.join("\n");
  fields.requiredChecks.value = sample.requiredChecks.join("\n");
  setGateSelections(sample.gateStatuses);
  generateReport();
  statusOutput.textContent = "Sample loaded";
  sampleLoadBaseline = sampleProtectedState();
}

function resetForm() {
  ownerDecisionsOutput.innerHTML = "";
  ownerDecisionsOutput.textContent = "No generated owner-decision review yet.";
  backlogOutput.textContent = "No declared backlog generated yet.";
  reportSnapshot = null;
  ownerReviewConfirmed.checked = false;
  highRiskConfirmed.checked = false;
  Object.values(fields).forEach((field) => {
    if (field.tagName === "SELECT") {
      field.value = "Moderate";
    } else {
      field.value = "";
    }
  });

  setGateSelections({});
  reportOutput.textContent = "No report yet. Fill the setup form or load the sample, then generate a report.";
  decisionCount.textContent = "0";
  holdCount.textContent = "0";
  readinessOutput.textContent = "Not generated";
  readinessOutput.className = "";
  phaseReadinessOutput.textContent = "Not generated";
  ownerReadinessOutput.textContent = "Not generated";
  expectationOutput.textContent = "No generated expectation review yet.";
  statusOutput.textContent = "Ready";
  sampleLoadBaseline = sampleProtectedState();
}

function selectReportText() {
  reportOutput.focus();

  if (!document.createRange || !window.getSelection) {
    return;
  }

  const range = document.createRange();
  range.selectNodeContents(reportOutput);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

async function copyReport() {
  const operation = ++copyOperation;
  const report = reportOutput.textContent.trim();

  if (!report || report.startsWith("No report yet")) {
    statusOutput.textContent = "Nothing to copy";
    return;
  }

  if (!reportIsCurrent()) {
    statusOutput.textContent = "Inputs or report changed; generate report before copying";
    return;
  }

  const snapshot = reportSnapshot;
  // An initiated clipboard write cannot be recalled; only current completion UI may update.
  const canComplete = () => operation === copyOperation && snapshot === reportSnapshot && reportIsCurrent();

  if (!navigator.clipboard) {
    statusOutput.textContent = "Select report to copy";
    selectReportText();
    return;
  }

  try {
    await navigator.clipboard.writeText(report);
    if (canComplete()) statusOutput.textContent = "Copied";
  } catch {
    if (canComplete()) {
      statusOutput.textContent = "Copy blocked; report selected";
      selectReportText();
    }
  }
}

renderGateControls();
sampleLoadBaseline = sampleProtectedState();
// Scope changes invalidate declarations; refresh a generated report to avoid stale readiness.
Object.values(fields).forEach((field) => field.addEventListener("input", () => {
  ownerReviewConfirmed.checked = false;
  highRiskConfirmed.checked = false;
  if (!reportOutput.textContent.startsWith("No report yet")) generateReport();
}));
[ownerReviewConfirmed, highRiskConfirmed, ...phases.map((phase) =>
  document.querySelector(`[data-phase="${phase}"]`))].forEach((control) =>
  control.addEventListener("change", () => {
    if (!reportOutput.textContent.startsWith("No report yet")) generateReport();
  }));
generateButton.addEventListener("click", generateReport);
sampleButton.addEventListener("click", loadSample);
resetButton.addEventListener("click", resetForm);
copyButton.addEventListener("click", copyReport);
function exportFilename(label) {
  const slug = label.trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    .slice(0, 60).replace(/-+$/g, "");
  const reserved = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:-|$)/.test(slug);
  return slug && !reserved
    ? `build-governor-${slug}-decision-report.txt`
    : "build-governor-decision-report.txt";
}

document.querySelector("#export-button").addEventListener("click", () => {
  generateReport();
  let url;
  try {
    const blob = new Blob([reportOutput.textContent], { type: "text/plain;charset=utf-8" });
    url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = exportFilename(fields.projectName.value);
    link.click();
    statusOutput.textContent = "Report download requested";
  } catch {
    statusOutput.textContent = "Export unavailable; copy report instead";
  } finally {
    if (url) window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
});
