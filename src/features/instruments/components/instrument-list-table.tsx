import Link from "next/link";
import type { InstrumentListRow } from "@/contracts/instruments";
import type { EvaluationState } from "@/contracts/domain";
import { WorkflowBadge } from "@/components/status/workflow-badge";
import { Scale, Plus, ArrowRight, Calendar, Building2 } from "lucide-react";

interface InstrumentListTableProps {
  instruments: InstrumentListRow[];
}

export function InstrumentListTable({ instruments }: InstrumentListTableProps) {
  if (instruments.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 sm:p-12 text-center shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-[#176B67] border border-slate-200">
          <Scale className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-base font-semibold text-slate-900">
          No instruments registered yet
        </h2>
        <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
          No non-automatic weighing instrument specimens have been registered in
          this laboratory. To begin a new OIML R 76 evaluation workflow, register
          the submitted specimen.
        </p>
        <div className="mt-6">
          <Link
            href="/instruments/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#183153] text-white text-sm font-semibold hover:bg-[#12253f] shadow-xs"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Register First Instrument</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th scope="col" className="py-3 px-4 font-mono text-[11px]">
                Application No.
              </th>
              <th scope="col" className="py-3 px-4">
                Designation / Category
              </th>
              <th scope="col" className="py-3 px-4">
                Sample Identifier
              </th>
              <th scope="col" className="py-3 px-4">
                Manufacturer
              </th>
              <th scope="col" className="py-3 px-4">
                Assigned Tester
              </th>
              <th scope="col" className="py-3 px-4">
                Workflow State
              </th>
              <th scope="col" className="py-3 px-4">
                Received Date
              </th>
              <th scope="col" className="py-3 px-4 text-right">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {instruments.map((row) => {
              const state = (row.currentEvaluation?.state ?? "DRAFT") as EvaluationState;
              const appNumber = row.currentEvaluation?.applicationNumber ?? "Pending";

              return (
                <tr key={row.id} className="hover:bg-slate-50/60 transition-none">
                  {/* Application Number */}
                  <td className="py-3.5 px-4 font-mono font-medium text-[#183153]">
                    {appNumber}
                  </td>

                  {/* Designation & Category */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900">
                      {row.designation}
                    </div>
                    <div className="text-[11px] text-slate-500 capitalize">
                      {row.category.toLowerCase().replace(/_/g, " ")}
                    </div>
                  </td>

                  {/* Sample Identifier */}
                  <td className="py-3.5 px-4 font-mono text-slate-800 font-medium">
                    {row.sampleIdentifier}
                    {row.serialNumber && (
                      <div className="text-[10px] text-slate-400 font-normal">
                        SN: {row.serialNumber}
                      </div>
                    )}
                  </td>

                  {/* Manufacturer */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-slate-800">
                      <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                      <span>{row.manufacturerName}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 pl-5">
                      Applicant: {row.applicantName}
                    </div>
                  </td>

                  {/* Assigned Tester */}
                  <td className="py-3.5 px-4 text-slate-700">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      Assigned Tester
                    </span>
                  </td>

                  {/* Workflow State */}
                  <td className="py-3.5 px-4">
                    <WorkflowBadge state={state} />
                  </td>

                  {/* Received Date */}
                  <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                      <span>
                        {new Date(row.receivedAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </td>

                  {/* Action Link */}
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/instruments/${row.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold text-[#183153] hover:bg-slate-100 border border-slate-200 hover:border-slate-300"
                    >
                      <span>View</span>
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

