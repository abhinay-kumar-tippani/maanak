import Link from "next/link";
import { redirect } from "next/navigation";
import { requireActor, AuthorizationError } from "@/server/auth/authorize";
import { getInstrument } from "@/server/instruments/queries";
import { InstrumentDetailView } from "@/features/instruments/components";
import { ArrowLeft, AlertCircle } from "lucide-react";

interface InstrumentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function InstrumentDetailPage({
  params,
}: InstrumentDetailPageProps) {
  const { id } = await params;

  try {
    await requireActor();
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

  const instrument = await getInstrument(id);

  if (!instrument) {
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

        <div className="bg-white rounded-lg border border-slate-200 p-8 sm:p-12 text-center max-w-md mx-auto shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 border border-slate-200">
            <AlertCircle className="h-6 w-6 text-slate-400" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-slate-900">
            Instrument Record Not Found
          </h2>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            The requested instrument record could not be found or is outside your
            laboratory scope.
          </p>
          <div className="mt-6">
            <Link
              href="/instruments"
              className="inline-flex items-center px-4 py-2 rounded-md bg-[#183153] text-white text-sm font-semibold hover:bg-[#12253f]"
            >
              Return to Instruments
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <InstrumentDetailView instrument={instrument} />;
}

