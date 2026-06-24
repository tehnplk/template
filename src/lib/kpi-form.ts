import type { KpiTemplatePayload } from "./kpi-types";

type ParseKpiTemplateFormResult =
  | { ok: true; data: KpiTemplatePayload }
  | { ok: false; message: string };

const optionalFields = [
  "target_area_type",
  "target_gender",
  "target_age_range",
  "target_previous_diag",
  "target_other",
  "data_entry_inscl",
  "data_entry_diag",
  "data_entry_procedure",
  "data_entry_drug",
  "data_entry_lab",
  "data_entry_special_pp",
  "data_entry_vaccine",
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

function isGoogleDriveUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      (url.hostname === "drive.google.com" ||
        url.hostname.endsWith(".drive.google.com"))
    );
  } catch {
    return false;
  }
}

export function parseKpiTemplateForm(formData: FormData): ParseKpiTemplateFormResult {
  const kpiName = getTrimmedString(formData, "kpi_name");
  const pmName = getTrimmedString(formData, "pm_name");
  const pmPosition = getTrimmedString(formData, "pm_position");
  const pmDepartment = getTrimmedString(formData, "pm_department");

  if (!kpiName) {
    return {
      ok: false,
      message: "กรุณาระบุชื่อ KPI",
    };
  }

  const googleDriveUrl = getNullableString(formData, "google_drive_url");
  const document = googleDriveUrl
    ? {
        doc_name: "Google Drive",
        doc_type: "URL",
        google_drive_url: googleDriveUrl,
      }
    : null;

  if (googleDriveUrl && !isGoogleDriveUrl(googleDriveUrl)) {
    return {
      ok: false,
      message: "กรุณาระบุ URL Google Drive เท่านั้น",
    };
  }

  if (!pmName) {
    return {
      ok: false,
      message: "กรุณาระบุผู้รับผิดชอบ",
    };
  }

  if (!pmPosition) {
    return {
      ok: false,
      message: "กรุณาระบุตำแหน่ง",
    };
  }

  if (!pmDepartment) {
    return {
      ok: false,
      message: "กรุณาระบุกลุ่มงาน",
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
        pm_name: pmName,
        pm_position: pmPosition,
        pm_department: pmDepartment,
      },
      document,
    },
  };
}
