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
