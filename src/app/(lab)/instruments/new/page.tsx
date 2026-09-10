import Link from "next/link";
import { redirect } from "next/navigation";
import { requireActor, AuthorizationError } from "@/server/auth/authorize";
import { InstrumentRegistrationForm } from "@/features/instruments/components";
import { ArrowLeft, ShieldAlert } from "lucide-react";

export default async function NewInstrumentPage() {
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

  // Guard: Only TESTER role can register instruments
  if (actor.role !== "TESTER") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link
            href="/instruments"
            className="inline-flex items-center gap-1 text-[#176B67] hover:underline font-semibold"
          >
            <ArrowLeft className="h-3 w-3" aria-hidden="true" />
            <span>Back to Instruments</span>
          </Link>
        </div>

        <div className="bg-white rounded-lg border border-amber-200 p-8 shadow-xs text-center max-w-lg mx-auto">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700 border border-amber-200">
            <ShieldAlert className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-slate-900">
            Registration Restricted
          </h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Instrument specimen intake and registration is restricted to laboratory
            Testers. Your current active role is{" "}
            <span className="font-semibold text-slate-800">{actor.role}</span>.
          </p>
          <div className="mt-6">
            <Link
              href="/instruments"
              className="inline-flex items-center px-4 py-2 rounded-md bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 border border-slate-300"
            >
              Return to Instruments List
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
          <Link
            href="/instruments"
            className="inline-flex items-center gap-1 text-[#176B67] hover:underline font-semibold"
          >
            <ArrowLeft className="h-3 w-3" aria-hidden="true" />
            <span>Instruments</span>
          </Link>
          <span>/</span>
          <span className="text-slate-700 font-medium">New Registration</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#183153]">
          Register New NAWI Specimen
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Enter specimen identification, applicant, and manufacturer details to
          initialize an OIML R 76 evaluation record.
        </p>
      </div>

      {/* Registration Form */}
      <InstrumentRegistrationForm
        currentTesterId={actor.id}
        currentTesterName={actor.displayName}
      />
    </div>
  );
}

