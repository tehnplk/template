"use client";

import {
  BookOpenText,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Database,
  FileText,
  Pencil,
  Plus,
  Search,
  Target,
  UserRound,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import Swal from "sweetalert2";
import { useActionState, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type {
  ActionState,
  DepartmentOption,
  KpiDetail,
  KpiGridFilters,
  KpiGridResult,
  KpiTypeOption,
} from "@/lib/kpi-types";

type TemplateAction = (
  prevState: ActionState,
  formData: FormData,
) => Promise<ActionState>;

type KpiTemplateClientProps = {
  departments: DepartmentOption[];
  filters: KpiGridFilters;
  grid: KpiGridResult;
  kpiTypes: KpiTypeOption[];
  saveAction: TemplateAction;
};

type ModalMode = "create" | "edit" | "view";

const initialActionState: ActionState = {
  status: "idle",
  message: "",
};

const inputClass =
  "min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-blue-700 outline-none transition read-only:cursor-text read-only:bg-slate-50 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-600";

const filterInputClass =
  "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-blue-700 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

const textareaClass =
  "min-h-24 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm leading-6 text-blue-700 outline-none transition read-only:cursor-text read-only:bg-slate-50 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-600";

const iconButtonClass =
  "inline-flex size-9 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40";

const filterFieldClass =
  "grid gap-1 text-sm font-medium text-slate-700";

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

function InlineField({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <label className="grid grid-cols-[minmax(120px,38%)_minmax(0,1fr)] items-start gap-3 text-sm font-medium text-slate-700">
      <span className="pt-2 text-right">{label} :</span>
      {children}
    </label>
  );
}

function FormSection({
  action,
  children,
  icon: Icon,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  icon?: LucideIcon;
  title: string;
}) {
  return (
    <section className="grid gap-4 border-t border-slate-200 pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-base font-semibold text-slate-950">
          {Icon ? (
            <Icon
              aria-hidden="true"
              className="size-5 shrink-0 text-blue-700"
            />
          ) : null}
          <span>{title}</span>
        </h3>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
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

function buildPageHref(filters: KpiGridFilters, page: number): string {
  const params = new URLSearchParams();

  if (filters.keyword) {
    params.set("q", filters.keyword);
  }

  if (filters.department) {
    params.set("department", filters.department);
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
  departments,
  filters,
  grid,
  kpiTypes,
  saveAction,
}: KpiTemplateClientProps) {
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [newVersion, setNewVersion] = useState(0);
  const filterSubmitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveState, saveFormAction, isSaving] = useActionState(
    async (prevState: ActionState, formData: FormData) => {
      const result = await saveAction(prevState, formData);

      if (result.status === "success") {
        setModalMode(null);
        setSelectedId(result.selectedId ?? null);
        void Swal.fire({
          icon: "success",
          position: "top-end",
          showConfirmButton: false,
          timer: 1800,
          timerProgressBar: true,
          title: "สำเร็จ",
          toast: true,
        });
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
  const modalDetail =
    modalMode === "edit" || modalMode === "view" ? selectedDetail : null;
  const isReadOnly = modalMode === "view";
  const selectedTypeIds = new Set(modalDetail?.topic.kpi_type ?? []);
  const modalKey = modalDetail
    ? `${modalMode}-kpi-${modalDetail.topic.id}`
    : `new-${newVersion}`;
  const activeState = saveState;
  const firstRecord =
    grid.total === 0 ? 0 : (grid.page - 1) * grid.pageSize + 1;
  const lastRecord = Math.min(grid.total, grid.page * grid.pageSize);

  function openCreateModal() {
    setSelectedId(null);
    setModalMode("create");
    setNewVersion((value) => value + 1);
  }

  async function openEditModal(detail: KpiDetail) {
    const result = await Swal.fire({
      title: "กรอกรหัสผ่าน",
      input: "password",
      inputPlaceholder: "Password",
      showCancelButton: true,
      confirmButtonText: "ตกลง",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#047857",
      cancelButtonColor: "#475569",
      preConfirm: (password) => {
        if (password !== "112233") {
          Swal.showValidationMessage("รหัสผ่านไม่ถูกต้อง");
          return false;
        }

        return password;
      },
    });

    if (!result.isConfirmed) {
      return;
    }

    setSelectedId(detail.topic.id);
    setModalMode("edit");
  }

  function openViewModal(detail: KpiDetail) {
    setSelectedId(detail.topic.id);
    setModalMode("view");
  }

  function submitFilterForm(form: HTMLFormElement | null, delay = 0) {
    if (!form) {
      return;
    }

    if (filterSubmitTimer.current) {
      clearTimeout(filterSubmitTimer.current);
    }

    if (delay > 0) {
      filterSubmitTimer.current = setTimeout(() => {
        form.requestSubmit();
      }, delay);
      return;
    }

    form.requestSubmit();
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="grid min-h-screen w-full grid-rows-[auto_1fr]">
        <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-normal text-slate-950">
                แนวทางการบันทึกข้อมูลผลการดำเนินงาน
              </h1>
            </div>
            <button
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
              type="button"
              onClick={openCreateModal}
            >
              <Plus aria-hidden="true" className="size-4" />
              เพิ่ม KPI
            </button>
          </div>
          <div className="mt-3">
            <StatusMessage state={activeState} />
          </div>
        </header>

        <section className="grid content-start gap-4 p-4 sm:p-6">
          <form
            action="/"
            className="rounded-md border border-slate-200 bg-white px-4 py-3 shadow-sm"
            method="get"
          >
            <input name="page" type="hidden" value="1" />
            <input name="pageSize" type="hidden" value={filters.pageSize} />
            <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
              <div className="min-w-0 flex-1">
                <label className={filterFieldClass}>
                  <span>ค้นหา KPI</span>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Search aria-hidden="true" className="size-4" />
                    </span>
                    <input
                      className={`${filterInputClass} pl-9`}
                      defaultValue={filters.keyword}
                      name="q"
                      placeholder="ชื่อ KPI"
                      type="search"
                      onChange={(event) =>
                        submitFilterForm(event.currentTarget.form, 500)
                      }
                    />
                  </div>
                </label>
              </div>

              <div className="w-full xl:w-[360px]">
                <label className={filterFieldClass}>
                  <span>กลุ่มงาน</span>
                  <select
                    className={filterInputClass}
                    defaultValue={filters.department}
                    name="department"
                    onChange={(event) =>
                      submitFilterForm(event.currentTarget.form)
                    }
                  >
                    <option value="">ทั้งหมด</option>
                    {departments.map((department) => (
                      <option
                        key={department.id}
                        value={department.department_name}
                      >
                        {department.department_name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </form>

          <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-950">
                  รายการ KPI
                </h2>
                <p className="text-sm text-slate-500">
                  แสดง {firstRecord}-{lastRecord} จาก {grid.total} รายการ
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <span className="text-sm text-slate-500">
                  หน้า {grid.page} / {grid.totalPages}
                </span>
                <form
                  action="/"
                  className="flex items-center gap-2"
                  method="get"
                >
                  <input name="page" type="hidden" value="1" />
                  <input name="q" type="hidden" value={filters.keyword} />
                  <input
                    name="department"
                    type="hidden"
                    value={filters.department}
                  />
                  <select
                    className={`${filterInputClass} w-24`}
                    aria-label="ต่อหน้า"
                    defaultValue={filters.pageSize}
                    id="grid-page-size"
                    name="pageSize"
                    onChange={(event) =>
                      event.currentTarget.form?.requestSubmit()
                    }
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                  </select>
                </form>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="w-20 px-4 py-3">#</th>
                    <th className="px-4 py-3">ชื่อ KPI</th>
                    <th className="w-[24%] px-4 py-3">กลุ่มงาน</th>
                    <th className="px-4 py-3">เอกสาร</th>
                    <th className="w-20 px-4 py-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {grid.rows.map((detail) => (
                    <tr
                      key={detail.topic.id}
                      className="align-top transition hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 font-medium text-slate-600">
                        {detail.topic.id}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          className="cursor-pointer text-left font-semibold text-slate-950 hover:text-emerald-700"
                          type="button"
                          onClick={() => openViewModal(detail)}
                        >
                          {detail.topic.kpi_name}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {displayText(detail.pm?.pm_department)}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {detail.document?.google_drive_url ? (
                          <a
                            className={iconButtonClass}
                            href={detail.document.google_drive_url}
                            rel="noreferrer"
                            target="_blank"
                            title="เปิดเอกสาร"
                          >
                            <FileText aria-hidden="true" className="size-4" />
                            <span className="sr-only">เปิดเอกสาร</span>
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            className={iconButtonClass}
                            title="ดู/แก้ไข"
                            type="button"
                            onClick={() => void openEditModal(detail)}
                          >
                            <Pencil aria-hidden="true" className="size-4" />
                            <span className="sr-only">ดู/แก้ไข</span>
                          </button>
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
                    <ChevronLeft aria-hidden="true" className="size-4" />
                  </span>
                ) : (
                  <Link
                    aria-label="หน้าก่อนหน้า"
                    className={iconButtonClass}
                    href={buildPageHref(filters, grid.page - 1)}
                  >
                    <ChevronLeft aria-hidden="true" className="size-4" />
                  </Link>
                )}

                <span className="min-w-20 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm font-semibold text-slate-700">
                  {grid.page} / {grid.totalPages}
                </span>

                {grid.page >= grid.totalPages ? (
                  <span className={iconButtonClass} aria-disabled="true">
                    <ChevronRight aria-hidden="true" className="size-4" />
                  </span>
                ) : (
                  <Link
                    aria-label="หน้าถัดไป"
                    className={iconButtonClass}
                    href={buildPageHref(filters, grid.page + 1)}
                  >
                    <ChevronRight aria-hidden="true" className="size-4" />
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
            className="grid h-dvh grid-rows-[auto_1fr]"
          >
            <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">
                    แนวทางการบันทึกข้อมูล
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {isReadOnly && modalDetail
                      ? modalDetail.topic.kpi_name
                      : modalDetail
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
                  <X aria-hidden="true" className="size-4" />
                </button>
              </div>
            </header>

            <div className="overflow-y-auto px-4 py-5 sm:px-6">
              <div className="mx-auto grid max-w-6xl gap-6 rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                {modalDetail ? (
                  <input name="id" type="hidden" value={modalDetail.topic.id} />
                ) : null}

                <div className="grid gap-6">
                  <FormSection
                    action={
                      <label className="flex min-h-9 items-center gap-3 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700">
                        <span>สถานะ</span>
                        <input
                          className="size-4 accent-emerald-700"
                          defaultChecked={modalDetail?.topic.is_active ?? true}
                          disabled={isReadOnly}
                          name="is_active"
                          type="checkbox"
                        />
                        <span>ใช้งาน</span>
                      </label>
                    }
                    icon={ClipboardList}
                    title="ชื่อตัวชี้วัดผลงาน"
                  >
                    <div className="grid gap-4">
                      <Field label="ชื่อ KPI">
                        <input
                          className={inputClass}
                          defaultValue={modalDetail?.topic.kpi_name ?? ""}
                          name="kpi_name"
                          readOnly={isReadOnly}
                          required
                        />
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
                                disabled={isReadOnly}
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

                <FormSection icon={Target} title="วิธีการระบุกลุ่มเป้าหมาย (จัดทำรายชื่อกลุ่มเป้าหมาย)">
                  <div className="grid gap-3">
                    <InlineField label="ประเภทการอยู่อาศัย (TYPE AREA)">
                      <input
                        className={inputClass}
                        defaultValue={emptyValue(
                          modalDetail?.template?.target_area_type,
                        )}
                        name="target_area_type"
                        placeholder="กรอก type area = 1,2,3,4,5"
                        readOnly={isReadOnly}
                      />
                    </InlineField>

                    <InlineField label="เพศ">
                      <select
                        className={inputClass}
                        defaultValue={emptyValue(
                          modalDetail?.template?.target_gender,
                        )}
                        name="target_gender"
                        disabled={isReadOnly}
                      >
                        <option value="">ทั้งหมด</option>
                        <option value="Female">หญิง</option>
                        <option value="Male">ชาย</option>
                        <option value="Other">อื่น ๆ</option>
                      </select>
                    </InlineField>

                    <InlineField label="ช่วงอายุ">
                      <input
                        className={inputClass}
                        defaultValue={emptyValue(
                          modalDetail?.template?.target_age_range,
                        )}
                        name="target_age_range"
                        placeholder="เช่น 30-60"
                        readOnly={isReadOnly}
                      />
                    </InlineField>

                    <InlineField label="ได้รับการวินิจฉัยก่อนหน้า เช่น เบาหวาน ความดัน">
                      <input
                        className={inputClass}
                        defaultValue={emptyValue(
                          modalDetail?.template?.target_previous_diag,
                        )}
                        name="target_previous_diag"
                        placeholder="ระบุ ICD10"
                        readOnly={isReadOnly}
                      />
                    </InlineField>

                    <InlineField label="เงื่อนไขอื่นๆ">
                      <textarea
                        className={textareaClass}
                        defaultValue={emptyValue(
                          modalDetail?.template?.target_other,
                        )}
                        name="target_other"
                        readOnly={isReadOnly}
                      />
                    </InlineField>
                  </div>
                </FormSection>

                <FormSection
                  icon={Database}
                  title="กิจกรรมที่ต้องบันทึกลงใน HIS เพื่อให้ได้ผลงาน"
                >
                  <div className="grid gap-3">
                    <InlineField label="สิทธิรักษาที่ต้องลง">
                      <textarea
                        className={textareaClass}
                        defaultValue={emptyValue(
                          modalDetail?.template?.data_entry_inscl,
                        )}
                        name="data_entry_inscl"
                        readOnly={isReadOnly}
                      />
                    </InlineField>

                    <InlineField label="รหัสวินิจฉัยที่ต้องลง">
                      <textarea
                        className={textareaClass}
                        defaultValue={emptyValue(
                          modalDetail?.template?.data_entry_diag,
                        )}
                        name="data_entry_diag"
                        readOnly={isReadOnly}
                      />
                    </InlineField>

                    <InlineField label="หัตถการที่ต้องลง">
                      <textarea
                        className={textareaClass}
                        defaultValue={emptyValue(
                          modalDetail?.template?.data_entry_procedure,
                        )}
                        name="data_entry_procedure"
                        readOnly={isReadOnly}
                      />
                    </InlineField>

                    <InlineField label="รายการยาที่ต้องลง">
                      <textarea
                        className={textareaClass}
                        defaultValue={emptyValue(
                          modalDetail?.template?.data_entry_drug,
                        )}
                        name="data_entry_drug"
                        readOnly={isReadOnly}
                      />
                    </InlineField>

                    <InlineField label="ผล LAB ที่ต้องลง">
                      <textarea
                        className={textareaClass}
                        defaultValue={emptyValue(
                          modalDetail?.template?.data_entry_lab,
                        )}
                        name="data_entry_lab"
                        readOnly={isReadOnly}
                      />
                    </InlineField>

                    <InlineField label="รหัส Special PP ที่ต้องลง">
                      <textarea
                        className={textareaClass}
                        defaultValue={emptyValue(
                          modalDetail?.template?.data_entry_special_pp,
                        )}
                        name="data_entry_special_pp"
                        readOnly={isReadOnly}
                      />
                    </InlineField>

                    <InlineField label="รหัสวัคซีนที่ต้องลง">
                      <textarea
                        className={textareaClass}
                        defaultValue={emptyValue(
                          modalDetail?.template?.data_entry_vaccine,
                        )}
                        name="data_entry_vaccine"
                        readOnly={isReadOnly}
                      />
                    </InlineField>

                    <InlineField label="ข้อมูลอื่นๆ ที่ต้องลง เพื่อให้เกิดผลงาน">
                      <textarea
                        className={textareaClass}
                        defaultValue={emptyValue(
                          modalDetail?.template?.data_entry_other,
                        )}
                        name="data_entry_other"
                        readOnly={isReadOnly}
                      />
                    </InlineField>
                  </div>
                </FormSection>

                <FormSection icon={BookOpenText} title="เอกสารที่เกี่ยวข้อง">
                  <div className="grid gap-4">
                    <input
                      className={inputClass}
                      defaultValue={emptyValue(
                        modalDetail?.document?.google_drive_url,
                      )}
                      name="google_drive_url"
                      placeholder="https://drive.google.com/..."
                      readOnly={isReadOnly}
                      type="url"
                    />
                  </div>
                </FormSection>

                <FormSection icon={UserRound} title="ผู้รับผิดชอบ">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Field label="ชื่อผู้รับผิดชอบ">
                      <input
                        className={inputClass}
                        defaultValue={modalDetail?.pm?.pm_name ?? ""}
                        name="pm_name"
                        readOnly={isReadOnly}
                        required
                      />
                    </Field>

                    <Field label="ตำแหน่ง">
                      <input
                        className={inputClass}
                        defaultValue={emptyValue(modalDetail?.pm?.pm_position)}
                        name="pm_position"
                        readOnly={isReadOnly}
                        required
                      />
                    </Field>

                    <Field label="กลุ่มงาน">
                      <select
                        className={inputClass}
                        defaultValue={emptyValue(
                          modalDetail?.pm?.pm_department,
                        )}
                        name="pm_department"
                        disabled={isReadOnly}
                        required
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
                </div>

                <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-end">
                  <button
                    className="min-h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    type="button"
                    onClick={() => setModalMode(null)}
                  >
                    {isReadOnly ? "ปิด" : "ยกเลิก"}
                  </button>
                  {isReadOnly ? null : (
                    <button
                      className="min-h-10 rounded-md bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                      disabled={isSaving}
                      type="submit"
                    >
                      {isSaving ? "กำลังบันทึก..." : "บันทึก"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}
