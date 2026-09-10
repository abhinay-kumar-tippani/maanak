"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  InstrumentCategory,
  InstrumentRegistrationInput,
  RegistrationResult,
} from "@/contracts/instruments";
import { registerInstrument } from "@/server/actions/instruments";
import { WorkflowBadge } from "@/components/status/workflow-badge";
import {
  Building2,
  Scale,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Plus,
} from "lucide-react";

interface InstrumentRegistrationFormProps {
  currentTesterId: string;
  currentTesterName: string;
}

export function InstrumentRegistrationForm({
  currentTesterId,
  currentTesterName,
}: InstrumentRegistrationFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    manufacturerName: "",
    manufacturerAddress: "",
    applicantName: "",
    applicantAddress: "",
    sameAsManufacturer: false,
    designation: "",
    category: "COMPLETE_INSTRUMENT" as InstrumentCategory,
    description: "",
    sampleIdentifier: "",
    serialNumber: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successResult, setSuccessResult] = useState<RegistrationResult | null>(null);

  const handleSameAsManufacturer = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      sameAsManufacturer: checked,
      applicantName: checked ? prev.manufacturerName : prev.applicantName,
      applicantAddress: checked ? prev.manufacturerAddress : prev.applicantAddress,
    }));
    if (checked) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.applicantName;
        delete next.applicantAddress;
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    // Client-side quick check
    const errors: Record<string, string> = {};
    if (!formData.manufacturerName.trim()) {
      errors.manufacturerName = "Manufacturer name is required.";
    }
    if (!formData.manufacturerAddress.trim()) {
      errors.manufacturerAddress = "Manufacturer address is required.";
    }
    if (!formData.applicantName.trim()) {
      errors.applicantName = "Applicant name is required.";
    }
    if (!formData.applicantAddress.trim()) {
      errors.applicantAddress = "Applicant address is required.";
    }
    if (!formData.designation.trim()) {
      errors.designation = "Model/instrument designation is required.";
    }
    if (!formData.sampleIdentifier.trim()) {
      errors.sampleIdentifier = "Sample identifier is required.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMessage("Please complete all required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: InstrumentRegistrationInput = {
        manufacturerName: formData.manufacturerName.trim(),
        manufacturerAddress: formData.manufacturerAddress.trim(),
        applicantName: formData.applicantName.trim(),
        applicantAddress: formData.applicantAddress.trim(),
        designation: formData.designation.trim(),
        category: formData.category,
        description: formData.description.trim() ? formData.description.trim() : null,
        sampleIdentifier: formData.sampleIdentifier.trim(),
        serialNumber: formData.serialNumber.trim() ? formData.serialNumber.trim() : null,
        assignedTesterId: currentTesterId,
      };

      const result = await registerInstrument(payload);

      if (!result.ok) {
        // Safe mapping of ActionResult errors without exposing raw SQL or server internals
        if (result.error.code === "DUPLICATE_SAMPLE") {
          setErrorMessage("That sample identifier is already registered in this laboratory.");
          setFieldErrors({
            sampleIdentifier: "Sample identifier already exists. Must be unique within the laboratory.",
          });
        } else if (result.error.code === "PERMISSION_DENIED") {
          setErrorMessage("You are not permitted to register an instrument. Only laboratory Testers can register new specimens.");
        } else if (result.error.code === "VALIDATION_ERROR") {
          setErrorMessage("The registration details are invalid. Please check the form errors.");
          if (result.error.fieldErrors) {
            setFieldErrors(result.error.fieldErrors);
          }
        } else {
          setErrorMessage("The instrument registration could not be completed. Please verify details and try again.");
        }
        return;
      }

      setSuccessResult(result.data);
      router.refresh();
    } catch {
      setErrorMessage("An unexpected network error occurred while submitting the registration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // If successfully registered, display success confirmation view
  if (successResult) {
    return (
      <div className="bg-white rounded-lg border border-emerald-200 p-8 shadow-xs space-y-6">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
            <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              Registration Complete
            </span>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Instrument Registered Successfully
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              The submitted specimen has been registered and initialized in the laboratory repository.
            </p>
          </div>
        </div>

        {/* Confirmation Details Card */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-500 font-medium">Generated Application Number</span>
            <div className="text-base font-bold text-[#183153] font-mono mt-0.5">
              {successResult.applicationNumber}
            </div>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Initial Workflow State</span>
            <div className="mt-1">
              <WorkflowBadge state={successResult.state} />
            </div>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Model Designation</span>
            <div className="text-sm font-semibold text-slate-900 mt-0.5">
              {successResult.designation}
            </div>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Sample Identifier</span>
            <div className="text-sm font-mono font-medium text-slate-900 mt-0.5">
              {successResult.sampleIdentifier}
            </div>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Manufacturer</span>
            <div className="text-slate-800 mt-0.5">{successResult.manufacturerName}</div>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Applicant</span>
            <div className="text-slate-800 mt-0.5">{successResult.applicantName}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            href={`/instruments/${successResult.instrumentId}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#183153] text-white text-sm font-semibold hover:bg-[#12253f] shadow-xs"
          >
            <span>View Instrument Record</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href="/instruments"
            className="inline-flex items-center px-4 py-2 rounded-md bg-white border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50"
          >
            Return to Instruments List
          </Link>
          <button
            type="button"
            onClick={() => {
              setSuccessResult(null);
              setFormData({
                manufacturerName: "",
                manufacturerAddress: "",
                applicantName: "",
                applicantAddress: "",
                sameAsManufacturer: false,
                designation: "",
                category: "COMPLETE_INSTRUMENT",
                description: "",
                sampleIdentifier: "",
                serialNumber: "",
              });
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:underline"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Register Another Specimen</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Top Banner Error Display */}
      {errorMessage && (
        <div
          role="alert"
          className="rounded-md border border-rose-300 bg-rose-50 p-4 text-rose-900 flex items-start gap-3 text-xs"
        >
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <span className="font-bold">Registration Error: </span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Fieldset 1: Manufacturer Information */}
      <fieldset className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-4">
        <legend className="px-2 font-bold text-sm uppercase tracking-wider text-[#183153] flex items-center gap-2">
          <Building2 className="h-4 w-4 text-[#176B67]" aria-hidden="true" />
          <span>Manufacturer Information</span>
        </legend>
        <p className="text-xs text-slate-500">
          The legal entity responsible for manufacturing the weighing instrument according to OIML R 76-1.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label htmlFor="manufacturerName" className="block text-xs font-semibold text-slate-800">
              Manufacturer Name <span className="text-rose-500" aria-hidden="true">*</span>
            </label>
            <input
              id="manufacturerName"
              type="text"
              required
              maxLength={200}
              placeholder="e.g. Avery Weigh-Tronix India Ltd."
              value={formData.manufacturerName}
              onChange={(e) => {
                const val = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  manufacturerName: val,
                  applicantName: prev.sameAsManufacturer ? val : prev.applicantName,
                }));
              }}
              className={`mt-1 block w-full rounded-md border text-xs px-3 py-2 text-slate-900 shadow-2xs focus:border-[#176B67] focus:ring-1 focus:ring-[#176B67] ${
                fieldErrors.manufacturerName ? "border-rose-400 bg-rose-50/20" : "border-slate-300 bg-white"
              }`}
            />
            {fieldErrors.manufacturerName && (
              <p className="mt-1 text-[11px] text-rose-600">{fieldErrors.manufacturerName}</p>
            )}
          </div>

          <div>
            <label htmlFor="manufacturerAddress" className="block text-xs font-semibold text-slate-800">
              Manufacturer Address <span className="text-rose-500" aria-hidden="true">*</span>
            </label>
            <input
              id="manufacturerAddress"
              type="text"
              required
              maxLength={500}
              placeholder="e.g. Plot 12, Industrial Area, Sector 58, Ballabgarh, Haryana"
              value={formData.manufacturerAddress}
              onChange={(e) => {
                const val = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  manufacturerAddress: val,
                  applicantAddress: prev.sameAsManufacturer ? val : prev.applicantAddress,
                }));
              }}
              className={`mt-1 block w-full rounded-md border text-xs px-3 py-2 text-slate-900 shadow-2xs focus:border-[#176B67] focus:ring-1 focus:ring-[#176B67] ${
                fieldErrors.manufacturerAddress ? "border-rose-400 bg-rose-50/20" : "border-slate-300 bg-white"
              }`}
            />
            {fieldErrors.manufacturerAddress && (
              <p className="mt-1 text-[11px] text-rose-600">{fieldErrors.manufacturerAddress}</p>
            )}
          </div>
        </div>
      </fieldset>

      {/* Fieldset 2: Applicant Information */}
      <fieldset className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-4">
        <legend className="px-2 font-bold text-sm uppercase tracking-wider text-[#183153] flex items-center gap-2">
          <Building2 className="h-4 w-4 text-[#176B67]" aria-hidden="true" />
          <span>Applicant Information</span>
        </legend>
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            The entity submitting the representative specimen for type evaluation.
          </p>
          <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none">
            <input
              type="checkbox"
              checked={formData.sameAsManufacturer}
              onChange={(e) => handleSameAsManufacturer(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-300 text-[#176B67] focus:ring-[#176B67]"
            />
            <span>Same as manufacturer</span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label htmlFor="applicantName" className="block text-xs font-semibold text-slate-800">
              Applicant Name <span className="text-rose-500" aria-hidden="true">*</span>
            </label>
            <input
              id="applicantName"
              type="text"
              required
              disabled={formData.sameAsManufacturer}
              maxLength={200}
              placeholder="e.g. Avery Weigh-Tronix India Ltd."
              value={formData.applicantName}
              onChange={(e) => setFormData((prev) => ({ ...prev, applicantName: e.target.value }))}
              className={`mt-1 block w-full rounded-md border text-xs px-3 py-2 text-slate-900 shadow-2xs focus:border-[#176B67] focus:ring-1 focus:ring-[#176B67] disabled:bg-slate-100 disabled:text-slate-500 ${
                fieldErrors.applicantName ? "border-rose-400 bg-rose-50/20" : "border-slate-300 bg-white"
              }`}
            />
            {fieldErrors.applicantName && (
              <p className="mt-1 text-[11px] text-rose-600">{fieldErrors.applicantName}</p>
            )}
          </div>

          <div>
            <label htmlFor="applicantAddress" className="block text-xs font-semibold text-slate-800">
              Applicant Address <span className="text-rose-500" aria-hidden="true">*</span>
            </label>
            <input
              id="applicantAddress"
              type="text"
              required
              disabled={formData.sameAsManufacturer}
              maxLength={500}
              placeholder="e.g. Plot 12, Industrial Area, Sector 58, Ballabgarh, Haryana"
              value={formData.applicantAddress}
              onChange={(e) => setFormData((prev) => ({ ...prev, applicantAddress: e.target.value }))}
              className={`mt-1 block w-full rounded-md border text-xs px-3 py-2 text-slate-900 shadow-2xs focus:border-[#176B67] focus:ring-1 focus:ring-[#176B67] disabled:bg-slate-100 disabled:text-slate-500 ${
                fieldErrors.applicantAddress ? "border-rose-400 bg-rose-50/20" : "border-slate-300 bg-white"
              }`}
            />
            {fieldErrors.applicantAddress && (
              <p className="mt-1 text-[11px] text-rose-600">{fieldErrors.applicantAddress}</p>
            )}
          </div>
        </div>
      </fieldset>

      {/* Fieldset 3: Model & Specimen Identification */}
      <fieldset className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-4">
        <legend className="px-2 font-bold text-sm uppercase tracking-wider text-[#183153] flex items-center gap-2">
          <Scale className="h-4 w-4 text-[#176B67]" aria-hidden="true" />
          <span>Model Designation &amp; Specimen Characteristics</span>
        </legend>
        <p className="text-xs text-slate-500">
          Identification of the weighing instrument model and physical sample submitted for laboratory testing.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label htmlFor="designation" className="block text-xs font-semibold text-slate-800">
              Model / Instrument Designation <span className="text-rose-500" aria-hidden="true">*</span>
            </label>
            <input
              id="designation"
              type="text"
              required
              maxLength={200}
              placeholder="e.g. DEMO-30 Digital Platform Scale"
              value={formData.designation}
              onChange={(e) => setFormData((prev) => ({ ...prev, designation: e.target.value }))}
              className={`mt-1 block w-full rounded-md border text-xs px-3 py-2 text-slate-900 shadow-2xs focus:border-[#176B67] focus:ring-1 focus:ring-[#176B67] ${
                fieldErrors.designation ? "border-rose-400 bg-rose-50/20" : "border-slate-300 bg-white"
              }`}
            />
            {fieldErrors.designation && (
              <p className="mt-1 text-[11px] text-rose-600">{fieldErrors.designation}</p>
            )}
          </div>

          <div>
            <label htmlFor="category" className="block text-xs font-semibold text-slate-800">
              Instrument Category <span className="text-rose-500" aria-hidden="true">*</span>
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  category: e.target.value as InstrumentCategory,
                }))
              }
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white text-xs px-3 py-2 text-slate-900 shadow-2xs focus:border-[#176B67] focus:ring-1 focus:ring-[#176B67]"
            >
              <option value="COMPLETE_INSTRUMENT">Complete Instrument (R 76-1 2.2)</option>
              <option value="MODULE">Module (Indicator / Load Receptor)</option>
            </select>
          </div>

          <div>
            <label htmlFor="sampleIdentifier" className="block text-xs font-semibold text-slate-800">
              Sample Identifier <span className="text-rose-500" aria-hidden="true">*</span>
            </label>
            <input
              id="sampleIdentifier"
              type="text"
              required
              maxLength={200}
              placeholder="e.g. SAMPLE-2026-001"
              value={formData.sampleIdentifier}
              onChange={(e) => setFormData((prev) => ({ ...prev, sampleIdentifier: e.target.value }))}
              className={`mt-1 block w-full rounded-md border text-xs px-3 py-2 font-mono text-slate-900 shadow-2xs focus:border-[#176B67] focus:ring-1 focus:ring-[#176B67] ${
                fieldErrors.sampleIdentifier ? "border-rose-400 bg-rose-50/20" : "border-slate-300 bg-white"
              }`}
            />
            <p className="mt-1 text-[10px] text-slate-400">
              Unique laboratory specimen tag or physical receipt code.
            </p>
            {fieldErrors.sampleIdentifier && (
              <p className="mt-1 text-[11px] text-rose-600">{fieldErrors.sampleIdentifier}</p>
            )}
          </div>

          <div>
            <label htmlFor="serialNumber" className="block text-xs font-semibold text-slate-800">
              Serial Number <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              id="serialNumber"
              type="text"
              maxLength={200}
              placeholder="e.g. SN-883492"
              value={formData.serialNumber}
              onChange={(e) => setFormData((prev) => ({ ...prev, serialNumber: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white text-xs px-3 py-2 font-mono text-slate-900 shadow-2xs focus:border-[#176B67] focus:ring-1 focus:ring-[#176B67]"
            />
            <p className="mt-1 text-[10px] text-slate-400">
              Manufacturer serial number if stamped on nameplate.
            </p>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="description" className="block text-xs font-semibold text-slate-800">
              Instrument Description <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              id="description"
              rows={3}
              maxLength={2000}
              placeholder="Describe construction, platform dimensions, display type, and submitted documentation..."
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white text-xs px-3 py-2 text-slate-900 shadow-2xs focus:border-[#176B67] focus:ring-1 focus:ring-[#176B67]"
            />
          </div>
        </div>
      </fieldset>

      {/* Section 4: Safe Read-only Context (No editable role/actor/IDs) */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <UserCheck className="h-4 w-4 text-[#176B67]" aria-hidden="true" />
          <span>
            <strong className="font-semibold text-slate-900">Assigned Tester:</strong>{" "}
            {currentTesterName} <span className="text-slate-500 font-mono">(Current Tester)</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Initial State:</span>
          <WorkflowBadge state="DRAFT" />
        </div>
      </div>

      {/* Form Submission Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          href="/instruments"
          className="px-4 py-2 rounded-md bg-white border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-md bg-[#183153] text-white text-sm font-semibold hover:bg-[#12253f] disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
        >
          {isSubmitting ? (
            <span>Registering Instrument...</span>
          ) : (
            <>
              <span>Submit Registration</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

