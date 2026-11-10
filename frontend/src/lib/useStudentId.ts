import { useCallback, useState } from "react";

const STUDENT_KEY = "getseatly:studentId";

export const STUDENT_ID_LENGTH = 17;

/** Only digits, exactly 17 of them. */
export function isValidStudentId(value: string): boolean {
  return /^\d{17}$/.test(value);
}

function readStoredStudentId(): string {
  if (typeof window === "undefined") return "";
  try {
    const stored = window.localStorage.getItem(STUDENT_KEY) ?? "";
    return isValidStudentId(stored) ? stored : "";
  } catch {
    return "";
  }
}

/**
 * The student identity, persisted in localStorage.
 *
 * There is no login: the 17-digit registration number *is* the identity, and
 * the API trusts the `X-Student-Id` header. Persisting it means a refresh, or a
 * browser restart, shows the same student's applications — which is a stated
 * requirement, not a convenience.
 */
export function useStudentId() {
  const [studentId, setStudentIdState] = useState<string>(readStoredStudentId);

  const setStudentId = useCallback((value: string) => {
    const trimmed = value.trim();
    setStudentIdState(trimmed);
    try {
      if (isValidStudentId(trimmed)) {
        window.localStorage.setItem(STUDENT_KEY, trimmed);
      } else {
        window.localStorage.removeItem(STUDENT_KEY);
      }
    } catch {
      // Storage blocked: the session still works, it just won't persist.
    }
  }, []);

  const clearStudentId = useCallback(() => {
    setStudentIdState("");
    try {
      window.localStorage.removeItem(STUDENT_KEY);
    } catch {
      // Ignore.
    }
  }, []);

  return {
    studentId,
    hasStudentId: isValidStudentId(studentId),
    setStudentId,
    clearStudentId,
  };
}
