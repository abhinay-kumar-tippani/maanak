import type { DashboardAuditEvent } from "@/contracts/dashboard";
import { History, Inbox } from "lucide-react";

interface RecentActivityTableProps {
  events: DashboardAuditEvent[];
}

export function RecentActivityTable({ events }: RecentActivityTableProps) {
  return (
    <section
      aria-label="Recent Laboratory Activity"
      className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden"
    >
      {/* Section Header */}
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-2.5">
          <History className="h-4 w-4 text-[#183153]" aria-hidden="true" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#183153]">
            Recent Laboratory Activity &amp; Audit Trail
          </h2>
        </div>
        <span className="text-xs font-medium text-slate-500">
          Append-only audit log
        </span>
      </div>

      {events.length === 0 ? (
        /* Honest empty state when database has zero audit events */
        <div className="p-8 sm:p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 border border-slate-200">
            <Inbox className="h-6 w-6 text-slate-400" aria-hidden="true" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900">
            No evaluations exist yet
          </h3>
          <p className="mt-2 text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
            The laboratory audit repository is empty. No specimen intake,
            specification revision, test observations, or review decisions have
            been recorded. Transactional events will appear here once evaluation
            workflows commence.
          </p>
          <div className="mt-4 inline-flex items-center px-3 py-1 rounded bg-slate-100 border border-slate-200 text-xs text-slate-600 font-mono">
            activityState: EMPTY &bull; 0 audit records
          </div>
        </div>
      ) : (
        /* Table when audit events exist */
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th scope="col" className="py-3 px-4 font-mono text-[11px]">
                  #
                </th>
                <th scope="col" className="py-3 px-4">
                  Action
                </th>
                <th scope="col" className="py-3 px-4">
                  Entity Type
                </th>
                <th scope="col" className="py-3 px-4">
                  Entity ID
                </th>
                <th scope="col" className="py-3 px-4">
                  Evaluation ID
                </th>
                <th scope="col" className="py-3 px-4">
                  Recorded At
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                    {event.id}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      {event.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 capitalize">
                    {event.entityType.replace(/_/g, " ")}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                    {event.entityId}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                    {event.evaluationId ?? "–"}
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                    {new Date(event.createdAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

