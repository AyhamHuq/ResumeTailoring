import type { ValidationIssue } from "../shared";

type ValidationResult = {
  success?: boolean;
  valid?: boolean;
  issues?: ValidationIssue[] | Array<Record<string, unknown>>;
};

type JsonProvider = {
  completeJson: (input: unknown) => Promise<unknown>;
};

export type GenerateResumeWithRepairInput = {
  provider: JsonProvider;
  request: Record<string, unknown>;
  validate: (response: Record<string, unknown>) => ValidationResult;
};

function isValid(result: ValidationResult): boolean {
  return Boolean(result.success ?? result.valid);
}

export async function generateResumeWithRepair({
  provider,
  request,
  validate
}: GenerateResumeWithRepairInput): Promise<Record<string, unknown>> {
  const first = await provider.completeJson({
    phase: "initial",
    request
  }) as Record<string, unknown>;

  const firstValidation = validate(first);
  if (isValid(firstValidation)) {
    return first;
  }

  const repaired = await provider.completeJson({
    phase: "repair",
    request,
    previous_output: first,
    validation_issues: firstValidation.issues ?? []
  }) as Record<string, unknown>;

  const repairedValidation = validate(repaired);
  if (!isValid(repairedValidation)) {
    const issueText = JSON.stringify(repairedValidation.issues ?? []);
    throw new Error(`Model repair failed validation: ${issueText}`);
  }

  return repaired;
}

export const generateWithRepair = generateResumeWithRepair;
export const generateResume = generateResumeWithRepair;
