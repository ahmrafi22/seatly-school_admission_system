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
  it("stamps the last successful read with a clock time", () => {
    const { container } = render(
      <LanguageProvider>
        <Freshness lastCheckedAt={Date.now()} isFetching={false} failures={0} />
      </LanguageProvider>,
    );

    // A stable timestamp, not a relative label: "Updated 7:22:27 PM". This is
    // the sentence the status announces. The visible clock beside it is a
    // stack of rolling digits and is `aria-hidden`, so the screen-reader text
    // is asserted directly rather than the element's whole text content — which
    // in jsdom also picks up NumberFlow's inlined fallback styles.
    expect(container.querySelector(".sr-only")).toHaveTextContent(
      /^Updated \d{1,2}:\d{2}:\d{2}\s?(AM|PM)$/,
    );
  });

  it("says the server cannot be reached after repeated failures", () => {
    const { container } = render(
      <LanguageProvider>
        <Freshness lastCheckedAt={Date.now() - 60_000} isFetching={false} failures={3} />
      </LanguageProvider>,
    );

    expect(container.querySelector(".sr-only")).toHaveTextContent(
      /can't reach the server/i,
    );
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
