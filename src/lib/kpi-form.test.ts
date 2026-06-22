import { describe, expect, it } from "vitest";

import { parseKpiTemplateForm } from "./kpi-form";

describe("parseKpiTemplateForm", () => {
  it("returns an error when kpi_name is missing", () => {
    const formData = new FormData();
    formData.set("kpi_name", "   ");

    expect(parseKpiTemplateForm(formData)).toEqual({
      ok: false,
      message: "กรุณาระบุชื่อ KPI",
    });
  });

  it("normalizes a full KPI template form", () => {
    const formData = new FormData();
    formData.set("id", "12");
    formData.set("kpi_name", " Cancer Screening ");
    formData.set("is_active", "on");
    formData.append("kpi_type", "1");
    formData.append("kpi_type", "3");
    formData.set("target_area_type", "Hospital");
    formData.set("target_gender", "Female");
    formData.set("target_age_range", "45-70");
    formData.set("target_previous_diag", "E11,I10");
    formData.set("target_other", "Annual");
    formData.set("data_entry_inscl", "INSCL");
    formData.set("data_entry_diag", "DIAG");
    formData.set("data_entry_procedure", "PROC");
    formData.set("data_entry_drug", "DRUG");
    formData.set("data_entry_lab", "LAB");
    formData.set("data_entry_special_pp", "SPECIAL");
    formData.set("data_entry_vaccine", "VACCINE");
    formData.set("data_entry_other", "OTHER");
    formData.set("pm_name", "Owner");
    formData.set("pm_position", "Manager");
    formData.set("pm_department", "IT");
    formData.set("google_drive_url", "https://drive.google.com/file/d/example/view");

    expect(parseKpiTemplateForm(formData)).toEqual({
      ok: true,
      data: {
        topic: {
          id: 12,
          kpi_name: "Cancer Screening",
          is_active: true,
          kpi_type: ["1", "3"],
        },
        template: {
          target_area_type: "Hospital",
          target_gender: "Female",
          target_age_range: "45-70",
          target_previous_diag: "E11,I10",
          target_other: "Annual",
          data_entry_inscl: "INSCL",
          data_entry_diag: "DIAG",
          data_entry_procedure: "PROC",
          data_entry_drug: "DRUG",
          data_entry_lab: "LAB",
          data_entry_special_pp: "SPECIAL",
          data_entry_vaccine: "VACCINE",
          data_entry_other: "OTHER",
        },
        pm: {
          pm_name: "Owner",
          pm_position: "Manager",
          pm_department: "IT",
        },
        document: {
          doc_name: "Google Drive",
          doc_type: "URL",
          google_drive_url: "https://drive.google.com/file/d/example/view",
        },
      },
    });
  });

  it("sets document to null when document URL is empty", () => {
    const formData = new FormData();
    formData.set("kpi_name", "Cancer Screening");
    formData.set("google_drive_url", " ");

    const result = parseKpiTemplateForm(formData);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.document).toBeNull();
    }
  });

  it("requires document URL to be from Google Drive", () => {
    const formData = new FormData();
    formData.set("kpi_name", "Cancer Screening");
    formData.set("google_drive_url", "https://example.com/manual.pdf");

    expect(parseKpiTemplateForm(formData)).toEqual({
      ok: false,
      message: "กรุณาระบุ URL Google Drive เท่านั้น",
    });
  });
});
