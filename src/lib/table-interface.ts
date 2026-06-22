export interface CDepartmentModel {
  id: number;
  department_name: string;
  is_active: boolean;
}

export interface CKpiTypeModel {
  id: number;
  type: string;
}

export interface KpiTopicModel {
  id: number;
  kpi_name: string;
  is_active: boolean;
  kpi_type: string[] | null;
}

export interface KpiTemplateModel {
  id: number;
  kpi_topic_id: number;
  target_area_type: string | null;
  target_gender: string | null;
  target_age_range: string | null;
  target_previous_diag: string | null;
  target_other: string | null;
  data_entry_inscl: string | null;
  data_entry_diag: string | null;
  data_entry_procedure: string | null;
  data_entry_drug: string | null;
  data_entry_lab: string | null;
  data_entry_special_pp: string | null;
  data_entry_vaccine: string | null;
  data_entry_other: string | null;
}

export interface KpiPmModel {
  id: number;
  kpi_topic_id: number;
  pm_name: string;
  pm_position: string | null;
  pm_department: string | null;
}

export interface KpiDocModel {
  id: number;
  kpi_topic_id: number;
  doc_name: string;
  doc_type: string;
  google_drive_url: string;
  created_at: string | null;
}
