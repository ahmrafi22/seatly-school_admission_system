import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/src/i18n/LanguageProvider";
import { IdentityGate } from "@/src/components/IdentityGate";

/**
 * The identity screen is the only gate into the product, so its validation is
 * worth pinning: a wrong number here means a student sees someone else's
 * applications, or none at all.
 */
function renderGate(onSubmit = vi.fn()) {
  render(
    <LanguageProvider>
      <IdentityGate onSubmit={onSubmit} />
    </LanguageProvider>,
  );
  return { onSubmit, input: screen.getByRole("textbox") };
}

describe("IdentityGate", () => {
  it("refuses to submit an empty number and says why", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderGate();

    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/enter your 17-digit/i)).toBeInTheDocument();
  });

  it("refuses a number that is too short", async () => {
    const user = userEvent.setup();
    const { onSubmit, input } = renderGate();

    await user.type(input, "201526912");
    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/too short/i)).toBeInTheDocument();
  });

  it("accepts exactly 17 digits and reports them upward", async () => {
    const user = userEvent.setup();
    const { onSubmit, input } = renderGate();

    await user.type(input, "20152691234567890");
    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(onSubmit).toHaveBeenCalledWith("20152691234567890");
  });

  it("strips non-digits as they are typed, so a pasted number still works", async () => {
    const user = userEvent.setup();
    const { onSubmit, input } = renderGate();

    await user.type(input, "2015 2691 23456 7890");
    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(onSubmit).toHaveBeenCalledWith("20152691234567890");
  });

  it("stops at 17 digits instead of silently truncating a longer paste", async () => {
    const user = userEvent.setup();
    const { onSubmit, input } = renderGate();

    await user.type(input, "201526912345678901234");
    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(onSubmit).toHaveBeenCalledWith("20152691234567890");
  });

  it("does not scold an empty field that was only clicked into", async () => {
    const user = userEvent.setup();
    const { onSubmit, input } = renderGate();

    // Click in, then leave by keyboard. Nothing typed.
    await user.click(input);
    await user.tab();

    expect(input).not.toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByText(/enter your 17-digit/i)).not.toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("counts down only once there is something to count", async () => {
    const user = userEvent.setup();
    const { input } = renderGate();

    expect(screen.queryByText(/digits? to go/i)).not.toBeInTheDocument();

    await user.type(input, "2015");
    expect(screen.getByText("13 digits to go")).toBeInTheDocument();

    await user.type(input, "269123456789");
    expect(screen.getByText("1 digit to go")).toBeInTheDocument();

    await user.type(input, "0");
    expect(screen.queryByText(/digits? to go/i)).not.toBeInTheDocument();
    expect(screen.getByText(/complete/i)).toBeInTheDocument();
  });

  it("switches its own copy to Bangla", async () => {
    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <IdentityGate onSubmit={vi.fn()} />
      </LanguageProvider>,
    );

    await user.click(screen.getByRole("radio", { name: "বাংলা" }));

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("ভর্তি শুরু করুন");
  });
});
