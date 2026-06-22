import { sql } from "@/lib/db";
import { parseKpiGridFilters } from "@/lib/kpi-query";
import type {
  DepartmentOption,
  KpiDetail,
  KpiDocument,
  KpiGridResult,
  KpiPm,
  KpiTemplate,
  KpiTopic,
  KpiTypeOption,
} from "@/lib/kpi-types";
import { deleteKpiTemplate, saveKpiTemplate } from "./actions";
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

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseKpiGridFilters(await searchParams);
  const offset = (filters.page - 1) * filters.pageSize;
  const keywordPattern = `%${filters.keyword}%`;

  const statusCondition =
    filters.status === "active"
      ? sql`AND is_active = true`
      : filters.status === "inactive"
        ? sql`AND is_active = false`
        : sql``;

  const typeCondition = filters.kpiType
    ? sql`AND kpi_type::text LIKE ${`%\"${filters.kpiType}\"%`}`
    : sql``;

  const [countRows, topics, departments, kpiTypes] = await Promise.all([
    sql<{ total: string }[]>`
      SELECT COUNT(*)::text AS total
      FROM kpi_topic
      WHERE kpi_name ILIKE ${keywordPattern}
      ${statusCondition}
      ${typeCondition}
    `,
    sql<KpiTopic[]>`
      SELECT id, kpi_name, is_active, kpi_type
      FROM kpi_topic
      WHERE kpi_name ILIKE ${keywordPattern}
      ${statusCondition}
      ${typeCondition}
      ORDER BY kpi_name
      LIMIT ${filters.pageSize}
      OFFSET ${offset}
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

  const topicIds = topics.map((topic) => topic.id);
  const [templates, pms, docs] =
    topicIds.length > 0
      ? await Promise.all([
          sql<KpiTemplate[]>`
            SELECT *
            FROM kpi_template
            WHERE kpi_topic_id IN ${sql(topicIds)}
          `,
          sql<KpiPm[]>`
            SELECT *
            FROM kpi_pm
            WHERE kpi_topic_id IN ${sql(topicIds)}
          `,
          sql<KpiDocument[]>`
            SELECT id, kpi_topic_id, doc_name, doc_type, file_path, created_at::text
            FROM kpi_doc
            WHERE kpi_topic_id IN ${sql(topicIds)}
          `,
        ])
      : [[], [], []];

  const typeNameById = new Map(
    kpiTypes.map((type) => [String(type.id), type.type]),
  );

  const details: KpiDetail[] = topics.map((topic) => ({
    topic: {
      ...topic,
      kpi_type: normalizeKpiType(topic.kpi_type),
    },
    template: templates.find((item) => item.kpi_topic_id === topic.id) ?? null,
    pm: pms.find((item) => item.kpi_topic_id === topic.id) ?? null,
    document: docs.find((item) => item.kpi_topic_id === topic.id) ?? null,
  }));

  const total = Number(countRows[0]?.total ?? 0);
  const grid: KpiGridResult = {
    rows: details.map((detail) => ({
      ...detail,
      typeNames: detail.topic.kpi_type
        ? detail.topic.kpi_type.map((typeId) => typeNameById.get(typeId) ?? typeId)
        : [],
    })),
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
  };

  return (
    <KpiTemplateClient
      deleteAction={deleteKpiTemplate}
      departments={departments}
      filters={filters}
      grid={grid}
      kpiTypes={kpiTypes}
      saveAction={saveKpiTemplate}
    />
  );
}
