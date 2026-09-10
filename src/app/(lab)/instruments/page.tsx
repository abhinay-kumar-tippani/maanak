import Link from "next/link";
import { redirect } from "next/navigation";
import { requireActor, AuthorizationError } from "@/server/auth/authorize";
import { listInstruments } from "@/server/instruments/queries";
import { InstrumentListTable } from "@/features/instruments/components";
import { Plus, Scale } from "lucide-react";

export default async function InstrumentsPage() {
  let actor;
  try {
    actor = await requireActor();
  } catch (error) {
    if (
      error instanceof AuthorizationError &&
      (error.code === "AUTH_REQUIRED" || error.code === "PROFILE_REQUIRED")
    ) {
      redirect("/login");
    }
    if (
      error instanceof AuthorizationError &&
      error.code === "CONFIGURATION_ERROR"
    ) {
      redirect("/login?error=config");
    }
    throw error;
  }

  const instruments = await listInstruments();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Scale className="h-6 w-6 text-[#183153]" aria-hidden="true" />
            <h1 className="text-2xl font-bold tracking-tight text-[#183153]">
              Instruments &amp; Specimens
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Authorized NAWI specimen intake and active evaluation records for this laboratory.
          </p>
        </div>

        {/* Action button - only visible if role is TESTER or viewable by all with appropriate permissions */}
        {actor.role === "TESTER" && (
          <Link
            href="/instruments/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#183153] text-white text-sm font-semibold hover:bg-[#12253f] shadow-xs"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Register Instrument</span>
          </Link>
        )}
      </div>

      {/* Instruments Table or Empty State */}
      <InstrumentListTable instruments={instruments} />
    </div>
  );
}

