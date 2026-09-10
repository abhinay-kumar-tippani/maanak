import Link from "next/link";
import { redirect } from "next/navigation";
import type { EvaluationState } from "@/contracts/domain";
import { WorkflowBadge } from "@/components/status/workflow-badge";
import { SpecificationForm, RevisionHistoryTable } from "@/features/specifications/components";
import { AuthorizationError, requireActor } from "@/server/auth/authorize";
import { getInstrument } from "@/server/instruments/queries";
import { getCurrentSpecification, listSpecificationRevisions } from "@/server/specifications/queries";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ evaluation?: string | string[] }>;
}

function Unavailable({ message }: { message: string }) {
  return <div role="alert" className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
    <h1 className="text-lg font-semibold">Specifications unavailable</h1>
    <p>{message}</p>
    <Link href="/instruments" className="inline-block font-semibold underline">Return to instruments</Link>
  </div>;
}

export default async function SpecificationsPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { evaluation: requested } = await searchParams;
  let actor;
  try {
    actor = await requireActor();
  } catch (error) {
    if (error instanceof AuthorizationError) {
      if (error.code === "AUTH_REQUIRED" || error.code === "PROFILE_REQUIRED") redirect("/login");
      if (error.code === "CONFIGURATION_ERROR") redirect("/login?error=config");
    }
    return <Unavailable message="Permission could not be verified. Sign in with an active laboratory account and try again." />;
  }

  let instrument;
  try {
    instrument = await getInstrument(id);
  } catch {
    return <Unavailable message="The instrument could not be loaded. Try reloading; if the problem continues, contact your laboratory administrator." />;
  }
  if (!instrument) return <Unavailable message="The instrument was not found or is outside your permitted laboratory scope." />;

  // Resolve only evaluations returned by the existing caller-scoped instrument query.
  // A sample ID is never substituted for an evaluation ID.
  const evaluation = requested === undefined ? instrument.evaluations[0]
    : typeof requested === "string" ? instrument.evaluations.find(item => item.id === requested) : undefined;
  if (!evaluation) return <Unavailable message="No accessible evaluation was found for this instrument. Open an evaluation from the instrument record." />;

  let current;
  let revisions;
  try {
    // Read the current pointer first; loading history afterwards includes that revision.
    current = await getCurrentSpecification(evaluation.id);
    revisions = await listSpecificationRevisions(evaluation.id);
  } catch {
    return <Unavailable message="The current specification and complete revision history could not be loaded. Reload before editing so changes are based on the saved record." />;
  }

  const assigned = actor.role === "TESTER" && evaluation.assignedTesterId === actor.id;
  const editableState = ["DRAFT", "PLANNED", "TESTING", "CORRECTION_REQUESTED"].includes(evaluation.state);
  // New evaluations start at row_version 0 in the existing registration schema.
  // With no current specification the query exposes no version; the command
  // still rejects a stale initial version under its database lock.
  const rowVersion = current?.resultingRowVersion ?? 0;
  const basePath = `/instruments/${encodeURIComponent(id)}`;

  return <div className="mx-auto max-w-7xl space-y-6 pb-8">
    <header className="space-y-3 border-b border-slate-200 pb-5">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <Link href="/instruments" className="text-[#176B67] hover:underline">Instruments</Link>
        <span className="mx-2">/</span><Link href={basePath} className="text-[#176B67] hover:underline">{instrument.sampleIdentifier}</Link>
        <span className="mx-2">/</span><span>Specifications</span>
      </nav>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-wider text-[#176B67]">SIH26035 · Specification intake</p>
          <h1 className="mt-1 text-2xl font-bold text-[#183153]">{instrument.designation}</h1></div>
        <WorkflowBadge state={evaluation.state as EvaluationState} />
      </div>
      <p className="text-sm text-slate-600">Application <strong className="text-slate-900">{evaluation.applicationNumber}</strong> · Sample {instrument.sampleIdentifier} · <strong>{current ? `Current revision v${current.versionNo}` : "No saved specification"}</strong></p>
    </header>

    {instrument.evaluations.length > 1 && <nav aria-label="Evaluation history" className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">Evaluation history — select a record</h2>
      <div className="flex flex-wrap gap-3">{instrument.evaluations.map(item => <Link key={item.id}
        href={`${basePath}/specifications?evaluation=${encodeURIComponent(item.id)}`} aria-current={item.id === evaluation.id ? "page" : undefined}
        className={`rounded-md border px-3 py-2 text-sm ${item.id === evaluation.id ? "border-teal-700 bg-teal-50 text-teal-900" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
        {item.applicationNumber} · {item.state.replaceAll("_", " ")}
      </Link>)}</div>
    </nav>}

    <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
      Declared characteristics and manual findings support laboratory intake. Saving does not determine profile support or full OIML conformity. <strong className="text-slate-900">Full type conformity: NOT DETERMINED.</strong> Only selected demonstration tests are in scope.
    </p>
    <SpecificationForm key={`${evaluation.id}:${current?.id ?? "new"}:${rowVersion}:${evaluation.state}`}
      evaluationId={evaluation.id} expectedRowVersion={rowVersion} currentRevision={current}
      isTester={assigned && editableState}
      readOnlyReason={!assigned ? "Read-only: only the assigned laboratory tester may save specifications." : `Evaluation locked (${evaluation.state}). Specifications can only be edited in DRAFT, PLANNED, TESTING or CORRECTION_REQUESTED.`} />

    <section aria-labelledby="revision-history" className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-xs">
      <div className="flex items-center justify-between gap-3"><h2 id="revision-history" className="text-lg font-bold text-[#183153]">Revision history</h2><span className="text-sm text-slate-500">{revisions.length} saved revisions</span></div>
      <p className="text-sm text-slate-600">All previous revisions are retained. Expand any revision to inspect its declarations and manual findings. Times shown in India Standard Time (IST).</p>
      <RevisionHistoryTable revisions={revisions} currentRevisionId={current?.id} />
    </section>
  </div>;
}
