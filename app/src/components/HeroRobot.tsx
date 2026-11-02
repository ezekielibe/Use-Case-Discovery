export default function HeroRobot() {
  return (
    <svg className="hero-robot" viewBox="0 0 320 320" role="img" aria-label="Friendly AI robot illustration">
      <defs>
        <linearGradient id="robotBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dfe7f5" />
        </linearGradient>
        <linearGradient id="robotVisor" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#14254a" />
          <stop offset="1" stopColor="#2b2f7a" />
        </linearGradient>
        <radialGradient id="robotGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#7ff7ff" />
          <stop offset="1" stopColor="#3ad1ff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="robotBubble" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b98cff" />
          <stop offset="1" stopColor="#7b3fe4" />
        </linearGradient>
      </defs>

      <circle cx="160" cy="170" r="135" fill="rgba(255,255,255,0.08)" />
      <circle cx="160" cy="170" r="105" fill="rgba(255,255,255,0.07)" />

      <g stroke="rgba(255,255,255,0.45)" strokeWidth="2" fill="none">
        <path d="M40 90 L75 110 L60 150" />
        <path d="M285 225 L250 245 L270 280" />
      </g>
      <g fill="#ffffff">
        <circle cx="40" cy="90" r="5" />
        <circle cx="75" cy="110" r="4" />
        <circle cx="60" cy="150" r="5" />
        <circle cx="285" cy="225" r="5" />
        <circle cx="250" cy="245" r="4" />
        <circle cx="270" cy="280" r="5" />
      </g>

      <g className="robot-float">
        <line x1="160" y1="58" x2="160" y2="82" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
        <circle cx="160" cy="50" r="14" fill="url(#robotGlow)" />
        <circle cx="160" cy="50" r="8" fill="#7ff7ff" />

        <rect x="92" y="80" width="136" height="108" rx="40" fill="url(#robotBody)" />
        <rect x="80" y="118" width="16" height="36" rx="8" fill="#c9d5ea" />
        <rect x="224" y="118" width="16" height="36" rx="8" fill="#c9d5ea" />
        <rect x="108" y="102" width="104" height="62" rx="28" fill="url(#robotVisor)" />
        <ellipse cx="138" cy="132" rx="11" ry="13" fill="#7ff7ff" />
        <ellipse cx="182" cy="132" rx="11" ry="13" fill="#7ff7ff" />
        <circle cx="142" cy="127" r="3.5" fill="#ffffff" />
        <circle cx="186" cy="127" r="3.5" fill="#ffffff" />
        <path d="M146 150 Q160 160 174 150" stroke="#7ff7ff" strokeWidth="4" fill="none" strokeLinecap="round" />

        <rect x="146" y="186" width="28" height="12" rx="4" fill="#c9d5ea" />
        <rect x="104" y="196" width="112" height="78" rx="30" fill="url(#robotBody)" />
        <circle cx="160" cy="232" r="18" fill="url(#robotVisor)" />
        <path d="M152 232 l6 6 l10 -12" stroke="#7ff7ff" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="80" y="206" width="22" height="50" rx="11" fill="#e6edf8" />
        <rect x="218" y="206" width="22" height="50" rx="11" fill="#e6edf8" />
      </g>

      <g className="robot-bubble">
        <path d="M222 44 h66 a16 16 0 0 1 16 16 v28 a16 16 0 0 1 -16 16 h-40 l-16 14 v-14 h-10 a16 16 0 0 1 -16 -16 v-28 a16 16 0 0 1 16 -16 z" fill="url(#robotBubble)" />
        <circle cx="240" cy="74" r="6" fill="#ffffff" />
        <circle cx="258" cy="74" r="6" fill="#ffffff" opacity="0.8" />
        <circle cx="276" cy="74" r="6" fill="#ffffff" opacity="0.6" />
      </g>

      <g fill="#ffe680">
        <path d="M58 228 l5 12 l12 5 l-12 5 l-5 12 l-5 -12 l-12 -5 l12 -5 z" />
        <path d="M262 150 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 l8 -3 z" />
      </g>
    </svg>
  );
}
