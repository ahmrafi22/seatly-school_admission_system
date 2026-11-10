import { describe, expect, it } from "vitest";
import { isValidStudentId } from "@/src/lib/useStudentId";

describe("student id validation", () => {
  it("accepts exactly 17 digits", () => {
    expect(isValidStudentId("20152691234567890")).toBe(true);
  });

  it("rejects 16 and 18 digits", () => {
    expect(isValidStudentId("2015269123456789")).toBe(false);
    expect(isValidStudentId("201526912345678901")).toBe(false);
  });

  it("rejects anything that is not a digit", () => {
    expect(isValidStudentId("2015269123456789a")).toBe(false);
    expect(isValidStudentId("2015 2691 23456 7890")).toBe(false);
    expect(isValidStudentId("")).toBe(false);
  });
});
