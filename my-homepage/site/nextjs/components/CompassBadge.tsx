const CX = 160;
const CY = 160;
const R_OUTER = 150;

const COMPASS_TICKS = Array.from({ length: 72 }, (_, i) => {
  const major = i % 18 === 0;
  const rInner = major ? 136 : 143;
  const angle = ((i * 5) * Math.PI) / 180;

  return {
    key: i,
    x1: (CX + R_OUTER * Math.sin(angle)).toFixed(1),
    y1: (CY - R_OUTER * Math.cos(angle)).toFixed(1),
    x2: (CX + rInner * Math.sin(angle)).toFixed(1),
    y2: (CY - rInner * Math.cos(angle)).toFixed(1),
    strokeWidth: major ? "1.4" : "0.7",
  };
});

export default function CompassBadge() {
  return (
    <div className="hero-compass-badge" aria-hidden="true">
      <svg className="compass" viewBox="0 0 320 320">
        <circle cx="160" cy="160" r="150" fill="none" stroke="#3f5f70" strokeWidth="1" />
        <circle cx="160" cy="160" r="118" fill="none" stroke="#33505f" strokeWidth="1" />
        <g stroke="#4c6d7d" strokeWidth="1">
          {COMPASS_TICKS.map((t) => (
            <line key={t.key} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} strokeWidth={t.strokeWidth} />
          ))}
        </g>
        <text x="160" y="34" textAnchor="middle" fill="#e7eff1" fontFamily="IBM Plex Mono, monospace" fontSize="15" fontWeight="600">N</text>
        <text x="160" y="296" textAnchor="middle" fill="#7d95a1" fontFamily="IBM Plex Mono, monospace" fontSize="13">S</text>
        <text x="290" y="165" textAnchor="middle" fill="#7d95a1" fontFamily="IBM Plex Mono, monospace" fontSize="13">E</text>
        <text x="30" y="165" textAnchor="middle" fill="#7d95a1" fontFamily="IBM Plex Mono, monospace" fontSize="13">W</text>
        <g className="compass-needle">
          <polygon points="160,52 170,160 160,150 150,160" fill="#c99a4f" />
          <polygon points="160,268 170,160 160,170 150,160" fill="#3f5f70" />
        </g>
        <circle cx="160" cy="160" r="6" fill="#f2e6cf" />
      </svg>
    </div>
  );
}
