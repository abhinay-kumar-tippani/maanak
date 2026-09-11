import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sql = readFileSync("supabase/migrations/202609090008_demo_workflow.sql", "utf8");
const commands = [
  "command_save_observations", "command_start_retest", "command_record_result", "command_complete_test",
  "command_mark_ready", "command_submit", "command_review", "command_prepare_final", "command_finish_artifact",
  "command_fail_artifact", "command_reserve_attachment", "command_finish_attachment", "command_fail_attachment",
];

test("every demo workflow mutation is a narrow security-definer command", () => {
  for (const command of commands) {
    assert.match(sql, new RegExp(`function public\\.${command}\\(`));
    const body = sql.slice(sql.indexOf(`function public.${command}(`));
    assert.match(body.slice(0, 800), /security definer set search_path\s*=\s*''/i);
    assert.ok(sql.includes(`'public.${command}(`), `${command} must be in the revoke/grant allowlist`);
  }
  assert.match(sql, /execute 'revoke all on function '\|\|v_signature\|\|' from public,anon,authenticated'/);
  assert.match(sql, /execute 'grant execute on function '\|\|v_signature\|\|' to service_role'/);
  assert.doesNotMatch(sql, /grant execute on function public\.command_[^\n]+ to (?:authenticated|anon|public)/i);
  assert.doesNotMatch(sql, /arbitrary sql|table_name/i);
});

test("workflow SQL retains version, immutable-history and issuance guards", () => {
  for (const token of ["STALE_DATA", "COMPLETED_ATTEMPT_IMMUTABLE", "INDEPENDENT_REVIEW_REQUIRED", "CURRENT_PASS_OR_FAIL_RESULT_REQUIRED", "SELECTED_TESTS_INCOMPLETE", "PENDING_EVIDENCE", "REPORT_ISSUED"]) assert.ok(sql.includes(token));
  assert.match(sql, /p_submission_sha256[\s\S]+snapshot_sha256 is distinct from p_submission_sha256/);
  assert.match(sql, /p_decision<>'APPROVE' or v_has_fail/);
  assert.match(sql, /state='READY'[\s\S]+state='ISSUED'/);
});
