import { render, screen, fireEvent, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HoldToConfirm } from "@/src/components/HoldToConfirm";

/**
 * The hold is measured from elapsed time, so the tests drive the clock rather
 * than the event count. `performance.now` is stubbed for the same reason.
 */
describe("HoldToConfirm", () => {
  let now = 0;

  beforeEach(() => {
    now = 0;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  /** Advance the clock and run the frames the hold asked for. */
  const advance = (ms: number) => {
    act(() => {
      now += ms;
      vi.advanceTimersByTime(ms);
    });
  };

  it("does not confirm on a press that is released early", () => {
    const onComplete = vi.fn();
    render(<HoldToConfirm label="Hold to confirm" holdingLabel="Keep holding…" onComplete={onComplete} />);

    const button = screen.getByRole("button", { name: "Hold to confirm" });
    fireEvent.pointerDown(button, { button: 0, pointerId: 1 });
    advance(400);
    fireEvent.pointerUp(button, { pointerId: 1 });
    advance(2000);

    expect(onComplete).not.toHaveBeenCalled();
  });

  it("confirms once the hold lasts long enough", () => {
    const onComplete = vi.fn();
    render(<HoldToConfirm label="Hold to confirm" holdingLabel="Keep holding…" onComplete={onComplete} />);

    const button = screen.getByRole("button", { name: "Hold to confirm" });
    fireEvent.pointerDown(button, { button: 0, pointerId: 1 });
    advance(1600);

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("does not confirm twice when the hold completes and is then released", () => {
    const onComplete = vi.fn();
    render(<HoldToConfirm label="Hold to confirm" holdingLabel="Keep holding…" onComplete={onComplete} />);

    const button = screen.getByRole("button", { name: "Hold to confirm" });
    fireEvent.pointerDown(button, { button: 0, pointerId: 1 });
    advance(1600);
    fireEvent.pointerUp(button, { pointerId: 1 });
    advance(2000);

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("announces that the hold is in progress", () => {
    render(<HoldToConfirm label="Hold to confirm" holdingLabel="Keep holding…" onComplete={vi.fn()} />);

    const button = screen.getByRole("button", { name: "Hold to confirm" });
    fireEvent.pointerDown(button, { button: 0, pointerId: 1 });

    expect(screen.getByText("Keep holding…")).toBeInTheDocument();
  });

  it("can be held with the keyboard", () => {
    const onComplete = vi.fn();
    render(<HoldToConfirm label="Hold to confirm" holdingLabel="Keep holding…" onComplete={onComplete} />);

    const button = screen.getByRole("button", { name: "Hold to confirm" });
    fireEvent.keyDown(button, { key: " " });
    advance(1600);

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("is holdable again after being remounted", () => {
    const onComplete = vi.fn();
    const { rerender } = render(
      <HoldToConfirm key="first" label="Hold to confirm" holdingLabel="Keep holding…" onComplete={onComplete} />,
    );

    const button = screen.getByRole("button", { name: "Hold to confirm" });
    fireEvent.pointerDown(button, { button: 0, pointerId: 1 });
    advance(1600);
    expect(onComplete).toHaveBeenCalledTimes(1);

    // A new key is a new control, which is how the dialog offers another
    // attempt after a failed confirmation.
    rerender(
      <HoldToConfirm key="second" label="Hold to confirm" holdingLabel="Keep holding…" onComplete={onComplete} />,
    );

    fireEvent.pointerDown(screen.getByRole("button", { name: "Hold to confirm" }), {
      button: 0,
      pointerId: 1,
    });
    advance(1600);
    expect(onComplete).toHaveBeenCalledTimes(2);
  });
});
