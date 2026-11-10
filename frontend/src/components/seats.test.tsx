import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LanguageProvider } from "@/src/i18n/LanguageProvider";
import { SeatBar } from "@/src/components/SeatBar";
import { Freshness } from "@/src/components/Freshness";

describe("SeatBar", () => {
  it("describes the split between confirmed, held and free seats", () => {
    render(
      <LanguageProvider>
        <SeatBar cls={{ totalSeats: 100, heldSeats: 5, confirmedSeats: 60 }} />
      </LanguageProvider>,
    );

    expect(
      screen.getByRole("img", { name: "60 confirmed, 5 on hold, 35 free of 100" }),
    ).toBeInTheDocument();
  });

  it("does not draw a segment for a zero count", () => {
    const { container } = render(
      <LanguageProvider>
        <SeatBar cls={{ totalSeats: 10, heldSeats: 0, confirmedSeats: 0 }} />
      </LanguageProvider>,
    );

    // The track plus exactly one free segment.
    expect(container.querySelectorAll(".seat-segment")).toHaveLength(1);
  });

  it("stays within the track when the counts briefly exceed capacity", () => {
    render(
      <LanguageProvider>
        <SeatBar cls={{ totalSeats: 10, heldSeats: 8, confirmedSeats: 8 }} />
      </LanguageProvider>,
    );

    // Free is clamped to zero rather than negative.
    expect(screen.getByRole("img")).toHaveAccessibleName("8 confirmed, 2 on hold, 0 free of 10");
  });
});

describe("Freshness", () => {
  it("reports a recent successful read as live", () => {
    render(
      <LanguageProvider>
        <Freshness lastCheckedAt={Date.now()} isFetching={false} failures={0} />
      </LanguageProvider>,
    );

    expect(screen.getByRole("status")).toHaveTextContent(/just now/i);
  });

  it("says the server cannot be reached after repeated failures", () => {
    render(
      <LanguageProvider>
        <Freshness lastCheckedAt={Date.now() - 60_000} isFetching={false} failures={3} />
      </LanguageProvider>,
    );

    expect(screen.getByRole("status")).toHaveTextContent(/can't reach the server/i);
  });

  it("treats a single dropped request as noise, not an outage", () => {
    render(
      <LanguageProvider>
        <Freshness lastCheckedAt={Date.now()} isFetching={false} failures={1} />
      </LanguageProvider>,
    );

    expect(screen.getByRole("status")).not.toHaveTextContent(/can't reach/i);
  });
});
