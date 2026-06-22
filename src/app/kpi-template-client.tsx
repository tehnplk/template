"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type {
  ActionState,
  CDepartmentModel,
  CKpiTypeModel,
  KpiDetail,
  KpiGridFilters,
  KpiGridResult,
} from "@/lib/kpi-types";

type TemplateAction = (
  prevState: ActionState,
  formData: FormData,
) => Promise<ActionState>;

type KpiTemplateClientProps = {
  deleteAction: TemplateAction;
  departments: CDepartmentModel[];
  filters: KpiGridFilters;
  grid: KpiGridResult;
  kpiTypes: CKpiTypeModel[];
  saveAction: TemplateAction;
};

type ModalMode = "create" | "edit";

const initialActionState: ActionState = {
  status: "idle",
  message: "",
};

const inputClass =
  "min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

const textareaClass =
  "min-h-24 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm leading-6 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

const iconButtonClass =
  "inline-flex size-9 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40";

function emptyValue(value: string | null | undefined): string {
  return value ?? "";
}

function Field({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      <span>{label}</span>
      {children}
    </label>
  );
}

function FormSection({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="grid gap-4 border-t border-slate-200 pt-5">
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      {children}
    </section>
  );
}

function StatusMessage({ state }: { state: ActionState }) {
  if (!state.message) {
    return null;
  }

  const statusClass =
    state.status === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-rose-200 bg-rose-50 text-rose-800";

  return (
    <div className={`rounded-md border px-3 py-2 text-sm ${statusClass}`}>
      {state.message}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24">
      <path
        d="m21 21-4.2-4.2m1.2-5.3a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24">
      <path
        d="M12 5v14M5 12h14"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24">
      <path
        d="m6 6 12 12M18 6 6 18"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  const path = direction === "left" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6";

  return (
    <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24">
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function buildPageHref(filters: KpiGridFilters, page: number): string {
  const params = new URLSearchParams();

  if (filters.keyword) {
    params.set("q", filters.keyword);
  }

  if (filters.status !== "all") {
    params.set("status", filters.status);
  }

  if (filters.kpiType) {
    params.set("type", filters.kpiType);
  }

  if (filters.pageSize !== 10) {
    params.set("pageSize", String(filters.pageSize));
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();
  return query ? `/?${query}` : "/";
}

function displayText(value: string | null | undefined, fallback = "-") {
  const normalized = value?.trim();
  return normalized ? normalized : fallback;
}

export function KpiTemplateClient({
  deleteAction,
  departments,
  filters,
  grid,
  kpiTypes,
  saveAction,
}: KpiTemplateClientProps) {
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [newVersion, setNewVersion] = useState(0);
  const [saveState, saveFormAction, isSaving] = useActionState(
    async (prevState: ActionState, formData: FormData) => {
      const result = await saveAction(prevState, formData);

      if (result.status === "success") {
        setModalMode(null);
        setSelectedId(result.selectedId ?? null);
      }

      return result;
    },
    initialActionState,
  );
  const [deleteState, deleteFormAction, isDeleting] = useActionState(
    async (prevState: ActionState, formData: FormData) => {
      const result = await deleteAction(prevState, formData);

      if (result.status === "success") {
        setModalMode(null);
        setSelectedId(null);
      }

      return result;
    },
    initialActionState,
  );

  const selectedDetail = useMemo(
    () =>
      selectedId === null
        ? null
        : grid.rows.find((row) => row.topic.id === selectedId) ?? null,
    [grid.rows, selectedId],
  );
  const modalDetail = modalMode === "edit" ? selectedDetail : null;
  const selectedTypeIds = new Set(modalDetail?.topic.kpi_type ?? []);
  const modalKey = modalDetail
    ? `kpi-${modalDetail.topic.id}`
    : `new-${newVersion}`;
  const activeState = deleteState.message ? deleteState : saveState;
  const firstRecord =
    grid.total === 0 ? 0 : (grid.page - 1) * grid.pageSize + 1;
  const lastRecord = Math.min(grid.total, grid.page * grid.pageSize);

  function openCreateModal() {
    setSelectedId(null);
    setModalMode("create");
    setNewVersion((value) => value + 1);
  }

  function openEditModal(detail: KpiDetail) {
    setSelectedId(detail.topic.id);
    setModalMode("edit");
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-rows-[auto_1fr]">
        <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-normal text-slate-950">
                จัดการเทมเพลท KPI
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                ตาราง KPI พร้อมตัวกรอง แบ่งหน้า และจัดการข้อมูลจริงในฐานข้อมูล
              </p>
            </div>
            <button
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
              type="button"
              onClick={openCreateModal}
            >
              <PlusIcon />
              เพิ่ม KPI
            </button>
          </div>
          <div className="mt-3">
            <StatusMessage state={activeState} />
          </div>
        </header>

        <section className="grid gap-4 p-4 sm:p-6">
          <form
            action="/"
            className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm"
            method="get"
          >
            <input name="page" type="hidden" value="1" />
            <div className="grid gap-3 md:grid-cols-[1fr_160px_180px_140px_auto_auto] md:items-end">
              <Field label="ค้นหา KPI">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <SearchIcon />
                  </span>
                  <input
                    className={`${inputClass} pl-9`}
                    defaultValue={filters.keyword}
                    name="q"
                    placeholder="ชื่อ KPI"
                    type="search"
                  />
                </div>
              </Field>

              <Field label="สถานะ">
                <select
                  className={inputClass}
                  defaultValue={filters.status}
                  name="status"
                >
                  <option value="all">ทั้งหมด</option>
                  <option value="active">ใช้งาน</option>
                  <option value="inactive">ไม่ใช้งาน</option>
                </select>
              </Field>

              <Field label="ประเภท KPI">
                <select
                  className={inputClass}
                  defaultValue={filters.kpiType}
                  name="type"
                >
                  <option value="">ทั้งหมด</option>
                  {kpiTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.type}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="ต่อหน้า">
                <select
                  className={inputClass}
                  defaultValue={filters.pageSize}
                  name="pageSize"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </Field>

              <button
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                type="submit"
              >
                <SearchIcon />
                ค้นหา
              </button>

              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                href="/"
              >
                ล้างค่า
              </Link>
            </div>
          </form>

          <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-950">
                  KPI Datagrid
                </h2>
                <p className="text-sm text-slate-500">
                  แสดง {firstRecord}-{lastRecord} จาก {grid.total} รายการ
                </p>
              </div>
              <span className="text-sm text-slate-500">
                หน้า {grid.page} / {grid.totalPages}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="w-[34%] px-4 py-3">ชื่อ KPI</th>
                    <th className="px-4 py-3">ประเภท</th>
                    <th className="px-4 py-3">ผู้รับผิดชอบ</th>
                    <th className="px-4 py-3">หน่วยงาน</th>
                    <th className="px-4 py-3">สถานะ</th>
                    <th className="px-4 py-3">เอกสาร</th>
                    <th className="px-4 py-3 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {grid.rows.map((detail) => (
                    <tr
                      key={detail.topic.id}
                      className="align-top transition hover:bg-slate-50"
                    >
                      <td className="px-4 py-3">
                        <button
                          className="text-left font-semibold text-slate-950 hover:text-emerald-700"
                          type="button"
                          onClick={() => openEditModal(detail)}
                        >
                          {detail.topic.kpi_name}
                        </button>
                        <div className="mt-1 text-xs text-slate-500">
                          ID: {detail.topic.id}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {detail.typeNames.length > 0
                          ? detail.typeNames.join(", ")
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {displayText(detail.pm?.pm_name)}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {displayText(detail.pm?.pm_department)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-sm px-2 py-1 text-xs font-semibold ${
                            detail.topic.is_active
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {detail.topic.is_active ? "ใช้งาน" : "ไม่ใช้งาน"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {detail.document
                          ? `${detail.document.doc_name} (${detail.document.doc_type})`
                          : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            type="button"
                            onClick={() => openEditModal(detail)}
                          >
                            ดู/แก้ไข
                          </button>
                          <form
                            action={deleteFormAction}
                            onSubmit={(event) => {
                              if (!window.confirm("ยืนยันการลบ KPI นี้?")) {
                                event.preventDefault();
                              }
                            }}
                          >
                            <input
                              name="id"
                              type="hidden"
                              value={detail.topic.id}
                            />
                            <button
                              className="rounded-md border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={isDeleting}
                              type="submit"
                            >
                              ลบ
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {grid.rows.length === 0 ? (
              <div className="grid place-items-center border-t border-slate-100 px-4 py-14 text-center">
                <div>
                  <h3 className="text-base font-semibold text-slate-950">
                    ไม่พบข้อมูล KPI
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    ปรับตัวกรองหรือเพิ่ม KPI ใหม่
                  </p>
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                รวมทั้งหมด {grid.total} รายการ
              </p>
              <nav
                aria-label="เปลี่ยนหน้า"
                className="flex items-center justify-end gap-2"
              >
                {grid.page <= 1 ? (
                  <span className={iconButtonClass} aria-disabled="true">
                    <ChevronIcon direction="left" />
                  </span>
                ) : (
                  <Link
                    aria-label="หน้าก่อนหน้า"
                    className={iconButtonClass}
                    href={buildPageHref(filters, grid.page - 1)}
                  >
                    <ChevronIcon direction="left" />
                  </Link>
                )}

                <span className="min-w-20 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm font-semibold text-slate-700">
                  {grid.page} / {grid.totalPages}
                </span>

                {grid.page >= grid.totalPages ? (
                  <span className={iconButtonClass} aria-disabled="true">
                    <ChevronIcon direction="right" />
                  </span>
                ) : (
                  <Link
                    aria-label="หน้าถัดไป"
                    className={iconButtonClass}
                    href={buildPageHref(filters, grid.page + 1)}
                  >
                    <ChevronIcon direction="right" />
                  </Link>
                )}
              </nav>
            </div>
          </div>
        </section>
      </div>

      {modalMode ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-100 text-slate-950"
          role="dialog"
        >
          <form
            key={modalKey}
            action={saveFormAction}
            className="grid h-dvh grid-rows-[auto_1fr_auto]"
          >
            <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">
                    {modalDetail ? "รายละเอียด KPI" : "เพิ่ม KPI ใหม่"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {modalDetail
                      ? `แก้ไขข้อมูลของ ${modalDetail.topic.kpi_name}`
                      : "กรอกข้อมูลเทมเพลท KPI และบันทึกลงฐานข้อมูล"}
                  </p>
                </div>
                <button
                  aria-label="ปิด"
                  className={iconButtonClass}
                  type="button"
                  onClick={() => setModalMode(null)}
                >
                  <CloseIcon />
                </button>
              </div>
            </header>

            <div className="overflow-y-auto px-4 py-5 sm:px-6">
              <div className="mx-auto grid max-w-6xl gap-6 rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                {modalDetail ? (
                  <input name="id" type="hidden" value={modalDetail.topic.id} />
                ) : null}

                <FormSection title="ข้อมูล KPI">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="ชื่อ KPI">
                      <input
                        className={inputClass}
                        defaultValue={modalDetail?.topic.kpi_name ?? ""}
                        name="kpi_name"
                        required
                      />
                    </Field>

                    <Field label="สถานะ">
                      <label className="flex min-h-10 items-center gap-3 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700">
                        <input
                          className="size-4 accent-emerald-700"
                          defaultChecked={modalDetail?.topic.is_active ?? true}
                          name="is_active"
                          type="checkbox"
                        />
                        ใช้งาน
                      </label>
                    </Field>
                  </div>

                  <div className="grid gap-2">
                    <span className="text-sm font-medium text-slate-700">
                      ประเภท KPI
                    </span>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {kpiTypes.map((type) => {
                        const value = String(type.id);

                        return (
                          <label
                            key={type.id}
                            className="flex min-h-10 items-center gap-3 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700"
                          >
                            <input
                              className="size-4 accent-emerald-700"
                              defaultChecked={selectedTypeIds.has(value)}
                              name="kpi_type"
                              type="checkbox"
                              value={value}
                            />
                            {type.type}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </FormSection>

                <FormSection title="กลุ่มเป้าหมาย">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="ประเภทพื้นที่เป้าหมาย">
                      <select
                        className={inputClass}
                        defaultValue={emptyValue(
                          modalDetail?.template?.target_area_type,
                        )}
                        name="target_area_type"
                      >
                        <option value="">ไม่ระบุ</option>
                        <option value="Province">จังหวัด</option>
                        <option value="District">อำเภอ</option>
                        <option value="Hospital">โรงพยาบาล</option>
                        <option value="Department">หน่วยงาน</option>
                      </select>
                    </Field>

                    <Field label="เพศเป้าหมาย">
                      <select
                        className={inputClass}
                        defaultValue={emptyValue(
                          modalDetail?.template?.target_gender,
                        )}
                        name="target_gender"
                      >
                        <option value="">ทั้งหมด</option>
                        <option value="Female">หญิง</option>
                        <option value="Male">ชาย</option>
                        <option value="Other">อื่น ๆ</option>
                      </select>
                    </Field>

                    <Field label="ช่วงอายุเป้าหมาย">
                      <input
                        className={inputClass}
                        defaultValue={emptyValue(
                          modalDetail?.template?.target_age_range,
                        )}
                        name="target_age_range"
                        placeholder="เช่น 30-60"
                      />
                    </Field>

                    <Field label="เป้าหมายอื่น ๆ">
                      <input
                        className={inputClass}
                        defaultValue={emptyValue(
                          modalDetail?.template?.target_other,
                        )}
                        name="target_other"
                      />
                    </Field>
                  </div>
                </FormSection>

                <FormSection title="ข้อมูลสำหรับบันทึกผลงาน">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="INSCL">
                      <textarea
                        className={textareaClass}
                        defaultValue={emptyValue(
                          modalDetail?.template?.data_entry_inscl,
                        )}
                        name="data_entry_inscl"
                      />
                    </Field>

                    <Field label="วินิจฉัย">
                      <textarea
                        className={textareaClass}
                        defaultValue={emptyValue(
                          modalDetail?.template?.data_entry_diag,
                        )}
                        name="data_entry_diag"
                      />
                    </Field>

                    <Field label="หัตถการ">
                      <textarea
                        className={textareaClass}
                        defaultValue={emptyValue(
                          modalDetail?.template?.data_entry_procedure,
                        )}
                        name="data_entry_procedure"
                      />
                    </Field>

                    <Field label="ยา">
                      <textarea
                        className={textareaClass}
                        defaultValue={emptyValue(
                          modalDetail?.template?.data_entry_drug,
                        )}
                        name="data_entry_drug"
                      />
                    </Field>

                    <Field label="แล็บ">
                      <textarea
                        className={textareaClass}
                        defaultValue={emptyValue(
                          modalDetail?.template?.data_entry_lab,
                        )}
                        name="data_entry_lab"
                      />
                    </Field>

                    <Field label="Special PP">
                      <textarea
                        className={textareaClass}
                        defaultValue={emptyValue(
                          modalDetail?.template?.data_entry_special_pp,
                        )}
                        name="data_entry_special_pp"
                      />
                    </Field>

                    <div className="md:col-span-2">
                      <Field label="ข้อมูลอื่น ๆ">
                        <textarea
                          className={textareaClass}
                          defaultValue={emptyValue(
                            modalDetail?.template?.data_entry_other,
                          )}
                          name="data_entry_other"
                        />
                      </Field>
                    </div>
                  </div>
                </FormSection>

                <FormSection title="ผู้รับผิดชอบ">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Field label="ชื่อผู้รับผิดชอบ">
                      <input
                        className={inputClass}
                        defaultValue={modalDetail?.pm?.pm_name ?? ""}
                        name="pm_name"
                      />
                    </Field>

                    <Field label="ตำแหน่ง">
                      <input
                        className={inputClass}
                        defaultValue={emptyValue(modalDetail?.pm?.pm_position)}
                        name="pm_position"
                      />
                    </Field>

                    <Field label="หน่วยงาน">
                      <select
                        className={inputClass}
                        defaultValue={emptyValue(
                          modalDetail?.pm?.pm_department,
                        )}
                        name="pm_department"
                      >
                        <option value="">ไม่ระบุ</option>
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
                </FormSection>

                <FormSection title="เอกสารอ้างอิง">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Field label="ชื่อเอกสาร">
                      <input
                        className={inputClass}
                        defaultValue={modalDetail?.document?.doc_name ?? ""}
                        name="doc_name"
                      />
                    </Field>

                    <Field label="ประเภทเอกสาร">
                      <select
                        className={inputClass}
                        defaultValue={modalDetail?.document?.doc_type ?? ""}
                        name="doc_type"
                      >
                        <option value="">ไม่ระบุ</option>
                        <option value="PDF">PDF</option>
                        <option value="DOC">DOC</option>
                        <option value="XLS">XLS</option>
                        <option value="URL">URL</option>
                        <option value="Other">อื่น ๆ</option>
                      </select>
                    </Field>

                    <Field label="ตำแหน่งไฟล์">
                      <input
                        className={inputClass}
                        defaultValue={emptyValue(
                          modalDetail?.document?.file_path,
                        )}
                        name="file_path"
                        placeholder="/docs/example.pdf"
                      />
                    </Field>
                  </div>
                </FormSection>
              </div>
            </div>

            <footer className="border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
              <div className="mx-auto flex max-w-6xl flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
                <button
                  className="min-h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  type="button"
                  onClick={() => setModalMode(null)}
                >
                  ยกเลิก
                </button>
                <button
                  className="min-h-10 rounded-md bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  disabled={isSaving}
                  type="submit"
                >
                  {isSaving ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </div>
            </footer>
          </form>
        </div>
      ) : null}
    </main>
  );
}
