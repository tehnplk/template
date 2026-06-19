# KPI Datagrid Modal CRUD Design

## Goal

Change the KPI Template landing page from a left-list/detail form layout into a standard KPI datagrid with filters, pagination, CRUD actions, and a full-screen detail modal.

The system must continue to save real PostgreSQL data through the existing KPI tables:

- `kpi_topic`
- `kpi_template`
- `kpi_pm`
- `kpi_doc`
- `c_department`
- `c_kpi_type`

Tables prefixed with `c_` remain master/reference tables for select options.

## Approved Approach

Use a hybrid design:

- Server-side data loading for the datagrid.
- URL query parameters for filter and pagination state.
- Client-side full-screen modal for create, view, and edit detail workflows.
- Server Actions for create, update, and hard delete.

This keeps the landing page focused on scanning and managing KPI records while preserving the existing detail form behavior inside a modal.

## Landing Page

The landing page must show the KPI datagrid as the first screen. It should feel like an operational admin tool, not a marketing page.

### Header

The page header should include:

- Page title: KPI datagrid / KPI management wording in Thai.
- Primary action: add KPI.
- Compact save/delete status message.

### Filters

The grid must provide standard filters:

- Keyword search by KPI name.
- Active status filter:
  - all
  - active
  - inactive
- KPI type filter using `c_kpi_type`.

Filter state should be represented in URL query parameters so refresh/back navigation keeps the same grid state.

### Pagination

The grid must provide standard pagination:

- Current page.
- Page size.
- Previous and next buttons.
- Total record count.
- Page range text such as "showing X-Y of Z".

Pagination state should be represented in URL query parameters.

## Datagrid Columns

The first version should include these columns:

- KPI name from `kpi_topic.kpi_name`.
- KPI type names resolved from `kpi_topic.kpi_type` and `c_kpi_type`.
- Status from `kpi_topic.is_active`.
- Responsible person from `kpi_pm.pm_name`.
- Department from `kpi_pm.pm_department`.
- Document name from `kpi_doc.doc_name`.
- Actions:
  - view/edit
  - delete

The grid should use a table layout on desktop. On narrow screens, it may horizontally scroll instead of turning into cards, because this is an operational datagrid.

## Full-Screen Modal

KPI details must open in a full-screen modal.

Modal modes:

- Create mode: blank form.
- View/edit mode: form populated from the selected KPI.

The modal should include:

- Sticky modal header.
- Title showing create/edit context.
- Close button.
- Save button.
- Delete button only for existing KPI records.
- The existing grouped form sections:
  - KPI details.
  - Target group.
  - Data entry.
  - Responsible person.
  - Documents.

Closing the modal should not discard database data. Unsaved local edits can be discarded without a custom warning in the first version.

## CRUD Behavior

### Create

User clicks add KPI, full-screen modal opens with an empty form, and save inserts:

- `kpi_topic`
- `kpi_template`
- `kpi_pm` when PM fields exist
- `kpi_doc` when document fields exist

After save:

- Modal may remain open with saved data selected.
- Grid refreshes through `revalidatePath("/")`.
- Success message is shown.

### Read

The datagrid reads KPI rows and related summary fields from PostgreSQL.

The modal receives enough detail data to populate the full form without an extra request in the first version.

### Update

User opens an existing KPI, edits fields, and save updates:

- `kpi_topic`
- `kpi_template`
- `kpi_pm`
- `kpi_doc`

Existing one-to-one related rows are upserted by `kpi_topic_id`.

### Delete

Delete is approved as hard delete.

When user clicks delete:

1. Show a confirmation prompt or confirmation state.
2. If confirmed, delete related rows first:
   - `kpi_doc`
   - `kpi_pm`
   - `kpi_template`
3. Delete `kpi_topic`.
4. Refresh the datagrid.
5. Close the modal if the deleted record was open.

The delete operation must run in a transaction.

## Data Access

Server-side list loading should support:

- filters
- pagination
- total count
- joining related summary data

The first implementation may load detail data for the current page only, as long as the modal works for all visible rows.

Use existing `.env` database configuration and the existing `postgres` client.

## Components

Suggested component responsibilities:

- Page server component:
  - parse `searchParams`
  - load filtered/paginated grid data
  - load master options
  - pass data to client component
- Client component:
  - render filters, table, pagination, modal
  - manage modal open/close and selected KPI
  - submit save/delete Server Actions
- Server Actions:
  - save KPI template
  - delete KPI template
- Pure helpers:
  - parse form data
  - normalize filter/pagination query values

## Validation And Error Handling

Required:

- KPI name.

Delete:

- Existing KPI ID is required.
- Delete action must return a clear error if the ID is missing or invalid.

UI should show Thai success/error messages for:

- save success
- save failure
- delete success
- delete failure
- validation errors

## Out Of Scope

- Authentication.
- Role permissions.
- File upload.
- Bulk delete.
- Column sorting beyond the default ordering.
- Editing `c_` master tables.
- Deployment.

## Verification

Minimum verification:

- `npm test`
- `npm run lint`
- `npm run build`
- Manual or HTTP-based create/update/delete verification against PostgreSQL.
- `db-cli` queries proving hard delete removes the topic and related rows.

