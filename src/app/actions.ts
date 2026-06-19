"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { parseKpiTemplateForm } from "@/lib/kpi-form";
import type { ActionState } from "@/lib/kpi-types";

function errorState(message: string): ActionState {
  return {
    status: "error",
    message,
  };
}

export async function saveKpiTemplate(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseKpiTemplateForm(formData);

  if (!parsed.ok) {
    return errorState(parsed.message);
  }

  const payload = parsed.data;

  try {
    const topicRows = payload.topic.id
      ? await sql<{ id: number }[]>`
          UPDATE kpi_topic
          SET
            kpi_name = ${payload.topic.kpi_name},
            is_active = ${payload.topic.is_active},
            kpi_type = ${JSON.stringify(payload.topic.kpi_type)}::json
          WHERE id = ${payload.topic.id}
          RETURNING id
        `
      : await sql<{ id: number }[]>`
          INSERT INTO kpi_topic (kpi_name, is_active, kpi_type)
          VALUES (
            ${payload.topic.kpi_name},
            ${payload.topic.is_active},
            ${JSON.stringify(payload.topic.kpi_type)}::json
          )
          RETURNING id
        `;

    const topicId = topicRows[0]?.id;

    if (!topicId) {
      return errorState("Unable to save KPI topic.");
    }

    await sql`
      INSERT INTO kpi_template (
        kpi_topic_id,
        target_area_type,
        target_gender,
        target_age_range,
        target_other,
        data_entry_inscl,
        data_entry_diag,
        data_entry_procedure,
        data_entry_drug,
        data_entry_lab,
        data_entry_special_pp,
        data_entry_other
      )
      VALUES (
        ${topicId},
        ${payload.template.target_area_type},
        ${payload.template.target_gender},
        ${payload.template.target_age_range},
        ${payload.template.target_other},
        ${payload.template.data_entry_inscl},
        ${payload.template.data_entry_diag},
        ${payload.template.data_entry_procedure},
        ${payload.template.data_entry_drug},
        ${payload.template.data_entry_lab},
        ${payload.template.data_entry_special_pp},
        ${payload.template.data_entry_other}
      )
      ON CONFLICT (kpi_topic_id)
      DO UPDATE SET
        target_area_type = EXCLUDED.target_area_type,
        target_gender = EXCLUDED.target_gender,
        target_age_range = EXCLUDED.target_age_range,
        target_other = EXCLUDED.target_other,
        data_entry_inscl = EXCLUDED.data_entry_inscl,
        data_entry_diag = EXCLUDED.data_entry_diag,
        data_entry_procedure = EXCLUDED.data_entry_procedure,
        data_entry_drug = EXCLUDED.data_entry_drug,
        data_entry_lab = EXCLUDED.data_entry_lab,
        data_entry_special_pp = EXCLUDED.data_entry_special_pp,
        data_entry_other = EXCLUDED.data_entry_other
    `;

    if (payload.pm.pm_name || payload.pm.pm_position || payload.pm.pm_department) {
      await sql`
        INSERT INTO kpi_pm (kpi_topic_id, pm_name, pm_position, pm_department)
        VALUES (
          ${topicId},
          ${payload.pm.pm_name || "-"},
          ${payload.pm.pm_position},
          ${payload.pm.pm_department}
        )
        ON CONFLICT (kpi_topic_id)
        DO UPDATE SET
          pm_name = EXCLUDED.pm_name,
          pm_position = EXCLUDED.pm_position,
          pm_department = EXCLUDED.pm_department
      `;
    }

    if (payload.document) {
      await sql`
        INSERT INTO kpi_doc (kpi_topic_id, doc_name, doc_type, file_path)
        VALUES (
          ${topicId},
          ${payload.document.doc_name},
          ${payload.document.doc_type},
          ${payload.document.file_path}
        )
        ON CONFLICT (kpi_topic_id)
        DO UPDATE SET
          doc_name = EXCLUDED.doc_name,
          doc_type = EXCLUDED.doc_type,
          file_path = EXCLUDED.file_path
      `;
    }

    revalidatePath("/");

    return {
      status: "success",
      message: "KPI template saved.",
      selectedId: topicId,
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Failed to save KPI template.",
    };
  }
}
