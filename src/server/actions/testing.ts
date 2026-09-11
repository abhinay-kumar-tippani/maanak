"use server";
import { revalidatePath } from "next/cache";
import type { SaveObservationsInput } from "@/contracts/testing";
import { completeTestService,evaluateTestService,markReadyService,saveObservationsService,startRetestService } from "@/server/workflow/evaluation";
export async function saveObservations(input:SaveObservationsInput){const r=await saveObservationsService(input);if(r.ok)revalidatePath(`/instruments`);return r;}
export async function evaluateTest(input:{evaluationId:string;sessionId:string;expectedEvaluationVersion:number;expectedSessionVersion:number}){const r=await evaluateTestService(input);if(r.ok)revalidatePath(`/instruments`);return r;}
export async function completeTest(input:{evaluationId:string;sessionId:string;expectedEvaluationVersion:number;expectedSessionVersion:number}){const r=await completeTestService(input);if(r.ok)revalidatePath(`/instruments`);return r;}
export async function startRetest(input:{evaluationId:string;planItemId:string;expectedEvaluationVersion:number;reason:string}){const r=await startRetestService(input);if(r.ok)revalidatePath(`/instruments`);return r;}
export async function markReady(input:{evaluationId:string;expectedEvaluationVersion:number}){const r=await markReadyService(input);if(r.ok)revalidatePath(`/instruments`);return r;}
