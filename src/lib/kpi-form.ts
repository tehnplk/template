import type { KpiTemplatePayload } from "./kpi-types";

type ParseKpiTemplateFormResult =
  | { ok: true; data: KpiTemplatePayload }
  | { ok: false; message: string };

const optionalFields = [
  "target_area_type",
  "target_gender",
  "target_age_range",
  "target_other",
  "data_entry_inscl",
  "data_entry_diag",
  "data_entry_procedure",
  "data_entry_drug",
  "data_entry_lab",
  "data_entry_special_pp",
  "data_entry_other",
] as const;

function getTrimmedString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function getNullableString(formData: FormData, name: string): string | null {
  const value = getTrimmedString(formData, name);
  return value === "" ? null : value;
}

function getPositiveIntegerOrNull(formData: FormData, name: string): number | null {
  const value = getTrimmedString(formData, name);

  if (!/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);
  return parsed > 0 ? parsed : null;
}

function getKpiTypes(formData: FormData): string[] {
  return formData
    .getAll("kpi_type")
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function parseKpiTemplateForm(formData: FormData): ParseKpiTemplateFormResult {
  const kpiName = getTrimmedString(formData, "kpi_name");

  if (!kpiName) {
    return {
      ok: false,
      message: "KPI name is required.",
    };
  }

  const docName = getTrimmedString(formData, "doc_name");
  const docType = getTrimmedString(formData, "doc_type");
  const filePath = getNullableString(formData, "file_path");
  const hasDocument = Boolean(docName || docType || filePath);

  if (hasDocument && (!docName || !docType)) {
    return {
      ok: false,
      message: "Document name and type are required when adding a document.",
    };
  }

  const template = Object.fromEntries(
    optionalFields.map((field) => [field, getNullableString(formData, field)]),
  ) as KpiTemplatePayload["template"];

  return {
    ok: true,
    data: {
      topic: {
        id: getPositiveIntegerOrNull(formData, "id"),
        kpi_name: kpiName,
        is_active: formData.get("is_active") === "on",
        kpi_type: getKpiTypes(formData),
      },
      template,
      pm: {
        pm_name: getTrimmedString(formData, "pm_name"),
        pm_position: getNullableString(formData, "pm_position"),
        pm_department: getNullableString(formData, "pm_department"),
      },
      document: hasDocument
        ? {
            doc_name: docName,
            doc_type: docType,
            file_path: filePath,
          }
        : null,
    },
  };
}
