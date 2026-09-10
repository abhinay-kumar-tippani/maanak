import Link from "next/link";
import type { InstrumentDetail } from "@/contracts/instruments";
import type { EvaluationState } from "@/contracts/domain";
import { WorkflowBadge } from "@/components/status/workflow-badge";
import {
  Building2,
  Scale,
  Calendar,
  User,
  ArrowLeft,
  Lock,
  FileText,
  FileSpreadsheet,
} from "lucide-react";

interface InstrumentDetailViewProps {
  instrument: InstrumentDetail;
}

export function InstrumentDetailView({ instrument }: InstrumentDetailViewProps) {
  const latestEvaluation = instrument.evaluations[0] ?? instrument.currentEvaluation;
  const state = (latestEvaluation?.state ?? "DRAFT") as EvaluationState;
  const applicationNumber = latestEvaluation?.applicationNumber ?? "Pending";
  const assignedTesterId =
    latestEvaluation && "assignedTesterId" in latestEvaluation
      ? latestEvaluation.assignedTesterId
      : null;

  return (
    <div className="space-y-6">
      {/* Top Navigation Bar & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
            <Link
              href="/instruments"
              className="inline-flex items-center gap-1 text-[#176B67] hover:underline font-semibold"
            >
              <ArrowLeft className="h-3 w-3" aria-hidden="true" />
              <span>Instruments</span>
            </Link>
            <span>/</span>
            <span className="font-mono text-slate-700">{instrument.sampleIdentifier}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#183153]">
              {instrument.designation}
            </h1>
            <WorkflowBadge state={state} />
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Application: <span className="font-mono font-semibold text-slate-800">{applicationNumber}</span> &bull; Sample Identifier:{" "}
            <span className="font-mono font-semibold text-slate-800">{instrument.sampleIdentifier}</span>
          </p>
        </div>
      </div>

      {/* Main Grid: Specimen Info, Parties, and Workflow Context */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Model and Parties */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Model & Physical Specimen Characteristics */}
          <section
            aria-label="Model and Physical Specimen Details"
            className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs"
          >
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <Scale className="h-4 w-4 text-[#176B67]" aria-hidden="true" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#183153]">
                Specimen &amp; Model Identification
              </h2>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <dt className="text-slate-500 font-medium">Model Designation</dt>
                <dd className="text-sm font-semibold text-slate-900 mt-0.5">
                  {instrument.designation}
                </dd>
              </div>

              <div>
                <dt className="text-slate-500 font-medium">Instrument Category</dt>
                <dd className="text-sm font-semibold text-slate-900 mt-0.5 capitalize">
                  {instrument.category.toLowerCase().replace(/_/g, " ")}
                </dd>
              </div>

              <div>
                <dt className="text-slate-500 font-medium">Sample Identifier</dt>
                <dd className="text-sm font-mono font-bold text-[#183153] mt-0.5">
                  {instrument.sampleIdentifier}
                </dd>
              </div>

              <div>
                <dt className="text-slate-500 font-medium">Serial Number</dt>
                <dd className="text-sm font-mono text-slate-800 mt-0.5">
                  {instrument.serialNumber ?? "Not provided"}
                </dd>
              </div>

              <div>
                <dt className="text-slate-500 font-medium">Date Received / Registered</dt>
                <dd className="text-slate-800 mt-0.5 flex items-center gap-1.5 font-mono">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                  <span>
                    {new Date(instrument.receivedAt).toLocaleString(undefined, {
                      dateStyle: "long",
                      timeStyle: "short",
                    })}
                  </span>
                </dd>
              </div>

              <div className="sm:col-span-2">
                <dt className="text-slate-500 font-medium">Specimen Description</dt>
                <dd className="text-slate-800 mt-0.5 leading-relaxed bg-slate-50 p-3 rounded border border-slate-200">
                  {instrument.description ?? "No additional description was provided at registration."}
                </dd>
              </div>
            </dl>
          </section>

          {/* 2. Parties: Manufacturer and Applicant Shown Separately */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Manufacturer Card */}
            <section
              aria-label="Manufacturer Details"
              className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
                  <Building2 className="h-4 w-4 text-[#176B67]" aria-hidden="true" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#183153]">
                    Manufacturer
                  </h2>
                </div>
                <div className="text-xs space-y-2">
                  <div>
                    <span className="text-slate-500 font-medium block">Legal Entity Name</span>
                    <span className="text-sm font-semibold text-slate-900 mt-0.5 block">
                      {instrument.manufacturer.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">Registered Address</span>
                    <span className="text-slate-700 leading-relaxed block mt-0.5">
                      {instrument.manufacturer.address}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Applicant Card */}
            <section
              aria-label="Applicant Details"
              className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
                  <Building2 className="h-4 w-4 text-[#176B67]" aria-hidden="true" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#183153]">
                    Applicant
                  </h2>
                </div>
                <div className="text-xs space-y-2">
                  <div>
                    <span className="text-slate-500 font-medium block">Applicant Entity Name</span>
                    <span className="text-sm font-semibold text-slate-900 mt-0.5 block">
                      {instrument.applicant.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">Submitting Address</span>
                    <span className="text-slate-700 leading-relaxed block mt-0.5">
                      {instrument.applicant.address}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Right Column: Evaluation Status & Next Step */}
        <div className="space-y-6">
          {/* Evaluation Lifecycle Details */}
          <section
            aria-label="Evaluation Lifecycle Status"
            className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-4"
          >
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText className="h-4 w-4 text-[#176B67]" aria-hidden="true" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#183153]">
                Evaluation Case
              </h2>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 font-medium block">Application Number</span>
                <span className="font-mono text-sm font-bold text-[#183153] block mt-0.5">
                  {applicationNumber}
                </span>
              </div>

              <div>
                <span className="text-slate-500 font-medium block">Current State</span>
                <div className="mt-1">
                  <WorkflowBadge state={state} />
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-medium block">Assigned Tester</span>
                <div className="flex items-center gap-1.5 mt-1 text-slate-800">
                  <User className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                  <span className="font-medium">Assigned Laboratory Tester</span>
                </div>
                {assignedTesterId && (
                  <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                    UUID: {assignedTesterId}
                  </span>
                )}
              </div>
            </div>

            {/* Next Workflow Step Notice - strictly no dead links to uncreated pages */}
            <div className="mt-6 pt-4 border-t border-slate-200">
              <span className="text-xs font-semibold text-slate-700 block mb-2">
                Next Workflow Step
              </span>
              <div
                aria-disabled="true"
                className="p-3.5 rounded-md border border-slate-200 bg-slate-50 text-slate-600 flex items-start gap-2.5 cursor-not-allowed select-none"
              >
                <FileSpreadsheet className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">
                      Technical Specifications Intake
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-200 text-slate-600 border border-slate-300">
                      <Lock className="h-2.5 w-2.5" aria-hidden="true" />
                      Stage 2
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500 leading-tight">
                    Specification characteristics, capacity, and accuracy class definition will be enabled in the next stage.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Standard Metrology Scope Notice */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-5 text-xs text-slate-600 leading-relaxed">
            <h3 className="font-bold text-[#183153] mb-1">
              Metrology Reference Notice
            </h3>
            <p className="text-[11px] text-slate-500">
              According to OIML R 76-1:2006 (clause 8.2.1), representative instrument submission and document examination precede physical metrology testing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

