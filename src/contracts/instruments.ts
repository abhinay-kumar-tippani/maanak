export type InstrumentCategory = "COMPLETE_INSTRUMENT" | "MODULE";

export type InstrumentRegistrationInput = {
  manufacturerName: string;
  manufacturerAddress: string;
  applicantName: string;
  applicantAddress: string;
  designation: string;
  category: InstrumentCategory;
  description: string | null;
  sampleIdentifier: string;
  serialNumber: string | null;
  assignedTesterId: string;
};

export type InstrumentListRow = {
  id: string;
  sampleIdentifier: string;
  serialNumber: string | null;
  receivedAt: string;
  designation: string;
  category: string;
  manufacturerName: string;
  applicantName: string;
  currentEvaluation: { id: string; applicationNumber: string; state: string } | null;
};

export type InstrumentDetail = InstrumentListRow & {
  description: string | null;
  manufacturer: { id: string; name: string; address: string };
  applicant: { id: string; name: string; address: string };
  evaluations: { id: string; applicationNumber: string; state: string; assignedTesterId: string; updatedAt: string }[];
};

export type RegistrationResult = {
  instrumentId: string;
  modelId: string;
  manufacturerId: string;
  applicantId: string;
  evaluationId: string;
  applicationNumber: string;
  state: "DRAFT";
  sampleIdentifier: string;
  designation: string;
  manufacturerName: string;
  applicantName: string;
};
