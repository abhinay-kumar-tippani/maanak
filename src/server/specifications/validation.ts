import "server-only";

import Decimal from "decimal.js";
import { z } from "zod";

const decimalText = z.string().trim().regex(/^-?(?:\d+)(?:\.\d+)?$/, "Enter a valid decimal value.");
const nonNegativeDecimal = decimalText.refine((value) => new Decimal(value).gte(0), "Value must not be negative.");
const positiveDecimal = decimalText.refine((value) => new Decimal(value).gt(0), "Value must be positive.");
const manualStatus = z.enum(["CONFIRMED", "NOT_CONFIRMED", "NOT_VERIFIED"]);
const specificationShape = {
  accuracyClass: z.enum(["I", "II", "III", "IIII"]),
  maxG: positiveDecimal,
  minG: nonNegativeDecimal,
  eG: positiveDecimal,
  dG: positiveDecimal,
  rangeType: z.enum(["SINGLE_INTERVAL", "MULTI_INTERVAL", "MULTIPLE_RANGE"]),
  category: z.enum(["COMPLETE_INSTRUMENT", "MODULE"]),
  indication: z.enum(["DIGITAL", "ANALOG", "NON_SELF_INDICATING"]),
  auxiliaryIndication: z.boolean(),
  extendedIndicationUsed: z.boolean(),
  isGradingInstrument: z.boolean(),
  receptor: z.enum(["ORDINARY_PLATFORM", "SPECIAL", "ROLLING_LOAD"]),
  supportPoints: z.number().int().positive(),
  maximumAdditiveTareG: nonNegativeDecimal,
  initialZeroSettingRangePercent: nonNegativeDecimal,
  automaticZeroSettingExists: z.boolean(),
  zeroTrackingExists: z.boolean(),
  declaredTemperatureMinC: decimalText,
  declaredTemperatureMaxC: decimalText,
  manualIntake: z.object({
    documentReview: manualStatus,
    markings: manualStatus,
    sealing: manualStatus,
    environment: manualStatus,
    notes: z.string().trim().max(2000).nullable().optional().transform((value) => value || null),
  }).strict(),
};

function withCrossFieldChecks<T extends z.ZodType>(schema: T) {
  return schema.superRefine((value: unknown, context) => {
    const candidate = value as { minG: string; maxG: string; declaredTemperatureMinC: string; declaredTemperatureMaxC: string };
    if (new Decimal(candidate.minG).gt(candidate.maxG)) context.addIssue({ code: "custom", path: ["minG"], message: "Min must not exceed Max." });
    if (new Decimal(candidate.declaredTemperatureMinC).gt(candidate.declaredTemperatureMaxC)) context.addIssue({ code: "custom", path: ["declaredTemperatureMinC"], message: "Temperature minimum must not exceed maximum." });
  });
}

export const specificationInputSchema = withCrossFieldChecks(z.object(specificationShape).strict());

export const saveSpecificationInputSchema = withCrossFieldChecks(z.object({
  evaluationId: z.uuid(),
  expectedRowVersion: z.number().int().nonnegative().safe(),
  ...specificationShape,
}).strict());
