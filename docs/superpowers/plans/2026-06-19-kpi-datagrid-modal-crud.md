# KPI Datagrid Modal CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current KPI list/detail landing page with a KPI datagrid that has filters, pagination, CRUD actions, and a full-screen detail modal.

**Architecture:** The `/` route remains the landing page. The Server Component parses URL query parameters and loads filtered, paginated KPI grid data from PostgreSQL. The Client Component renders the datagrid, filters, pagination, full-screen modal form, save action, and hard-delete action.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, PostgreSQL through `postgres`, Vitest.

---

## Current Context

The current implementation already has:

- `src/app/page.tsx`: server-side data loading for all KPI rows.
- `src/app/kpi-template-client.tsx`: list/detail UI and form.
- `src/app/actions.ts`: `saveKpiTemplate` Server Action.
- `src/lib/kpi-form.ts`: form parser and validation.
- `src/lib/kpi-types.ts`: domain types.

There are existing uncommitted Thai-label changes in app files. Preserve them and do not revert them.

## File Structure

- Modify `src/lib/kpi-types.ts`: add grid row, pagination, filter, and delete action types.
- Create `src/lib/kpi-query.ts`: parse and normalize grid URL search parameters.
- Create `src/lib/kpi-query.test.ts`: tests for query parsing.
- Modify `src/app/page.tsx`: load filtered/paginated grid data and pass actions/options to the client.
- Modify `src/app/actions.ts`: add `deleteKpiTemplate` Server Action.
- Modify `src/app/kpi-template-client.tsx`: replace list/detail layout with datagrid + filters + pagination + full-screen modal form.
- Modify `src/lib/kpi-form.test.ts`: keep existing parser tests passing with Thai messages.

## Task 1: Add Query Types And Parser

**Files:**
- Modify: `src/lib/kpi-types.ts`
- Create: `src/lib/kpi-query.ts`
- Create: `src/lib/kpi-query.test.ts`

- [ ] **Step 1: Add grid/query types**

Append these exports to `src/lib/kpi-types.ts`:

```ts
export type KpiStatusFilter = "all" | "active" | "inactive";

export type KpiGridFilters = {
  keyword: string;
  status: KpiStatusFilter;
  kpiType: string;
  page: number;
  pageSize: number;
};

export type KpiGridRow = KpiDetail & {
  typeNames: string[];
};

export type KpiGridResult = {
  rows: KpiGridRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
```

- [ ] **Step 2: Write failing tests**

Create `src/lib/kpi-query.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseKpiGridFilters } from "./kpi-query";

describe("parseKpiGridFilters", () => {
  it("uses defaults for missing params", () => {
    expect(parseKpiGridFilters({})).toEqual({
      keyword: "",
      status: "all",
      kpiType: "",
      page: 1,
      pageSize: 10,
    });
  });

  it("normalizes valid filter and pagination params", () => {
    expect(
      parseKpiGridFilters({
        q: " cancer ",
        status: "inactive",
        type: "3",
        page: "2",
        pageSize: "25",
      }),
    ).toEqual({
      keyword: "cancer",
      status: "inactive",
      kpiType: "3",
      page: 2,
      pageSize: 25,
    });
  });

  it("guards invalid status, page, and page size", () => {
    expect(
      parseKpiGridFilters({
        status: "deleted",
        page: "-1",
        pageSize: "999",
      }),
    ).toEqual({
      keyword: "",
      status: "all",
      kpiType: "",
      page: 1,
      pageSize: 10,
    });
  });
});
```

- [ ] **Step 3: Run test to verify failure**

Run:

```powershell
npm test -- src/lib/kpi-query.test.ts
```

Expected: FAIL because `src/lib/kpi-query.ts` does not exist yet.

- [ ] **Step 4: Implement query parser**

Create `src/lib/kpi-query.ts`:

```ts
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

function positiveInt(value: string, fallback: number): number {
  if (!/^\d+$/.test(value)) {
    return fallback;
  }

  const parsed = Number(value);
  return parsed > 0 ? parsed : fallback;
}

export function parseKpiGridFilters(
  searchParams: KpiSearchParams,
): KpiGridFilters {
  const statusValue = first(searchParams.status);
  const pageSize = positiveInt(first(searchParams.pageSize), 10);

  return {
    keyword: first(searchParams.q).trim(),
    status: validStatuses.has(statusValue as KpiStatusFilter)
      ? (statusValue as KpiStatusFilter)
      : "all",
    kpiType: first(searchParams.type).trim(),
    page: positiveInt(first(searchParams.page), 1),
    pageSize: [10, 25, 50].includes(pageSize) ? pageSize : 10,
  };
}
```

- [ ] **Step 5: Verify and commit**

Run:

```powershell
npm test -- src/lib/kpi-query.test.ts
npm run lint
```

Expected: both exit 0.

Commit:

```powershell
git add src/lib/kpi-types.ts src/lib/kpi-query.ts src/lib/kpi-query.test.ts
git commit -m "test: add KPI grid query parsing"
```

## Task 2: Add Hard Delete Server Action

**Files:**
- Modify: `src/app/actions.ts`

- [ ] **Step 1: Add delete action**

Add this export to `src/app/actions.ts` below `saveKpiTemplate`:

```ts
export async function deleteKpiTemplate(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const rawId = formData.get("id");
  const id =
    typeof rawId === "string" && /^\d+$/.test(rawId) ? Number(rawId) : 0;

  if (id <= 0) {
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
    return {
      status: "error",
      message: error instanceof Error ? error.message : "ลบ KPI ไม่สำเร็จ",
    };
  }
}
```

- [ ] **Step 2: Verify and commit**

Run:

```powershell
npm run lint
```

Expected: exits 0.

Commit:

```powershell
git add src/app/actions.ts
git commit -m "feat: add hard delete for KPI templates"
```

## Task 3: Load Filtered Paginated Grid Data

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Update route signature and imports**

Change imports in `src/app/page.tsx` to include:

```ts
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
```

Change `Home` signature:

```ts
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
```

- [ ] **Step 2: Parse filters and load page data**

Inside `Home`, start with:

```ts
  const filters = parseKpiGridFilters(await searchParams);
  const offset = (filters.page - 1) * filters.pageSize;
  const keywordPattern = `%${filters.keyword}%`;
```

Replace the current all-row queries with one count query and paginated topic query:

```ts
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
```

- [ ] **Step 3: Load related rows for visible topics**

After topics load, add:

```ts
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
```

- [ ] **Step 4: Build grid result**

Replace existing `details` return shape with:

```ts
  const typeNameById = new Map(
    kpiTypes.map((type) => [String(type.id), type.type]),
  );
  const total = Number(countRows[0]?.total ?? 0);
  const details: KpiDetail[] = topics.map((topic) => ({
    topic: {
      ...topic,
      kpi_type: normalizeKpiType(topic.kpi_type),
    },
    template: templates.find((item) => item.kpi_topic_id === topic.id) ?? null,
    pm: pms.find((item) => item.kpi_topic_id === topic.id) ?? null,
    document: docs.find((item) => item.kpi_topic_id === topic.id) ?? null,
  }));
  const grid: KpiGridResult = {
    rows: details.map((detail) => ({
      ...detail,
      typeNames: (detail.topic.kpi_type ?? [])
        .map((id) => typeNameById.get(id))
        .filter((name): name is string => Boolean(name)),
    })),
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
  };
```

Pass these props:

```tsx
    <KpiTemplateClient
      deleteAction={deleteKpiTemplate}
      departments={departments}
      filters={filters}
      grid={grid}
      kpiTypes={kpiTypes}
      saveAction={saveKpiTemplate}
    />
```

- [ ] **Step 5: Verify and commit**

Run:

```powershell
npm run lint
```

Expected: it may fail until Task 4 updates the client props. Do not commit until Task 4 completes.

## Task 4: Replace Landing UI With Datagrid And Full-Screen Modal

**Files:**
- Modify: `src/app/kpi-template-client.tsx`

- [ ] **Step 1: Update component props**

Change props to:

```ts
type KpiTemplateClientProps = {
  deleteAction: SaveAction;
  departments: DepartmentOption[];
  filters: KpiGridFilters;
  grid: KpiGridResult;
  kpiTypes: KpiTypeOption[];
  saveAction: SaveAction;
};
```

Update imports to include `KpiGridFilters` and `KpiGridResult`.

- [ ] **Step 2: Replace list state with modal state**

Use these state values:

```ts
const [saveState, saveFormAction, isSaving] = useActionState(
  saveAction,
  initialActionState,
);
const [deleteState, deleteFormAction, isDeleting] = useActionState(
  deleteAction,
  initialActionState,
);
const [modalMode, setModalMode] = useState<"closed" | "create" | "edit">(
  "closed",
);
const [selectedId, setSelectedId] = useState<number | null>(null);
const [confirmDelete, setConfirmDelete] = useState(false);
```

Derive selected row:

```ts
const selectedRow =
  selectedId === null
    ? null
    : grid.rows.find((row) => row.topic.id === selectedId) ?? null;
const modalOpen = modalMode !== "closed";
const selectedTypeIds = new Set(selectedRow?.topic.kpi_type ?? []);
```

- [ ] **Step 3: Build URL helper for filters and pagination**

Inside the component, add:

```ts
function gridUrl(next: Partial<KpiGridFilters>): string {
  const params = new URLSearchParams();
  const merged = { ...filters, ...next };

  if (merged.keyword) params.set("q", merged.keyword);
  if (merged.status !== "all") params.set("status", merged.status);
  if (merged.kpiType) params.set("type", merged.kpiType);
  if (merged.page > 1) params.set("page", String(merged.page));
  if (merged.pageSize !== 10) params.set("pageSize", String(merged.pageSize));

  const query = params.toString();
  return query ? `/?${query}` : "/";
}
```

- [ ] **Step 4: Render header, filters, table, pagination, modal**

Replace the JSX with this structure:

```tsx
<main className="min-h-screen bg-slate-100 text-slate-950">
  <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 p-4 sm:p-6">
    <header className="flex flex-col gap-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-2xl font-semibold">จัดการ KPI</h1>
        <p className="mt-1 text-sm text-slate-500">
          ค้นหา กรอง แก้ไข และลบเทมเพลต KPI
        </p>
      </div>
      <button
        className="min-h-11 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white"
        type="button"
        onClick={() => {
          setSelectedId(null);
          setConfirmDelete(false);
          setModalMode("create");
        }}
      >
        เพิ่ม KPI
      </button>
    </header>

    <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <form className="grid gap-3 md:grid-cols-[1fr_180px_180px_120px]">
        <input className={textInputClass} name="q" placeholder="ค้นหาชื่อ KPI" defaultValue={filters.keyword} />
        <select className={textInputClass} name="status" defaultValue={filters.status}>
          <option value="all">ทุกสถานะ</option>
          <option value="active">ใช้งาน</option>
          <option value="inactive">ไม่ใช้งาน</option>
        </select>
        <select className={textInputClass} name="type" defaultValue={filters.kpiType}>
          <option value="">ทุกประเภท</option>
          {kpiTypes.map((type) => (
            <option key={type.id} value={type.id}>{type.type}</option>
          ))}
        </select>
        <button className="min-h-11 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white" type="submit">
          กรอง
        </button>
      </form>
    </section>

    <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">ชื่อ KPI</th>
              <th className="px-4 py-3">ประเภท</th>
              <th className="px-4 py-3">สถานะ</th>
              <th className="px-4 py-3">ผู้รับผิดชอบ</th>
              <th className="px-4 py-3">หน่วยงาน</th>
              <th className="px-4 py-3">เอกสาร</th>
              <th className="px-4 py-3 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {grid.rows.map((row) => (
              <tr key={row.topic.id} className="border-t border-slate-200">
                <td className="px-4 py-3 font-medium text-slate-950">{row.topic.kpi_name}</td>
                <td className="px-4 py-3 text-slate-600">{row.typeNames.join(", ") || "-"}</td>
                <td className="px-4 py-3">{row.topic.is_active ? "ใช้งาน" : "ไม่ใช้งาน"}</td>
                <td className="px-4 py-3 text-slate-600">{row.pm?.pm_name || "-"}</td>
                <td className="px-4 py-3 text-slate-600">{row.pm?.pm_department || "-"}</td>
                <td className="px-4 py-3 text-slate-600">{row.document?.doc_name || "-"}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
                    type="button"
                    onClick={() => {
                      setSelectedId(row.topic.id);
                      setConfirmDelete(false);
                      setModalMode("edit");
                    }}
                  >
                    เปิด
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>

    {modalOpen ? <Full-screen modal with the existing grouped form fields and delete confirmation /> : null}
  </div>
</main>
```

Replace the conditional modal area with a fixed full-screen overlay:

```tsx
<div className="fixed inset-0 z-50 overflow-y-auto bg-slate-100">
  <form action={saveFormAction} className="mx-auto grid min-h-screen w-full max-w-6xl gap-6 bg-white p-4 sm:p-6">
    <div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-slate-200 bg-white pb-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-xl font-semibold">
          {modalMode === "create" ? "เพิ่มเทมเพลต KPI" : "แก้ไขเทมเพลต KPI"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          รายละเอียดข้อมูล KPI
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setModalMode("closed")}>ปิด</button>
        <button type="submit" disabled={isSaving}>
          {isSaving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>
    </div>
    {selectedRow ? <input name="id" type="hidden" value={selectedRow.topic.id} /> : null}
    <Section title="ข้อมูล KPI">
      Reuse the current KPI details fields and bind values from selectedRow.
    </Section>
    <Section title="กลุ่มเป้าหมาย">
      Reuse the current target group fields and bind values from selectedRow.
    </Section>
    <Section title="รายละเอียดการบันทึกข้อมูล">
      Reuse the current data entry fields and bind values from selectedRow.
    </Section>
    <Section title="ผู้รับผิดชอบ">
      Reuse the current PM fields and bind values from selectedRow.
    </Section>
    <Section title="เอกสารประกอบ">
      Reuse the current document fields and bind values from selectedRow.
    </Section>
  </form>
</div>
```

- [ ] **Step 5: Add delete form inside modal**

For existing rows only, add a delete zone in the modal footer:

```tsx
{selectedRow ? (
  <form action={deleteFormAction} className="border-t border-rose-200 pt-5">
    <input name="id" type="hidden" value={selectedRow.topic.id} />
    {confirmDelete ? (
      <div className="flex flex-col gap-3 rounded-md border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-rose-800">
          ยืนยันการลบ KPI นี้แบบถาวร
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={() => setConfirmDelete(false)}>
            ยกเลิก
          </button>
          <button type="submit" disabled={isDeleting}>
            {isDeleting ? "กำลังลบ..." : "ยืนยันลบ"}
          </button>
        </div>
      </div>
    ) : (
      <button type="button" onClick={() => setConfirmDelete(true)}>
        ลบ KPI
      </button>
    )}
  </form>
) : null}
```

- [ ] **Step 6: Add pagination footer**

Add footer below the grid:

```tsx
const startRow = grid.total === 0 ? 0 : (grid.page - 1) * grid.pageSize + 1;
const endRow = Math.min(grid.total, grid.page * grid.pageSize);
```

Render:

```tsx
<div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
  <span>
    แสดง {startRow}-{endRow} จาก {grid.total} รายการ
  </span>
  <div className="flex items-center gap-2">
    <a aria-disabled={grid.page <= 1} href={gridUrl({ page: Math.max(1, grid.page - 1) })}>
      ก่อนหน้า
    </a>
    <span>
      หน้า {grid.page} / {grid.totalPages}
    </span>
    <a aria-disabled={grid.page >= grid.totalPages} href={gridUrl({ page: Math.min(grid.totalPages, grid.page + 1) })}>
      ถัดไป
    </a>
  </div>
</div>
```

- [ ] **Step 7: Verify and commit Tasks 3-4**

Run:

```powershell
npm run lint
```

Expected: exits 0.

Commit:

```powershell
git add src/app/page.tsx src/app/kpi-template-client.tsx
git commit -m "feat: add KPI datagrid modal UI"
```

## Task 5: Verify CRUD Against PostgreSQL

**Files:**
- No source changes unless verification exposes a defect.

- [ ] **Step 1: Run automated checks**

Run:

```powershell
npm test
npm run lint
Get-Content .env | ForEach-Object { if ($_ -match '^\s*([^#][^=]*)=(.*)$') { $name=$matches[1].Trim(); $value=$matches[2].Trim().Trim('"'); Set-Item -Path "Env:$name" -Value $value } }; npm run build
```

Expected: all exit 0.

- [ ] **Step 2: Start dev server if not already running**

Run:

```powershell
npm run dev
```

Expected: app is available at `http://localhost:3000`.

- [ ] **Step 3: Verify create/update/delete manually or by HTTP**

Create a KPI named:

```text
Codex Datagrid CRUD KPI
```

Use these values:

```text
KPI type: first available type
Target area: Test Area
PM name: Codex CRUD Tester
Document name: CRUD Spec
Document type: PDF
File path: /tmp/crud-spec.pdf
```

Then update the KPI name to:

```text
Codex Datagrid CRUD KPI Updated
```

Then delete it through the hard-delete action.

- [ ] **Step 4: Verify hard delete with db-cli**

Run:

```powershell
$env:DB_CLI_SKIP_UTF8_CONSOLE='1'; Get-Content .env | ForEach-Object { if ($_ -match '^\s*([^#][^=]*)=(.*)$') { $name=$matches[1].Trim(); $value=$matches[2].Trim().Trim('"'); Set-Item -Path "Env:$name" -Value $value } }; db-cli -g pg -H $env:DB_HOST -P $env:DB_PORT -u $env:DB_USER -p $env:DB_PASSWORD -d $env:DB_NAME -e "SELECT COUNT(*) AS topic_count FROM kpi_topic WHERE kpi_name IN ('Codex Datagrid CRUD KPI','Codex Datagrid CRUD KPI Updated'); SELECT COUNT(*) AS template_count FROM kpi_template tmp JOIN kpi_topic kt ON kt.id = tmp.kpi_topic_id WHERE kt.kpi_name IN ('Codex Datagrid CRUD KPI','Codex Datagrid CRUD KPI Updated');"
```

Expected:

```text
topic_count
0
template_count
0
```

- [ ] **Step 5: Commit verification fixes only if source changed**

If source code changed during verification, run:

```powershell
git status --short
git add src/app/actions.ts src/app/kpi-template-client.tsx src/app/page.tsx src/lib/kpi-query.ts src/lib/kpi-query.test.ts src/lib/kpi-types.ts
git commit -m "fix: verify KPI datagrid CRUD"
```

If no source changed, do not create a verification commit.
