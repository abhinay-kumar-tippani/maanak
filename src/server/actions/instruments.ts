"use server";

import type { RegistrationResult } from "@/contracts/instruments";
import type { ActionResult } from "@/contracts/domain";
import { registerInstrumentCommand } from "@/server/db/commands";

export async function registerInstrument(input: unknown): Promise<ActionResult<RegistrationResult>> {
  return registerInstrumentCommand(input);
}
