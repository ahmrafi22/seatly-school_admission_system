import "@testing-library/jest-dom/vitest";

// jsdom has no matchMedia, and the theme toggle reads it to decide whether to
// animate. A stub keeps the components mountable.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// The segmented control measures its selected segment with a ResizeObserver.
// jsdom ships none, so a no-op implementation lets it mount; the measurement
// itself is visual and is covered by the browser checks instead.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = globalThis.ResizeObserver ?? (ResizeObserverStub as never);
