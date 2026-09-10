import "server-only";

import { z } from "zod";
import type { InstrumentRegistrationInput } from "@/contracts/instruments";

export const instrumentRegistrationSchema = z.object({
  manufacturerName: z.string().trim().min(1).max(200),
  manufacturerAddress: z.string().trim().min(1).max(500),
  applicantName: z.string().trim().min(1).max(200),
  applicantAddress: z.string().trim().min(1).max(500),
  designation: z.string().trim().min(1).max(200),
  category: z.enum(["COMPLETE_INSTRUMENT", "MODULE"]),
  description: z.string().trim().max(2000).nullable().optional().transform((value) => value || null),
  sampleIdentifier: z.string().trim().min(1).max(200),
  serialNumber: z.string().trim().max(200).nullable().optional().transform((value) => value || null),
  assignedTesterId: z.string().uuid(),
}).strict() satisfies z.ZodType<InstrumentRegistrationInput>;
