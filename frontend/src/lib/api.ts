/**
 * Typed client for the admission API. Every call returns data or throws an
 * `ApiError` that already carries a sentence a person can read, so the UI never
 * has to inspect a status code to decide what to say.
 */

export type HoldStatus = "HELD" | "CONFIRMED" | "EXPIRED" | "CANCELLED";

export interface ClassSummary {
  id: string;
  name: string;
  totalSeats: number;
  heldSeats: number;
  confirmedSeats: number;
  availableSeats: number;
}

export interface HoldCreated {
  holdId: string;
  classId: string;
  studentId: string;
  status: HoldStatus;
  expiresAt: string;
}

export interface HoldDetail {
  holdId: string;
  classId: string;
  status: HoldStatus;
  expiresAt: string;
}

export interface MyHold {
  holdId: string;
  classId: string;
  className: string;
  status: HoldStatus;
  expiresAt: string;
}

/**
 * Base URL of the API, set at build time with VITE_API_BASE_URL. The fallback is
 * `/api`, which the dev server and nginx both proxy, so a build with no
 * environment at all still works.
 */
const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(/\/+$/, "");

const REQUEST_TIMEOUT_MS = 12_000;

/** A failure the UI can show as-is. */
export class ApiError extends Error {
  readonly status: number;
  readonly title: string;
  /** True when the request never reached the server. */
  readonly isNetworkError: boolean;

  constructor(
    message: string,
    options: { status?: number; title?: string; isNetworkError?: boolean } = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = options.status ?? 0;
    this.title = options.title ?? "";
    this.isNetworkError = options.isNetworkError ?? false;
  }
}

interface ProblemBody {
  title?: string;
  detail?: string;
  status?: number;
}

async function request<T>(
  path: string,
  init: RequestInit & { studentId?: string } = {},
): Promise<T> {
  const { studentId, headers, ...rest } = init;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...rest,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(rest.body ? { "Content-Type": "application/json" } : {}),
        ...(studentId ? { "X-Student-Id": studentId } : {}),
        ...headers,
      },
    });
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === "AbortError";
    throw new ApiError(
      aborted
        ? "The server took too long to answer."
        : "Can't reach the server.",
      { isNetworkError: true, title: "Server unreachable" },
    );
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    const problem = (body ?? {}) as ProblemBody;
    // Prefer the server's own detail: it names the class and the reason.
    const message =
      problem.detail ??
      problem.title ??
      (response.status >= 500
        ? "The server ran into a problem. Please try again."
        : "That request could not be completed.");

    throw new ApiError(message, {
      status: response.status,
      title: problem.title ?? "",
    });
  }

  return body as T;
}

export const api = {
  listClasses: () => request<ClassSummary[]>("/classes"),

  getClass: (classId: string) => request<ClassSummary>(`/classes/${classId}`),

  createClass: (name: string, totalSeats: number) =>
    request<ClassSummary>("/classes", {
      method: "POST",
      body: JSON.stringify({ name, totalSeats }),
    }),

  createHold: (classId: string, studentId: string) =>
    request<HoldCreated>(`/classes/${classId}/holds`, {
      method: "POST",
      studentId,
    }),

  getHold: (holdId: string) => request<HoldDetail>(`/holds/${holdId}`),

  confirmHold: (holdId: string, studentId: string) =>
    request<{ holdId: string; status: HoldStatus }>(`/holds/${holdId}/confirm`, {
      method: "POST",
      studentId,
    }),

  cancelHold: (holdId: string, studentId: string) =>
    request<void>(`/holds/${holdId}`, {
      method: "DELETE",
      studentId,
    }),

  myHolds: (studentId: string) =>
    request<MyHold[]>("/me/holds", { studentId }),
};
