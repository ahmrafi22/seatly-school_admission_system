import { describe, expect, it } from "vitest";
import {
  effectiveStatus,
  formatCountdown,
  formatTime,
  localizeDigits,
  maskStudentId,
  occupancyPercent,
  seatsFilled,
} from "@/src/lib/format";

describe("effectiveStatus", () => {
  const future = new Date(Date.now() + 60_000).toISOString();
  const past = new Date(Date.now() - 60_000).toISOString();
  const now = Date.now();

  it("keeps a live hold as HELD", () => {
    expect(effectiveStatus("HELD", future, now)).toBe("HELD");
  });

  it("reports a lapsed hold as EXPIRED without asking the server", () => {
    expect(effectiveStatus("HELD", past, now)).toBe("EXPIRED");
  });

  it("expires exactly at the boundary, not a millisecond later", () => {
    const exact = new Date(now).toISOString();
    expect(effectiveStatus("HELD", exact, now)).toBe("EXPIRED");
  });

  it("never downgrades a terminal status", () => {
    expect(effectiveStatus("CONFIRMED", past, now)).toBe("CONFIRMED");
    expect(effectiveStatus("CANCELLED", past, now)).toBe("CANCELLED");
    expect(effectiveStatus("EXPIRED", future, now)).toBe("EXPIRED");
  });

  it("leaves an unparseable expiry alone rather than guessing", () => {
    expect(effectiveStatus("HELD", "not-a-date", now)).toBe("HELD");
  });
});

describe("formatCountdown", () => {
  it("formats as MM:SS", () => {
    expect(formatCountdown(600_000)).toBe("10:00");
    expect(formatCountdown(65_000)).toBe("01:05");
    expect(formatCountdown(5_000)).toBe("00:05");
  });

  it("clamps at zero instead of showing a negative clock", () => {
    expect(formatCountdown(-5_000)).toBe("00:00");
    expect(formatCountdown(0)).toBe("00:00");
  });

  it("rounds down, so it never shows time the student does not have", () => {
    expect(formatCountdown(1_999)).toBe("00:01");
  });
});

describe("seat arithmetic", () => {
  it("counts held and confirmed as taken", () => {
    expect(seatsFilled({ totalSeats: 100, heldSeats: 3, confirmedSeats: 60 })).toBe(63);
  });

  it("computes occupancy as a percentage", () => {
    expect(occupancyPercent({ totalSeats: 100, heldSeats: 3, confirmedSeats: 60 })).toBe(63);
  });

  it("clamps to 100 when the numbers briefly disagree", () => {
    expect(occupancyPercent({ totalSeats: 10, heldSeats: 8, confirmedSeats: 8 })).toBe(100);
  });

  it("returns 0 rather than dividing by zero", () => {
    expect(occupancyPercent({ totalSeats: 0, heldSeats: 0, confirmedSeats: 0 })).toBe(0);
  });
});

describe("localizeDigits", () => {
  it("leaves Latin digits alone in English", () => {
    expect(localizeDigits(1234, "en")).toBe("1234");
  });

  it("converts to Bengali numerals", () => {
    expect(localizeDigits(120, "bn")).toBe("১২০");
  });
});

describe("maskStudentId", () => {
  it("groups a 17-digit number in fours and fives", () => {
    expect(maskStudentId("20152691234567890")).toBe("2015 2691 23456 7890");
  });

  it("returns a malformed value untouched rather than slicing it", () => {
    expect(maskStudentId("123")).toBe("123");
  });
});

describe("formatTime", () => {
  it("returns a dash for an invalid date", () => {
    expect(formatTime("nonsense", "en")).toBe("—");
  });
});
