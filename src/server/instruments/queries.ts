import "server-only";

import type { InstrumentDetail, InstrumentListRow } from "@/contracts/instruments";
import { requireActor } from "@/server/auth/authorize";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type InstrumentRecord = {
  id: string;
  model_id: string;
  applicant_id: string;
  sample_identifier: string;
  serial_number: string | null;
  received_at: string;
};
type ModelRecord = { id: string; manufacturer_id: string; designation: string; category: string; description: string | null };
type PartyRecord = { id: string; name: string; address: string };
type EvaluationRecord = { id: string; instrument_id: string; application_number: string; state: string; assigned_tester_id: string; updated_at: string };

async function clientOrThrow() {
  const client = await createSupabaseServerClient();
  if (!client) throw new Error("Authentication is not configured.");
  return client;
}

async function loadRows(ids?: string[]) {
  const supabase = await clientOrThrow();
  const instrumentQuery = supabase.from("instruments").select("id, model_id, applicant_id, sample_identifier, serial_number, received_at").order("received_at", { ascending: false });
  const { data: instruments, error: instrumentsError } = ids ? await instrumentQuery.in("id", ids) : await instrumentQuery;
  if (instrumentsError) throw instrumentsError;
  const records = (instruments ?? []) as InstrumentRecord[];
  if (records.length === 0) return { instruments: [], models: new Map<string, ModelRecord>(), parties: new Map<string, PartyRecord>(), evaluations: [] as EvaluationRecord[] };

  const modelIds = [...new Set(records.map((row) => row.model_id))];
  const partyIds = [...new Set(records.flatMap((row) => [row.applicant_id]))];
  const [{ data: models, error: modelsError }, { data: parties, error: partiesError }, { data: evaluations, error: evaluationsError }] = await Promise.all([
    supabase.from("instrument_models").select("id, manufacturer_id, designation, category, description").in("id", modelIds),
    supabase.from("parties").select("id, name, address").in("id", partyIds),
    supabase.from("evaluations").select("id, instrument_id, application_number, state, assigned_tester_id, updated_at").in("instrument_id", records.map((row) => row.id)).order("updated_at", { ascending: false }),
  ]);
  if (modelsError) throw modelsError;
  if (partiesError) throw partiesError;
  if (evaluationsError) throw evaluationsError;

  const allManufacturerIds = [...new Set((models ?? []).map((model) => model.manufacturer_id))];
  const missingPartyIds = allManufacturerIds.filter((id) => !partyIds.includes(id));
  if (missingPartyIds.length > 0) {
    const { data: manufacturers, error: manufacturerError } = await supabase.from("parties").select("id, name, address").in("id", missingPartyIds);
    if (manufacturerError) throw manufacturerError;
    parties?.push(...(manufacturers ?? []));
  }

  return {
    instruments: records,
    models: new Map((models ?? []).map((row) => [row.id, row as ModelRecord])),
    parties: new Map((parties ?? []).map((row) => [row.id, row as PartyRecord])),
    evaluations: (evaluations ?? []) as EvaluationRecord[],
  };
}

function toListRow(record: InstrumentRecord, model: ModelRecord, manufacturer: PartyRecord, applicant: PartyRecord, evaluations: EvaluationRecord[]): InstrumentListRow {
  const current = evaluations.filter((evaluation) => evaluation.instrument_id === record.id).sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0];
  return { id: record.id, sampleIdentifier: record.sample_identifier, serialNumber: record.serial_number, receivedAt: record.received_at, designation: model.designation, category: model.category, manufacturerName: manufacturer.name, applicantName: applicant.name, currentEvaluation: current ? { id: current.id, applicationNumber: current.application_number, state: current.state } : null };
}

export async function listInstruments(): Promise<InstrumentListRow[]> {
  await requireActor();
  const loaded = await loadRows();
  return loaded.instruments.flatMap((record) => {
    const model = loaded.models.get(record.model_id);
    const manufacturer = model ? loaded.parties.get(model.manufacturer_id) : undefined;
    const applicant = loaded.parties.get(record.applicant_id);
    return model && manufacturer && applicant ? [toListRow(record, model, manufacturer, applicant, loaded.evaluations)] : [];
  });
}

export async function getInstrument(instrumentId: string): Promise<InstrumentDetail | null> {
  await requireActor();
  const loaded = await loadRows([instrumentId]);
  const record = loaded.instruments[0];
  if (!record) return null;
  const model = loaded.models.get(record.model_id);
  const manufacturer = model ? loaded.parties.get(model.manufacturer_id) : undefined;
  const applicant = loaded.parties.get(record.applicant_id);
  if (!model || !manufacturer || !applicant) return null;
  const evaluations = loaded.evaluations.filter((evaluation) => evaluation.instrument_id === record.id).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  return {
    ...toListRow(record, model, manufacturer, applicant, evaluations),
    description: model.description,
    manufacturer: { id: manufacturer.id, name: manufacturer.name, address: manufacturer.address },
    applicant: { id: applicant.id, name: applicant.name, address: applicant.address },
    evaluations: evaluations.map((evaluation) => ({ id: evaluation.id, applicationNumber: evaluation.application_number, state: evaluation.state, assignedTesterId: evaluation.assigned_tester_id, updatedAt: evaluation.updated_at })),
  };
}
