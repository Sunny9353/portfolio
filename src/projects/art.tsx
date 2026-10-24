import type { ReactElement } from 'react'

export type ArtKind = 'falcons-pipeline'

const INK = '#ffffff'

function Arrow({ x1, x2, y, label }: { x1: number; x2: number; y: number; label?: string }) {
  return (
    <g stroke={INK} strokeOpacity={0.55} fill="none" strokeWidth={2}>
      <line x1={x1} y1={y} x2={x2 - 8} y2={y} />
      <path d={`M${x2 - 14} ${y - 6} L${x2} ${y} L${x2 - 14} ${y + 6}`} />
      {label && (
        <text x={(x1 + x2) / 2} y={y - 14} textAnchor="middle" className="art-mono" fill={INK} fillOpacity={0.6} stroke="none">
          {label}
        </text>
      )}
    </g>
  )
}

function Box({
  x, y, w, h, title, sub, color, filled = false,
}: { x: number; y: number; w: number; h: number; title: string; sub?: string; color: string; filled?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={filled ? color : 'none'} fillOpacity={filled ? 0.16 : 0} stroke={color} strokeWidth={2} />
      <text x={x + 18} y={y + (sub ? h / 2 - 3 : h / 2 + 7)} className="art-tech" fill={INK}>
        {title}
      </text>
      {sub && (
        <text x={x + 18} y={y + h / 2 + 22} className="art-mono" fill={INK} fillOpacity={0.62}>
          {sub}
        </text>
      )}
    </g>
  )
}

/** Shadow Falcons: how a frame travels from the drone to a threat level. Drawn in the site's own colours. */
function FalconsPipeline() {
  return (
    <svg
      viewBox="0 0 1280 720"
      className="art-svg"
      role="img"
      aria-label="Shadow Falcons pipeline: the drone streams video over Wi-Fi to a ground station running three models, three false-alarm filters turn detections into a threat level, and a human operator decides"
    >
      <rect width="1280" height="720" fill="#000" />
      <text x="60" y="64" className="art-mono" fill={INK} fillOpacity={0.62}>SHADOW FALCONS &middot; DETECTION PIPELINE</text>
      <text x="1220" y="64" textAnchor="end" className="art-mono" fill={INK} fillOpacity={0.62}>FRAME &rarr; THREAT LEVEL</text>
      <line x1="60" y1="84" x2="1220" y2="84" stroke={INK} strokeOpacity={0.22} />

      {/* drone */}
      <Box x={60} y={286} w={200} h={150} title="DRONE" sub="ESP32-S3 + camera" color={INK} />
      <text x={60} y={470} className="art-mono" fill={INK} fillOpacity={0.55}>flies and streams only</text>
      <Arrow x1={260} x2={350} y={361} label="MJPEG / Wi-Fi" />

      {/* ground station: three models */}
      <rect x={350} y={188} width={290} height={346} fill="none" stroke={INK} strokeOpacity={0.35} strokeDasharray="6 6" />
      <text x={366} y={216} className="art-mono" fill={INK} fillOpacity={0.62}>GROUND STATION</text>
      <Box x={366} y={238} w={258} h={84} title="WEAPON" sub="YOLOv8 · gun, knife" color={INK} filled />
      <Box x={366} y={338} w={258} h={84} title="PERSON" sub="YOLOv8-seg · outlines" color={INK} filled />
      <Box x={366} y={438} w={258} h={84} title="SCREEN" sub="YOLOv8n · tv, laptop" color={INK} filled />
      <Arrow x1={640} x2={720} y={361} />

      {/* three filters */}
      <text x={720} y={216} className="art-mono" fill={INK} fillOpacity={0.62}>FALSE-ALARM FILTERS</text>
      <Box x={720} y={238} w={250} h={84} title="01 SCREEN" sub="weapon on a TV? drop it" color={INK} />
      <Box x={720} y={338} w={250} h={84} title="02 PERSON" sub="held by someone? keep" color={INK} />
      <Box x={720} y={438} w={250} h={84} title="03 CONFIRM" sub="3 frames in a row" color={INK} />
      <Arrow x1={970} x2={1050} y={361} />

      {/* threat level */}
      <text x={1050} y={216} className="art-mono" fill={INK} fillOpacity={0.62}>TACTICAL HUD</text>
      <rect x={1050} y={238} width={170} height={284} fill="none" stroke={INK} strokeWidth={2} />
      <rect x={1050} y={238} width={170} height={94} fill={INK} />
      <text x={1135} y={296} textAnchor="middle" className="art-tech" fill="#000" fontWeight={700}>HIGH</text>
      <text x={1135} y={392} textAnchor="middle" className="art-tech" fill={INK} fillOpacity={0.7}>MEDIUM</text>
      <line x1={1050} y1={332} x2={1220} y2={332} stroke={INK} strokeOpacity={0.35} />
      <line x1={1050} y1={427} x2={1220} y2={427} stroke={INK} strokeOpacity={0.35} />
      <text x={1135} y={487} textAnchor="middle" className="art-tech" fill={INK} fillOpacity={0.45}>LOW</text>

      {/* human in the loop */}
      <line x1="1135" y1="522" x2="1135" y2="600" stroke={INK} strokeOpacity={0.55} strokeWidth={2} />
      <path d="M1129 590 L1135 604 L1141 590" fill="none" stroke={INK} strokeOpacity={0.55} strokeWidth={2} />
      <text x={1220} y={640} textAnchor="end" className="art-tech" fill={INK}>OPERATOR DECIDES</text>
      <text x={1220} y={666} textAnchor="end" className="art-mono" fill={INK} fillOpacity={0.55}>human in the loop, always</text>
    </svg>
  )
}

const ART: Record<ArtKind, () => ReactElement> = { 'falcons-pipeline': FalconsPipeline }

export function Art({ kind }: { kind: ArtKind }) {
  const C = ART[kind]
  return <C />
}
