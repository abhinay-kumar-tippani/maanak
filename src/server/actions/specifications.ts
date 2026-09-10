"use server";

import type { ActionResult } from "@/contracts/domain";
import type { SaveSpecificationInput, SpecificationRevision } from "@/contracts/specifications";
import { saveSpecificationCommand } from "@/server/db/commands";

export async function saveSpecification(input: SaveSpecificationInput): Promise<ActionResult<SpecificationRevision>> {
  return saveSpecificationCommand(input);
}
