# KPI Template Recording System Design

## Goal

Build a real PostgreSQL-backed KPI template recording system in the existing Next.js app. The system must use the current database tables:

- `kpi_topic`
- `kpi_template`
- `kpi_pm`
- `kpi_doc`
- `c_department`
- `c_kpi_type`

Tables prefixed with `c_` are master/reference tables used for select options.

## Approved Approach

Use the approved **List + Detail Form** layout.

- Left panel: KPI topic list from `kpi_topic`
- Right panel: one consolidated form for the selected KPI
- The form saves real data to PostgreSQL
- The app must not deploy unless explicitly requested

This layout is optimized for users who need to create or edit multiple KPI templates quickly.

## Application Architecture

Use the existing Next.js App Router project.

- Route: `/`
- Rendering: Server Component for initial database reads
- Mutations: Server Actions
- Database access: PostgreSQL connection from `.env`
- Cache refresh: call `revalidatePath("/")` after successful save

The implementation should keep the first version simple and focused. It can use small helper functions and local components, but it should not introduce an ORM unless a later requirement needs one.

## Data Model Usage

### `kpi_topic`

Primary KPI record.

Fields used:

- `id`
- `kpi_name`
- `is_active`
- `kpi_type`

`kpi_type` is a JSON field. The form should store selected KPI type IDs or values from `c_kpi_type` as JSON.

### `kpi_template`

Template details for target group and data entry rules.

Fields used:

- `kpi_topic_id`
- `target_area_type`
- `target_gender`
- `target_age_range`
- `target_other`
- `data_entry_inscl`
- `data_entry_diag`
- `data_entry_procedure`
- `data_entry_drug`
- `data_entry_lab`
- `data_entry_special_pp`
- `data_entry_other`

Each KPI should have at most one current template row in this first version. Save should create it when missing and update it when present.

### `kpi_pm`

Responsible person information.

Fields used:

- `kpi_topic_id`
- `pm_name`
- `pm_position`
- `pm_department`

The department selector should use `c_department`, but the current table stores `pm_department` as text. Save the selected department name as text unless the database schema changes later.

### `kpi_doc`

Document metadata.

Fields used:

- `kpi_topic_id`
- `doc_name`
- `doc_type`
- `file_path`

This first version records document metadata and file path text only. It does not upload files.

### `c_department`

Master table for department select options.

Use active departments where possible:

- `id`
- `department_name`
- `is_active`

### `c_kpi_type`

Master table for KPI type select options.

Fields used:

- `id`
- `type`

## User Interface

### Page Structure

The page should feel like an operational data-entry tool, not a landing page.

Top area:

- App title: KPI Template
- Compact save status or error message

Left panel:

- KPI search/filter
- KPI list
- New KPI button
- Active/inactive visual state

Right panel:

- Main form grouped into clear sections:
  - KPI Topic
  - Target Group
  - Data Entry
  - Responsible Person
  - Documents
- Primary Save button

### Form Behavior

New KPI:

- User clicks New KPI
- Form resets
- Save inserts `kpi_topic`
- Save then inserts related rows into `kpi_template`, `kpi_pm`, and optionally `kpi_doc`

Existing KPI:

- User selects a KPI from the left panel
- Form loads current values
- Save updates `kpi_topic`
- Save upserts related rows by `kpi_topic_id`

## Validation

Required:

- `kpi_name`

Optional:

- All target fields
- All data entry fields
- PM fields
- Document fields

If `doc_name`, `doc_type`, and `file_path` are all empty, the app may skip creating a `kpi_doc` row.

## Error Handling

The page should show a clear message when:

- Required data is missing
- Database connection fails
- Save fails

Successful save should show a short success message and refresh the KPI list.

## Testing And Verification

Minimum verification:

- Run lint
- Run build if implementation changes server/database code
- Start local dev server only for local verification, not deployment
- Verify database save by reading the affected rows with `db-cli`

Database operations during development must use `.env` config and the `db-cli` skill when direct inspection or manipulation is needed.

## Out Of Scope For First Version

- Authentication
- Role permissions
- File upload/storage
- Multi-document management UI
- Deleting KPI records
- Editing master tables
- Deployment

