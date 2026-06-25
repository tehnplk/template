import { describe, expect, test } from "vitest";

import { modalHint } from "./kpi-modal";

describe("modalHint", () => {
  test("hides placeholder hints in view mode", () => {
    expect(modalHint(true, "กรอก type area = 1,2,3,4,5")).toBeUndefined();
  });

  test("keeps placeholder hints in editable modes", () => {
    expect(modalHint(false, "กรอก type area = 1,2,3,4,5")).toBe(
      "กรอก type area = 1,2,3,4,5",
    );
  });
});
