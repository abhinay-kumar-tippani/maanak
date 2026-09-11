"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Scale,
  ShieldCheck,
  FileText,
  History,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const isDashboard = pathname === "/dashboard";
  const isInstruments = pathname.startsWith("/instruments");
  const isApprovals = pathname.startsWith("/approvals");
  const isReports = pathname.startsWith("/reports");

  return (
    <aside className="w-64 bg-[#183153] text-white flex flex-col shrink-0 border-r border-slate-800">
      {/* Laboratory Title */}
      <div className="p-5 border-b border-slate-700/60">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded bg-[#176B67] flex items-center justify-center text-white font-bold text-base shadow-xs">
            NL
          </div>
          <div>
            <div className="font-bold text-base tracking-tight text-white leading-tight">
              NAWI Lab
            </div>
            <div className="text-[11px] text-slate-300 tracking-wide uppercase font-medium">
              Legal Metrology Portal
            </div>
          </div>
        </div>
      </div>

      {/* Navigation section */}
      <nav className="flex-1 px-3 py-4 space-y-1.5" aria-label="Sidebar Navigation">
        {/* 1. Dashboard */}
        <Link
          href="/dashboard"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold transition-none shadow-xs ${
            isDashboard
              ? "bg-[#176B67] text-white"
              : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
          }`}
        >
          <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Dashboard</span>
        </Link>

        {/* 2. Instruments */}
        <Link
          href="/instruments"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold transition-none shadow-xs ${
            isInstruments
              ? "bg-[#176B67] text-white"
              : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
          }`}
        >
          <Scale className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Instruments</span>
        </Link>

        <Link href="/approvals" className={`flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium ${isApprovals?"bg-[#176B67] text-white":"text-slate-300 hover:bg-slate-800/60"}`}>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <span>Approvals</span>
          </div>
        </Link>

        <Link href="/reports" className={`flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium ${isReports?"bg-[#176B67] text-white":"text-slate-300 hover:bg-slate-800/60"}`}>
          <div className="flex items-center gap-3">
            <FileText className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <span>Reports</span>
          </div>
        </Link>

        {/* 5. Audit Trail (Inactive - route not yet implemented) */}
        <div
          aria-disabled="true"
          className="flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium text-slate-400 opacity-60 cursor-not-allowed select-none"
        >
          <div className="flex items-center gap-3">
            <History className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <span>Audit Trail</span>
          </div>
          <span className="flex items-center gap-1 text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            Next
          </span>
        </div>
      </nav>

      {/* Standards Architecture Info in Footer */}
      <div className="p-4 border-t border-slate-700/60 bg-[#12253f] text-slate-400 text-xs">
        <div className="font-semibold text-slate-200">Legal Metrology Base</div>
        <div className="mt-1 text-[11px] leading-relaxed text-slate-400">
          OIML R 76-1:2006 / R 76-2:2007
        </div>
        <div className="mt-0.5 text-[10px] font-mono text-slate-400">
          Single-Interval Class III
        </div>
      </div>
    </aside>
  );
}
