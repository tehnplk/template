import { describe, expect, it } from "vitest";

import { parseKpiGridFilters } from "./kpi-query";

describe("parseKpiGridFilters", () => {
  it("returns defaults when params are missing", () => {
    expect(parseKpiGridFilters({})).toEqual({
      keyword: "",
      status: "all",
      kpiType: "",
      page: 1,
      pageSize: 10,
    });
  });

  it("normalizes valid params", () => {
    expect(
      parseKpiGridFilters({
        q: " cancer ",
        status: "inactive",
        type: "3",
        page: "2",
        pageSize: "25",
      }),
    ).toEqual({
      keyword: "cancer",
      status: "inactive",
      kpiType: "3",
      page: 2,
      pageSize: 25,
    });
  });

  it("guards invalid status, page, and pageSize back to defaults", () => {
    expect(
      parseKpiGridFilters({
        status: "archived",
        page: "0",
        pageSize: "30",
      }),
    ).toEqual({
      keyword: "",
      status: "all",
      kpiType: "",
      page: 1,
      pageSize: 10,
    });
  });
});
