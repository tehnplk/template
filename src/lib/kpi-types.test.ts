import { describe, expectTypeOf, test } from "vitest";

import type {
  ActionState,
  KpiDetail,
  KpiGridFilters,
  KpiGridResult,
  KpiTemplatePayload,
} from "./kpi-types";
import type {
  KpiDocModel,
  KpiPmModel,
  KpiTemplateModel,
  KpiTopicModel,
} from "./table-interface";

describe("KPI app types", () => {
  test("compose app models from database table interfaces", () => {
    expectTypeOf<KpiDetail>().toEqualTypeOf<{
      topic: KpiTopicModel;
      template: KpiTemplateModel | null;
      pm: KpiPmModel | null;
      document: KpiDocModel | null;
    }>();

    expectTypeOf<KpiTemplatePayload>().toHaveProperty("topic");
    expectTypeOf<ActionState>().toHaveProperty("status");
    expectTypeOf<KpiGridFilters>().toHaveProperty("pageSize");
    expectTypeOf<KpiGridResult>().toHaveProperty("rows");
  });
});
