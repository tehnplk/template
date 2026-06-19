# KPI Template Recording System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a real PostgreSQL-backed KPI template recording screen using the approved List + Detail Form layout.

**Architecture:** The `/` route remains the main screen. Server Components load KPI data and master options from PostgreSQL, Server Actions perform create/update mutations, and a focused Client Component manages the interactive list/detail form state.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS 4, TypeScript, PostgreSQL, `postgres` package, Vitest for focused form parsing tests.

---

## File Structure

- Modify `package.json`: add `postgres`, `vitest`, and a `test` script.
- Modify `package-lock.json`: update dependency lock after install.
- Create `src/lib/db.ts`: shared PostgreSQL client using `DATABASE_URL`.
- Create `src/lib/kpi-types.ts`: TypeScript types for rows, form state, and action state.
- Create `src/lib/kpi-form.ts`: pure parsing/normalization functions for form data.
- Create `src/lib/kpi-form.test.ts`: unit tests for validation and payload normalization.
- Create `src/app/actions.ts`: Server Actions for saving KPI templates.
- Create `src/app/kpi-template-client.tsx`: Client Component for list selection, form state, and submit UI.
- Modify `src/app/page.tsx`: load database data and render the client screen.
- Modify `src/app/layout.tsx`: update metadata and language.
- Modify `src/app/globals.css`: operational app styling base.

## Task 1: Install Runtime And Test Dependencies

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Install packages**

Run:

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; $OutputEncoding = [System.Text.Encoding]::UTF8; chcp 65001 | Out-Null; npm install postgres; npm install -D vitest
```

Expected: npm exits with code 0 and updates `package.json` plus `package-lock.json`.

- [ ] **Step 2: Add test script**

Update `package.json` scripts to include:

```json
"test": "vitest run"
```

Expected scripts:

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest run"
}
```

- [ ] **Step 3: Commit dependency setup**

Run:

```powershell
git add package.json package-lock.json
git commit -m "chore: add KPI template dependencies"
```

## Task 2: Add Types And Form Parser With Tests

**Files:**
- Create: `src/lib/kpi-types.ts`
- Create: `src/lib/kpi-form.ts`
- Create: `src/lib/kpi-form.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/kpi-form.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseKpiTemplateForm } from "./kpi-form";

describe("parseKpiTemplateForm", () => {
  it("rejects missing KPI name", () => {
    const formData = new FormData();
    formData.set("kpi_name", " ");

    const result = parseKpiTemplateForm(formData);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe("KPI name is required.");
    }
  });

  it("normalizes topic, template, PM, and document payloads", () => {
    const formData = new FormData();
    formData.set("id", "12");
    formData.set("kpi_name", "Cancer Screening");
    formData.set("is_active", "on");
    formData.append("kpi_type", "1");
    formData.append("kpi_type", "3");
    formData.set("target_area_type", "Province");
    formData.set("target_gender", "Female");
    formData.set("target_age_range", "30-60");
    formData.set("target_other", "High risk");
    formData.set("data_entry_inscl", "Check insurance");
    formData.set("data_entry_diag", "ICD10");
    formData.set("data_entry_procedure", "Procedure note");
    formData.set("data_entry_drug", "Drug note");
    formData.set("data_entry_lab", "Lab note");
    formData.set("data_entry_special_pp", "PP note");
    formData.set("data_entry_other", "Other note");
    formData.set("pm_name", "Nina");
    formData.set("pm_position", "Officer");
    formData.set("pm_department", "IT");
    formData.set("doc_name", "Manual");
    formData.set("doc_type", "PDF");
    formData.set("file_path", "/docs/manual.pdf");

    const result = parseKpiTemplateForm(formData);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.topic).toEqual({
        id: 12,
        kpi_name: "Cancer Screening",
        is_active: true,
        kpi_type: ["1", "3"],
      });
      expect(result.data.template.target_gender).toBe("Female");
      expect(result.data.pm.pm_department).toBe("IT");
      expect(result.data.document).toEqual({
        doc_name: "Manual",
        doc_type: "PDF",
        file_path: "/docs/manual.pdf",
      });
    }
  });

  it("omits empty document payload", () => {
    const formData = new FormData();
    formData.set("kpi_name", "OPD Visit");

    const result = parseKpiTemplateForm(formData);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.document).toBeNull();
    }
  });
});
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```powershell
npm test -- src/lib/kpi-form.test.ts
```

Expected: FAIL because `src/lib/kpi-form.ts` does not exist yet.

- [ ] **Step 3: Add shared types**

Create `src/lib/kpi-types.ts`:

```ts
export type DepartmentOption = {
  id: number;
  department_name: string;
  is_active: boolean;
};

export type KpiTypeOption = {
  id: number;
  type: string;
};

export type KpiTopic = {
  id: number;
  kpi_name: string;
  is_active: boolean;
  kpi_type: string[] | null;
};

export type KpiTemplate = {
  id: number;
  kpi_topic_id: number;
  target_area_type: string | null;
  target_gender: string | null;
  target_age_range: string | null;
  target_other: string | null;
  data_entry_inscl: string | null;
  data_entry_diag: string | null;
  data_entry_procedure: string | null;
  data_entry_drug: string | null;
  data_entry_lab: string | null;
  data_entry_special_pp: string | null;
  data_entry_other: string | null;
};

export type KpiPm = {
  id: number;
  kpi_topic_id: number;
  pm_name: string;
  pm_position: string | null;
  pm_department: string | null;
};

export type KpiDocument = {
  id: number;
  kpi_topic_id: number;
  doc_name: string;
  doc_type: string;
  file_path: string | null;
  created_at: string | null;
};

export type KpiDetail = {
  topic: KpiTopic;
  template: KpiTemplate | null;
  pm: KpiPm | null;
  document: KpiDocument | null;
};

export type KpiTemplatePayload = {
  topic: {
    id: number | null;
    kpi_name: string;
    is_active: boolean;
    kpi_type: string[];
  };
  template: Omit<KpiTemplate, "id" | "kpi_topic_id">;
  pm: Omit<KpiPm, "id" | "kpi_topic_id">;
  document: Omit<KpiDocument, "id" | "kpi_topic_id" | "created_at"> | null;
};

export type ActionState = {
  status: "idle" | "success" | "error";
  message: string;
  selectedId?: number;
};
```

- [ ] **Step 4: Add parser implementation**

Create `src/lib/kpi-form.ts`:

```ts
import type { KpiTemplatePayload } from "./kpi-types";

type ParseResult =
  | { ok: true; data: KpiTemplatePayload }
  | { ok: false; message: string };

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(formData: FormData, key: string): string | null {
  const value = text(formData, key);
  return value.length > 0 ? value : null;
}

function numberOrNull(value: string): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function parseKpiTemplateForm(formData: FormData): ParseResult {
  const kpiName = text(formData, "kpi_name");

  if (!kpiName) {
    return { ok: false, message: "KPI name is required." };
  }

  const docName = text(formData, "doc_name");
  const docType = text(formData, "doc_type");
  const filePath = text(formData, "file_path");
  const hasDocument = Boolean(docName || docType || filePath);

  if (hasDocument && (!docName || !docType)) {
    return {
      ok: false,
      message: "Document name and type are required when adding a document.",
    };
  }

  return {
    ok: true,
    data: {
      topic: {
        id: numberOrNull(text(formData, "id")),
        kpi_name: kpiName,
        is_active: formData.get("is_active") === "on",
        kpi_type: formData
          .getAll("kpi_type")
          .filter((value): value is string => typeof value === "string")
          .map((value) => value.trim())
          .filter(Boolean),
      },
      template: {
        target_area_type: nullableText(formData, "target_area_type"),
        target_gender: nullableText(formData, "target_gender"),
        target_age_range: nullableText(formData, "target_age_range"),
        target_other: nullableText(formData, "target_other"),
        data_entry_inscl: nullableText(formData, "data_entry_inscl"),
        data_entry_diag: nullableText(formData, "data_entry_diag"),
        data_entry_procedure: nullableText(formData, "data_entry_procedure"),
        data_entry_drug: nullableText(formData, "data_entry_drug"),
        data_entry_lab: nullableText(formData, "data_entry_lab"),
        data_entry_special_pp: nullableText(formData, "data_entry_special_pp"),
        data_entry_other: nullableText(formData, "data_entry_other"),
      },
      pm: {
        pm_name: text(formData, "pm_name"),
        pm_position: nullableText(formData, "pm_position"),
        pm_department: nullableText(formData, "pm_department"),
      },
      document: hasDocument
        ? {
            doc_name: docName,
            doc_type: docType,
            file_path: filePath || null,
          }
        : null,
    },
  };
}
```

- [ ] **Step 5: Run tests and commit**

Run:

```powershell
npm test -- src/lib/kpi-form.test.ts
```

Expected: PASS.

Commit:

```powershell
git add src/lib/kpi-types.ts src/lib/kpi-form.ts src/lib/kpi-form.test.ts
git commit -m "test: add KPI template form parsing"
```

## Task 3: Add Database Access Helpers

**Files:**
- Create: `src/lib/db.ts`

- [ ] **Step 1: Create database client**

Create `src/lib/db.ts`:

```ts
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured.");
}

export const sql = postgres(connectionString, {
  max: 5,
  idle_timeout: 20,
  connect_timeout: 10,
});
```

- [ ] **Step 2: Run lint**

Run:

```powershell
npm run lint
```

Expected: exits 0.

- [ ] **Step 3: Commit DB helper**

Run:

```powershell
git add src/lib/db.ts
git commit -m "feat: add PostgreSQL client"
```

## Task 4: Implement Save Server Action

**Files:**
- Create: `src/app/actions.ts`

- [ ] **Step 1: Create Server Action**

Create `src/app/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { parseKpiTemplateForm } from "@/lib/kpi-form";
import type { ActionState } from "@/lib/kpi-types";
import { sql } from "@/lib/db";

const initialError = (message: string): ActionState => ({
  status: "error",
  message,
});

export async function saveKpiTemplate(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseKpiTemplateForm(formData);

  if (!parsed.ok) {
    return initialError(parsed.message);
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
      return initialError("Unable to save KPI topic.");
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
```

- [ ] **Step 2: Verify unique constraints before relying on upsert**

Run:

```powershell
$env:DB_CLI_SKIP_UTF8_CONSOLE='1'; Get-Content .env | ForEach-Object { if ($_ -match '^\s*([^#][^=]*)=(.*)$') { $name=$matches[1].Trim(); $value=$matches[2].Trim().Trim('"'); Set-Item -Path "Env:$name" -Value $value } }; db-cli -g pg -H $env:DB_HOST -P $env:DB_PORT -u $env:DB_USER -p $env:DB_PASSWORD -d $env:DB_NAME -e "SELECT tc.table_name, kcu.column_name FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema WHERE tc.table_schema = 'public' AND tc.constraint_type IN ('UNIQUE','PRIMARY KEY') ORDER BY tc.table_name, kcu.ordinal_position;"
```

Expected: if `kpi_template.kpi_topic_id`, `kpi_pm.kpi_topic_id`, or `kpi_doc.kpi_topic_id` are missing unique constraints, add Task 4A before continuing.

- [ ] **Task 4A: Add one-to-one unique constraints when Step 2 reports them missing**

Run only if Step 2 shows missing unique constraints:

```powershell
$env:DB_CLI_SKIP_UTF8_CONSOLE='1'; Get-Content .env | ForEach-Object { if ($_ -match '^\s*([^#][^=]*)=(.*)$') { $name=$matches[1].Trim(); $value=$matches[2].Trim().Trim('"'); Set-Item -Path "Env:$name" -Value $value } }; db-cli -g pg -H $env:DB_HOST -P $env:DB_PORT -u $env:DB_USER -p $env:DB_PASSWORD -d $env:DB_NAME -e "ALTER TABLE kpi_template ADD CONSTRAINT kpi_template_kpi_topic_id_key UNIQUE (kpi_topic_id); ALTER TABLE kpi_pm ADD CONSTRAINT kpi_pm_kpi_topic_id_key UNIQUE (kpi_topic_id); ALTER TABLE kpi_doc ADD CONSTRAINT kpi_doc_kpi_topic_id_key UNIQUE (kpi_topic_id);"
```

Expected: `status|affectedRows|insertId` and `ok`.

- [ ] **Step 3: Run lint and commit**

Run:

```powershell
npm run lint
```

Expected: exits 0.

Commit:

```powershell
git add src/app/actions.ts
git commit -m "feat: save KPI templates"
```

## Task 5: Build Server Data Loading

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Replace starter page with database reads**

Replace `src/app/page.tsx` with:

```tsx
import { saveKpiTemplate } from "./actions";
import { KpiTemplateClient } from "./kpi-template-client";
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
    template:
      templates.find((item) => item.kpi_topic_id === topic.id) ?? null,
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
```

- [ ] **Step 2: Run lint**

Run:

```powershell
npm run lint
```

Expected: FAIL because `src/app/kpi-template-client.tsx` does not exist yet.

Do not commit until Task 6 creates the client component.

## Task 6: Build List + Detail Client UI

**Files:**
- Create: `src/app/kpi-template-client.tsx`

- [ ] **Step 1: Create client component**

Create `src/app/kpi-template-client.tsx` with a Client Component that:

- Uses `useActionState` for `saveKpiTemplate`
- Uses local state for selected KPI and search
- Shows left KPI list and New KPI button
- Shows grouped form sections
- Submits all fields by name matching `parseKpiTemplateForm`

Required field names:

```text
id
kpi_name
is_active
kpi_type
target_area_type
target_gender
target_age_range
target_other
data_entry_inscl
data_entry_diag
data_entry_procedure
data_entry_drug
data_entry_lab
data_entry_special_pp
data_entry_other
pm_name
pm_position
pm_department
doc_name
doc_type
file_path
```

The visual layout must match the approved A approach:

- Full-height app shell
- Compact top header
- Left panel with search and list
- Right panel with the detail form
- Save button visible in the form header and repeated after the last form section on narrow screens

- [ ] **Step 2: Run lint and resolve reported errors**

Run:

```powershell
npm run lint
```

Expected: exits 0.

- [ ] **Step 3: Commit page and client UI**

Run:

```powershell
git add src/app/page.tsx src/app/kpi-template-client.tsx
git commit -m "feat: add KPI template form UI"
```

## Task 7: Update App Metadata And Global Styles

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Update metadata and language**

Change metadata in `src/app/layout.tsx`:

```ts
export const metadata: Metadata = {
  title: "KPI Template",
  description: "KPI template recording system",
};
```

Set `<html lang="th">`.

- [ ] **Step 2: Update global styles**

Keep Tailwind import and set stable app colors:

```css
@import "tailwindcss";

:root {
  --background: #f7f8fa;
  --foreground: #172026;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}

button,
input,
select,
textarea {
  font: inherit;
}
```

- [ ] **Step 3: Run lint and commit**

Run:

```powershell
npm run lint
```

Expected: exits 0.

Commit:

```powershell
git add src/app/layout.tsx src/app/globals.css
git commit -m "style: update KPI app shell"
```

## Task 8: Verify Real Database Save

**Files:**
- No code files unless verification exposes defects.

- [ ] **Step 1: Run automated checks**

Run:

```powershell
npm test
npm run lint
npm run build
```

Expected: all exit 0.

- [ ] **Step 2: Start local dev server for verification**

Run:

```powershell
npm run dev
```

Expected: local Next.js server starts. This is not deployment.

- [ ] **Step 3: Submit a test KPI through the UI**

Use the browser form to create a KPI with:

```text
KPI name: Codex Verification KPI
KPI type: first available c_kpi_type option
Target area: Test Area
PM name: Codex Tester
Document name: Test Spec
Document type: PDF
File path: /tmp/test-spec.pdf
```

Expected: UI shows success message.

- [ ] **Step 4: Verify saved rows with db-cli**

Run:

```powershell
$env:DB_CLI_SKIP_UTF8_CONSOLE='1'; Get-Content .env | ForEach-Object { if ($_ -match '^\s*([^#][^=]*)=(.*)$') { $name=$matches[1].Trim(); $value=$matches[2].Trim().Trim('"'); Set-Item -Path "Env:$name" -Value $value } }; db-cli -g pg -H $env:DB_HOST -P $env:DB_PORT -u $env:DB_USER -p $env:DB_PASSWORD -d $env:DB_NAME -e "SELECT kt.id, kt.kpi_name, tmp.target_area_type, pm.pm_name, doc.doc_name FROM kpi_topic kt LEFT JOIN kpi_template tmp ON tmp.kpi_topic_id = kt.id LEFT JOIN kpi_pm pm ON pm.kpi_topic_id = kt.id LEFT JOIN kpi_doc doc ON doc.kpi_topic_id = kt.id WHERE kt.kpi_name = 'Codex Verification KPI' ORDER BY kt.id DESC LIMIT 1;"
```

Expected output includes:

```text
kpi_name|target_area_type|pm_name|doc_name
Codex Verification KPI|Test Area|Codex Tester|Test Spec
```

- [ ] **Step 5: Commit verification fixes only when source files changed**

If verification required source changes, first run `git status --short`, then add the exact modified source files shown by git status. Example when the source changes are in the action and client component:

```powershell
git add src/app/actions.ts src/app/kpi-template-client.tsx
git commit -m "fix: verify KPI template persistence"
```

If verification passes without source changes, do not create a commit for this step.
