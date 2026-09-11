import { z } from "zod";
import type { WeighingObservations, EccentricityObservations, RepeatabilityObservations } from "../../../contracts/domain";
import { decimalString } from "./specifications";

// Structural schemas only. Planned load matching and verdicts belong to later stages.
const reading = {
  rowKey: z.string().min(1), loadG: decimalString, indicationG: decimalString,
  additionalLoadG: decimalString, changeoverConfirmed: z.boolean(), observedAt: z.iso.datetime(),
};
const zero = z.object({ ...reading, zeroReferenceId: z.string().min(1) }).strict();
export const weighingSchema = z.object({
  type: z.literal("WEIGHING_INITIAL"), zeroReferences: z.array(zero),
  rows: z.array(z.object({ ...reading, direction: z.enum(["INCREASING", "DECREASING"]), zeroReferenceId: z.string().min(1) }).strict()),
}).strict() satisfies z.ZodType<WeighingObservations>;
export const eccentricitySchema = z.object({
  type: z.literal("ECCENTRICITY_WEIGHTS"), sketchAttachmentId: z.string().min(1), displayPositionDescription: z.string().min(1),
  zeroReferences: z.array(zero), rows: z.array(z.object({ ...reading,
    segment: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]), zeroReferenceId: z.string().min(1),
  }).strict()),
}).strict() satisfies z.ZodType<EccentricityObservations>;
export const repeatabilitySchema = z.object({
  type: z.literal("REPEATABILITY_TYPE"), series: z.array(z.object({
    designation: z.enum(["ABOUT_HALF_MAX", "CLOSE_TO_MAX"]), loadG: decimalString, loadSelectionReason: z.string().min(1),
    rows: z.array(z.object({ ...reading, unloadedIndicationG: decimalString, zeroResetPerformed: z.boolean() }).strict()),
  }).strict()),
}).strict() satisfies z.ZodType<RepeatabilityObservations>;
