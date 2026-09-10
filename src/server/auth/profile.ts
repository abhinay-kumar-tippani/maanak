import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthenticatedProfile = { userId: string; laboratoryId: string; displayName: string; role: "TESTER" | "APPROVER" | "ADMIN" };

export async function getAuthenticatedProfile() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { profile: null, authenticated: false, configurationError: true };
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || typeof userId !== "string") return { profile: null, authenticated: false, configurationError: false };
  const { data, error } = await supabase.from("profiles").select("laboratory_id, display_name, role, active").eq("id", userId).maybeSingle();
  if (error || !data?.active || !["TESTER", "APPROVER", "ADMIN"].includes(data.role)) return { profile: null, authenticated: true, configurationError: false };
  return { profile: { userId, laboratoryId: data.laboratory_id, displayName: data.display_name, role: data.role as AuthenticatedProfile["role"] }, authenticated: true, configurationError: false };
}
