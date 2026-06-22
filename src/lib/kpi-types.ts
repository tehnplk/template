import type {
  CDepartmentModel,
  CKpiTypeModel,
  KpiDocModel,
  KpiPmModel,
  KpiTemplateModel,
  KpiTopicModel,
} from "./table-interface";

export type DepartmentOption = CDepartmentModel;

export type KpiTypeOption = CKpiTypeModel;

export type KpiTopic = KpiTopicModel;

export type KpiTemplate = KpiTemplateModel;

export type KpiPm = KpiPmModel;

export type KpiDocument = KpiDocModel;

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

export type KpiGridFilters = {
  keyword: string;
  department: string;
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
