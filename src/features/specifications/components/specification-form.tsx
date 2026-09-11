"use client";

import { useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { SpecificationInput, SpecificationRevision, ManualCheckStatus } from "@/contracts/specifications";
import { saveSpecification } from "@/server/actions/specifications";
import { ChevronDown, ChevronRight } from "lucide-react";

interface SpecificationFormProps {
  evaluationId: string;
  expectedRowVersion: number;
  currentRevision: SpecificationRevision | null;
  isTester: boolean;
  readOnlyReason?: string;
}

type Draft = { [K in keyof Omit<SpecificationInput, "manualIntake" | "supportPoints">]: SpecificationInput[K] | "" } & {
  supportPoints: string;
  manualIntake: SpecificationInput["manualIntake"];
};
type FieldKey = Exclude<keyof SpecificationInput, "manualIntake">;
type ManualKey = Exclude<keyof SpecificationInput["manualIntake"], "notes">;
const decimalFields = [
  ["maxG", "Max — Maximum capacity (g)"],
  ["minG", "Min — Minimum capacity (g)"],
  ["eG", "e — Verification scale interval (g)"],
  ["dG", "d — Actual scale interval (g)"],
  ["maximumAdditiveTareG", "Maximum additive tare (g)"],
  ["initialZeroSettingRangePercent", "Initial-zero setting range (% of Max)"],
  ["declaredTemperatureMinC", "Declared temperature minimum (°C)"],
  ["declaredTemperatureMaxC", "Declared temperature maximum (°C)"],
] as const;
const choices = [
  ["accuracyClass", "Accuracy class", ["I", "II", "III", "IIII"]],
  ["rangeType", "Range type", ["SINGLE_INTERVAL", "MULTI_INTERVAL", "MULTIPLE_RANGE"]],
  ["category", "Instrument category", ["COMPLETE_INSTRUMENT", "MODULE"]],
  ["indication", "Indication type", ["DIGITAL", "ANALOG", "NON_SELF_INDICATING"]],
  ["receptor", "Receptor type", ["ORDINARY_PLATFORM", "SPECIAL", "ROLLING_LOAD"]],
] as const;
const flags = [
  ["auxiliaryIndication", "Auxiliary indicating device present"],
  ["extendedIndicationUsed", "Extended indication used for testing"],
  ["isGradingInstrument", "Grading instrument"],
  ["automaticZeroSettingExists", "Automatic zero-setting device present"],
  ["zeroTrackingExists", "Zero-tracking device present"],
] as const;
const manualChecks: [ManualKey, string, string][] = [
  ["documentReview", "Document review", "Record examination of submitted documentation and comparison with the instrument."],
  ["markings", "Markings", "Record examination of identification and metrological markings."],
  ["sealing", "Sealing", "Record examination of securing and sealing arrangements."],
  ["environment", "Environmental checks", "Record actual setup and environmental evidence; endpoint readings alone do not establish continuous stability."],
];
const manualStatuses: ManualCheckStatus[] = ["NOT_VERIFIED", "CONFIRMED", "NOT_CONFIRMED"];

// Declarations transcribed from fixtures/demo-observations.json and the
// DEMO-30 profile in docs/master-blueprint.md. No physical checks are inferred.
const demo: SpecificationInput = {
  accuracyClass: "III", maxG: "30000", minG: "200", eG: "10", dG: "10",
  rangeType: "SINGLE_INTERVAL", category: "COMPLETE_INSTRUMENT", indication: "DIGITAL",
  auxiliaryIndication: false, extendedIndicationUsed: false, isGradingInstrument: false,
  receptor: "ORDINARY_PLATFORM", supportPoints: 1, maximumAdditiveTareG: "0",
  initialZeroSettingRangePercent: "4", automaticZeroSettingExists: false, zeroTrackingExists: true,
  declaredTemperatureMinC: "-10", declaredTemperatureMaxC: "40",
  manualIntake: { documentReview: "NOT_VERIFIED", markings: "NOT_VERIFIED", sealing: "NOT_VERIFIED", environment: "NOT_VERIFIED", notes: null },
};

function draftFrom(input: SpecificationInput | null): Draft {
  // Copy only DTO input keys; revision metadata must never enter the save payload.
  const blank = Object.fromEntries([
    ...decimalFields.map(([key]) => [key, input?.[key] ?? ""]),
    ...choices.map(([key]) => [key, input?.[key] ?? ""]),
    ...flags.map(([key]) => [key, input?.[key] ?? ""]),
  ]) as Omit<Draft, "supportPoints" | "manualIntake">;
  return { ...blank, supportPoints: input ? String(input.supportPoints) : "",
    manualIntake: input ? { ...input.manualIntake } : { ...demo.manualIntake } };
}

const controlClass = "mt-1.5 block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-teal-700 disabled:bg-slate-100 disabled:text-slate-600 aria-invalid:border-rose-500";
function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return <div><label htmlFor={id} className="block text-sm font-semibold text-slate-800">{label}</label>{children}
    {error && <p id={`${id}-error`} className="mt-1 text-sm text-rose-700">{error}</p>}</div>;
}
function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="space-y-5 rounded-lg border border-slate-200 bg-white p-6 shadow-xs">
    <h2 className="border-b border-slate-100 pb-3 text-base font-bold text-[#183153]">{title}</h2>{children}</section>;
}

export function SpecificationForm({ evaluationId, expectedRowVersion, currentRevision, isTester, readOnlyReason }: SpecificationFormProps) {
  const router = useRouter();
  const [form, setForm] = useState(() => draftFrom(currentRevision));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [pending, setPending] = useState(false);
  const [demoSelected, setDemoSelected] = useState(false);
  const submitting = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const disabled = !isTester || pending || saved || blocked;

  function update<K extends FieldKey>(key: K, value: Draft[K]) {
    setForm(previous => ({ ...previous, [key]: value }));
    setErrors(previous => ({ ...previous, [key]: "" }));
    setMessage(null);
  }
  function updateManual(key: keyof SpecificationInput["manualIntake"], value: string) {
    setForm(previous => ({ ...previous, manualIntake: { ...previous.manualIntake, [key]: value } }));
    setErrors(previous => ({ ...previous, [`manualIntake.${key}`]: "" }));
    setMessage(null);
  }
  function fieldProps(key: string) {
    return { id: key, name: key, className: controlClass, "aria-invalid": Boolean(errors[key]),
      "aria-describedby": errors[key] ? `${key}-error` : undefined };
  }
  function showErrors(next: Record<string, string>) {
    setErrors(next);
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled || submitting.current) return;
    const next: Record<string, string> = {};
    for (const [key, label] of [...decimalFields, ...choices, ...flags]) {
      if (form[key] === "") next[key] = `${label} is required. Select or enter the declared value.`;
    }
    for (const [key] of decimalFields) {
      if (form[key] && !/^-?\d+(?:\.\d+)?$/.test(form[key].trim())) next[key] = "Enter a decimal value without commas or exponent notation.";
    }
    if (!/^\d+$/.test(form.supportPoints) || !Number.isSafeInteger(Number(form.supportPoints)) || Number(form.supportPoints) < 1) {
      next.supportPoints = "Enter a positive whole number of support points.";
    }
    if ((form.manualIntake.notes?.length ?? 0) > 2000) next["manualIntake.notes"] = "Keep notes within 2,000 characters.";
    if (Object.keys(next).length) {
      showErrors(next); setMessage("Correct the highlighted fields before saving."); return;
    }
    submitting.current = true;
    setPending(true); setMessage(null); setErrors({});
    try {
      // Only supportPoints is numeric in the existing DTO. All measurements stay strings.
      const input = { ...form, supportPoints: Number(form.supportPoints) } as SpecificationInput;
      const result = await saveSpecification({ ...input, evaluationId, expectedRowVersion });
      if (!result.ok) {
        showErrors(result.error.fieldErrors ?? {});
        const code = result.error.code;
        if (["PERMISSION_DENIED", "ASSIGNMENT_REQUIRED", "ROLE_REQUIRED", "AUTH_REQUIRED", "PROFILE_REQUIRED", "LABORATORY_SCOPE_REQUIRED"].includes(code)) {
          setBlocked(true); setMessage("Permission denied. Only the assigned tester with an active laboratory account can save. Reload after your access is restored.");
        } else if (code === "STALE_DATA") {
          setBlocked(true); setMessage("Stale version: this evaluation changed since loading. Your entries remain visible. Copy any unsaved changes, then reload the latest revision before saving again.");
        } else if (["SPECIFICATION_LOCKED", "INVALID_STATE"].includes(code)) {
          setBlocked(true); setMessage("Evaluation locked: specifications cannot be changed in the current workflow state. Reload after the evaluation is reopened through the authorized workflow.");
        } else if (code === "VALIDATION_ERROR") {
          setMessage("Validation failed. Correct the highlighted fields and save again.");
        } else {
          setMessage("The specification could not be saved. Your entries are retained. Try again; if this continues, contact your laboratory administrator.");
        }
        return;
      }
      // Reload via the existing queries so the form and full history share the
      // authoritative revision and optimistic version. Do not reuse an old version.
      setSaved(true);
      setMessage("Specification saved. The active test plan is invalidated and must be regenerated. Refreshing the current revision and preserved history…");
      router.refresh();
    } catch {
      setBlocked(true);
      setMessage("The save outcome could not be verified because of a connection or server error. Your entries remain visible. Reload and check revision history before retrying to avoid a duplicate revision.");
    } finally {
      setPending(false); submitting.current = false;
    }
  }

  function decimalField(key: typeof decimalFields[number][0], label: string) {
    return <Field key={key} id={key} label={label} error={errors[key]}>
      <input {...fieldProps(key)} type="text" inputMode="decimal" value={form[key]} onChange={event => update(key, event.target.value)} className={`${controlClass} font-mono tabular-nums ${key === "eG" || key === "dG" ? "border-l-4 border-l-teal-700" : ""}`} />
    </Field>;
  }

  return <form ref={formRef} onSubmit={submit} noValidate className="space-y-6" aria-busy={pending}>
    {!isTester && <p className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{readOnlyReason ?? "Read-only: only the assigned tester can edit specifications."}</p>}
    <div className="rounded-md border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-slate-800">
      Saving a changed specification creates a new revision and <strong>invalidates the active test plan</strong> and dependent results. Regenerate the plan before testing. Previous revisions remain available below.
    </div>
    {message && <div role={saved ? "status" : "alert"} className={`rounded-md border p-4 text-sm ${saved ? "border-teal-300 bg-teal-50 text-teal-900" : "border-rose-300 bg-rose-50 text-rose-900"}`}>
      {message}
      {(blocked || saved) && <button type="button" onClick={() => window.location.reload()} className="ml-3 font-semibold underline">Reload saved record</button>}
      {Object.entries(errors).filter(([key, value]) => value && ![...decimalFields, ...choices, ...flags, ["supportPoints"]].some(([field]) => field === key) && !key.startsWith("manualIntake.")).map(([key, value]) => <p key={key}>{value}</p>)}
    </div>}
    <fieldset disabled={disabled} className="min-w-0 space-y-6">
      <legend className="sr-only">Declared specifications and manual intake</legend>
      {isTester && <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm">
        <div><p className="font-semibold text-slate-900">Fictional DEMO-30 fixture</p><p className="mt-1 text-slate-600">Explicit selection replaces this draft. No physical tests or manual confirmations are supplied.</p></div>
        <button type="button" onClick={() => { setForm(draftFrom(demo)); setErrors({}); setMessage(null); setDemoSelected(true); }} className="rounded-md border border-slate-300 bg-white px-4 py-2 font-semibold text-[#176B67] disabled:opacity-50">Load fictional demo fixture</button>
        {demoSelected && <p role="status" className="w-full text-amber-800">Fictional demo values loaded; not saved. Every manual check is NOT_VERIFIED.</p>}
      </div>}
      <Section title="1 · Classification and capacity">
        <p className="text-sm text-slate-600">Enter manufacturer declarations. All mass fields use grams. Verification interval e and actual interval d are separate declarations.</p>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {choices.slice(0, 2).map(([key, label, options]) => <Field key={key} id={key} label={label} error={errors[key]}>
            <select {...fieldProps(key)} value={form[key]} onChange={event => update(key, event.target.value as Draft[typeof key])}><option value="">Select declared value</option>{options.map(option => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}</select>
          </Field>)}
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">{decimalFields.slice(0, 4).map(([key, label]) => decimalField(key, label))}</div>
      </Section>
      <Section title="2 · Construction and device declarations">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {choices.slice(2).map(([key, label, options]) => <Field key={key} id={key} label={label} error={errors[key]}>
            <select {...fieldProps(key)} value={form[key]} onChange={event => update(key, event.target.value as Draft[typeof key])}><option value="">Select declared value</option>{options.map(option => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}</select>
          </Field>)}
          <Field id="supportPoints" label="Support points" error={errors.supportPoints}><input {...fieldProps("supportPoints")} type="text" inputMode="numeric" value={form.supportPoints} onChange={event => update("supportPoints", event.target.value)} /></Field>
          {decimalFields.slice(4, 6).map(([key, label]) => decimalField(key, label))}
          {flags.map(([key, label]) => <Field key={key} id={key} label={label} error={errors[key]}>
            <select {...fieldProps(key)} value={form[key] === "" ? "" : String(form[key])} onChange={event => update(key, event.target.value === "" ? "" : event.target.value === "true")}><option value="">Select Yes or No</option><option value="true">Yes</option><option value="false">No</option></select>
          </Field>)}
        </div>
      </Section>
      <Section title="3 · Declared operating temperature">
        <p className="text-sm text-slate-600">Record the manufacturer&apos;s declared range in °C. This does not confirm conditions during physical testing.</p>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">{decimalFields.slice(6).map(([key, label]) => decimalField(key, label))}</div>
      </Section>
      <Section title="4 · Manual intake confirmations">
        <p className="text-sm leading-6 text-slate-600">Record actual examinations and evidence. CONFIRMED is an explicit tester confirmation; NOT_CONFIRMED records a negative finding; NOT_VERIFIED means the check remains unverified. Saving or loading a fixture never confirms a check.</p>
        <div className="space-y-4">{manualChecks.map(([key, label, description]) => <div key={key} className="grid items-start gap-4 rounded-md border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[1fr_240px]">
          <div><p className="font-semibold text-slate-900">{label}</p><p className="mt-1 text-sm text-slate-600">{description}</p></div>
          <Field id={`manualIntake.${key}`} label={`${label} status`} error={errors[`manualIntake.${key}`]}>
            <select {...fieldProps(`manualIntake.${key}`)} value={form.manualIntake[key]} onChange={event => updateManual(key, event.target.value)}>{manualStatuses.map(status => <option key={status} value={status}>{status}</option>)}</select>
          </Field>
        </div>)}</div>
        <Field id="manualIntake.notes" label="Evidence, findings and other applicable checks" error={errors["manualIntake.notes"]}>
          <p id="notes-help" className="mt-1 text-sm text-slate-600">For other applicable checks (construction, leveling, power/setup, preloading, adjustment/recovery or equipment traceability), record each check, its CONFIRMED / NOT_CONFIRMED / NOT_VERIFIED status, observations and evidence reference here. Up to 2,000 characters.</p>
          <textarea {...fieldProps("manualIntake.notes")} aria-describedby={`notes-help${errors["manualIntake.notes"] ? " manualIntake.notes-error" : ""}`} rows={5} value={form.manualIntake.notes ?? ""} onChange={event => updateManual("notes", event.target.value)} />
        </Field>
      </Section>
      {isTester && <div className="flex items-center justify-end gap-4"><span className="text-sm text-slate-600">{currentRevision ? `Current revision: v${currentRevision.versionNo}` : "No saved revision"}</span><button type="submit" className="rounded-md bg-[#183153] px-5 py-3 text-sm font-semibold text-white hover:bg-[#12253f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:opacity-50">{pending ? "Saving revision…" : "Save specification revision"}</button></div>}
    </fieldset>
  </form>;
}

// ─── Revision History Table ────────────────────────────────────────────────────

interface RevisionHistoryTableProps {
  revisions: SpecificationRevision[];
  currentRevisionId?: string;
}

export function RevisionHistoryTable({ revisions, currentRevisionId }: RevisionHistoryTableProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (revisions.length === 0) {
    return (
      <div className="text-center py-6 text-xs text-slate-500">
        No specification revisions have been saved yet.
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {revisions.map((rev) => {
        const isOpen = expanded === rev.id;
        const isLatest = currentRevisionId === rev.id;
        return (
          <div
            key={rev.id}
            className={`border rounded-md overflow-hidden ${
              isLatest ? "border-[#176B67]" : "border-slate-200"
            }`}
          >
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setExpanded(isOpen ? null : rev.id)}
              className="w-full flex items-center justify-between px-4 py-3 text-xs text-left bg-white hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                {isOpen ? (
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                )}
                <span className="font-bold text-slate-900 font-mono">
                  Revision v{rev.versionNo}
                </span>
                {isLatest && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#176B67] text-white">
                    Current
                  </span>
                )}
                <span className="text-slate-500">
                  Class {rev.accuracyClass} · Max {rev.maxG} g · e = {rev.eG} g · d = {rev.dG} g
                </span>
              </div>
              <span className="text-slate-400 font-mono ml-4 shrink-0">
                {new Date(rev.createdAt).toLocaleString("en-IN", {
                  timeZone: "Asia/Kolkata",
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </button>

            {isOpen && (
              <div className="border-t border-slate-200 bg-slate-50 px-4 py-4">
                <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-3 text-xs">
                  {[
                    { label: "Accuracy Class", value: `Class ${rev.accuracyClass}` },
                    { label: "Max (g)", value: rev.maxG },
                    { label: "Min (g)", value: rev.minG },
                    { label: "e (g)", value: rev.eG },
                    { label: "d (g)", value: rev.dG },
                    { label: "Range Type", value: rev.rangeType },
                    { label: "Category", value: rev.category },
                    { label: "Indication", value: rev.indication },
                    { label: "Receptor", value: rev.receptor },
                    { label: "Support Points", value: String(rev.supportPoints) },
                    { label: "Max Additive Tare (g)", value: rev.maximumAdditiveTareG },
                    { label: "Zero Setting Range (%)", value: rev.initialZeroSettingRangePercent },
                    { label: "Temp Min (°C)", value: rev.declaredTemperatureMinC },
                    { label: "Temp Max (°C)", value: rev.declaredTemperatureMaxC },
                    { label: "Auxiliary Indication", value: rev.auxiliaryIndication ? "Yes" : "No" },
                    { label: "Extended Mode Used", value: rev.extendedIndicationUsed ? "Yes" : "No" },
                    { label: "Grading Instrument", value: rev.isGradingInstrument ? "Yes" : "No" },
                    { label: "Auto Zero Setting", value: rev.automaticZeroSettingExists ? "Yes" : "No" },
                    { label: "Zero Tracking", value: rev.zeroTrackingExists ? "Yes" : "No" },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <dt className="text-slate-500">{label}</dt>
                      <dd className="font-mono font-semibold text-slate-900 mt-0.5">{value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <span className="text-xs font-semibold text-slate-700">Manual Intake Status</span>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(
                      [
                        ["Document Review", rev.manualIntake.documentReview],
                        ["Markings", rev.manualIntake.markings],
                        ["Sealing", rev.manualIntake.sealing],
                        ["Environment", rev.manualIntake.environment],
                      ] as [string, ManualCheckStatus][]
                    ).map(([label, status]) => (
                      <div key={label} className="text-xs">
                        <span className="text-slate-500 block">{label}</span>
                        <span
                          className={`inline-block mt-0.5 px-2 py-0.5 rounded font-bold uppercase text-[10px] tracking-wide ${
                            status === "CONFIRMED"
                              ? "bg-emerald-100 text-emerald-800"
                              : status === "NOT_CONFIRMED"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {status}
                        </span>
                      </div>
                    ))}
                  </div>
                  {rev.manualIntake.notes && (
                    <div className="mt-2 whitespace-pre-wrap break-words text-xs text-slate-700">
                      <span className="font-semibold">Notes and other applicable checks: </span>
                      {rev.manualIntake.notes}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
