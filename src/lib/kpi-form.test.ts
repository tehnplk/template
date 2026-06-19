import { describe, expect, it } from "vitest";

import { parseKpiTemplateForm } from "./kpi-form";

describe("parseKpiTemplateForm", () => {
  it("returns an error when kpi_name is missing", () => {
    const formData = new FormData();
    formData.set("kpi_name", "   ");

    expect(parseKpiTemplateForm(formData)).toEqual({
      ok: false,
      message: "KPI name is required.",
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
    formData.set("target_other", "Annual");
    formData.set("data_entry_inscl", "INSCL");
    formData.set("data_entry_diag", "DIAG");
    formData.set("data_entry_procedure", "PROC");
    formData.set("data_entry_drug", "DRUG");
    formData.set("data_entry_lab", "LAB");
    formData.set("data_entry_special_pp", "SPECIAL");
    formData.set("data_entry_other", "OTHER");
    formData.set("pm_name", "Owner");
    formData.set("pm_position", "Manager");
    formData.set("pm_department", "IT");
    formData.set("doc_name", "Manual");
    formData.set("doc_type", "PDF");
    formData.set("file_path", "/docs/manual.pdf");

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
          target_other: "Annual",
          data_entry_inscl: "INSCL",
          data_entry_diag: "DIAG",
          data_entry_procedure: "PROC",
          data_entry_drug: "DRUG",
          data_entry_lab: "LAB",
          data_entry_special_pp: "SPECIAL",
          data_entry_other: "OTHER",
        },
        pm: {
          pm_name: "Owner",
          pm_position: "Manager",
          pm_department: "IT",
        },
        document: {
          doc_name: "Manual",
          doc_type: "PDF",
          file_path: "/docs/manual.pdf",
        },
      },
    });
  });

  it("sets document to null when document fields are empty", () => {
    const formData = new FormData();
    formData.set("kpi_name", "Cancer Screening");
    formData.set("doc_name", " ");
    formData.set("doc_type", "");
    formData.set("file_path", " ");

    const result = parseKpiTemplateForm(formData);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.document).toBeNull();
    }
  });

  it("requires document name and type when adding a document", () => {
    const formData = new FormData();
    formData.set("kpi_name", "Cancer Screening");
    formData.set("doc_name", "Manual");
    formData.set("doc_type", " ");

    expect(parseKpiTemplateForm(formData)).toEqual({
      ok: false,
      message: "Document name and type are required when adding a document.",
    });
  });
});
