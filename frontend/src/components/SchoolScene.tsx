/**
 * The paper-cut schoolscape at the foot of the identity screen. One SVG so the
 * pediment, door and flag share a coordinate system.
 *
 * The height scales with the viewport (`14vw`) and the SVG uses `xMidYMax slice`,
 * so the band is always taller than the drawing and the crop happens on the
 * sides, where there is only sky. A fixed height cropped the flag off at 1440px.
 */
export function SchoolScene() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[clamp(5.5rem,14vw,13rem)] overflow-hidden"
    >
      <svg
        viewBox="0 0 1200 150"
        preserveAspectRatio="xMidYMax slice"
        className="h-full w-full"
        fill="none"
      >
        {/* Distant hills, behind everything. */}
        <ellipse cx="180" cy="152" rx="330" ry="82" className="fill-accent-100 dark:fill-accent-950" />
        <ellipse cx="1020" cy="154" rx="350" ry="90" className="fill-accent-100 dark:fill-accent-950" />

        {/* The ground the school stands on. */}
        <rect y="138" width="1200" height="12" className="fill-accent-200 dark:fill-accent-900" />

        {/* Trees, kept inside the middle of the viewBox so a side-cropped
            narrow screen still shows whole trees. */}
        <g className="fill-accent-300 dark:fill-accent-800">
          <circle cx="352" cy="112" r="21" />
          <circle cx="331" cy="121" r="14" />
          <circle cx="373" cy="121" r="14" />
        </g>
        <rect x="349" y="124" width="6" height="15" rx="3" className="fill-accent-700 dark:fill-accent-500" />

        <g className="fill-accent-300 dark:fill-accent-800">
          <circle cx="848" cy="116" r="17" />
          <circle cx="831" cy="124" r="12" />
          <circle cx="865" cy="124" r="12" />
        </g>
        <rect x="845" y="127" width="6" height="12" rx="3" className="fill-accent-700 dark:fill-accent-500" />

        {/* Flag, above the pediment. */}
        <path d="M600 44V20" className="stroke-accent-700 dark:stroke-accent-400" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M600 21l22 6-22 6z" className="fill-accent-500 dark:fill-accent-300" />

        {/* Pediment and its eave. */}
        <path d="M470 80 600 42l130 38z" className="fill-accent-600 dark:fill-accent-500" />
        <rect x="466" y="78" width="268" height="6" rx="3" className="fill-accent-700 dark:fill-accent-400" />
        <circle cx="600" cy="64" r="8" className="fill-accent-50 dark:fill-accent-950" />
        <circle cx="600" cy="64" r="3.4" className="fill-accent-600 dark:fill-accent-500" />

        {/* The building. */}
        <rect
          x="505"
          y="84"
          width="190"
          height="54"
          rx="5"
          className="fill-background-primary-default stroke-border-button-default"
          strokeWidth="1.5"
        />

        {/* Windows, each with a mullion. */}
        {[520, 556, 628, 664].map((x) => (
          <g key={x}>
            <rect x={x} y="94" width="26" height="24" rx="3" className="fill-accent-200 dark:fill-accent-800" />
            <path
              d={`M${x + 13} 94v24M${x} 106h26`}
              className="stroke-background-primary-default"
              strokeWidth="1.5"
            />
          </g>
        ))}

        {/* Arched door, and the step beneath it. */}
        <path d="M584 138v-24a16 16 0 0 1 32 0v24z" className="fill-accent-700 dark:fill-accent-400" />
        <circle cx="609" cy="123" r="1.8" className="fill-accent-50 dark:fill-accent-950" />
        <rect x="574" y="137" width="52" height="4" rx="2" className="fill-accent-300 dark:fill-accent-800" />

        {/* Shrubs, kept in the same safe middle band as the trees. */}
        <g className="fill-accent-300 dark:fill-accent-800">
          <rect x="302" y="131" width="38" height="9" rx="4.5" />
          <rect x="424" y="133" width="28" height="7" rx="3.5" />
          <rect x="748" y="133" width="28" height="7" rx="3.5" />
          <rect x="858" y="131" width="38" height="9" rx="4.5" />
        </g>
      </svg>
    </div>
  );
}
