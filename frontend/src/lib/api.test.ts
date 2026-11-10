import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, ApiError } from "@/src/lib/api";

/**
 * The API client is the single place where a transport failure becomes a
 * sentence. These tests pin the three cases that decide what the student reads:
 * the server's own explanation, a dead server, and a server that answers with
 * nothing useful.
 */
describe("api client", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  const jsonResponse = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });

  it("sends the student id as the X-Student-Id header", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, []));

    await api.myHolds("20152691234567890");

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/me/holds");
    expect(init.headers["X-Student-Id"]).toBe("20152691234567890");
  });

  it("surfaces the server's own detail on a 409", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(409, {
        title: "No seats available",
        detail: 'No seats left in "Class 6". All 120 seats are taken.',
        status: 409,
      }),
    );

    await expect(api.createHold("abc", "20152691234567890")).rejects.toMatchObject({
      status: 409,
      message: 'No seats left in "Class 6". All 120 seats are taken.',
    });
  });

  it("marks a connection failure as a network error with readable text", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const error = await api.listClasses().catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).isNetworkError).toBe(true);
    expect((error as ApiError).message).toBe("Can't reach the server.");
  });

  it("falls back to a readable line when the error body is empty", async () => {
    fetchMock.mockResolvedValue(new Response("", { status: 500 }));

    await expect(api.listClasses()).rejects.toMatchObject({
      status: 500,
      message: "The server ran into a problem. Please try again.",
    });
  });

  it("treats 204 as success with no body", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(api.cancelHold("h1", "20152691234567890")).resolves.toBeUndefined();
  });

  it("never leaks a raw non-JSON error body to the interface", async () => {
    fetchMock.mockResolvedValue(new Response("<html>502 Bad Gateway</html>", { status: 502 }));

    const error = (await api.listClasses().catch((caught: unknown) => caught)) as ApiError;

    expect(error.message).not.toContain("<html>");
    expect(error.message).toBe("The server ran into a problem. Please try again.");
  });
});
