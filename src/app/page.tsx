import { sql } from "@/lib/db";
import type {
  DepartmentOption,
  KpiDetail,
  KpiDocument,
  KpiPm,
  KpiTemplate,
  KpiTopic,
  KpiTypeOption,
} from "@/lib/kpi-types";
import { saveKpiTemplate } from "./actions";
import { KpiTemplateClient } from "./kpi-template-client";

export const dynamic = "force-dynamic";

function normalizeKpiType(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }

  return [];
}

export default async function Home() {
  const [topics, templates, pms, docs, departments, kpiTypes] =
    await Promise.all([
      sql<KpiTopic[]>`
        SELECT id, kpi_name, is_active, kpi_type
        FROM kpi_topic
        ORDER BY kpi_name
      `,
      sql<KpiTemplate[]>`
        SELECT *
        FROM kpi_template
      `,
      sql<KpiPm[]>`
        SELECT *
        FROM kpi_pm
      `,
      sql<KpiDocument[]>`
        SELECT id, kpi_topic_id, doc_name, doc_type, file_path, created_at::text
        FROM kpi_doc
      `,
      sql<DepartmentOption[]>`
        SELECT id, department_name, is_active
        FROM c_department
        WHERE is_active = true
        ORDER BY department_name
      `,
      sql<KpiTypeOption[]>`
        SELECT id, type
        FROM c_kpi_type
        ORDER BY id
      `,
    ]);

  const details: KpiDetail[] = topics.map((topic) => ({
    topic: {
      ...topic,
      kpi_type: normalizeKpiType(topic.kpi_type),
    },
    template: templates.find((item) => item.kpi_topic_id === topic.id) ?? null,
    pm: pms.find((item) => item.kpi_topic_id === topic.id) ?? null,
    document: docs.find((item) => item.kpi_topic_id === topic.id) ?? null,
  }));

  return (
    <KpiTemplateClient
      action={saveKpiTemplate}
      departments={departments}
      details={details}
      kpiTypes={kpiTypes}
    />
  );
}
