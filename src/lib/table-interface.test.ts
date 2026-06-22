import { describe, expectTypeOf, test } from "vitest";

import type {
  CDepartmentModel,
  CKpiTypeModel,
  KpiDocModel,
  KpiPmModel,
  KpiTemplateModel,
  KpiTopicModel,
} from "./table-interface";

describe("database table models", () => {
  test("match public table row shapes", () => {
    expectTypeOf<CDepartmentModel>().toEqualTypeOf<{
      id: number;
      department_name: string;
      is_active: boolean;
    }>();

    expectTypeOf<CKpiTypeModel>().toEqualTypeOf<{
      id: number;
      type: string;
    }>();

    expectTypeOf<KpiTopicModel>().toEqualTypeOf<{
      id: number;
      kpi_name: string;
      is_active: boolean;
      kpi_type: string[] | null;
    }>();

    expectTypeOf<KpiTemplateModel>().toEqualTypeOf<{
      id: number;
      kpi_topic_id: number;
      target_area_type: string | null;
      target_gender: string | null;
      target_age_range: string | null;
      target_previous_diag: string | null;
      target_other: string | null;
      data_entry_inscl: string | null;
      data_entry_diag: string | null;
      data_entry_procedure: string | null;
      data_entry_drug: string | null;
      data_entry_lab: string | null;
      data_entry_special_pp: string | null;
      data_entry_vaccine: string | null;
      data_entry_other: string | null;
    }>();

    expectTypeOf<KpiPmModel>().toEqualTypeOf<{
      id: number;
      kpi_topic_id: number;
      pm_name: string;
      pm_position: string | null;
      pm_department: string | null;
    }>();

    expectTypeOf<KpiDocModel>().toEqualTypeOf<{
      id: number;
      kpi_topic_id: number;
      doc_name: string;
      doc_type: string;
      google_drive_url: string;
      created_at: string | null;
    }>();
  });
});
