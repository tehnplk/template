import { describe, expect, it } from "vitest";

import { parseKpiGridFilters } from "./kpi-query";

describe("parseKpiGridFilters", () => {
  it("returns defaults when params are missing", () => {
    expect(parseKpiGridFilters({})).toEqual({
      keyword: "",
      department: "",
      page: 1,
      pageSize: 10,
    });
  });

  it("normalizes valid params", () => {
    expect(
      parseKpiGridFilters({
        q: " cancer ",
        department: " IT ",
        page: "2",
        pageSize: "25",
      }),
    ).toEqual({
      keyword: "cancer",
      department: "IT",
      page: 2,
      pageSize: 25,
    });
  });

  it("guards invalid page and pageSize back to defaults", () => {
    expect(
      parseKpiGridFilters({
        page: "0",
        pageSize: "30",
      }),
    ).toEqual({
      keyword: "",
      department: "",
      page: 1,
      pageSize: 10,
    });
  });

  it("returns default page when numeric page exceeds the maximum", () => {
    expect(parseKpiGridFilters({ page: "10001" }).page).toBe(1);
  });

  it("uses the first item from array values", () => {
    expect(
      parseKpiGridFilters({
        q: [" cancer ", "diabetes"],
        department: [" IT ", "Finance"],
        page: ["2", "3"],
        pageSize: ["25", "50"],
      }),
    ).toEqual({
      keyword: "cancer",
      department: "IT",
      page: 2,
      pageSize: 25,
    });
  });

  it("accepts pageSize 50", () => {
    expect(parseKpiGridFilters({ pageSize: "50" }).pageSize).toBe(50);
  });

  it("normalizes department with whitespace", () => {
    expect(parseKpiGridFilters({ department: " IT " }).department).toBe("IT");
  });
});
