export const WorkflowDiagram = () => {
  return (
    <div className="relative w-full max-w-[520px]">
      <svg
        viewBox="0 0 520 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full"
        role="img"
        aria-label="Workflow: GitHub commits flow through a significance filter, producing LinkedIn, X, and Changelog drafts"
      >
        {/* ── GitHub Repo node ── */}
        <rect
          x="10"
          y="90"
          width="124"
          height="60"
          rx="8"
          fill="#18181b"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />
        <text
          x="72"
          y="114"
          textAnchor="middle"
          fill="#52525b"
          fontSize="8.5"
          fontFamily="ui-monospace, monospace"
          letterSpacing="0.08em"
        >
          GITHUB REPO
        </text>
        <text
          x="72"
          y="130"
          textAnchor="middle"
          fill="#fafafa"
          fontSize="11"
          fontWeight="500"
          fontFamily="ui-monospace, monospace"
        >
          acme/dashboard
        </text>
        <text
          x="72"
          y="144"
          textAnchor="middle"
          fill="#52525b"
          fontSize="8.5"
          fontFamily="ui-monospace, monospace"
        >
          12 commits pushed
        </text>

        {/* ── Connector: GitHub → Filter ── */}
        <line
          x1="134"
          y1="120"
          x2="188"
          y2="120"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
        />
        <polyline
          points="184,116 188,120 184,124"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
          fill="none"
        />

        {/* ── Significance Filter node ── */}
        <rect
          x="188"
          y="90"
          width="144"
          height="60"
          rx="8"
          fill="#18181b"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1"
        />
        <text
          x="260"
          y="114"
          textAnchor="middle"
          fill="#52525b"
          fontSize="8.5"
          fontFamily="ui-monospace, monospace"
          letterSpacing="0.08em"
        >
          SIGNIFICANCE
        </text>
        <text
          x="260"
          y="130"
          textAnchor="middle"
          fill="#fafafa"
          fontSize="11"
          fontWeight="500"
          fontFamily="ui-monospace, monospace"
        >
          Filter
        </text>
        <text
          x="260"
          y="144"
          textAnchor="middle"
          fill="#a78bfa"
          fontSize="8.5"
          fontFamily="ui-monospace, monospace"
        >
          1 signal detected
        </text>

        {/* ── Noise drop (downward dashed) ── */}
        <line
          x1="260"
          y1="150"
          x2="260"
          y2="208"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        <text
          x="260"
          y="222"
          textAnchor="middle"
          fill="#3f3f46"
          fontSize="8"
          fontFamily="ui-monospace, monospace"
        >
          11 commits filtered
        </text>

        {/* ── Connector: Filter → LinkedIn (violet signal, animated) ── */}
        <path
          d="M332,110 L390,42"
          stroke="#a78bfa"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="-8"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </path>
        <polyline
          points="386,45 390,42 389,48"
          stroke="#a78bfa"
          strokeWidth="1.5"
          fill="none"
        />

        {/* ── Connector: Filter → X (muted) ── */}
        <line
          x1="332"
          y1="120"
          x2="390"
          y2="120"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />
        <polyline
          points="386,116 390,120 386,124"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
          fill="none"
        />

        {/* ── Connector: Filter → Changelog (muted) ── */}
        <path
          d="M332,130 L390,198"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />
        <polyline
          points="386,195 390,198 387,192"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
          fill="none"
        />

        {/* ── LinkedIn Draft node (violet highlight = signal path) ── */}
        <rect
          x="390"
          y="20"
          width="122"
          height="44"
          rx="8"
          fill="#18181b"
          stroke="#a78bfa"
          strokeWidth="1"
          strokeOpacity="0.5"
        />
        <text
          x="451"
          y="38"
          textAnchor="middle"
          fill="#a78bfa"
          fontSize="8.5"
          fontFamily="ui-monospace, monospace"
          letterSpacing="0.08em"
        >
          LINKEDIN POST
        </text>
        <text
          x="451"
          y="54"
          textAnchor="middle"
          fill="#fafafa"
          fontSize="10"
          fontFamily="ui-monospace, monospace"
        >
          Draft ready →
        </text>

        {/* ── X Thread node ── */}
        <rect
          x="390"
          y="98"
          width="122"
          height="44"
          rx="8"
          fill="#18181b"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />
        <text
          x="451"
          y="116"
          textAnchor="middle"
          fill="#52525b"
          fontSize="8.5"
          fontFamily="ui-monospace, monospace"
          letterSpacing="0.08em"
        >
          X THREAD
        </text>
        <text
          x="451"
          y="132"
          textAnchor="middle"
          fill="#fafafa"
          fontSize="10"
          fontFamily="ui-monospace, monospace"
        >
          Draft ready →
        </text>

        {/* ── Changelog node ── */}
        <rect
          x="390"
          y="176"
          width="122"
          height="44"
          rx="8"
          fill="#18181b"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />
        <text
          x="451"
          y="194"
          textAnchor="middle"
          fill="#52525b"
          fontSize="8.5"
          fontFamily="ui-monospace, monospace"
          letterSpacing="0.08em"
        >
          CHANGELOG
        </text>
        <text
          x="451"
          y="210"
          textAnchor="middle"
          fill="#fafafa"
          fontSize="10"
          fontFamily="ui-monospace, monospace"
        >
          Entry drafted →
        </text>
      </svg>
    </div>
  )
}
