import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { generateTestPlan, validateDemoScope } from "../../src/domain/oiml/plans/generate";
import { normalizeSpecification, PlanDecimal as D } from "../../src/domain/oiml/schemas/specifications";
import { selectedDefinitions, observationSchemas, coverageCatalogue, manualPreconditions, RULE_SET_ID, RULE_SET_VERSION } from "../../src/domain/oiml/definitions/selected";
import { z } from "zod";
import type { InstrumentSpecifications } from "../../src/contracts/domain";
import fixture from "../../fixtures/demo-observations.json";
import manifest from "../../docs/source-manifest.json";
import catalogue from "../../docs/test-catalogue.json";

// Independently transcribed from blueprint's explicit DEMO-30 list and verified A.4.4.1 / A.4.10 / 3.6.2.1.
const expectedDemoLoads = ["200","1000","2500","5000","5010","10000","15000","20000","20010","25000","30000"];
const spec: InstrumentSpecifications = {
  accuracyClass: "III", maxG: "30000", minG: "200", eG: "10", dG: "10", rangeType: "SINGLE_INTERVAL",
  category: "COMPLETE_INSTRUMENT", indication: "DIGITAL", auxiliaryIndication: false, extendedIndicationUsed: false,
  isGradingInstrument: false, receptor: "ORDINARY_PLATFORM", supportPoints: 1, maximumAdditiveTareG: "0",
  initialZeroSettingRangePercent: "4", automaticZeroSettingExists: false, zeroTrackingExists: true,
  declaredTemperatureMinC: "-10", declaredTemperatureMaxC: "40",
};
const revision = (changes: Partial<InstrumentSpecifications> = {}) => ({ id: "10000000-0000-4000-8000-000000000001", versionNo: 1, specifications: { ...spec, ...changes } });
function plan(changes: Partial<InstrumentSpecifications> = {}) {
  const result = generateTestPlan(revision(changes)); assert.equal(result.ok, true);
  return result.plan;
}
test("source PDFs match the supplied immutable manifest hashes", () => {
  for (const source of manifest.sources.filter(s => ["r76-1", "r76-2"].includes(s.id))) {
    assert.equal(createHash("sha256").update(readFileSync(source.path!)).digest("hex"), source.sha256);
  }
});
test("documented DEMO-30 plan matches independent fixture loads", () => {
  const p = plan(); const w = p.items[0].configuration;
  assert.equal(w.code, "WEIGHING_INITIAL"); if (w.code !== "WEIGHING_INITIAL") return;
  assert.deepEqual(w.increasingLoadsG, expectedDemoLoads);
  assert.deepEqual(w.decreasingLoadsG, [...expectedDemoLoads].reverse());
  assert.deepEqual(fixture.weighing.rows.filter(r => r.direction === "INCREASING").map(r => r.loadG), expectedDemoLoads);
  const ec = p.items[1].configuration; assert.equal(ec.code, "ECCENTRICITY_WEIGHTS");
  if (ec.code === "ECCENTRICITY_WEIGHTS") { assert.equal(ec.loadG, "10000"); assert.deepEqual(ec.segments, [1,2,3,4]); assert.equal(ec.zeroBeforeEachSegment, true); }
  const rep = p.items[2].configuration; assert.equal(rep.code, "REPEATABILITY_TYPE");
  if (rep.code === "REPEATABILITY_TYPE") assert.deepEqual(rep.series.map(s => [s.loadG,s.repetitions]), [["15000",10],["30000",10]]);
});
test("60 kg plan follows tenths policy, not fixed DEMO-30 loads", () => {
  const p = plan({ maxG: "60000" }); const w = p.items[0].configuration;
  assert.equal(p.selectionPolicy, "E_ALIGNED_TENTHS");
  assert.equal(w.code,"WEIGHING_INITIAL"); if (w.code !== "WEIGHING_INITIAL") return;
  assert.deepEqual(w.increasingLoadsG, ["200","5000","5010","6000","12000","18000","20000","20010","24000","60000"]);
  const ec=p.items[1].configuration; if(ec.code==="ECCENTRICITY_WEIGHTS") assert.equal(ec.loadG,"20000");
  const rep=p.items[2].configuration; if(rep.code==="REPEATABILITY_TYPE") assert.deepEqual(rep.series.map(s=>s.loadG),["30000","60000"]);
});
test("missing specifications, identity or explicit flags never produce a plan", () => {
  for (const input of [null, undefined, {}, { specifications: spec }, { ...revision(), specifications: { ...spec, zeroTrackingExists: undefined } }]) assert.equal(generateTestPlan(input).ok, false);
});
for (const [name,changes] of Object.entries({
  class: { accuracyClass: "II" }, range: { rangeType: "MULTI_INTERVAL" }, receptor: { receptor: "SPECIAL" },
  rolling: { receptor: "ROLLING_LOAD" }, supports: { supportPoints: 5 }, module: { category: "MODULE" },
  analog: { indication: "ANALOG" }, auxiliary: { auxiliaryIndication: true }, grading: { isGradingInstrument: true },
  extended: { extendedIndicationUsed: true }, tare: { maximumAdditiveTareG: "1" }, unequal: { dG: "5" },
  supplementary: { initialZeroSettingRangePercent: "20.01" }, capacity: { maxG: "1000000", eG: "100", dG: "100", minG: "2000" },
})) test(`unsupported ${name} is NOT_SUPPORTED, never FAIL`, () => {
  const r = generateTestPlan(revision(changes as Partial<InstrumentSpecifications>));
  assert.equal(r.ok, false); if (!r.ok) assert.equal(r.code, "NOT_SUPPORTED");
});
test("scope boundaries use exact decimal comparisons", () => {
  for (const changes of [{ maxG:"2500",eG:"5",dG:"5",minG:"100" }, { maxG:"50000",eG:"5",dG:"5",minG:"100" }, { initialZeroSettingRangePercent:"20", supportPoints:4 }]) {
    assert.equal(validateDemoScope({ ...spec,...changes }).supported,true);
  }
  for(const changes of [{ maxG:"2499.99",eG:"5",dG:"5",minG:"100" },{ maxG:"50000.01",eG:"5",dG:"5",minG:"100" },{ minG:"199.9999999999999999999999999999" },{eG:"4.999",dG:"4.999"},{dG:"3",eG:"3"}]) {
    assert.equal(validateDemoScope({ ...spec,...changes }).supported,false);
  }
});
test("non-terminating one-third target returns unresolved, without rounding", () => {
  const r = generateTestPlan(revision({ maxG:"30001" })); assert.equal(r.ok,false);
  if(!r.ok) { assert.equal(r.code,"UNRESOLVED_PLAN"); assert.equal(r.issues[0].code,"ECCENTRIC_LOAD_NOT_EXACT"); }
});
test("insufficient exact optional points do not trigger invented load spacing", () => {
  const r=generateTestPlan(revision({maxG:"30003"})); assert.equal(r.ok,false);
  if(!r.ok) assert.equal(r.issues[0].code,"INSUFFICIENT_EXACT_LOADS");
});
test("all generated loads are unique, in range, ordered with separate zero references", () => {
  for(const maxG of ["30000","60000","90000"]){
    const p=plan({maxG}); const w=p.items[0].configuration; assert.equal(w.code,"WEIGHING_INITIAL"); if(w.code!=="WEIGHING_INITIAL") continue;
    assert.ok(w.increasingLoadsG.length>=10); assert.equal(new Set(w.increasingLoadsG).size,w.increasingLoadsG.length);
    w.increasingLoadsG.forEach((load,i)=>{ assert.ok(new D(load).gte(spec.minG) && new D(load).lte(maxG)); if(i) assert.ok(new D(load).gt(w.increasingLoadsG[i-1])); });
    assert.deepEqual(w.decreasingLoadsG,[...w.increasingLoadsG].reverse()); assert.equal(w.sequence[0].loadG,"0"); assert.equal(w.sequence.at(-1)?.loadG,"0"); assert.equal(w.zeroReferences.length,2);
    assert.ok(w.increasingLoadsG.includes("5000")); assert.ok(w.increasingLoadsG.includes("5010"));
    assert.ok(w.increasingLoadsG.includes("20000")); assert.ok(w.increasingLoadsG.includes("20010"));
  }
});
test("coverage is complete as a catalogue and cannot assert full conformity", () => {
  const p=plan(); assert.equal(p.scope,"DEMO_SELECTED_ONLY"); assert.equal(p.overallConformity,"NOT_DETERMINED");
  for(const entry of catalogue.items) assert.ok(p.coverage.some(c=>c.code===`FORM_${entry.form}`));
  assert.ok(p.coverage.some(c=>c.code==="WEIGHING_TEMPERATURE_REPETITIONS" && c.status==="NOT_IMPLEMENTED"));
  assert.ok(p.coverage.every(c=>c.status!=="NOT_APPLICABLE"));
  assert.ok(p.manualPreconditions.every(c=>c.status==="NOT_VERIFIED"));
  assert.ok(p.items.every(i=>i.definition.evaluatorStatus==="NOT_IMPLEMENTED"));
});
test("all rules retain source provenance and distinguish software choices", () => {
  const p=plan(); assert.ok(p.traces.some(t=>t.basis==="SOFTWARE_CHOICE"));
  for(const trace of p.traces){ assert.ok(trace.ruleId && trace.version && trace.explanation && trace.calculationOrCondition); assert.ok(trace.references.length); }
  for(const ref of p.references){ assert.equal(ref.documentSha256,manifest.sources.find(s=>s.id===ref.documentId)?.sha256); assert.ok(ref.clause && ref.edition && ref.pdfPages.length && ref.printedPages.length); }
});
test("normalization preserves e/d, rejects defaults and numeric wire values", () => {
  const row={id:revision().id,version_no:1,accuracy_class:"III",max_g:"30000",min_g:"200",e_g:"10",d_g:"5",features:{...spec}};
  const s=normalizeSpecification(row); assert.equal(s.specifications.eG,"10"); assert.equal(s.specifications.dG,"5");
  assert.throws(()=>normalizeSpecification({...row,max_g:30000}));
  assert.throws(()=>normalizeSpecification({...row,features:{...spec,auxiliaryIndication:undefined}}));
});
test("structural observation schemas correspond to reserved definitions", () => {
  for(const definition of selectedDefinitions){ assert.ok(observationSchemas[definition.code]); assert.ok(definition.requiredReadings.length && definition.procedureConfirmations.length); assert.equal(observationSchemas[definition.code].safeParse({type:definition.code}).success,false); }
});
test("generation is deterministic and does not modify inputs", () => {
  const input=revision(); const before=JSON.stringify(input); assert.deepEqual(generateTestPlan(input),generateTestPlan(input)); assert.equal(JSON.stringify(input),before);
  const first=plan(); const expected=plan(); first.items[0].definition.name="Modified presentation";
  first.items[0].definition.references[0].pdfPages.push(999);
  assert.deepEqual(plan(),expected);
});

test("migration reference seed agrees with the actual schemas, catalogue and source bytes", () => {
  const sql=readFileSync("supabase/migrations/202609090007_plans.sql","utf8");
  const body=sql.split("$manifest$")[1]; const hash=sql.match(/v_manifest_hash text := '([a-f0-9]{64})'/)?.[1];
  assert.ok(body && hash); assert.equal(createHash("sha256").update(body).digest("hex"),hash);
  const data=JSON.parse(body); assert.equal(data.id,RULE_SET_ID); assert.equal(data.version,RULE_SET_VERSION);
  assert.deepEqual(data.coverage,JSON.parse(JSON.stringify(coverageCatalogue())));
  assert.deepEqual(data.definitions,JSON.parse(JSON.stringify(selectedDefinitions)));
  assert.deepEqual(data.manualPreconditions,JSON.parse(JSON.stringify(manualPreconditions())));
  for(const [field,path] of [["sourceManifestSha256","docs/source-manifest.json"],["sourceRegistrySha256","docs/rule-registry.json"],["testCatalogueSha256","docs/test-catalogue.json"]]) assert.equal(data[field],createHash("sha256").update(readFileSync(path)).digest("hex"));
  const definitions=JSON.parse(sql.split("$definitions$")[1]);
  for(const definition of selectedDefinitions){
    const seeded=definitions.find((d: {id:string})=>d.id===definition.id);
    assert.ok(seeded); assert.equal(seeded.rule_set_id,RULE_SET_ID); assert.equal(seeded.implementation_status,"NOT_IMPLEMENTED");
    assert.deepEqual(seeded.input_schema,z.toJSONSchema(observationSchemas[definition.code]));
  }
});
