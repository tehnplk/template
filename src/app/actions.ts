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
    const topicId = await sql.begin(async (tx) => {
      const topicRows = payload.topic.id
        ? await tx<{ id: number }[]>`
            UPDATE kpi_topic
            SET
              kpi_name = ${payload.topic.kpi_name},
              is_active = ${payload.topic.is_active},
              kpi_type = ${JSON.stringify(payload.topic.kpi_type)}::json
            WHERE id = ${payload.topic.id}
            RETURNING id
          `
        : await tx<{ id: number }[]>`
            INSERT INTO kpi_topic (kpi_name, is_active, kpi_type)
            VALUES (
              ${payload.topic.kpi_name},
              ${payload.topic.is_active},
              ${JSON.stringify(payload.topic.kpi_type)}::json
            )
            RETURNING id
          `;

      const savedTopicId = topicRows[0]?.id;

      if (!savedTopicId) {
        throw new Error("Unable to save KPI topic.");
      }

      await tx`
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
          ${savedTopicId},
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

      if (
        payload.pm.pm_name ||
        payload.pm.pm_position ||
        payload.pm.pm_department
      ) {
        await tx`
          INSERT INTO kpi_pm (kpi_topic_id, pm_name, pm_position, pm_department)
          VALUES (
            ${savedTopicId},
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
      } else {
        await tx`
          DELETE FROM kpi_pm
          WHERE kpi_topic_id = ${savedTopicId}
        `;
      }

      if (payload.document) {
        await tx`
          INSERT INTO kpi_doc (kpi_topic_id, doc_name, doc_type, file_path)
          VALUES (
            ${savedTopicId},
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
      } else {
        await tx`
          DELETE FROM kpi_doc
          WHERE kpi_topic_id = ${savedTopicId}
        `;
      }

      return savedTopicId;
    });

    revalidatePath("/");

    return {
      status: "success",
      message: "บันทึกเทมเพลท KPI สำเร็จ",
      selectedId: topicId,
    };
  } catch {
    return {
      status: "error",
      message: "บันทึกเทมเพลท KPI ไม่สำเร็จ",
    };
  }
}

export async function deleteKpiTemplate(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const rawId = formData.get("id");
  const id =
    typeof rawId === "string" && /^\d+$/.test(rawId) ? Number(rawId) : 0;

  if (!Number.isSafeInteger(id) || id <= 0) {
    return errorState("ไม่พบรหัส KPI สำหรับลบข้อมูล");
  }

  try {
    await sql.begin(async (tx) => {
      await tx`
        DELETE FROM kpi_doc
        WHERE kpi_topic_id = ${id}
      `;

      await tx`
        DELETE FROM kpi_pm
        WHERE kpi_topic_id = ${id}
      `;

      await tx`
        DELETE FROM kpi_template
        WHERE kpi_topic_id = ${id}
      `;

      const deletedTopics = await tx<{ id: number }[]>`
        DELETE FROM kpi_topic
        WHERE id = ${id}
        RETURNING id
      `;

      if (!deletedTopics[0]?.id) {
        throw new Error("ไม่พบ KPI ที่ต้องการลบ");
      }
    });

    revalidatePath("/");

    return {
      status: "success",
      message: "ลบ KPI สำเร็จ",
    };
  } catch (error) {
    const message =
      error instanceof Error && error.message === "ไม่พบ KPI ที่ต้องการลบ"
        ? error.message
        : "ลบ KPI ไม่สำเร็จ";

    return {
      status: "error",
      message,
    };
  }
}
