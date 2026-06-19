import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ActionState } from "@/lib/kpi-types";

const { beginMock, revalidatePathMock } = vi.hoisted(() => ({
  beginMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  sql: {
    begin: beginMock,
  },
}));

vi.mock("@/lib/kpi-form", () => ({
  parseKpiTemplateForm: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

import { deleteKpiTemplate } from "./actions";

type TransactionTag = <T>(
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<T>;

const previousState: ActionState = {
  status: "idle",
  message: "",
};

function formDataWithId(id: string): FormData {
  const formData = new FormData();
  formData.set("id", id);
  return formData;
}

function createTransaction(topicRows: { id: number }[] = [{ id: 12 }]) {
  const queries: string[] = [];
  const tx = vi.fn(
    async <T,>(strings: TemplateStringsArray): Promise<T> => {
      queries.push(strings[0]);

      if (strings[0].includes("DELETE FROM kpi_topic")) {
        return topicRows as T;
      }

      return [] as T;
    },
  ) as TransactionTag;

  return { queries, tx };
}

describe("deleteKpiTemplate", () => {
  beforeEach(() => {
    beginMock.mockReset();
    revalidatePathMock.mockReset();
  });

  it("returns an error for an invalid id without starting a transaction", async () => {
    const result = await deleteKpiTemplate(previousState, formDataWithId("abc"));

    expect(result).toEqual({
      status: "error",
      message: "ไม่พบรหัส KPI สำหรับลบข้อมูล",
    });
    expect(beginMock).not.toHaveBeenCalled();
  });

  it("returns an error for an unsafe huge id", async () => {
    const result = await deleteKpiTemplate(
      previousState,
      formDataWithId("9007199254740993"),
    );

    expect(result).toEqual({
      status: "error",
      message: "ไม่พบรหัส KPI สำหรับลบข้อมูล",
    });
    expect(beginMock).not.toHaveBeenCalled();
  });

  it("deletes related KPI rows in order and revalidates the home page", async () => {
    const { queries, tx } = createTransaction();
    beginMock.mockImplementation(async (callback) => callback(tx));

    const result = await deleteKpiTemplate(previousState, formDataWithId("12"));

    expect(beginMock).toHaveBeenCalledTimes(1);
    expect(queries).toHaveLength(4);
    expect(queries[0]).toContain("DELETE FROM kpi_doc");
    expect(queries[1]).toContain("DELETE FROM kpi_pm");
    expect(queries[2]).toContain("DELETE FROM kpi_template");
    expect(queries[3]).toContain("DELETE FROM kpi_topic");
    expect(revalidatePathMock).toHaveBeenCalledWith("/");
    expect(result).toEqual({
      status: "success",
      message: "ลบ KPI สำเร็จ",
    });
  });

  it("returns the expected not-found message when no topic is deleted", async () => {
    const { tx } = createTransaction([]);
    beginMock.mockImplementation(async (callback) => callback(tx));

    const result = await deleteKpiTemplate(previousState, formDataWithId("12"));

    expect(result).toEqual({
      status: "error",
      message: "ไม่พบ KPI ที่ต้องการลบ",
    });
  });

  it("returns a generic message for unexpected transaction errors", async () => {
    beginMock.mockRejectedValue(new Error("database password leaked"));

    const result = await deleteKpiTemplate(previousState, formDataWithId("12"));

    expect(result).toEqual({
      status: "error",
      message: "ลบ KPI ไม่สำเร็จ",
    });
  });
});
