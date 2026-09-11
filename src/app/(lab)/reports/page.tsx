import { createSupabaseServerClient } from "@/lib/supabase/server";
import { IssueButton } from "@/features/testing/issue-client";
import { requireActor } from "@/server/auth/authorize";
import { listReports } from "@/server/reports/queries";

export const dynamic = "force-dynamic";

export default async function Page() {
  const actor = await requireActor();
  const reports = await listReports();
  return <div className="space-y-5">
    <header><h1 className="text-2xl font-bold text-[#183153]">Reports</h1><p className="text-sm text-slate-600">Approved selected-test snapshots and private issued PDF artifacts.</p></header>
    {!reports.ok ? <p>{reports.error.message}</p> : reports.data.length === 0 ? <p className="rounded border bg-white p-8 text-center text-slate-600">No reports are available.</p> : await Promise.all(reports.data.map(async report => {
      let version = 0;
      const db = await createSupabaseServerClient();
      if (db) { const { data } = await db.from("evaluations").select("row_version::text").eq("id", report.evaluationId).single(); version = Number(data?.row_version ?? 0); }
      return <article key={report.evaluationId} className="rounded border bg-white p-5">
        <h2 className="font-bold">{report.reportNumber} · {report.applicationNumber}</h2>
        <p className="text-sm text-slate-600">State {report.state} · final version {report.versionNo || "not generated"} · artifact {report.artifactState ?? "none"}</p>
        <div className="mt-3">{report.state === "APPROVED" && actor.role === "APPROVER" && <IssueButton evaluationId={report.evaluationId} version={version}/>} {report.artifactId && report.artifactState === "READY" && <a href={`/api/reports/${report.artifactId}/download`} className="rounded bg-[#183153] px-4 py-2 text-sm font-semibold text-white">Download private PDF</a>}</div>
        {report.sha256 && <p className="mt-3 break-all font-mono text-xs text-slate-500">PDF SHA-256 {report.sha256}</p>}
      </article>;
    }))}
  </div>;
}
