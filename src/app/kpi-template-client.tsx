"use client";

import { useActionState, useMemo, useState } from "react";
import type {
  ActionState,
  DepartmentOption,
  KpiDetail,
  KpiTypeOption,
} from "@/lib/kpi-types";

type SaveAction = (
  prevState: ActionState,
  formData: FormData,
) => Promise<ActionState>;

type KpiTemplateClientProps = {
  action: SaveAction;
  departments: DepartmentOption[];
  details: KpiDetail[];
  kpiTypes: KpiTypeOption[];
};

const initialActionState: ActionState = {
  status: "idle",
  message: "",
};

const textInputClass =
  "min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

const textAreaClass =
  "min-h-20 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm leading-6 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

function emptyValue(value: string | null | undefined): string {
  return value ?? "";
}

function Field({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Section({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="border-t border-slate-200 pt-5">
      <h2 className="mb-4 text-base font-semibold text-slate-950">{title}</h2>
      {children}
    </section>
  );
}

function StatusMessage({ state }: { state: ActionState }) {
  if (!state.message) {
    return (
      <span className="text-sm text-slate-500">
        Select a KPI or create a new template.
      </span>
    );
  }

  const statusClass =
    state.status === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-rose-200 bg-rose-50 text-rose-800";

  return (
    <span className={`rounded-md border px-3 py-2 text-sm ${statusClass}`}>
      {state.message}
    </span>
  );
}

export function KpiTemplateClient({
  action,
  departments,
  details,
  kpiTypes,
}: KpiTemplateClientProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    initialActionState,
  );
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | "new" | null>(
    details[0]?.topic.id ?? null,
  );
  const [newVersion, setNewVersion] = useState(0);
  const [ignoredActionSelectedId, setIgnoredActionSelectedId] = useState<
    number | undefined
  >(undefined);

  const filteredDetails = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return details;
    }

    return details.filter((detail) =>
      detail.topic.kpi_name.toLowerCase().includes(normalizedQuery),
    );
  }, [details, query]);

  const actionSelectedId =
    state.status === "success" && state.selectedId !== ignoredActionSelectedId
      ? state.selectedId
      : undefined;

  const effectiveSelectedId =
    selectedId === "new"
      ? actionSelectedId ?? null
      : selectedId !== null &&
          details.some((detail) => detail.topic.id === selectedId)
        ? selectedId
        : actionSelectedId ?? details[0]?.topic.id ?? null;

  const selectedDetail =
    effectiveSelectedId === null
      ? null
      : details.find((detail) => detail.topic.id === effectiveSelectedId) ??
        null;

  const selectedTypeIds = new Set(selectedDetail?.topic.kpi_type ?? []);
  const formKey = selectedDetail
    ? `kpi-${selectedDetail.topic.id}`
    : `new-${newVersion}`;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col">
        <header className="flex flex-col gap-4 border-b border-slate-200 bg-white px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal text-slate-950">
              KPI Template
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Record KPI topics, target rules, data entry details, PM owners,
              and document metadata.
            </p>
          </div>
          <StatusMessage state={state} />
        </header>

        <div className="grid flex-1 grid-cols-1 lg:grid-cols-[320px_1fr]">
          <aside className="border-b border-slate-200 bg-white lg:border-b-0 lg:border-r">
            <div className="sticky top-0 grid gap-4 p-4 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-950">
                    KPI Topics
                  </h2>
                  <p className="text-xs text-slate-500">
                    {details.length} records
                  </p>
                </div>
                <button
                  className="min-h-10 rounded-md bg-slate-950 px-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  type="button"
                  onClick={() => {
                    setIgnoredActionSelectedId(state.selectedId);
                    setSelectedId("new");
                    setNewVersion((value) => value + 1);
                  }}
                >
                  New KPI
                </button>
              </div>

              <input
                className={textInputClass}
                placeholder="Search KPI"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />

              <div className="grid max-h-[calc(100vh-220px)] gap-2 overflow-auto pr-1">
                {filteredDetails.map((detail) => {
                  const isSelected = effectiveSelectedId === detail.topic.id;

                  return (
                    <button
                      key={detail.topic.id}
                      className={`rounded-md border px-3 py-3 text-left transition ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                      type="button"
                      onClick={() => setSelectedId(detail.topic.id)}
                    >
                      <span className="block text-sm font-semibold text-slate-950">
                        {detail.topic.kpi_name}
                      </span>
                      <span
                        className={`mt-1 inline-flex rounded-sm px-2 py-0.5 text-xs font-medium ${
                          detail.topic.is_active
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {detail.topic.is_active ? "Active" : "Inactive"}
                      </span>
                    </button>
                  );
                })}

                {filteredDetails.length === 0 ? (
                  <p className="rounded-md border border-dashed border-slate-300 px-3 py-6 text-center text-sm text-slate-500">
                    No KPI topics found.
                  </p>
                ) : null}
              </div>
            </div>
          </aside>

          <section className="bg-slate-100 p-4 sm:p-6">
            <form
              key={formKey}
              action={formAction}
              className="mx-auto grid max-w-5xl gap-6 rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
            >
              <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">
                    {selectedDetail ? "Edit KPI Template" : "New KPI Template"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Save writes directly to PostgreSQL.
                  </p>
                </div>
                <button
                  className="min-h-11 rounded-md bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  type="submit"
                  disabled={isPending}
                >
                  {isPending ? "Saving..." : "Save Template"}
                </button>
              </div>

              {selectedDetail ? (
                <input name="id" type="hidden" value={selectedDetail.topic.id} />
              ) : null}

              <Section title="KPI Topic">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="KPI name">
                    <input
                      className={textInputClass}
                      name="kpi_name"
                      required
                      defaultValue={selectedDetail?.topic.kpi_name ?? ""}
                    />
                  </Field>

                  <Field label="Status">
                    <label className="flex min-h-11 items-center gap-3 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700">
                      <input
                        className="size-4 accent-emerald-700"
                        name="is_active"
                        type="checkbox"
                        defaultChecked={selectedDetail?.topic.is_active ?? true}
                      />
                      Active
                    </label>
                  </Field>
                </div>

                <div className="mt-4 grid gap-2">
                  <span className="text-sm font-medium text-slate-700">
                    KPI type
                  </span>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {kpiTypes.map((type) => {
                      const value = String(type.id);

                      return (
                        <label
                          key={type.id}
                          className="flex min-h-11 items-center gap-3 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700"
                        >
                          <input
                            className="size-4 accent-emerald-700"
                            name="kpi_type"
                            type="checkbox"
                            value={value}
                            defaultChecked={selectedTypeIds.has(value)}
                          />
                          {type.type}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </Section>

              <Section title="Target Group">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Target area type">
                    <select
                      className={textInputClass}
                      name="target_area_type"
                      defaultValue={emptyValue(
                        selectedDetail?.template?.target_area_type,
                      )}
                    >
                      <option value="">Not specified</option>
                      <option value="Province">Province</option>
                      <option value="District">District</option>
                      <option value="Hospital">Hospital</option>
                      <option value="Department">Department</option>
                    </select>
                  </Field>

                  <Field label="Target gender">
                    <select
                      className={textInputClass}
                      name="target_gender"
                      defaultValue={emptyValue(
                        selectedDetail?.template?.target_gender,
                      )}
                    >
                      <option value="">All</option>
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </Field>

                  <Field label="Target age range">
                    <input
                      className={textInputClass}
                      name="target_age_range"
                      placeholder="Example: 30-60"
                      defaultValue={emptyValue(
                        selectedDetail?.template?.target_age_range,
                      )}
                    />
                  </Field>

                  <Field label="Target other">
                    <input
                      className={textInputClass}
                      name="target_other"
                      defaultValue={emptyValue(
                        selectedDetail?.template?.target_other,
                      )}
                    />
                  </Field>
                </div>
              </Section>

              <Section title="Data Entry">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="INSCL">
                    <textarea
                      className={textAreaClass}
                      name="data_entry_inscl"
                      defaultValue={emptyValue(
                        selectedDetail?.template?.data_entry_inscl,
                      )}
                    />
                  </Field>

                  <Field label="Diagnosis">
                    <textarea
                      className={textAreaClass}
                      name="data_entry_diag"
                      defaultValue={emptyValue(
                        selectedDetail?.template?.data_entry_diag,
                      )}
                    />
                  </Field>

                  <Field label="Procedure">
                    <textarea
                      className={textAreaClass}
                      name="data_entry_procedure"
                      defaultValue={emptyValue(
                        selectedDetail?.template?.data_entry_procedure,
                      )}
                    />
                  </Field>

                  <Field label="Drug">
                    <textarea
                      className={textAreaClass}
                      name="data_entry_drug"
                      defaultValue={emptyValue(
                        selectedDetail?.template?.data_entry_drug,
                      )}
                    />
                  </Field>

                  <Field label="Lab">
                    <textarea
                      className={textAreaClass}
                      name="data_entry_lab"
                      defaultValue={emptyValue(
                        selectedDetail?.template?.data_entry_lab,
                      )}
                    />
                  </Field>

                  <Field label="Special PP">
                    <textarea
                      className={textAreaClass}
                      name="data_entry_special_pp"
                      defaultValue={emptyValue(
                        selectedDetail?.template?.data_entry_special_pp,
                      )}
                    />
                  </Field>

                  <div className="md:col-span-2">
                    <Field label="Other data entry">
                      <textarea
                        className={textAreaClass}
                        name="data_entry_other"
                        defaultValue={emptyValue(
                          selectedDetail?.template?.data_entry_other,
                        )}
                      />
                    </Field>
                  </div>
                </div>
              </Section>

              <Section title="Responsible Person">
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="PM name">
                    <input
                      className={textInputClass}
                      name="pm_name"
                      defaultValue={selectedDetail?.pm?.pm_name ?? ""}
                    />
                  </Field>

                  <Field label="PM position">
                    <input
                      className={textInputClass}
                      name="pm_position"
                      defaultValue={emptyValue(selectedDetail?.pm?.pm_position)}
                    />
                  </Field>

                  <Field label="PM department">
                    <select
                      className={textInputClass}
                      name="pm_department"
                      defaultValue={emptyValue(
                        selectedDetail?.pm?.pm_department,
                      )}
                    >
                      <option value="">Not specified</option>
                      {departments.map((department) => (
                        <option
                          key={department.id}
                          value={department.department_name}
                        >
                          {department.department_name}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </Section>

              <Section title="Documents">
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Document name">
                    <input
                      className={textInputClass}
                      name="doc_name"
                      defaultValue={selectedDetail?.document?.doc_name ?? ""}
                    />
                  </Field>

                  <Field label="Document type">
                    <select
                      className={textInputClass}
                      name="doc_type"
                      defaultValue={selectedDetail?.document?.doc_type ?? ""}
                    >
                      <option value="">Not specified</option>
                      <option value="PDF">PDF</option>
                      <option value="DOC">DOC</option>
                      <option value="XLS">XLS</option>
                      <option value="URL">URL</option>
                      <option value="Other">Other</option>
                    </select>
                  </Field>

                  <Field label="File path">
                    <input
                      className={textInputClass}
                      name="file_path"
                      placeholder="/docs/example.pdf"
                      defaultValue={emptyValue(
                        selectedDetail?.document?.file_path,
                      )}
                    />
                  </Field>
                </div>
              </Section>

              <div className="flex justify-end border-t border-slate-200 pt-5">
                <button
                  className="min-h-11 w-full rounded-md bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
                  type="submit"
                  disabled={isPending}
                >
                  {isPending ? "Saving..." : "Save Template"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
