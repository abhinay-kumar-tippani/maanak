# Report specification and versioning

The official supplied report-format source is OIML R76-2:2007. Use it together with the applicable procedure in R76-1:2006. The prototype output is clearly labelled **Type Evaluation Test Report - Selected Tests - Demonstration Only**. It is not a model approval certificate, an official issuance by a government laboratory, an accredited report, or a legally validated digitally signed document.

## Source fields versus software additions

| Content | Primary basis or status | P0 rendering |
|---|---|---|
| Type evaluation report purpose and adaptable report pagination | R76-2 Introduction p4 | A4 report; repeat forms as needed, page x/y; no fixed 64-page promise |
| Application/type/manufacturer/applicant and category | R76-2 p6 | Frozen values and fictional-data labels |
| Accuracy class, Min/Max/e/d/n, range values, tare effect | R76-2 p6 | Actual saved scope; unsupported/unrecorded fields explicitly marked |
| Power supply, zero/tare devices, temperature range, printer/features | R76-2 pp6-7 | Captured declared data where available; no guessed electrical/environmental limits |
| Submitted sample ID, instrument software version, interfaces and load-cell information | R76-2 pp6-7 | Saved technical information or NOT RECORDED; distinguish NAWI software version from our rules-engine version |
| Evaluation period, report date, observer and remarks | R76-2 p6 | Preserve test date separately from PDF-generation time |
| Test equipment identification and traceability | R76-2 Introduction p4 and equipment form p8 | Snapshot essential names/types/reference IDs and actual supporting evidence; demo equipment is labelled fictional |
| Summary of tests and examinations | R76-2 p9 | Selected outcomes plus clear omitted/unevaluated coverage; no invented N/A or overall PASS |
| Units and relevant header conditions | R76-2 explanatory notes p5 and selected forms pp10,12,16 | All quantities display units; record actual start/end temperature and time on these forms; optional extra condition monitoring is labelled separately |
| Weighing table L/I/deltaL/E/Ec/MPE, increasing/decreasing | R76-2 form 1 p10 | All selected load rows and zero references, arithmetic from frozen result |
| Eccentricity sketch/positions, zero references and per-position results | R76-2 form 3.1 p12 | Four quarter segments and display position; prior zero reference per position |
| Repeatability two series and Emax-Emin | R76-2 form 5 p16 | Ten loaded readings per series for DEMO-30, individual-error and spread outcomes; extra unload-record appendix from A.4.10 |
| Construction information/picture | R76-2 p48 | Manual intake description and demo sketch/evidence where recorded |
| Applicable technical checklist results | R76-2 p49 and pp50-62 | Explicit limited manual coverage; no fake completed checklist |
| Lab heading/address, unique application/report identifier and human review controls | PS lab/report/RBAC requirements plus software design | Useful identification; do not claim every field is individually mandated by R76-2 |
| Cover design, product branding, report version, rule/engine hashes and immutable snapshot | Software design | Clear, restrained, no state emblem or unsupported official status |
| Approver display name and approval timestamp | Software workflow | Label as application approval for report issue; no claim it is a legally valid digital signature |
| QR/verification token | Optional software enhancement | P1, minimal metadata only, private evidence stays private |
| Editable DOCX | Explicit PS pp1-2 | P1 if time permits, export the same snapshot; a filename change from HTML to .docx is not a valid DOCX |

The white/grey boxes in the source forms matter. Do not require every possible environmental field on every test: the class III selected forms do not make barometric pressure universally mandatory, and the relative-humidity boxes on these selected forms are shaded. Record start/end temperature/time and the procedure's actual monitoring/confirmations. Additional monitored conditions are allowed as clearly labelled laboratory records. Never fill missing measurements with room-temperature defaults.

A report number, officer name and QR code do not establish legal acceptance. Indian report issuance/signature requirements remain NOT VERIFIED FROM PROVIDED AUTHORITATIVE SOURCE.

## P0 page order

1. Cover and scope declaration: report number/version, fictional lab/applicant/model, selected-test limitation.
2. General instrument information and recorded declarations.
3. Test equipment and procedure/condition records.
4. Selected-test summary and full catalogue coverage status.
5. Weighing performance table (additional pages as needed, repeated table header).
6. Eccentricity sketch and table.
7. Repeatability series and each-error/spread summary.
8. Remarks, manual intake findings, omitted requirements and evidence list.
9. Application review/issue record and traceability manifest.

This is our proposed order, not a claim of a mandatory nine-page report. Actual page count varies with rows, remarks and appendices. Keep a row together; don't lose signs, units, decimals, zero references or source clauses at a page break. Reproduce the meaning and data of the included source forms, and describe this as R76-2-aligned partial reporting until full coverage is implemented.

## Versions and integrity

| Version | State/kind | Immutable content |
|---|---|---|
| Live draft preview | No official numbered version | Current saved data clearly labelled draft; no approval |
| v1 | SUBMITTED | Frozen test/spec/party/condition/equipment/source/coverage snapshot and hash |
| v2 | SUBMITTED after correction | New snapshot; old v1 and correction decision remain |
| v3 | FINAL after approval of v2 | Same approved test dataset from v2 plus approval/issue metadata; derived_from_id points to v2 |

Without a correction the usual path is v1 SUBMITTED -> v2 FINAL. Use monotonic integers under a locked report/evaluation row, not decimal version numbers. Store original submitted version/hash inside final approval metadata. Finalization must assert that the test dataset is copied from the approved snapshot and only the allowlisted issue metadata is added. Never recompute historical results under a newly deployed rules version.

Use separate digests: canonical snapshot hash for input-data identity; SHA-256 of actual PDF bytes for the produced file. A final snapshot containing additional approval metadata naturally has a different hash from its source submission; retain both and their relationship. Hashes provide integrity checks, not non-repudiation by themselves.

## Reliable generation

Reserve final version and artifact with a frozen generation time -> render in Node -> upload unique private path with upsert:false -> persist digest/length/state READY -> mark ISSUED and audit in the completion transaction. A failure keeps the evaluation APPROVED and exposes Retry. Reuse the existing reservation. If a prior attempt uploaded the bytes but did not commit DB metadata, inspect that reserved object's digest and finalize consistently instead of overwriting it or allocating a duplicate report.

Never return the entire large PDF through a Server Action. Return authorized short-lived download access after Storage success. During initial PDF testing a small one-page buffer is acceptable to prove compatibility; remove the health PDF route after the real report path is verified.

## Report QA gate

Check every included page visually. Compare every numeric cell with its immutable snapshot. Test long model names/remarks, all rows, multi-page tables, positive/negative limits, narrow decimal columns and page numbering. Reopen the final PDF downloaded from Supabase, not just a local preview. Confirm the partial-scope statement and fictional-data label are present, approved snapshot identity matches, and the downloadable artifact digest corresponds to the stored bytes.
