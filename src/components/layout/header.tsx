import { signOut } from "@/server/auth/actions";
import type { LabRole } from "@/server/auth/authorize";
import { LogOut, User } from "lucide-react";

interface HeaderProps {
  actor: {
    displayName: string;
    role: LabRole;
    laboratoryId?: string;
  };
}

const roleStyles: Record<LabRole, { bg: string; text: string; border: string }> = {
  TESTER: {
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-200",
  },
  APPROVER: {
    bg: "bg-teal-50",
    text: "text-[#176B67]",
    border: "border-teal-300",
  },
  ADMIN: {
    bg: "bg-purple-50",
    text: "text-purple-800",
    border: "border-purple-200",
  },
};

export function Header({ actor }: HeaderProps) {
  const roleStyle = roleStyles[actor.role] ?? {
    bg: "bg-slate-100",
    text: "text-slate-800",
    border: "border-slate-300",
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Branding & Prototype Label */}
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold tracking-tight text-[#183153]">
            NAWI Lab
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-[#176B67] text-white">
            SIH26035 Prototype
          </span>
        </div>

        {/* Right: Authenticated User Display Name, Role Badge, and Sign Out */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 border-r border-slate-200 pr-4">
            <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700">
              <User className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-900 leading-tight">
                {actor.displayName}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}
                >
                  {actor.role}
                </span>
              </div>
            </div>
          </div>

          {/* Sign out form */}
          <form action={signOut}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
              title="Sign out of laboratory session"
            >
              <LogOut className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
              <span>Sign out</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

