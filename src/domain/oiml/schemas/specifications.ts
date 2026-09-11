import Decimal from "decimal.js";
import { z } from "zod";
import type { InstrumentSpecifications } from "../../../contracts/domain";

// Engineering input bound, not an OIML limit. Precision exceeds all bounded inputs and products.
export const PlanDecimal = Decimal.clone({ precision: 200, toExpNeg: -200, toExpPos: 200 });
export const decimalString = z.string().max(60).regex(/^-?\d+(?:\.\d+)?$/);
const positive = decimalString.refine(v => /^-?\d+(?:\.\d+)?$/.test(v) && new PlanDecimal(v).gt(0));
const nonnegative = decimalString.refine(v => /^-?\d+(?:\.\d+)?$/.test(v) && new PlanDecimal(v).gte(0));
export const instrumentSpecificationsSchema = z.object({
  accuracyClass: z.enum(["I", "II", "III", "IIII"]), maxG: positive, minG: nonnegative,
  eG: positive, dG: positive, rangeType: z.enum(["SINGLE_INTERVAL", "MULTI_INTERVAL", "MULTIPLE_RANGE"]),
  category: z.enum(["COMPLETE_INSTRUMENT", "MODULE"]), indication: z.enum(["DIGITAL", "ANALOG", "NON_SELF_INDICATING"]),
  auxiliaryIndication: z.boolean(), extendedIndicationUsed: z.boolean(), isGradingInstrument: z.boolean(),
  receptor: z.enum(["ORDINARY_PLATFORM", "SPECIAL", "ROLLING_LOAD"]), supportPoints: z.number().int().positive().safe(),
  maximumAdditiveTareG: nonnegative, initialZeroSettingRangePercent: nonnegative,
  automaticZeroSettingExists: z.boolean(), zeroTrackingExists: z.boolean(),
  declaredTemperatureMinC: decimalString, declaredTemperatureMaxC: decimalString,
}).strict().superRefine((v, ctx) => {
  if ([v.minG,v.maxG,v.declaredTemperatureMinC,v.declaredTemperatureMaxC].some(s => !/^-?\d+(?:\.\d+)?$/.test(s))) return;
  if (new PlanDecimal(v.minG).gt(v.maxG)) ctx.addIssue({ code: "custom", path: ["minG"], message: "Min exceeds Max." });
  if (new PlanDecimal(v.declaredTemperatureMinC).gt(v.declaredTemperatureMaxC)) ctx.addIssue({ code: "custom", path: ["declaredTemperatureMinC"], message: "Temperature bounds are reversed." });
}) satisfies z.ZodType<InstrumentSpecifications>;

export const planningSpecificationSchema = z.object({
  id: z.uuid(), versionNo: z.number().int().positive().safe(), specifications: instrumentSpecificationsSchema,
}).strict();
export type PlanningSpecification = z.infer<typeof planningSpecificationSchema>;

// Accept the database wire shape only: numeric columns must have been selected as ::text.
export function normalizeSpecification(row: unknown): PlanningSpecification {
  const record = z.object({
    id: z.uuid(), version_no: z.number().int().positive(), accuracy_class: z.string(),
    max_g: decimalString, min_g: decimalString, e_g: decimalString, d_g: decimalString,
    features: z.record(z.string(), z.unknown()),
  }).parse(row);
  const f = record.features;
  return planningSpecificationSchema.parse({ id: record.id, versionNo: record.version_no, specifications: {
    accuracyClass: record.accuracy_class, maxG: record.max_g, minG: record.min_g, eG: record.e_g, dG: record.d_g,
    rangeType: f.rangeType, category: f.category, indication: f.indication,
    auxiliaryIndication: f.auxiliaryIndication, extendedIndicationUsed: f.extendedIndicationUsed,
    isGradingInstrument: f.isGradingInstrument, receptor: f.receptor, supportPoints: f.supportPoints,
    maximumAdditiveTareG: f.maximumAdditiveTareG, initialZeroSettingRangePercent: f.initialZeroSettingRangePercent,
    automaticZeroSettingExists: f.automaticZeroSettingExists, zeroTrackingExists: f.zeroTrackingExists,
    declaredTemperatureMinC: f.declaredTemperatureMinC, declaredTemperatureMaxC: f.declaredTemperatureMaxC,
  }});
}
