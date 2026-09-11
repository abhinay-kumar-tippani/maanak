"use server";
import {revalidatePath}from"next/cache";import type{ReviewDecision}from"@/contracts/reports";import{reviewSubmission,submitEvaluation}from"@/server/reports/review";
export async function submitForReview(input:{evaluationId:string;expectedEvaluationVersion:number}){const r=await submitEvaluation(input);if(r.ok){revalidatePath("/approvals");revalidatePath("/reports");}return r;}
export async function decideReview(input:{evaluationId:string;expectedEvaluationVersion:number;submissionId:string;submissionSha256:string;decision:ReviewDecision;comment?:string}){const r=await reviewSubmission(input);if(r.ok){revalidatePath("/approvals");revalidatePath("/reports");}return r;}
