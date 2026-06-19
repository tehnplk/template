import type { KpiGridFilters, KpiStatusFilter } from "./kpi-types";

type SearchValue = string | string[] | undefined;

export type KpiSearchParams = Record<string, SearchValue>;

const validStatuses = new Set<KpiStatusFilter>([
  "all",
  "active",
  "inactive",
]);

function first(value: SearchValue): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function positiveInt(
  value: string,
  fallback: number,
  max = Number.MAX_SAFE_INTEGER,
): number {
  if (!/^\d+$/.test(value)) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 && parsed <= max
    ? parsed
    : fallback;
}

export function parseKpiGridFilters(
  searchParams: KpiSearchParams,
): KpiGridFilters {
  const statusValue = first(searchParams.status).trim();
  const pageSize = positiveInt(first(searchParams.pageSize), 10);

  return {
    keyword: first(searchParams.q).trim(),
    status: validStatuses.has(statusValue as KpiStatusFilter)
      ? (statusValue as KpiStatusFilter)
      : "all",
    kpiType: first(searchParams.type).trim(),
    page: positiveInt(first(searchParams.page), 1, 10000),
    pageSize: [10, 25, 50].includes(pageSize) ? pageSize : 10,
  };
}
