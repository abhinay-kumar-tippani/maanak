-- Apply only after confirming migrations 202609090007 and 202609090008 are absent remotely.
-- Dependency order: selected plan reference/persistence, then demo workflow commands.

-- STEP 12: immutable source references, selected-demo definitions and atomic planning.
-- Apply after 001..005 and the existing registration ambiguity fix.
-- This unapplied plan migration uses version 007 so it follows the applied
-- 202609090006 registration ambiguity fix without a migration-version collision.
begin;

-- Serialize reference installation; existing immutable rows are compared, never updated.
lock table public.standard_documents, public.rule_sets, public.test_definitions in share row exclusive mode;
do $seed$
declare
  v_expected jsonb;
  v_actual jsonb;
  v_manifest_text text := $manifest${"id":"r76-2006-2007-demo-classiii-plan-v1","version":"selected-demo-plan-1","plannerVersion":"1","evaluatorStatus":"NOT_IMPLEMENTED","sourceManifestSha256":"3dd06908328fc42271000ff4b09f37e45e10fce6c70f6f1117b3ee25c745a8bc","sourceRegistrySha256":"42110ce437d57309ff6de72a57de48b3aacc27bffd2c6b60bc34b473ad3f86f4","testCatalogueSha256":"89b339b13f617fcae0f8ac9afb0e21db9e2ae94db432f16f2f0ab3a5fad44804","sourceRegistry":{"ruleSetId":"r76-2006-2007-demo-classiii-v1","scope":"P0: complete, digital, class III, single-interval, no auxiliary indication, e=d, e>=5 g; ordinary non-grading platform; no additive tare; no smaller-resolution test mode. Unsupported features block this rule pack; they are not a metrological FAIL.","unverifiedLiteral":"NOT VERIFIED FROM PROVIDED AUTHORITATIVE SOURCE","rules":[{"ruleId":"R76-CLASS-III-LARGE-E","ruleVersion":"1","verificationStatus":"VERIFIED_SCOPED","implementationStatus":"SPECIFICATION_ONLY","automation":"AUTOMATE","description":"Check declared class III against the e>=5 g Table 3 branch; not a complete classification/conformity decision.","inputs":["Max","Min","e","d","declared class","range and feature flags"],"calculation":"n = Max/e","expectedCondition":"e>=5 g; 500<=n<=10000; Min>=20e; e=d for graduated instrument without auxiliary device","result":null,"references":[{"documentId":"r76-1","standard":"OIML R 76-1","edition":"2006","documentSha256":"06d9674f4f557ea053482960472db560aaedcc7665e6dabb4b4012333f3e068b","clause":"3.1.2; 3.2","printedPages":[26,27],"pdfPages":[26,27],"tableOrForm":"Tables 2 and 3"}],"supportedScope":"P0: complete, digital, class III, single-interval, no auxiliary indication, e=d, e>=5 g; ordinary non-grading platform; no additive tare; no smaller-resolution test mode. Unsupported features block this rule pack; they are not a metrological FAIL."},{"ruleId":"R76-INTERVAL-FORM","ruleVersion":"1","verificationStatus":"VERIFIED_SCOPED","implementationStatus":"SPECIFICATION_ONLY","automation":"AUTOMATE","description":"Allowed scale-interval form for weighing results.","inputs":["d","mass unit"],"calculation":"d = a * 10^k in the declared mass unit","expectedCondition":"a in {1,2,5}; k integral","result":null,"references":[{"documentId":"r76-1","standard":"OIML R 76-1","edition":"2006","documentSha256":"06d9674f4f557ea053482960472db560aaedcc7665e6dabb4b4012333f3e068b","clause":"4.2.2.1","printedPages":[43],"pdfPages":[43],"tableOrForm":null}],"supportedScope":"P0: complete, digital, class III, single-interval, no auxiliary indication, e=d, e>=5 g; ordinary non-grading platform; no additive tare; no smaller-resolution test mode. Unsupported features block this rule pack; they are not a metrological FAIL."},{"ruleId":"R76-MPE-III","ruleVersion":"1","verificationStatus":"VERIFIED_SCOPED","implementationStatus":"SPECIFICATION_ONLY","automation":"AUTOMATE","description":"Absolute permissible error for the selected class III evaluation tests.","inputs":["load L","e","Max"],"calculation":"q=L/e; MPE = 0.5e if 0<=q<=500; 1e if 500<q<=2000; 1.5e if 2000<q<=10000","expectedCondition":"Use inclusive upper bounds exactly. Reject L<0 or L>Max as invalid for this scoped plan. Do not apply in-service doubling.","result":null,"references":[{"documentId":"r76-1","standard":"OIML R 76-1","edition":"2006","documentSha256":"06d9674f4f557ea053482960472db560aaedcc7665e6dabb4b4012333f3e068b","clause":"3.5.1; 3.10.1","printedPages":[30,36],"pdfPages":[30,36],"tableOrForm":"Table 6"}],"supportedScope":"P0: complete, digital, class III, single-interval, no auxiliary indication, e=d, e>=5 g; ordinary non-grading platform; no additive tare; no smaller-resolution test mode. Unsupported features block this rule pack; they are not a metrological FAIL."},{"ruleId":"R76-CHANGEOVER","ruleVersion":"1","verificationStatus":"VERIFIED_SCOPED","implementationStatus":"SPECIFICATION_ONLY","automation":"AUTOMATE","description":"Calculate prior-to-rounding indication and error.","inputs":["L","I","e","additional load deltaL","confirmation of changeover"],"calculation":"P=I+e/2-deltaL; E=P-L","expectedCondition":"All mass quantities in the same unit; use decimal arithmetic, not binary floating point; actual observed deltaL, no invented default","result":null,"references":[{"documentId":"r76-1","standard":"OIML R 76-1","edition":"2006","documentSha256":"06d9674f4f557ea053482960472db560aaedcc7665e6dabb4b4012333f3e068b","clause":"3.5.3.2; A.4.4.3","printedPages":[30,88,89],"pdfPages":[30,88,89],"tableOrForm":null},{"documentId":"r76-2","standard":"OIML R 76-2","edition":"2007","documentSha256":"650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820","clause":"Explanatory notes; 1","printedPages":[5,10],"pdfPages":[5,10],"tableOrForm":null}],"supportedScope":"P0: complete, digital, class III, single-interval, no auxiliary indication, e=d, e>=5 g; ordinary non-grading platform; no additive tare; no smaller-resolution test mode. Unsupported features block this rule pack; they are not a metrological FAIL."},{"ruleId":"R76-ZERO-CORRECTION","ruleVersion":"1","verificationStatus":"VERIFIED_SCOPED","implementationStatus":"SPECIFICATION_ONLY","automation":"AUTOMATE","description":"Zero-correct weighing and eccentricity errors.","inputs":["E","raw zero or near-zero reference L0 I0 deltaL0","e"],"calculation":"E0=I0+e/2-deltaL0-L0; Ec=E-E0","expectedCondition":"abs(Ec)<=MPE for the load; preserve zero-reference identity; no default E0=0","result":null,"references":[{"documentId":"r76-1","standard":"OIML R 76-1","edition":"2006","documentSha256":"06d9674f4f557ea053482960472db560aaedcc7665e6dabb4b4012333f3e068b","clause":"A.4.4.3","printedPages":[89],"pdfPages":[89],"tableOrForm":null},{"documentId":"r76-2","standard":"OIML R 76-2","edition":"2007","documentSha256":"650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820","clause":"1; 3.1","printedPages":[10,12],"pdfPages":[10,12],"tableOrForm":null}],"supportedScope":"P0: complete, digital, class III, single-interval, no auxiliary indication, e=d, e>=5 g; ordinary non-grading platform; no additive tare; no smaller-resolution test mode. Unsupported features block this rule pack; they are not a metrological FAIL."},{"ruleId":"R76-INITIAL-WEIGHING-PLAN","ruleVersion":"1","verificationStatus":"VERIFIED_SCOPED","implementationStatus":"SPECIFICATION_ONLY","automation":"AUTOMATE","description":"Initial intrinsic error test loading requirements.","inputs":["Max","Min","e","initial-zero-setting range"],"calculation":"Generate >=10 distinct positive test loads for this demo as a conservative implementation of the at-least-10-load requirement, include Min/Max and points at or near MPE changes; add zero before and after","expectedCondition":"Increase progressively to Max and decrease to zero. Min is included when Min>=100 mg. Manufacturer initial-zero range >20% Max requires a supplementary test, unsupported in P0.","result":null,"references":[{"documentId":"r76-1","standard":"OIML R 76-1","edition":"2006","documentSha256":"06d9674f4f557ea053482960472db560aaedcc7665e6dabb4b4012333f3e068b","clause":"A.4.4.1; A.4.4.2","printedPages":[88],"pdfPages":[88],"tableOrForm":null}],"supportedScope":"P0: complete, digital, class III, single-interval, no auxiliary indication, e=d, e>=5 g; ordinary non-grading platform; no additive tare; no smaller-resolution test mode. Unsupported features block this rule pack; they are not a metrological FAIL."},{"ruleId":"R76-ECCENTRIC-LOAD","ruleVersion":"1","verificationStatus":"VERIFIED_SCOPED","implementationStatus":"SPECIFICATION_ONLY","automation":"AUTOMATE","description":"Eccentricity load for ordinary receptor with at most four supports.","inputs":["Max","maximum additive tare effect","receptor/support information"],"calculation":"L=(Max+maximum additive tare effect)/3","expectedCondition":"P0 additive effect is declared 0, not silently presumed. Special, rolling and >4-support receptors are NOT_SUPPORTED.","result":null,"references":[{"documentId":"r76-1","standard":"OIML R 76-1","edition":"2006","documentSha256":"06d9674f4f557ea053482960472db560aaedcc7665e6dabb4b4012333f3e068b","clause":"3.6.2; 3.6.2.1","printedPages":[31],"pdfPages":[31],"tableOrForm":null}],"supportedScope":"P0: complete, digital, class III, single-interval, no auxiliary indication, e=d, e>=5 g; ordinary non-grading platform; no additive tare; no smaller-resolution test mode. Unsupported features block this rule pack; they are not a metrological FAIL."},{"ruleId":"R76-ECCENTRIC-POSITIONS","ruleVersion":"1","verificationStatus":"VERIFIED_SCOPED","implementationStatus":"SPECIFICATION_ONLY","automation":"AUTOMATE","description":"Four-segment eccentricity procedure and evaluation.","inputs":["4 positions","sketch/display location","per-position zero reference","L I deltaL","device state"],"calculation":"Calculate E and Ec for each position, then compare abs(Ec) with MPE","expectedCondition":"Load four quarter segments in turn; mark positions on sketch; automatic zero-setting and zero-tracking not in operation. P0 captures zero before each position, as in R76-2 form; all four must pass.","result":null,"references":[{"documentId":"r76-1","standard":"OIML R 76-1","edition":"2006","documentSha256":"06d9674f4f557ea053482960472db560aaedcc7665e6dabb4b4012333f3e068b","clause":"A.4.7; A.4.7.1","printedPages":[90,91],"pdfPages":[90,91],"tableOrForm":null},{"documentId":"r76-2","standard":"OIML R 76-2","edition":"2007","documentSha256":"650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820","clause":"3.1","printedPages":[12],"pdfPages":[12],"tableOrForm":null}],"supportedScope":"P0: complete, digital, class III, single-interval, no auxiliary indication, e=d, e>=5 g; ordinary non-grading platform; no additive tare; no smaller-resolution test mode. Unsupported features block this rule pack; they are not a metrological FAIL."},{"ruleId":"R76-REPEATABILITY-SERIES","ruleVersion":"1","verificationStatus":"VERIFIED_SCOPED","implementationStatus":"SPECIFICATION_ONLY","automation":"AUTOMATE","description":"Type-evaluation repeatability series and repetitions.","inputs":["Max","load choices","loaded/unloaded readings","zero reset/device state"],"calculation":"Two series, about 50% Max and close to 100% Max; 10 readings in each when Max<1000 kg; otherwise at least 3","expectedCondition":"P0 Max<1000 kg. Demo chooses exactly 0.5Max and Max; these exact choices are ours, not universal mandated loads. Record unload readings; reset if zero deviates; automatic zero/tracking in operation if present.","result":null,"references":[{"documentId":"r76-1","standard":"OIML R 76-1","edition":"2006","documentSha256":"06d9674f4f557ea053482960472db560aaedcc7665e6dabb4b4012333f3e068b","clause":"A.4.10","printedPages":[93],"pdfPages":[93],"tableOrForm":null},{"documentId":"r76-2","standard":"OIML R 76-2","edition":"2007","documentSha256":"650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820","clause":"5","printedPages":[16],"pdfPages":[16],"tableOrForm":null}],"supportedScope":"P0: complete, digital, class III, single-interval, no auxiliary indication, e=d, e>=5 g; ordinary non-grading platform; no additive tare; no smaller-resolution test mode. Unsupported features block this rule pack; they are not a metrological FAIL."},{"ruleId":"R76-REPEATABILITY-LIMITS","ruleVersion":"1","verificationStatus":"VERIFIED_SCOPED","implementationStatus":"SPECIFICATION_ONLY","automation":"AUTOMATE","description":"Evaluate individual errors AND spread at each repeatability load.","inputs":["L","e","I and deltaL for each repeat"],"calculation":"E_i=I_i+e/2-deltaL_i-L; spread=max(E_i)-min(E_i)","expectedCondition":"abs(E_i)<=MPE for EVERY reading AND spread<=MPE in EACH series. Do not zero-correct each repeat by arbitrary per-reading offsets.","result":null,"references":[{"documentId":"r76-1","standard":"OIML R 76-1","edition":"2006","documentSha256":"06d9674f4f557ea053482960472db560aaedcc7665e6dabb4b4012333f3e068b","clause":"3.6; 3.6.1","printedPages":[31],"pdfPages":[31],"tableOrForm":null},{"documentId":"r76-2","standard":"OIML R 76-2","edition":"2007","documentSha256":"650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820","clause":"5","printedPages":[16],"pdfPages":[16],"tableOrForm":null}],"supportedScope":"P0: complete, digital, class III, single-interval, no auxiliary indication, e=d, e>=5 g; ordinary non-grading platform; no additive tare; no smaller-resolution test mode. Unsupported features block this rule pack; they are not a metrological FAIL."},{"ruleId":"R76-GENERAL-CONDITIONS","ruleVersion":"1","verificationStatus":"VERIFIED_SCOPED","implementationStatus":"SPECIFICATION_ONLY","automation":"MANUAL_CHECKLIST_P0","description":"Test setup and environmental conditions.","inputs":["temperatures/times","declared temperature range","power state","leveling","preload","adjustment/recovery records"],"calculation":"Steady temperature: extreme difference<=min(one fifth of declared temperature span,5 C); rate<=5 C/hour for these selected tests","expectedCondition":"Monitor and record conditions; do not assert continuously steady temperature from only two endpoint readings; require tester confirmation. Preload once to Max or Lim before weighing tests with stated exceptions. Follow test-specific zero/tracking requirements.","result":null,"references":[{"documentId":"r76-1","standard":"OIML R 76-1","edition":"2006","documentSha256":"06d9674f4f557ea053482960472db560aaedcc7665e6dabb4b4012333f3e068b","clause":"A.4.1.1-A.4.1.11","printedPages":[85,86],"pdfPages":[85,86],"tableOrForm":null}],"supportedScope":"P0: complete, digital, class III, single-interval, no auxiliary indication, e=d, e>=5 g; ordinary non-grading platform; no additive tare; no smaller-resolution test mode. Unsupported features block this rule pack; they are not a metrological FAIL."},{"ruleId":"R76-TEST-EQUIPMENT","ruleVersion":"1","verificationStatus":"VERIFIED_SCOPED","implementationStatus":"SPECIFICATION_ONLY","automation":"MANUAL_CHECKLIST_P0","description":"Record standards and equipment traceability.","inputs":["equipment names/types/IDs","calibration/reference evidence"],"calculation":"No R111-class inference from the supplied R76 alone","expectedCondition":"R76-1 3.7.1 references R111 and gives a 1/3-MPE test-standard condition with an E2-or-better uncertainty alternative. Capture evidence/manual suitability confirmation; full R111 validation NOT VERIFIED FROM PROVIDED AUTHORITATIVE SOURCE.","result":null,"references":[{"documentId":"r76-1","standard":"OIML R 76-1","edition":"2006","documentSha256":"06d9674f4f557ea053482960472db560aaedcc7665e6dabb4b4012333f3e068b","clause":"3.7.1","printedPages":[32],"pdfPages":[32],"tableOrForm":null},{"documentId":"r76-2","standard":"OIML R 76-2","edition":"2007","documentSha256":"650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820","clause":"Introduction; equipment information","printedPages":[4,8],"pdfPages":[4,8],"tableOrForm":null}],"supportedScope":"P0: complete, digital, class III, single-interval, no auxiliary indication, e=d, e>=5 g; ordinary non-grading platform; no additive tare; no smaller-resolution test mode. Unsupported features block this rule pack; they are not a metrological FAIL."}]},"coverage":[{"code":"FORM_1","name":"Weighing performance","status":"REQUIRED","explanation":"Only the selected baseline procedure is planned; its evaluator is not implemented. This does not cover every branch of this form.","references":[{"documentId":"r76-2","standard":"OIML R 76-2","edition":"2007","documentSha256":"650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820","clause":"1","printedPages":[10],"pdfPages":[10],"tableOrForm":"Form 1"}]},{"code":"FORM_2","name":"Temperature effect on no-load indication","status":"NOT_IMPLEMENTED","explanation":"Omitted from selected-demo automation. Applicability remains unresolved pending profile review; omission is not NOT_APPLICABLE.","references":[{"documentId":"r76-2","standard":"OIML R 76-2","edition":"2007","documentSha256":"650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820","clause":"2","printedPages":[11],"pdfPages":[11],"tableOrForm":"Form 2"}]},{"code":"FORM_3.1","name":"Eccentricity using weights","status":"REQUIRED","explanation":"Only the selected baseline procedure is planned; its evaluator is not implemented. This does not cover every branch of this form.","references":[{"documentId":"r76-2","standard":"OIML R 76-2","edition":"2007","documentSha256":"650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820","clause":"3.1","printedPages":[12],"pdfPages":[12],"tableOrForm":"Form 3.1"}]},{"code":"FORM_3.2","name":"Eccentricity using rolling load","status":"NOT_IMPLEMENTED","explanation":"Omitted from selected-demo automation. Applicability remains unresolved pending profile review; omission is not NOT_APPLICABLE.","references":[{"documentId":"r76-2","standard":"OIML R 76-2","edition":"2007","documentSha256":"650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820","clause":"3.2","printedPages":[13],"pdfPages":[13],"tableOrForm":"Form 3.2"}]},{"code":"FORM_4.1","name":"Discrimination","status":"NOT_IMPLEMENTED","explanation":"Omitted from selected-demo automation. Applicability remains unresolved pending profile review; omission is not NOT_APPLICABLE.","references":[{"documentId":"r76-2","standard":"OIML R 76-2","edition":"2007","documentSha256":"650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820","clause":"4.1","printedPages":[14],"pdfPages":[14],"tableOrForm":"Form 4.1"}]},{"code":"FORM_4.2","name":"Sensitivity, non-self-indicating","status":"NOT_IMPLEMENTED","explanation":"Omitted from selected-demo automation. Applicability remains unresolved pending profile review; omission is not NOT_APPLICABLE.","references":[{"documentId":"r76-2","standard":"OIML R 76-2","edition":"2007","documentSha256":"650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820","clause":"4.2","printedPages":[15],"pdfPages":[15],"tableOrForm":"Form 4.2"}]},{"code":"FORM_5","name":"Repeatability","status":"REQUIRED","explanation":"Only the selected baseline procedure is planned; its evaluator is not implemented. This does not cover every branch of this form.","references":[{"documentId":"r76-2","standard":"OIML R 76-2","edition":"2007","documentSha256":"650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820","clause":"5","printedPages":[16],"pdfPages":[16],"tableOrForm":"Form 5"}]},{"code":"FORM_6.1","name":"Zero return","status":"NOT_IMPLEMENTED","explanation":"Omitted from selected-demo automation. Applicability remains unresolved pending profile review; omission is not NOT_APPLICABLE.","references":[{"documentId":"r76-2","standard":"OIML R 76-2","edition":"2007","documentSha256":"650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820","clause":"6.1","printedPages":[17],"pdfPages":[17],"tableOrForm":"Form 6.1"}]},{"code":"FORM_6.2","name":"Creep","status":"NOT_IMPLEMENTED","explanation":"Omitted from selected-demo automation. Applicability remains unresolved pending profile review; omission is not NOT_APPLICABLE.","references":[{"documentId":"r76-2","standard":"OIML R 76-2","edition":"2007","documentSha256":"650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820","clause":"6.2","printedPages":[18],"pdfPages":[18],"tableOrForm":"Form 6.2"}]},{"code":"FORM_7","name":"Stability of equilibrium","status":"NOT_IMPLEMENTED","explanation":"Omitted from selected-demo automation. Applicability remains unresolved pending profile review; omission is not NOT_APPLICABLE.","references":[{"documentId":"r76-2","standard":"OIML R 76-2","edition":"2007","documentSha256":"650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820","clause":"7","printedPages":[19],"pdfPages":[19],"tableOrForm":"Form 7"}]},{"code":"FORM_8","name":"Tilting","status":"NOT_IMPLEMENTED","explanation":"Omitted from selected-demo automation. Applicability remains unresolved pending profile review; omission is not NOT_APPLICABLE.","references":[{"documentId":"r76-2","standard":"OIML R 76-2","edition":"2007","documentSha256":"650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820","clause":"8","printedPages":[20],"pdfPages":[20],"tableOrForm":"Form 8"}]},{"code":"FORM_9","name":"Tare weighing test","status":"NOT_IMPLEMENTED","explanation":"Omitted from selected-demo automation. Applicability remains unresolved pending profile review; omission is not NOT_APPLICABLE.","references":[{"documentId":"r76-2","standard":"OIML R 76-2","edition":"2007","documentSha256":"650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820","clause":"9","printedPages":[21],"pdfPages":[21],"tableOrForm":"Form 9"}]},{"code":"FORM_10","name":"Warm-up time","status":"NOT_IMPLEMENTED","explanation":"Omitted from selected-demo automation. Applicability remains unresolved pending profile review; omission is not NOT_APPLICABLE.","references":[{"documentId":"r76-2","standard":"OIML R 76-2","edition":"2007","documentSha256":"650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820","clause":"10","printedPages":[22],"pdfPages":[22],"tableOrForm":"Form 10"}]},{"code":"FORM_11","name":"Voltage variations","status":"NOT_IMPLEMENTED","explanation":"Omitted from selected-demo automation. Applicability remains unresolved pending profile review; omission is not NOT_APPLICABLE.","references":[{"documentId":"r76-2","standard":"OIML R 76-2","edition":"2007","documentSha256":"650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820","clause":"11","printedPages":[23],"pdfPages":[23],"tableOrForm":"Form 11"}]},{"code":"FORM_12.1","name":"AC dips and short interruptions","status":"NOT_IMPLEMENTED","explanation":"Omitted from selected-demo automation. Applicability remains unresolved pending profile review; omission is not NOT_APPLICABLE.","references":[{"documentId":"r76-2","standard":"OIML R 76-2","edition":"2007","documentSha256":"650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820","clause":"12.1","printedPages":[24],"pdfPages":[24],"tableOrForm":"Form 12.1"}]},{"code":"FORM_12.2","name":"Electrical bursts","status":"NOT_IMPLEMENTED","explanation":"Omitted from selected-demo automation. Applicability remains unresolved pending profile review; omission is not NOT_APPLICABLE.","references":[{"documentId":"r76-2","standard":"OIML R 76-2","edition":"2007","documentSha256":"650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820","clause":"12.2","printedPages":[25,26],"pdfPages":[25,26],"tableOrForm":"Form 12.2"}]},{"code":"FORM_12.3","name":"Surges","status":"NOT_IMPLEMENTED","explanation":"Omitted from selected-demo automation. Applicability remains unresolved pending profile review; omission is not NOT_APPLICABLE.","references":[{"documentId":"r76-2","standard":"OIML R 76-2","edition":"2007","documentSha256":"650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820","clause":"12.3","printedPages":[27,28],"pdfPages":[27,28],"tableOrForm":"Form 12.3"}]},{"code":"FORM_12.4","name":"Electrostatic discharges","status":"NOT_IMPLEMENTED","explanation":"Omitted from selected-demo automation. Applicability remains unresolved pending profile review; omission is not NOT_APPLICABLE.","references":[{"documentId":"r76-2","standard":"OIML R 76-2","edition":"2007","documentSha256":"650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820","clause":"12.4","printedPages":[29,30,31],"pdfPages":[29,30,31],"tableOrForm":"Form 12.4"}]},{"code":"FORM_12.5","name":"Radiated electromagnetic fields","status":"NOT_IMPLEMENTED","explanation":"Omitted from selected-demo automation. Applicability remains unresolved pending profile review; omission is not NOT_APPLICABLE.","references":[{"documentId":"r76-2","standard":"OIML R 76-2","edition":"2007","documentSha256":"650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820","clause":"12.5","printedPages":[32,33],"pdfPages":[32,33],"tableOrForm":"Form 12.5"}]},{"code":"FORM_12.6","name":"Conducted radio-frequency fields","status":"NOT_IMPLEMENTED","explanation":"Omitted from selected-demo automation. Applicability remains unresolved pending profile review; omission is not NOT_APPLICABLE.","references":[{"documentId":"r76-2","standard":"OIML R 76-2","edition":"2007","documentSha256":"650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820","clause":"12.6","printedPages":[34],"pdfPages":[34],"tableOrForm":"Form 12.6"}]},{"code":"FORM_12.7","name":"Road vehicle power supply transients","status":"NOT_IMPLEMENTED","explanation":"Omitted from selected-demo automation. Applicability remains unresolved pending profile review; omission is not NOT_APPLICABLE.","references":[{"documentId":"r76-2","standard":"OIML R 76-2","edition":"2007","documentSha256":"650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820","clause":"12.7","printedPages":[35,36],"pdfPages":[35,36],"tableOrForm":"Form 12.7"}]},{"code":"FORM_13","name":"Damp heat, steady state","status":"NOT_IMPLEMENTED","explanation":"Omitted from selected-demo automation. Applicability remains unresolved pending profile review; omission is not NOT_APPLICABLE.","references":[{"documentId":"r76-2","standard":"OIML R 76-2","edition":"2007","documentSha256":"650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820","clause":"13","printedPages":[37,38,39],"pdfPages":[37,38,39],"tableOrForm":"Form 13"}]},{"code":"FORM_14","name":"Span stability","status":"NOT_IMPLEMENTED","explanation":"Omitted from selected-demo automation. Applicability remains unresolved pending profile review; omission is not NOT_APPLICABLE.","references":[{"documentId":"r76-2","standard":"OIML R 76-2","edition":"2007","documentSha256":"650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820","clause":"14","printedPages":[40,41,42,43,44,45],"pdfPages":[40,41,42,43,44,45],"tableOrForm":"Form 14"}]},{"code":"FORM_15","name":"Endurance","status":"NOT_IMPLEMENTED","explanation":"Omitted from selected-demo automation. Applicability remains unresolved pending profile review; omission is not NOT_APPLICABLE.","references":[{"documentId":"r76-2","standard":"OIML R 76-2","edition":"2007","documentSha256":"650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820","clause":"15","printedPages":[46,47],"pdfPages":[46,47],"tableOrForm":"Form 15"}]},{"code":"FORM_16","name":"Construction examination","status":"NOT_IMPLEMENTED","explanation":"Omitted from selected-demo automation. Applicability remains unresolved pending profile review; omission is not NOT_APPLICABLE.","references":[{"documentId":"r76-2","standard":"OIML R 76-2","edition":"2007","documentSha256":"650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820","clause":"16","printedPages":[48],"pdfPages":[48],"tableOrForm":"Form 16"}]},{"code":"FORM_17.1","name":"General checklist","status":"NOT_IMPLEMENTED","explanation":"Omitted from selected-demo automation. Applicability remains unresolved pending profile review; omission is not NOT_APPLICABLE.","references":[{"documentId":"r76-2","standard":"OIML R 76-2","edition":"2007","documentSha256":"650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820","clause":"17.1","printedPages":[50,51,52,53,54,55,56],"pdfPages":[50,51,52,53,54,55,56],"tableOrForm":"Form 17.1"}]},{"code":"FORM_17.2","name":"Direct sales/price computing/labeling","status":"NOT_IMPLEMENTED","explanation":"Omitted from selected-demo automation. Applicability remains unresolved pending profile review; omission is not NOT_APPLICABLE.","references":[{"documentId":"r76-2","standard":"OIML R 76-2","edition":"2007","documentSha256":"650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820","clause":"17.2","printedPages":[57,58,59],"pdfPages":[57,58,59],"tableOrForm":"Form 17.2"}]},{"code":"FORM_17.3","name":"Electronic instruments checklist","status":"NOT_IMPLEMENTED","explanation":"Omitted from selected-demo automation. Applicability remains unresolved pending profile review; omission is not NOT_APPLICABLE.","references":[{"documentId":"r76-2","standard":"OIML R 76-2","edition":"2007","documentSha256":"650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820","clause":"17.3","printedPages":[60],"pdfPages":[60],"tableOrForm":"Form 17.3"}]},{"code":"FORM_17.4","name":"Software-controlled devices checklist","status":"NOT_IMPLEMENTED","explanation":"Omitted from selected-demo automation. Applicability remains unresolved pending profile review; omission is not NOT_APPLICABLE.","references":[{"documentId":"r76-2","standard":"OIML R 76-2","edition":"2007","documentSha256":"650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820","clause":"17.4","printedPages":[61,62],"pdfPages":[61,62],"tableOrForm":"Form 17.4"}]},{"code":"WEIGHING_TEMPERATURE_REPETITIONS","name":"Weighing at other temperatures","status":"NOT_IMPLEMENTED","explanation":"Form 1 initial baseline only. Temperature repetitions shown in the summary are not implemented.","references":[{"documentId":"r76-2","standard":"OIML R 76-2","edition":"2007","documentSha256":"650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820","clause":"Summary; 1","printedPages":[9,10],"pdfPages":[9,10],"tableOrForm":"Form Summary; 1"}]}],"definitions":[{"id":"r76-2006-2007-demo-classiii-plan-v1:WEIGHING_INITIAL:1","code":"WEIGHING_INITIAL","version":"1","name":"Initial weighing performance","evaluatorId":"weighing_initial-v1","evaluatorStatus":"NOT_IMPLEMENTED","references":[{"documentId":"r76-1","standard":"OIML R 76-1","edition":"2006","documentSha256":"06d9674f4f557ea053482960472db560aaedcc7665e6dabb4b4012333f3e068b","clause":"A.4.4.1; A.4.4.2","printedPages":[88],"pdfPages":[88]},{"documentId":"r76-1","standard":"OIML R 76-1","edition":"2006","documentSha256":"06d9674f4f557ea053482960472db560aaedcc7665e6dabb4b4012333f3e068b","clause":"3.5.1; 3.10.1","printedPages":[30,36],"pdfPages":[30,36],"tableOrForm":"Table 6"},{"documentId":"r76-1","standard":"OIML R 76-1","edition":"2006","documentSha256":"06d9674f4f557ea053482960472db560aaedcc7665e6dabb4b4012333f3e068b","clause":"3.5.3.2; A.4.4.3","printedPages":[30,88,89],"pdfPages":[30,88,89]},{"documentId":"r76-2","standard":"OIML R 76-2","edition":"2007","documentSha256":"650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820","clause":"Explanatory notes; 1","printedPages":[5,10],"pdfPages":[5,10]},{"documentId":"r76-2","standard":"OIML R 76-2","edition":"2007","documentSha256":"650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820","clause":"1","printedPages":[10],"pdfPages":[10],"tableOrForm":"Form 1"}],"requiredReadings":["Actual load, indication and additional load to observed changeover in each direction","Separate zero/near-zero observations before loading and after unloading"],"procedureConfirmations":["PROGRESSIVE_LOADING_AND_UNLOADING","CHANGEOVER_OBSERVED","ZERO_DEVICE_STATE_RECORDED","ZERO_OUTSIDE_AUTOMATIC_RANGE_IF_OPERATING"]},{"id":"r76-2006-2007-demo-classiii-plan-v1:ECCENTRICITY_WEIGHTS:1","code":"ECCENTRICITY_WEIGHTS","version":"1","name":"Eccentricity using weights, ordinary receptor","evaluatorId":"eccentricity_weights-v1","evaluatorStatus":"NOT_IMPLEMENTED","references":[{"documentId":"r76-1","standard":"OIML R 76-1","edition":"2006","documentSha256":"06d9674f4f557ea053482960472db560aaedcc7665e6dabb4b4012333f3e068b","clause":"3.6.2; 3.6.2.1","printedPages":[31],"pdfPages":[31]},{"documentId":"r76-1","standard":"OIML R 76-1","edition":"2006","documentSha256":"06d9674f4f557ea053482960472db560aaedcc7665e6dabb4b4012333f3e068b","clause":"A.4.7; A.4.7.1","printedPages":[90,91],"pdfPages":[90,91]},{"documentId":"r76-2","standard":"OIML R 76-2","edition":"2007","documentSha256":"650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820","clause":"3.1","printedPages":[12],"pdfPages":[12]}],"requiredReadings":["Four quarter-segment load/indication/changeover readings","Zero/near-zero before each segment","Numbered sketch with display location"],"procedureConfirmations":["QUARTER_SEGMENTS_LOADED_IN_TURN","LOAD_DISTRIBUTION_RECORDED","ZERO_DEVICES_NOT_OPERATING","SKETCH_AND_DISPLAY_LOCATION_RECORDED"]},{"id":"r76-2006-2007-demo-classiii-plan-v1:REPEATABILITY_TYPE:1","code":"REPEATABILITY_TYPE","version":"1","name":"Type-evaluation repeatability","evaluatorId":"repeatability_type-v1","evaluatorStatus":"NOT_IMPLEMENTED","references":[{"documentId":"r76-1","standard":"OIML R 76-1","edition":"2006","documentSha256":"06d9674f4f557ea053482960472db560aaedcc7665e6dabb4b4012333f3e068b","clause":"A.4.10","printedPages":[93],"pdfPages":[93]},{"documentId":"r76-2","standard":"OIML R 76-2","edition":"2007","documentSha256":"650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820","clause":"5","printedPages":[16],"pdfPages":[16]}],"requiredReadings":["Ten loaded indication/changeover readings in each of two series","Resting unloaded indication between weighings and zero-reset record"],"procedureConfirmations":["UNLOADED_INSTRUMENT_AT_REST","RESET_IF_ZERO_DEVIATES","ZERO_DEVICES_OPERATING_IF_PRESENT"]}],"manualPreconditions":[{"id":"INTAKE_REVIEW","description":"Review documentation, markings and sealing; record manual findings. These are not an approval certificate.","status":"NOT_VERIFIED","references":[{"documentId":"r76-1","standard":"OIML R 76-1","edition":"2006","documentSha256":"06d9674f4f557ea053482960472db560aaedcc7665e6dabb4b4012333f3e068b","clause":"A.1-A.3","printedPages":[85],"pdfPages":[85]}]},{"id":"ENVIRONMENT","description":"Record temperature and times throughout the test. Manually confirm extreme temperature difference <= one fifth of declared span, capped at 5 C, and rate <= 5 C/hour. Two endpoints alone cannot establish continuous stability.","status":"NOT_VERIFIED","references":[{"documentId":"r76-1","standard":"OIML R 76-1","edition":"2006","documentSha256":"06d9674f4f557ea053482960472db560aaedcc7665e6dabb4b4012333f3e068b","clause":"A.4.1.1-A.4.1.11","printedPages":[85,86],"pdfPages":[85,86]}]},{"id":"POWER_LEVEL_RECOVERY","description":"Record power supply, leveling where relevant, adjustment and sufficient recovery between tests.","status":"NOT_VERIFIED","references":[{"documentId":"r76-1","standard":"OIML R 76-1","edition":"2006","documentSha256":"06d9674f4f557ea053482960472db560aaedcc7665e6dabb4b4012333f3e068b","clause":"A.4.1.1-A.4.1.11","printedPages":[85,86],"pdfPages":[85,86]}]},{"id":"PRELOAD","description":"Before each weighing test preload once to Max or Lim if defined; record the actual preload and procedure exceptions.","status":"NOT_VERIFIED","references":[{"documentId":"r76-1","standard":"OIML R 76-1","edition":"2006","documentSha256":"06d9674f4f557ea053482960472db560aaedcc7665e6dabb4b4012333f3e068b","clause":"A.4.1.1-A.4.1.11","printedPages":[85,86],"pdfPages":[85,86]}]},{"id":"TEST_EQUIPMENT","description":"Identify actual weights/equipment and traceability; document manual suitability. Full R111 validation: NOT VERIFIED FROM PROVIDED AUTHORITATIVE SOURCE.","status":"NOT_VERIFIED","references":[{"documentId":"r76-1","standard":"OIML R 76-1","edition":"2006","documentSha256":"06d9674f4f557ea053482960472db560aaedcc7665e6dabb4b4012333f3e068b","clause":"3.7.1","printedPages":[32],"pdfPages":[32]},{"documentId":"r76-2","standard":"OIML R 76-2","edition":"2007","documentSha256":"650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820","clause":"Introduction; equipment information","printedPages":[4,8],"pdfPages":[4,8]}]},{"id":"TESTER_PLAN_REVIEW","description":"Review generated loads and actual available weights before testing; do not substitute invented readings or silently round targets.","status":"NOT_VERIFIED","references":[{"documentId":"r76-1","standard":"OIML R 76-1","edition":"2006","documentSha256":"06d9674f4f557ea053482960472db560aaedcc7665e6dabb4b4012333f3e068b","clause":"A.4.1.1-A.4.1.11","printedPages":[85,86],"pdfPages":[85,86]}]}],"policy":{"general":"Min/Max; reachable 500e and 2000e plus e; exact e-aligned tenths until ten positive loads","demo30":"Explicit blueprint DEMO-30 list only at Max=30000, Min=200, e=d=10 g","repeatability":"Exactly Max/2 and Max, ten readings each for Max<1000 kg","rounding":"No rounding. Nonterminating eccentric load or insufficient exact points is unresolved","conformity":"NOT_DETERMINED","scope":"DEMO_SELECTED_ONLY"}}$manifest$;
  v_manifest_hash text := 'c872ba2e4e159230f3c4905d1f6a534a3f7f87e1eac13e3e7a24617fee9a2bca';
begin
  for v_expected in select item.value from jsonb_array_elements($documents$[{"id":"r76-1","title":"OIML R 76-1","edition":"2006","local_reference_path":"docs/reference/r076-1-e06.pdf","sha256":"06d9674f4f557ea053482960472db560aaedcc7665e6dabb4b4012333f3e068b","page_count":144,"authority_level":"PRIMARY"},{"id":"r76-2","title":"OIML R 76-2","edition":"2007","local_reference_path":"docs/reference/r076-2-e07.pdf","sha256":"650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820","page_count":62,"authority_level":"PRIMARY"}]$documents$::jsonb) as item(value) loop
    insert into public.standard_documents(id,title,edition,local_reference_path,sha256,page_count,authority_level)
    values (v_expected->>'id',v_expected->>'title',v_expected->>'edition',v_expected->>'local_reference_path',v_expected->>'sha256',(v_expected->>'page_count')::integer,v_expected->>'authority_level)
    on conflict do nothing;
    select to_jsonb(d) - 'created_at' into v_actual from public.standard_documents as d where d.id=v_expected->>'id';
    if v_actual is distinct from v_expected then raise exception using errcode='22000',message='REFERENCE_VERSION_CONFLICT'; end if;
  end loop;

  v_expected := jsonb_build_object('id','r76-2006-2007-demo-classiii-plan-v1','version','selected-demo-plan-1','manifest',v_manifest_text::jsonb,'manifest_sha256',v_manifest_hash,'release_status','DRAFT');
  insert into public.rule_sets(id,version,manifest,manifest_sha256,release_status)
  values (v_expected->>'id',v_expected->>'version',v_manifest_text::jsonb,v_manifest_hash,'DRAFT') on conflict do nothing;
  select to_jsonb(r) - 'created_at' into v_actual from public.rule_sets as r where r.id=v_expected->>'id';
  if v_actual is distinct from v_expected then raise exception using errcode='22000',message='REFERENCE_VERSION_CONFLICT'; end if;

  for v_expected in select item.value from jsonb_array_elements($definitions$[{"id":"r76-2006-2007-demo-classiii-plan-v1:WEIGHING_INITIAL:1","rule_set_id":"r76-2006-2007-demo-classiii-plan-v1","code":"WEIGHING_INITIAL","version":"1","name":"Initial weighing performance","implementation_status":"NOT_IMPLEMENTED","input_schema":{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"type":{"type":"string","const":"WEIGHING_INITIAL"},"zeroReferences":{"type":"array","items":{"type":"object","properties":{"rowKey":{"type":"string","minLength":1},"loadG":{"type":"string","maxLength":60,"pattern":"^-?\\d+(?:\\.\\d+)?$"},"indicationG":{"type":"string","maxLength":60,"pattern":"^-?\\d+(?:\\.\\d+)?$"},"additionalLoadG":{"type":"string","maxLength":60,"pattern":"^-?\\d+(?:\\.\\d+)?$"},"changeoverConfirmed":{"type":"boolean"},"observedAt":{"type":"string","format":"date-time","pattern":"^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$"},"zeroReferenceId":{"type":"string","minLength":1}},"required":["rowKey","loadG","indicationG","additionalLoadG","changeoverConfirmed","observedAt","zeroReferenceId"],"additionalProperties":false}},"rows":{"type":"array","items":{"type":"object","properties":{"rowKey":{"type":"string","minLength":1},"loadG":{"type":"string","maxLength":60,"pattern":"^-?\\d+(?:\\.\\d+)?$"},"indicationG":{"type":"string","maxLength":60,"pattern":"^-?\\d+(?:\\.\\d+)?$"},"additionalLoadG":{"type":"string","maxLength":60,"pattern":"^-?\\d+(?:\\.\\d+)?$"},"changeoverConfirmed":{"type":"boolean"},"observedAt":{"type":"string","format":"date-time","pattern":"^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$"},"direction":{"type":"string","enum":["INCREASING","DECREASING"]},"zeroReferenceId":{"type":"string","minLength":1}},"required":["rowKey","loadG","indicationG","additionalLoadG","changeoverConfirmed","observedAt","direction","zeroReferenceId"],"additionalProperties":false}}},"required":["type","zeroReferences","rows"],"additionalProperties":false},"references_json":[{"documentId":"r76-1","standard":"OIML R 76-1","edition":"2006","documentSha256":"06d9674f4f557ea053482960472db560aaedcc7665e6dabb4b4012333f3e068b","clause":"A.4.4.1; A.4.4.2","printedPages":[88],"pdfPages":[88]},{"documentId":"r76-1","standard":"OIML R 76-1","edition":"2006","documentSha256":"06d9674f4f557ea053482960472db560aaedcc7665e6dabb4b4012333f3e068b","clause":"3.5.1; 3.10.1","printedPages":[30,36],"pdfPages":[30,36],"tableOrForm":"Table 6"},{"documentId":"r76-1","standard":"OIML R 76-1","edition":"2006","documentSha256":"06d9674f4f557ea053482960472db560aaedcc7665e6dabb4b4012333f3e068b","clause":"3.5.3.2; A.4.4.3","printedPages":[30,88,89],"pdfPages":[30,88,89]},{"documentId":"r76-2","standard":"OIML R 76-2","edition":"2007","documentSha256":"650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820","clause":"Explanatory notes; 1","printedPages":[5,10],"pdfPages":[5,10]},{"documentId":"r76-2","standard":"OIML R 76-2","edition":"2007","documentSha256":"650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820","clause":"1","printedPages":[10],"pdfPages":[10],"tableOrForm":"Form 1"}]},{"id":"r76-2006-2007-demo-classiii-plan-v1:ECCENTRICITY_WEIGHTS:1","rule_set_id":"r76-2006-2007-demo-classiii-plan-v1","code":"ECCENTRICITY_WEIGHTS","version":"1","name":"Eccentricity using weights, ordinary receptor","implementation_status":"NOT_IMPLEMENTED","input_schema":{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"type":{"type":"string","const":"ECCENTRICITY_WEIGHTS"},"sketchAttachmentId":{"type":"string","minLength":1},"displayPositionDescription":{"type":"string","minLength":1},"zeroReferences":{"type":"array","items":{"type":"object","properties":{"rowKey":{"type":"string","minLength":1},"loadG":{"type":"string","maxLength":60,"pattern":"^-?\\d+(?:\\.\\d+)?$"},"indicationG":{"type":"string","maxLength":60,"pattern":"^-?\\d+(?:\\.\\d+)?$"},"additionalLoadG":{"type":"string","maxLength":60,"pattern":"^-?\\d+(?:\\.\\d+)?$"},"changeoverConfirmed":{"type":"boolean"},"observedAt":{"type":"string","format":"date-time","pattern":"^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$"},"zeroReferenceId":{"type":"string","minLength":1}},"required":["rowKey","loadG","indicationG","additionalLoadG","changeoverConfirmed","observedAt","zeroReferenceId"],"additionalProperties":false}},"rows":{"type":"array","items":{"type":"object","properties":{"rowKey":{"type":"string","minLength":1},"loadG":{"type":"string","maxLength":60,"pattern":"^-?\\d+(?:\\.\\d+)?$"},"indicationG":{"type":"string","maxLength":60,"pattern":"^-?\\d+(?:\\.\\d+)?$"},"additionalLoadG":{"type":"string","maxLength":60,"pattern":"^-?\\d+(?:\\.\\d+)?$"},"changeoverConfirmed":{"type":"boolean"},"observedAt":{"type":"string","format":"date-time","pattern":"^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$"},"segment":{"anyOf":[{"type":"number","const":1},{"type":"number","const":2},{"type":"number","const":3},{"type":"number","const":4}]},"zeroReferenceId":{"type":"string","minLength":1}},"required":["rowKey","loadG","indicationG","additionalLoadG","changeoverConfirmed","observedAt","segment","zeroReferenceId"],"additionalProperties":false}}},"required":["type","sketchAttachmentId","displayPositionDescription","zeroReferences","rows"],"additionalProperties":false},"references_json":[{"documentId":"r76-1","standard":"OIML R 76-1","edition":"2006","documentSha256":"06d9674f4f557ea053482960472db560aaedcc7665e6dabb4b4012333f3e068b","clause":"3.6.2; 3.6.2.1","printedPages":[31],"pdfPages":[31]},{"documentId":"r76-1","standard":"OIML R 76-1","edition":"2006","documentSha256":"06d9674f4f557ea053482960472db560aaedcc7665e6dabb4b4012333f3e068b","clause":"A.4.7; A.4.7.1","printedPages":[90,91],"pdfPages":[90,91]},{"documentId":"r76-2","standard":"OIML R 76-2","edition":"2007","documentSha256":"650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820","clause":"3.1","printedPages":[12],"pdfPages":[12]}]},{"id":"r76-2006-2007-demo-classiii-plan-v1:REPEATABILITY_TYPE:1","rule_set_id":"r76-2006-2007-demo-classiii-plan-v1","code":"REPEATABILITY_TYPE","version":"1","name":"Type-evaluation repeatability","implementation_status":"NOT_IMPLEMENTED","input_schema":{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"type":{"type":"string","const":"REPEATABILITY_TYPE"},"series":{"type":"array","items":{"type":"object","properties":{"designation":{"type":"string","enum":["ABOUT_HALF_MAX","CLOSE_TO_MAX"]},"loadG":{"type":"string","maxLength":60,"pattern":"^-?\\d+(?:\\.\\d+)?$"},"loadSelectionReason":{"type":"string","minLength":1},"rows":{"type":"array","items":{"type":"object","properties":{"rowKey":{"type":"string","minLength":1},"loadG":{"type":"string","maxLength":60,"pattern":"^-?\\d+(?:\\.\\d+)?$"},"indicationG":{"type":"string","maxLength":60,"pattern":"^-?\\d+(?:\\.\\d+)?$"},"additionalLoadG":{"type":"string","maxLength":60,"pattern":"^-?\\d+(?:\\.\\d+)?$"},"changeoverConfirmed":{"type":"boolean"},"observedAt":{"type":"string","format":"date-time","pattern":"^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$"},"unloadedIndicationG":{"type":"string","maxLength":60,"pattern":"^-?\\d+(?:\\.\\d+)?$"},"zeroResetPerformed":{"type":"boolean"}},"required":["rowKey","loadG","indicationG","additionalLoadG","changeoverConfirmed","observedAt","unloadedIndicationG","zeroResetPerformed"],"additionalProperties":false}}},"required":["designation","loadG","loadSelectionReason","rows"],"additionalProperties":false}}},"required":["type","series"],"additionalProperties":false},"references_json":[{"documentId":"r76-1","standard":"OIML R 76-1","edition":"2006","documentSha256":"06d9674f4f557ea053482960472db560aaedcc7665e6dabb4b4012333f3e068b","clause":"A.4.10","printedPages":[93],"pdfPages":[93]},{"documentId":"r76-2","standard":"OIML R 76-2","edition":"2007","documentSha256":"650b8ea9b1001499574f585f0eab0a097ba290118da312b6a05a17bc856a3820","clause":"5","printedPages":[16],"pdfPages":[16]}]}]$definitions$::jsonb) as item(value) loop
    insert into public.test_definitions(id,rule_set_id,code,version,name,implementation_status,input_schema,references_json)
    values(v_expected->>'id',v_expected->>'rule_set_id',v_expected->>'code',v_expected->>'version',v_expected->>'name','NOT_IMPLEMENTED',v_expected->'input_schema',v_expected->'references_json') on conflict do nothing;
    select to_jsonb(d) - 'created_at' into v_actual from public.test_definitions as d where d.id=v_expected->>'id';
    if v_actual is distinct from v_expected then raise exception using errcode='22000',message='REFERENCE_VERSION_CONFLICT'; end if;
  end loop;
end;
$seed$;

create function public.command_create_plan(
  p_actor_id uuid,
  p_evaluation_id uuid,
  p_expected_row_version bigint,
  p_specification_id uuid,
  p_plan jsonb
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $command$
declare
  v_evaluation public.evaluations%rowtype;
  v_actor public.profiles%rowtype;
  v_specification public.specification_revisions%rowtype;
  v_plan public.test_plans%rowtype;
  v_rule_set_id constant text := 'r76-2006-2007-demo-classiii-plan-v1';
  v_rule_set_version constant text := 'selected-demo-plan-1';
  v_manifest jsonb;
  v_specifications jsonb;
  v_item jsonb;
  v_definition jsonb;
  v_position integer;
  v_version integer;
begin
  -- Evaluation lock serializes revisions, plans and duplicate/stale requests.
  select e.* into v_evaluation from public.evaluations as e
    where e.id = p_evaluation_id for update;
  if not found then
    raise exception using errcode='42501',message='PERMISSION_DENIED';
  end if;
  select a.* into v_actor from public.profiles as a
    where a.id = p_actor_id for share;
  if not found or v_actor.active is distinct from true
    or v_actor.role is distinct from 'TESTER'::public.lab_role
    or v_actor.laboratory_id is distinct from v_evaluation.laboratory_id
    or v_actor.id is distinct from v_evaluation.assigned_tester_id then
    raise exception using errcode='42501',message='PERMISSION_DENIED';
  end if;
  if p_expected_row_version is null or p_expected_row_version < 0
    or v_evaluation.row_version is distinct from p_expected_row_version
    or p_specification_id is null
    or v_evaluation.current_specification_id is distinct from p_specification_id then
    raise exception using errcode='40001',message='STALE_DATA';
  end if;
  if v_evaluation.state is distinct from 'DRAFT'::public.evaluation_state then
    raise exception using errcode='55000',message='PLAN_STATE_LOCKED';
  end if;
  if v_evaluation.current_plan_id is not null then
    raise exception using errcode='55000',message='PLAN_ALREADY_EXISTS';
  end if;
  select s.* into v_specification from public.specification_revisions as s
    where s.id = p_specification_id and s.evaluation_id = v_evaluation.id
      and s.laboratory_id = v_actor.laboratory_id;
  if not found then
    raise exception using errcode='42501',message='PERMISSION_DENIED';
  end if;
  select r.manifest into v_manifest from public.rule_sets as r
    where r.id = v_rule_set_id and r.version = v_rule_set_version;
  if not found then
    raise exception using errcode='55000',message='REFERENCE_DATA_MISSING';
  end if;

  -- Compare the calculation inputs with the current immutable revision, including
  -- explicit JSON feature types. No fallback false/zero values are manufactured.
  v_specifications := jsonb_build_object(
    'accuracyClass',v_specification.accuracy_class,
    'maxG',v_specification.max_g::text,'minG',v_specification.min_g::text,
    'eG',v_specification.e_g::text,'dG',v_specification.d_g::text,
    'rangeType',v_specification.features->'rangeType',
    'category',v_specification.features->'category',
    'indication',v_specification.features->'indication',
    'auxiliaryIndication',v_specification.features->'auxiliaryIndication',
    'extendedIndicationUsed',v_specification.features->'extendedIndicationUsed',
    'isGradingInstrument',v_specification.features->'isGradingInstrument',
    'receptor',v_specification.features->'receptor',
    'supportPoints',v_specification.features->'supportPoints',
    'maximumAdditiveTareG',v_specification.features->'maximumAdditiveTareG',
    'initialZeroSettingRangePercent',v_specification.features->'initialZeroSettingRangePercent',
    'automaticZeroSettingExists',v_specification.features->'automaticZeroSettingExists',
    'zeroTrackingExists',v_specification.features->'zeroTrackingExists',
    'declaredTemperatureMinC',v_specification.features->'declaredTemperatureMinC',
    'declaredTemperatureMaxC',v_specification.features->'declaredTemperatureMaxC'
  );
  if jsonb_typeof(p_plan) is distinct from 'object'
    or p_plan->>'schemaVersion' is distinct from '1'
    or p_plan->>'plannerVersion' is distinct from '1'
    or p_plan->>'ruleSetId' is distinct from v_rule_set_id
    or p_plan->>'ruleSetVersion' is distinct from v_rule_set_version
    or p_plan->>'scope' is distinct from 'DEMO_SELECTED_ONLY'
    or p_plan->>'overallConformity' is distinct from 'NOT_DETERMINED'
    or p_plan->>'specificationRevisionId' is distinct from p_specification_id::text
    or p_plan->'specificationVersion' is distinct from to_jsonb(v_specification.version_no)
    or p_plan->'specifications' is distinct from v_specifications
    or p_plan->'coverage' is distinct from v_manifest->'coverage'
    or p_plan->'manualPreconditions' is distinct from v_manifest->'manualPreconditions'
    or jsonb_typeof(p_plan->'items') is distinct from 'array'
    or jsonb_typeof(p_plan->'traces') is distinct from 'array'
    or jsonb_typeof(p_plan->'references') is distinct from 'array' then
    raise exception using errcode='22023',message='INVALID_PLAN';
  end if;
  if jsonb_array_length(p_plan->'items') <> 3
    or jsonb_array_length(p_plan->'traces') = 0
    or jsonb_array_length(p_plan->'references') = 0 then
    raise exception using errcode='22023',message='INVALID_PLAN';
  end if;

  -- The reviewed pure server generator owns loads. This command accepts no
  -- browser loads, evaluator outcome, lab or rule-set selection. Pin metadata
  -- and FK targets to this version before any data writes.
  for v_item, v_position in
    select entry.value, entry.ordinality::integer
    from jsonb_array_elements(p_plan->'items') with ordinality as entry(value,ordinality)
  loop
    v_definition := v_manifest->'definitions'->(v_position - 1);
    if v_item->'definition' is distinct from v_definition
      or jsonb_typeof(v_item->'configuration') is distinct from 'object'
      or v_item->'configuration'->>'code' is distinct from v_definition->>'code' then
      raise exception using errcode='22023',message='INVALID_PLAN';
    end if;
    if not exists(select 1 from public.test_definitions as d
      where d.id=v_definition->>'id' and d.rule_set_id=v_rule_set_id
        and d.code=v_definition->>'code' and d.version=v_definition->>'version'
        and d.implementation_status='NOT_IMPLEMENTED'
        and d.references_json=v_definition->'references') then
      raise exception using errcode='55000',message='REFERENCE_DATA_MISSING';
    end if;
  end loop;

  perform set_config('app.actor_id',p_actor_id::text,true);
  select coalesce(max(p.version_no),0)+1 into v_version
    from public.test_plans as p where p.evaluation_id=v_evaluation.id;
  insert into public.test_plans as new_plan
    (laboratory_id,evaluation_id,specification_id,rule_set_id,version_no,scope,plan_snapshot,created_by)
  values(v_actor.laboratory_id,v_evaluation.id,p_specification_id,v_rule_set_id,v_version,'DEMO_SELECTED_ONLY',p_plan,v_actor.id)
  returning new_plan.* into v_plan;

  for v_item, v_position in
    select entry.value, entry.ordinality::integer
    from jsonb_array_elements(p_plan->'items') with ordinality as entry(value,ordinality)
  loop
    insert into public.test_plan_items
      (laboratory_id,evaluation_id,plan_id,definition_id,rule_set_id,position,coverage,coverage_reason,configuration)
    values(v_actor.laboratory_id,v_evaluation.id,v_plan.id,v_item->'definition'->>'id',v_rule_set_id,v_position,
      'REQUIRED','Selected-demo procedure only; evaluator not implemented; overall conformity not determined.',v_item->'configuration');
  end loop;
  update public.evaluations as e
    set current_plan_id=v_plan.id,state='PLANNED'::public.evaluation_state,
        row_version=e.row_version+1,overall_conformity='NOT_DETERMINED'
    where e.id=v_evaluation.id;
  insert into public.audit_logs(laboratory_id,evaluation_id,actor_id,actor_kind,action,entity_type,entity_id,metadata)
    values(v_actor.laboratory_id,v_evaluation.id,v_actor.id,'USER','plan.created','test_plan',v_plan.id::text,
      jsonb_build_object('specification_id',p_specification_id,'rule_set_id',v_rule_set_id,'version_no',v_version,'previous_row_version',v_evaluation.row_version));
  return jsonb_build_object('id',v_plan.id,'evaluationId',v_evaluation.id,'versionNo',v_version,
    'createdAt',v_plan.created_at,'createdBy',v_plan.created_by,'plan',v_plan.plan_snapshot,
    'rowVersion',(v_evaluation.row_version+1)::text);
end;
$command$;

revoke all on function public.command_create_plan(uuid,uuid,bigint,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.command_create_plan(uuid,uuid,bigint,uuid,jsonb) to service_role;

commit;

-- Selected-demo observation, review, evidence and report commands.
-- All browser roles remain read-only; mutation is through these named server commands.
begin;

create function private.require_active_actor(p_actor_id uuid, p_evaluation_id uuid, p_role public.lab_role)
returns public.evaluations language plpgsql security definer set search_path = '' as $$
declare v_evaluation public.evaluations; v_profile public.profiles;
begin
  select e.* into v_evaluation from public.evaluations e where e.id=p_evaluation_id for update;
  if not found then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
  select p.* into v_profile from public.profiles p where p.id=p_actor_id and p.active and p.laboratory_id=v_evaluation.laboratory_id;
  if not found or v_profile.role is distinct from p_role then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
  if p_role='TESTER' and v_evaluation.assigned_tester_id is distinct from p_actor_id then raise exception using errcode='42501',message='ASSIGNMENT_REQUIRED'; end if;
  if p_role='APPROVER' and v_evaluation.assigned_tester_id=p_actor_id then raise exception using errcode='42501',message='INDEPENDENT_REVIEW_REQUIRED'; end if;
  return v_evaluation;
end $$;
revoke all on function private.require_active_actor(uuid,uuid,public.lab_role) from public,anon,authenticated;

create or replace function public.command_save_observations(
  p_actor_id uuid,p_evaluation_id uuid,p_plan_item_id uuid,p_session_id uuid,
  p_expected_evaluation_version bigint,p_expected_session_version bigint,
  p_observations jsonb,p_conditions jsonb,p_equipment jsonb,p_procedure_confirmations jsonb,p_remarks text
) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_e public.evaluations; v_item public.test_plan_items; v_s public.test_sessions; v_session_id uuid; v_attempt integer; v_code text;
begin
  v_e:=private.require_active_actor(p_actor_id,p_evaluation_id,'TESTER');
  if v_e.row_version<>p_expected_evaluation_version then raise exception using errcode='40001',message='STALE_DATA'; end if;
  if v_e.state not in ('PLANNED','TESTING','CORRECTION_REQUESTED') then raise exception using errcode='55000',message='INVALID_STATE'; end if;
  select i,d.code into v_item,v_code from public.test_plan_items i join public.test_definitions d on d.id=i.definition_id and d.rule_set_id=i.rule_set_id
    where i.id=p_plan_item_id and i.evaluation_id=v_e.id and i.laboratory_id=v_e.laboratory_id and i.plan_id=v_e.current_plan_id;
  if not found or p_observations->>'type' is distinct from v_code then raise exception using errcode='22023',message='VALIDATION_ERROR'; end if;
  if jsonb_typeof(p_observations)<>'object' or jsonb_typeof(p_conditions)<>'object' or jsonb_typeof(p_equipment)<>'array' or jsonb_typeof(p_procedure_confirmations)<>'object' then raise exception using errcode='22023',message='VALIDATION_ERROR'; end if;
  perform set_config('app.actor_id',p_actor_id::text,true);
  if p_session_id is null then
    if exists(select 1 from public.test_sessions s where s.plan_item_id=v_item.id) then raise exception using errcode='55000',message='RETEST_REQUIRED'; end if;
    v_session_id:=gen_random_uuid(); v_attempt:=1;
    insert into public.test_sessions(id,laboratory_id,evaluation_id,plan_item_id,attempt_no,state,row_version,observation_schema_version,conditions,equipment_snapshot,procedure_confirmations,performed_at,observer_id,remarks)
    values(v_session_id,v_e.laboratory_id,v_e.id,v_item.id,v_attempt,'DRAFT',1,'1',p_conditions,p_equipment,p_procedure_confirmations,now(),p_actor_id,nullif(btrim(p_remarks),''));
  else
    select s.* into v_s from public.test_sessions s where s.id=p_session_id and s.evaluation_id=v_e.id and s.plan_item_id=v_item.id for update;
    if not found then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
    if v_s.state<>'DRAFT' then raise exception using errcode='55000',message='COMPLETED_ATTEMPT_IMMUTABLE'; end if;
    if v_s.row_version<>p_expected_session_version then raise exception using errcode='40001',message='STALE_DATA'; end if;
    v_session_id:=v_s.id; v_attempt:=v_s.attempt_no;
    update public.test_sessions s set conditions=p_conditions,equipment_snapshot=p_equipment,procedure_confirmations=p_procedure_confirmations,
      performed_at=now(),remarks=nullif(btrim(p_remarks),''),row_version=s.row_version+1 where s.id=v_s.id;
  end if;
  insert into public.test_observations(laboratory_id,evaluation_id,session_id,row_key,sequence_no,row_version,payload)
    values(v_e.laboratory_id,v_e.id,v_session_id,'observations',1,1,p_observations)
    on conflict(session_id,row_key) do update set payload=excluded.payload,row_version=public.test_observations.row_version+1;
  update public.evaluations e set state='TESTING',row_version=e.row_version+1 where e.id=v_e.id;
  select s.* into v_s from public.test_sessions s where s.id=v_session_id;
  insert into public.audit_logs(laboratory_id,evaluation_id,actor_id,actor_kind,action,entity_type,entity_id,metadata)
    values(v_e.laboratory_id,v_e.id,p_actor_id,'USER','OBSERVATIONS_SAVED','test_sessions',v_session_id::text,jsonb_build_object('attemptNo',v_attempt,'testCode',v_code));
  return jsonb_build_object('sessionId',v_session_id,'sessionVersion',v_s.row_version,'evaluationVersion',v_e.row_version+1);
end $$;

create or replace function public.command_start_retest(p_actor_id uuid,p_evaluation_id uuid,p_plan_item_id uuid,p_expected_evaluation_version bigint,p_reason text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_e public.evaluations; v_item public.test_plan_items; v_previous public.test_sessions; v_id uuid:=gen_random_uuid(); v_attempt integer;
begin
  v_e:=private.require_active_actor(p_actor_id,p_evaluation_id,'TESTER');
  if v_e.row_version<>p_expected_evaluation_version then raise exception using errcode='40001',message='STALE_DATA'; end if;
  if v_e.state not in ('TESTING','CORRECTION_REQUESTED') or nullif(btrim(p_reason),'') is null then raise exception using errcode='55000',message='INVALID_STATE'; end if;
  select i.* into v_item from public.test_plan_items i where i.id=p_plan_item_id and i.evaluation_id=v_e.id and i.plan_id=v_e.current_plan_id;
  if not found then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
  select s.* into v_previous from public.test_sessions s where s.plan_item_id=v_item.id order by s.attempt_no desc limit 1 for update;
  if not found or v_previous.state<>'COMPLETED' then raise exception using errcode='55000',message='RETEST_REQUIRES_COMPLETED_ATTEMPT'; end if;
  v_attempt:=v_previous.attempt_no+1; perform set_config('app.actor_id',p_actor_id::text,true);
  insert into public.test_sessions(id,laboratory_id,evaluation_id,plan_item_id,attempt_no,state,row_version,observation_schema_version,conditions,equipment_snapshot,procedure_confirmations,performed_at,observer_id,retest_reason)
  values(v_id,v_e.laboratory_id,v_e.id,v_item.id,v_attempt,'DRAFT',0,'1','{}','[]','{}',now(),p_actor_id,btrim(p_reason));
  update public.evaluations e set state='TESTING',row_version=e.row_version+1 where e.id=v_e.id;
  insert into public.audit_logs(laboratory_id,evaluation_id,actor_id,actor_kind,action,entity_type,entity_id,metadata)
  values(v_e.laboratory_id,v_e.id,p_actor_id,'USER','RETEST_STARTED','test_sessions',v_id::text,jsonb_build_object('attemptNo',v_attempt,'reason',btrim(p_reason)));
  return jsonb_build_object('sessionId',v_id,'attemptNo',v_attempt,'evaluationVersion',v_e.row_version+1);
end $$;

create or replace function public.command_record_result(
  p_actor_id uuid,p_evaluation_id uuid,p_session_id uuid,p_expected_evaluation_version bigint,p_expected_session_version bigint,
  p_input_snapshot jsonb,p_input_sha256 text,p_engine_version text,p_outcome public.result_outcome,p_evaluation jsonb
) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_e public.evaluations; v_s public.test_sessions; v_i public.test_plan_items; v_p public.test_plans; v_spec public.specification_revisions; v_obs jsonb; v_current jsonb; v_id uuid;
begin
  v_e:=private.require_active_actor(p_actor_id,p_evaluation_id,'TESTER');
  if v_e.row_version<>p_expected_evaluation_version then raise exception using errcode='40001',message='STALE_DATA'; end if;
  select s.* into v_s from public.test_sessions s where s.id=p_session_id and s.evaluation_id=v_e.id for update;
  if not found or v_s.state<>'DRAFT' or v_s.row_version<>p_expected_session_version then raise exception using errcode='40001',message='STALE_DATA'; end if;
  select i.* into v_i from public.test_plan_items i where i.id=v_s.plan_item_id and i.plan_id=v_e.current_plan_id;
  select p.* into v_p from public.test_plans p where p.id=v_e.current_plan_id and p.specification_id=v_e.current_specification_id;
  select s.* into v_spec from public.specification_revisions s where s.id=v_e.current_specification_id;
  select o.payload into v_obs from public.test_observations o where o.session_id=v_s.id and o.row_key='observations';
  v_current:=jsonb_build_object('specification',jsonb_build_object('id',v_spec.id,'version_no',v_spec.version_no,'accuracy_class',v_spec.accuracy_class,'max_g',v_spec.max_g::text,'min_g',v_spec.min_g::text,'e_g',v_spec.e_g::text,'d_g',v_spec.d_g::text,'features',v_spec.features),'configuration',v_i.configuration,
    'observations',v_obs,'conditions',v_s.conditions,'equipment',v_s.equipment_snapshot,'procedureConfirmations',v_s.procedure_confirmations,
    'sessionVersion',v_s.row_version,'planId',v_p.id,'ruleSetId',v_p.rule_set_id);
  if v_current is distinct from p_input_snapshot or p_evaluation->>'inputSha256' is distinct from p_input_sha256
    or p_evaluation->>'sessionId' is distinct from v_s.id::text or (p_evaluation->>'sessionVersion')::bigint is distinct from v_s.row_version
    or p_evaluation->>'outcome' is distinct from p_outcome::text or p_input_sha256 !~ '^[a-f0-9]{64}$' then
    raise exception using errcode='40001',message='STALE_DATA';
  end if;
  if p_outcome in ('NOT_SUPPORTED','NOT_VERIFIED') then raise exception using errcode='22023',message='UNSUPPORTED_RESULT_NOT_PERSISTED'; end if;
  perform set_config('app.actor_id',p_actor_id::text,true);
  insert into public.test_results(laboratory_id,evaluation_id,session_id,session_version,rule_set_id,engine_version,input_sha256,outcome,evaluation_json)
    values(v_e.laboratory_id,v_e.id,v_s.id,v_s.row_version,v_p.rule_set_id,p_engine_version,p_input_sha256,p_outcome,p_evaluation)
    on conflict(session_id,session_version,engine_version) do nothing returning id into v_id;
  if v_id is null then select r.id into v_id from public.test_results r where r.session_id=v_s.id and r.session_version=v_s.row_version and r.engine_version=p_engine_version and r.input_sha256=p_input_sha256; end if;
  if v_id is null then raise exception using errcode='23505',message='RESULT_CONFLICT'; end if;
  insert into public.audit_logs(laboratory_id,evaluation_id,actor_id,actor_kind,action,entity_type,entity_id,metadata)
  values(v_e.laboratory_id,v_e.id,p_actor_id,'USER','RESULT_CALCULATED','test_results',v_id::text,jsonb_build_object('outcome',p_outcome,'inputSha256',p_input_sha256));
  return jsonb_build_object('sessionId',v_s.id,'sessionVersion',v_s.row_version,'evaluation',p_evaluation,'version',v_s.row_version);
end $$;

create or replace function public.command_complete_test(p_actor_id uuid,p_evaluation_id uuid,p_session_id uuid,p_expected_evaluation_version bigint,p_expected_session_version bigint)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_e public.evaluations; v_s public.test_sessions; v_result public.test_results;
begin
  v_e:=private.require_active_actor(p_actor_id,p_evaluation_id,'TESTER');
  if v_e.row_version<>p_expected_evaluation_version or v_e.state<>'TESTING' then raise exception using errcode='40001',message='STALE_DATA'; end if;
  select s.* into v_s from public.test_sessions s where s.id=p_session_id and s.evaluation_id=v_e.id for update;
  if not found or v_s.state<>'DRAFT' or v_s.row_version<>p_expected_session_version then raise exception using errcode='40001',message='STALE_DATA'; end if;
  select r.* into v_result from public.test_results r where r.session_id=v_s.id and r.session_version=v_s.row_version and r.outcome in ('PASS','FAIL') order by r.evaluated_at desc limit 1;
  if not found then raise exception using errcode='55000',message='CURRENT_PASS_OR_FAIL_RESULT_REQUIRED'; end if;
  perform set_config('app.actor_id',p_actor_id::text,true);
  update public.test_sessions s set state='COMPLETED',completed_at=now(),row_version=s.row_version+1 where s.id=v_s.id;
  update public.evaluations e set row_version=e.row_version+1 where e.id=v_e.id;
  insert into public.audit_logs(laboratory_id,evaluation_id,actor_id,actor_kind,action,entity_type,entity_id,metadata)
  values(v_e.laboratory_id,v_e.id,p_actor_id,'USER','TEST_COMPLETED','test_sessions',v_s.id::text,jsonb_build_object('outcome',v_result.outcome));
  return jsonb_build_object('sessionId',v_s.id,'outcome',v_result.outcome,'evaluationVersion',v_e.row_version+1,'version',v_s.row_version+1);
end $$;

create or replace function public.command_mark_ready(p_actor_id uuid,p_evaluation_id uuid,p_expected_evaluation_version bigint)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_e public.evaluations; v_required integer; v_complete integer;
begin
  v_e:=private.require_active_actor(p_actor_id,p_evaluation_id,'TESTER');
  if v_e.row_version<>p_expected_evaluation_version or v_e.state<>'TESTING' then raise exception using errcode='40001',message='STALE_DATA'; end if;
  select count(*) into v_required from public.test_plan_items i where i.plan_id=v_e.current_plan_id and i.coverage='REQUIRED';
  select count(*) into v_complete from public.test_plan_items i where i.plan_id=v_e.current_plan_id and i.coverage='REQUIRED' and exists(
    select 1 from public.test_sessions s where s.plan_item_id=i.id and s.state='COMPLETED' and s.attempt_no=(select max(x.attempt_no) from public.test_sessions x where x.plan_item_id=i.id)
      and exists(select 1 from public.test_results r where r.session_id=s.id and r.session_version=s.row_version-1 and r.outcome in ('PASS','FAIL')));
  if v_required<>3 or v_complete<>v_required then raise exception using errcode='55000',message='SELECTED_TESTS_INCOMPLETE'; end if;
  perform set_config('app.actor_id',p_actor_id::text,true);
  update public.evaluations e set state='READY_FOR_REVIEW',overall_conformity='NOT_DETERMINED',row_version=e.row_version+1 where e.id=v_e.id;
  insert into public.audit_logs(laboratory_id,evaluation_id,actor_id,actor_kind,action,entity_type,entity_id)
  values(v_e.laboratory_id,v_e.id,p_actor_id,'USER','SELECTED_TESTS_READY','evaluations',v_e.id::text);
  return jsonb_build_object('evaluationId',v_e.id,'state','READY_FOR_REVIEW','evaluationVersion',v_e.row_version+1,'version',v_e.row_version+1);
end $$;

create or replace function public.command_submit(p_actor_id uuid,p_evaluation_id uuid,p_expected_evaluation_version bigint,p_snapshot jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_e public.evaluations; v_report public.reports; v_version integer; v_id uuid:=gen_random_uuid(); v_hash text; v_rule_set text;
begin
  v_e:=private.require_active_actor(p_actor_id,p_evaluation_id,'TESTER');
  if v_e.row_version<>p_expected_evaluation_version or v_e.state<>'READY_FOR_REVIEW' then raise exception using errcode='40001',message='STALE_DATA'; end if;
  if p_snapshot->>'evaluationId' is distinct from v_e.id::text or p_snapshot->>'kind' is distinct from 'SUBMITTED' or p_snapshot->>'overallConformity' is distinct from 'NOT_DETERMINED' then raise exception using errcode='22023',message='INVALID_SNAPSHOT'; end if;
  if exists(select 1 from public.attachments a where a.evaluation_id=v_e.id and a.state='PENDING') then raise exception using errcode='55000',message='PENDING_EVIDENCE'; end if;
  perform set_config('app.actor_id',p_actor_id::text,true);
  select r.* into v_report from public.reports r where r.evaluation_id=v_e.id for update;
  if not found then
    insert into public.reports(laboratory_id,evaluation_id,report_number) values(v_e.laboratory_id,v_e.id,'NAWI-'||to_char(current_date,'YYYY')||'-'||upper(substr(replace(v_e.id::text,'-',''),1,10))) returning * into v_report;
  end if;
  select coalesce(max(rv.version_no),0)+1 into v_version from public.report_versions rv where rv.report_id=v_report.id;
  p_snapshot:=jsonb_set(jsonb_set(p_snapshot,'{reportId}',to_jsonb(v_report.id::text)),'{reportNumber}',to_jsonb(v_report.report_number));
  p_snapshot:=jsonb_set(p_snapshot,'{versionNo}',to_jsonb(v_version));
  v_hash:=encode(extensions.digest(convert_to(p_snapshot::text,'utf8'),'sha256'),'hex');
  select p.rule_set_id into strict v_rule_set from public.test_plans p where p.id=v_e.current_plan_id;
  insert into public.report_versions(id,laboratory_id,evaluation_id,report_id,version_no,kind,snapshot_schema_version,snapshot,snapshot_sha256,rule_set_id,created_by)
  values(v_id,v_e.laboratory_id,v_e.id,v_report.id,v_version,'SUBMITTED','1',p_snapshot,v_hash,v_rule_set,p_actor_id);
  update public.evaluations e set current_submission_id=v_id,state='UNDER_REVIEW',row_version=e.row_version+1 where e.id=v_e.id;
  insert into public.audit_logs(laboratory_id,evaluation_id,actor_id,actor_kind,action,entity_type,entity_id,metadata)
  values(v_e.laboratory_id,v_e.id,p_actor_id,'USER','REPORT_SUBMITTED','report_versions',v_id::text,jsonb_build_object('versionNo',v_version,'snapshotSha256',v_hash));
  return jsonb_build_object('submissionId',v_id,'reportId',v_report.id,'reportNumber',v_report.report_number,'versionNo',v_version,'snapshotSha256',v_hash,'state','UNDER_REVIEW','evaluationVersion',v_e.row_version+1,'version',v_e.row_version+1);
end $$;

create or replace function public.command_review(p_actor_id uuid,p_evaluation_id uuid,p_expected_evaluation_version bigint,p_submission_id uuid,p_submission_sha256 text,p_decision public.review_decision,p_comment text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_e public.evaluations; v_submission public.report_versions; v_event uuid:=gen_random_uuid(); v_state public.evaluation_state; v_has_fail boolean;
begin
  v_e:=private.require_active_actor(p_actor_id,p_evaluation_id,'APPROVER');
  if v_e.row_version<>p_expected_evaluation_version or v_e.state<>'UNDER_REVIEW' or v_e.current_submission_id is distinct from p_submission_id then raise exception using errcode='40001',message='STALE_DATA'; end if;
  select rv.* into v_submission from public.report_versions rv where rv.id=p_submission_id and rv.evaluation_id=v_e.id and rv.kind='SUBMITTED';
  if not found or v_submission.snapshot_sha256 is distinct from p_submission_sha256 then raise exception using errcode='40001',message='STALE_DATA'; end if;
  v_has_fail:=jsonb_path_exists(v_submission.snapshot,'$.testData[*].evaluation ? (@.outcome == "FAIL")');
  if (p_decision<>'APPROVE' or v_has_fail) and nullif(btrim(p_comment),'') is null then raise exception using errcode='22023',message='COMMENT_REQUIRED'; end if;
  v_state:=case p_decision when 'APPROVE' then 'APPROVED'::public.evaluation_state when 'REJECT' then 'REJECTED'::public.evaluation_state else 'CORRECTION_REQUESTED'::public.evaluation_state end;
  perform set_config('app.actor_id',p_actor_id::text,true);
  insert into public.approval_events(id,laboratory_id,evaluation_id,submission_version_id,decision,comment,actor_id)
  values(v_event,v_e.laboratory_id,v_e.id,v_submission.id,p_decision,nullif(btrim(p_comment),''),p_actor_id);
  update public.evaluations e set state=v_state,row_version=e.row_version+1 where e.id=v_e.id;
  insert into public.audit_logs(laboratory_id,evaluation_id,actor_id,actor_kind,action,entity_type,entity_id,metadata)
  values(v_e.laboratory_id,v_e.id,p_actor_id,'USER','REPORT_REVIEWED','approval_events',v_event::text,jsonb_build_object('decision',p_decision,'submissionSha256',p_submission_sha256));
  return jsonb_build_object('approvalEventId',v_event,'decision',p_decision,'state',v_state,'evaluationVersion',v_e.row_version+1,'version',v_e.row_version+1);
end $$;

create or replace function public.command_prepare_final(p_actor_id uuid,p_evaluation_id uuid,p_expected_evaluation_version bigint)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_e public.evaluations; v_submission public.report_versions; v_approval public.approval_events; v_profile public.profiles; v_final public.report_versions; v_artifact public.report_artifacts; v_artifact_id uuid:=gen_random_uuid(); v_version integer; v_generated timestamptz:=now(); v_snapshot jsonb; v_hash text;
begin
  v_e:=private.require_active_actor(p_actor_id,p_evaluation_id,'APPROVER');
  if v_e.row_version<>p_expected_evaluation_version or v_e.state<>'APPROVED' then raise exception using errcode='40001',message='STALE_DATA'; end if;
  select rv.* into v_submission from public.report_versions rv where rv.id=v_e.current_submission_id and rv.kind='SUBMITTED';
  select a.* into v_approval from public.approval_events a where a.submission_version_id=v_submission.id and a.decision='APPROVE';
  select p.* into v_profile from public.profiles p where p.id=v_approval.actor_id and p.active and p.laboratory_id=v_e.laboratory_id;
  if not found then raise exception using errcode='55000',message='APPROVAL_REQUIRED'; end if;
  select rv.* into v_final from public.report_versions rv where rv.derived_from_id=v_submission.id and rv.kind='FINAL';
  if found then
    select a.* into v_artifact from public.report_artifacts a where a.report_version_id=v_final.id and a.format='PDF';
    if v_artifact.state='FAILED' then perform set_config('app.actor_id',p_actor_id::text,true); update public.report_artifacts a set state='PENDING',last_error_code=null where a.id=v_artifact.id returning * into v_artifact; end if;
    return jsonb_build_object('reportVersionId',v_final.id,'artifactId',v_artifact.id,'storagePath',v_artifact.storage_path,'snapshot',v_final.snapshot,'snapshotSha256',v_final.snapshot_sha256,'artifactState',v_artifact.state,'evaluationVersion',v_e.row_version,'version',v_e.row_version);
  end if;
  select coalesce(max(rv.version_no),0)+1 into v_version from public.report_versions rv where rv.report_id=v_submission.report_id;
  v_snapshot:=jsonb_set(jsonb_set(jsonb_set(v_submission.snapshot,'{kind}','"FINAL"'::jsonb),'{versionNo}',to_jsonb(v_version)),'{generatedAt}',to_jsonb(v_generated::text));
  v_snapshot:=jsonb_set(v_snapshot,'{approval}',jsonb_build_object('actorId',v_approval.actor_id,'displayName',v_profile.display_name,'decidedAt',v_approval.created_at,'submissionVersionId',v_submission.id,'submissionSha256',v_submission.snapshot_sha256,'comment',v_approval.comment));
  v_hash:=encode(extensions.digest(convert_to(v_snapshot::text,'utf8'),'sha256'),'hex');
  perform set_config('app.actor_id',p_actor_id::text,true);
  insert into public.report_versions(laboratory_id,evaluation_id,report_id,version_no,kind,snapshot_schema_version,snapshot,snapshot_sha256,rule_set_id,derived_from_id,created_by)
  values(v_e.laboratory_id,v_e.id,v_submission.report_id,v_version,'FINAL','1',v_snapshot,v_hash,v_submission.rule_set_id,v_submission.id,p_actor_id) returning * into v_final;
  insert into public.report_artifacts(id,laboratory_id,evaluation_id,report_version_id,format,state,storage_path)
  values(v_artifact_id,v_e.laboratory_id,v_e.id,v_final.id,'PDF','PENDING',v_e.laboratory_id||'/'||v_e.id||'/'||v_final.id||'/'||v_artifact_id||'.pdf') returning * into v_artifact;
  return jsonb_build_object('reportVersionId',v_final.id,'artifactId',v_artifact.id,'storagePath',v_artifact.storage_path,'snapshot',v_snapshot,'snapshotSha256',v_hash,'artifactState','PENDING','evaluationVersion',v_e.row_version,'version',v_e.row_version);
end $$;

create or replace function public.command_finish_artifact(p_actor_id uuid,p_evaluation_id uuid,p_expected_evaluation_version bigint,p_artifact_id uuid,p_sha256 text,p_byte_length bigint)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_e public.evaluations; v_a public.report_artifacts;
begin
  v_e:=private.require_active_actor(p_actor_id,p_evaluation_id,'APPROVER');
  if v_e.row_version<>p_expected_evaluation_version or v_e.state<>'APPROVED' or p_sha256 !~ '^[a-f0-9]{64}$' or p_byte_length<=0 then raise exception using errcode='40001',message='STALE_DATA'; end if;
  select a.* into v_a from public.report_artifacts a where a.id=p_artifact_id and a.evaluation_id=v_e.id and a.state='PENDING' for update;
  if not found then raise exception using errcode='55000',message='ARTIFACT_RESERVATION_REQUIRED'; end if;
  perform set_config('app.actor_id',p_actor_id::text,true);
  update public.report_artifacts a set state='READY',sha256=p_sha256,byte_length=p_byte_length,last_error_code=null where a.id=v_a.id;
  update public.evaluations e set state='ISSUED',row_version=e.row_version+1 where e.id=v_e.id;
  insert into public.audit_logs(laboratory_id,evaluation_id,actor_id,actor_kind,action,entity_type,entity_id,metadata)
  values(v_e.laboratory_id,v_e.id,p_actor_id,'USER','REPORT_ISSUED','report_artifacts',v_a.id::text,jsonb_build_object('sha256',p_sha256,'byteLength',p_byte_length));
  return jsonb_build_object('artifactId',v_a.id,'state','READY','evaluationState','ISSUED','sha256',p_sha256,'byteLength',p_byte_length,'evaluationVersion',v_e.row_version+1,'version',v_e.row_version+1);
end $$;

create or replace function public.command_fail_artifact(p_actor_id uuid,p_evaluation_id uuid,p_artifact_id uuid,p_error_code text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_e public.evaluations; v_a public.report_artifacts;
begin
  v_e:=private.require_active_actor(p_actor_id,p_evaluation_id,'APPROVER');
  select a.* into v_a from public.report_artifacts a where a.id=p_artifact_id and a.evaluation_id=v_e.id and a.state='PENDING' for update;
  if not found or v_e.state<>'APPROVED' then raise exception using errcode='55000',message='ARTIFACT_RESERVATION_REQUIRED'; end if;
  perform set_config('app.actor_id',p_actor_id::text,true);
  update public.report_artifacts a set state='FAILED',last_error_code=left(coalesce(nullif(p_error_code,''),'PDF_GENERATION_FAILED'),80) where a.id=v_a.id;
  return jsonb_build_object('artifactId',v_a.id,'state','FAILED','evaluationState','APPROVED','version',v_e.row_version);
end $$;

create or replace function public.command_reserve_attachment(p_actor_id uuid,p_evaluation_id uuid,p_session_id uuid,p_original_name text,p_media_type text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_e public.evaluations; v_s public.test_sessions; v_id uuid:=gen_random_uuid(); v_safe text; v_path text;
begin
  v_e:=private.require_active_actor(p_actor_id,p_evaluation_id,'TESTER');
  select s.* into v_s from public.test_sessions s where s.id=p_session_id and s.evaluation_id=v_e.id and s.state='DRAFT';
  if not found or v_e.state not in ('TESTING','CORRECTION_REQUESTED') or p_media_type not in ('application/pdf','image/png','image/jpeg') then raise exception using errcode='22023',message='INVALID_ATTACHMENT'; end if;
  v_safe:=regexp_replace(left(coalesce(nullif(p_original_name,''),'evidence'),120),'[^A-Za-z0-9._-]','_','g');
  v_path:=v_e.laboratory_id||'/'||v_e.id||'/'||v_id||'/'||v_safe;
  perform set_config('app.actor_id',p_actor_id::text,true);
  insert into public.attachments(id,laboratory_id,evaluation_id,session_id,storage_path,original_name,media_type,state,uploaded_by)
  values(v_id,v_e.laboratory_id,v_e.id,v_s.id,v_path,v_safe,p_media_type,'PENDING',p_actor_id);
  return jsonb_build_object('attachmentId',v_id,'storagePath',v_path,'version',v_s.row_version);
end $$;

create or replace function public.command_finish_attachment(p_actor_id uuid,p_evaluation_id uuid,p_attachment_id uuid,p_sha256 text,p_byte_length bigint)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_e public.evaluations; v_a public.attachments;
begin
  v_e:=private.require_active_actor(p_actor_id,p_evaluation_id,'TESTER');
  select a.* into v_a from public.attachments a where a.id=p_attachment_id and a.evaluation_id=v_e.id and a.state='PENDING' for update;
  if not found or p_sha256 !~ '^[a-f0-9]{64}$' or p_byte_length<=0 or p_byte_length>2097152 then raise exception using errcode='22023',message='INVALID_ATTACHMENT'; end if;
  perform set_config('app.actor_id',p_actor_id::text,true);
  update public.attachments a set state='READY',sha256=p_sha256,byte_length=p_byte_length where a.id=v_a.id;
  return jsonb_build_object('attachmentId',v_a.id,'state','READY','sha256',p_sha256,'byteLength',p_byte_length,'version',v_e.row_version);
end $$;

create or replace function public.command_fail_attachment(p_actor_id uuid,p_evaluation_id uuid,p_attachment_id uuid,p_error_code text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_e public.evaluations; v_a public.attachments;
begin
  v_e:=private.require_active_actor(p_actor_id,p_evaluation_id,'TESTER');
  select a.* into v_a from public.attachments a where a.id=p_attachment_id and a.evaluation_id=v_e.id and a.state='PENDING' for update;
  if not found then raise exception using errcode='55000',message='ATTACHMENT_RESERVATION_REQUIRED'; end if;
  perform set_config('app.actor_id',p_actor_id::text,true);
  update public.attachments a set state='FAILED' where a.id=v_a.id;
  insert into public.audit_logs(laboratory_id,evaluation_id,actor_id,actor_kind,action,entity_type,entity_id,metadata)
  values(v_e.laboratory_id,v_e.id,p_actor_id,'USER','ATTACHMENT_FAILED','attachments',v_a.id::text,jsonb_build_object('errorCode',left(coalesce(p_error_code,'UPLOAD_FAILED'),80)));
  return jsonb_build_object('attachmentId',v_a.id,'state','FAILED','version',v_e.row_version);
end $$;

do $$ declare v_name text; v_signature text; begin
  foreach v_signature in array array[
    'public.command_save_observations(uuid,uuid,uuid,uuid,bigint,bigint,jsonb,jsonb,jsonb,jsonb,text)',
    'public.command_start_retest(uuid,uuid,uuid,bigint,text)',
    'public.command_record_result(uuid,uuid,uuid,bigint,bigint,jsonb,text,text,public.result_outcome,jsonb)',
    'public.command_complete_test(uuid,uuid,uuid,bigint,bigint)',
    'public.command_mark_ready(uuid,uuid,bigint)',
    'public.command_submit(uuid,uuid,bigint,jsonb)',
    'public.command_review(uuid,uuid,bigint,uuid,text,public.review_decision,text)',
    'public.command_prepare_final(uuid,uuid,bigint)',
    'public.command_finish_artifact(uuid,uuid,bigint,uuid,text,bigint)',
    'public.command_fail_artifact(uuid,uuid,uuid,text)',
    'public.command_reserve_attachment(uuid,uuid,uuid,text,text)',
    'public.command_finish_attachment(uuid,uuid,uuid,text,bigint)',
    'public.command_fail_attachment(uuid,uuid,uuid,text)'
  ] loop
    execute 'revoke all on function '||v_signature||' from public,anon,authenticated';
    execute 'grant execute on function '||v_signature||' to service_role';
  end loop;
end $$;

commit;
