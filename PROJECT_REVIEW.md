# Project evidence and engineering review

This review is based on the published Quarto reports and the owner’s supplied HP description. It is not a re-execution of notebooks or an audit of private datasets. The website describes completed work; the architecture and validation additions below are recommendations, not claims of deployed systems.

## Evidence used in the showcase

| Project | Source | Result suitable for a portfolio | Important qualification |
| --- | --- | --- | --- |
| HP data validation | Public `marketing_data_validation.html` and supplied About reference | 900+ discrepancies flagged; reporting changes adopted | Team capstone. A flag is not a confirmed error. No private campaign or source identifiers. |
| Fraud prioritization | `credit_card_fraud_detection.qmd`, Final Model Performance / Cutoff Comparison | 62% capture and 1.658% FPR at the 4% review cutoff | The source table has higher net savings at 5% and 6%. Do not call 4% profit-optimal. The OOT performance decline needs investigation. |
| Campaign targeting | `Intuit_Quickbooks_Upgrade.qmd`, Benchmark / Recommendation | $1,225,587.45 projected profit versus $1,168,918.80 mail-to-all: +$56,668.65, about 4.85% | Projections rely on a 50% second-wave response adjustment. These are not realized sales. The final MLP1 recommendation and alternative-model comparisons need a reproducible score table. |
| PO–invoice ETL | `database_management.qmd`, Data Description / Joining tables | 400K+ source records, approximately 2,100 PO reconciliations | Weather enrichment reduces the matched sample to approximately 1,300 records. The source describes loading then warehouse transformations: an ELT pattern in practice. |
| Donation experiment | `AB_Testing.qmd`, Test Results / Treatment Effect | +0.42 percentage points, about 23% relative lift, p = .002 | Replication of an existing randomized experiment. Observed group means (1.79% and 2.20%) differ slightly from the regression estimate. Null significance for richer matching does not prove equivalence. |
| Patent counts | `Maximum_Likelihood_Estimation.qmd`, Poisson Regression Results | Customer coefficient .2076; exp(.2076) ≈ 1.23, p < .001 | Adjusted association. Age and age-squared, plus region, are controls. Software-caused innovation is not established. |
| Subscription choice | `Multinomial_Logit_Model.qmd`, Simulation / Estimation comparison | 100 respondents × 10 tasks = 1,000 simulated choices; price MLE −.0995 / MCMC −.0997 | Three alternatives per task produce 3,000 alternative rows, not 3,000 independent choices. Earlier rounded summaries vary; retain precision and output provenance. |
| Clustering | `Key_Drivers_Analysis.qmd`, Evaluation of Cluster Quantity | k = 2 silhouette .612 vs k = 3 .456 | Species excluded from fitting features but informed k selection. This is morphology exploration, not a demonstrated customer segmentation result. |

## Highest-priority corrections

1. **Fraud financial scaling:** the report describes a 2010 dataset, a two-month financial sample, and a 10M/year portfolio. Reconcile the observation period and annualization before using $40.5M as a validated benefit. Preserve the existing table pending source-data verification; disclose the uncertainty and lead with capture/FPR instead.
2. **Threshold selection:** choose the review cutoff under an explicit capacity/cost constraint. The shown net-savings table does not establish 4% as the unconstrained optimum.
3. **Campaign attribution:** a response model trained on mailed customers is not automatically an uplift model. A randomized no-mail group is needed to estimate incremental treatment effect.
4. **Sample boundaries:** distinguish source records, transformed rows, unique business entities, matched enrichment subsets, simulation units, and observed outcomes.
5. **Deployment language:** coursework comparisons alone do not establish production readiness. The fraud report now states the validation still required.

## Data-engineering design

### HP: make every exception traceable

**Documented flow:** source tables → naming rules / aggregated-spend comparisons → flags → reviewer reports.

**Recommended implementation:**

- Keep raw inputs immutable with `source_file`, `source_row_id`, `ingested_at`, and `run_id`.
- Define the comparison grain before joining: the agreed campaign/date/currency dimensions must match on both sides. Do not disclose private dimension values in the public repo.
- Store naming rules and tolerances as versioned configuration, with `rule_id`, `rule_version`, severity, and failure reason in the exception output.
- Separate exceptions from review decisions. Record open/resolved/accepted status and evidence without overwriting original flags.
- Export a compact summary plus drill-through exception rows. Validate record counts, spend totals, unmatched keys, and rounding tolerance at each step.

The completed project does not document all of these controls; add them only when implemented.

### PO–invoice reconciliation: aggregate before joining

**Documented flow:** 41 monthly CSV order files + XML invoices + PostgreSQL supplier reference → Snowflake staging → PO/invoice aggregates → reconciliation table → separate weather-enriched subset.

**Recommended table boundaries:**

| Layer | Grain | Main checks |
| --- | --- | --- |
| Raw orders/invoices | Original source row | Preserve file identity; reject duplicate ingest batches; validate parse and schema |
| Order totals | PO ID + supplier ID | Sum quantity × expected unit price; define return/correction handling |
| Invoice totals | PO ID + supplier ID | Aggregate pre-tax invoice amounts; handle split invoices and credit notes |
| Reconciliation fact | One PO + supplier | Unique keys on both sides; outer join for unmatched records; `quoted_amount - invoice_amount`; currency and decimal precision |
| Supplier dimension | Supplier ID / applicable date | Unique or effective-dated reference; standardize ZIP codes |
| Weather enrichment | ZIP + date | Unique station/date mapping; nearest-station distance rule; retain unmatched reconciliation rows |

Use Python for extraction, XML parsing, and load orchestration; use SQL for typed staging, aggregation, joins, and exception calculations. Keep weather enrichment separate from the core financial reconciliation so missing weather never silently removes financial exceptions.

For scheduled use, add run manifests, idempotent loads, failed-row quarantine, count/amount reconciliation, and a run-status table. Add an orchestrator only when scheduling, dependencies, or retries justify it; the current work does not require a streaming platform.

### Fraud: separate features, evaluation, and policy

**Documented flow:** transaction cleaning → rolling/entity features → feature selection → model comparison → OOT evaluation → cutoff/cost table.

**Recommended boundaries:**

- A point-in-time feature table keyed by transaction ID and event time; compute histories from available earlier events only.
- Train/test/OOT manifests with explicit dates and consistent labels. Fit encoders and selectors on training data only; prevent target leakage.
- A prediction table with model version, feature version, probability/score, and scored time.
- A policy table with review rate, recall, FPR, review workload, and net value under one consistent time/population basis.
- Monitor temporal drift and investigate the reported drop from train/test to OOT before deployment. The report’s score table does not label its metric clearly enough to infer AUC or recall.

### Campaign targeting: make the decision rule reproducible

Keep customer features, model scores, and mailing decisions in separate outputs. Version the mailing cost, margin, assumed wave-two response multiplier, and eligibility rule. Emit the expected profit and number selected for every candidate model on the same holdout set, with mail-to-all as a baseline. Stress-test the anomalous ZIP segment and response multiplier. Record observed outcomes for post-campaign calibration; use a holdout experiment for causal lift.

## Analytical-method validation

| Project | Recommended next check | Why it matters |
| --- | --- | --- |
| A/B replication | Verify assignment balance, analysis unit, confidence intervals, multiple subgroup comparisons, and power for match-ratio differences | Separates a positive treatment result from an underpowered null comparison |
| Poisson | Compare variance with mean; check overdispersion, robust uncertainty, and a negative-binomial alternative | A significant coefficient can still have understated uncertainty under a restrictive count model |
| MNL simulation | Use stable grouped log-sum-exp; verify one chosen alternative per task; compare analytic/numeric gradients; inspect MCMC chains, effective sample size, and acceptance | A trace plot alone does not establish convergence; grouping errors can invalidate likelihoods |
| K-Means | Compare raw/scaled features, multiple seeds and objective values; keep species only for interpretation; compare stability across runs | Distance scales and initialization affect centroids; the custom and library centroids differ in the report |

## Website structure

The homepage follows the four featured project designs from PR #21: HP, fraud, campaign targeting, and PO–invoice reconciliation. Four additional analyses appear as compact result-and-tool summaries, with methods available through native disclosures. All standalone case pages remain available. Content improvements belong inside the Explore Project case pages: business question, analytical approach, measured result, and interpretation limits. Existing case-page plots, code, headings, and TOC anchors are preserved.

The site remains buildless HTML/CSS/JS. Keep homepage assets and their `docs/` mirrors synchronized; edit both Quarto source and rendered case-page summaries when the source datasets cannot be re-executed.
