import { motion } from 'framer-motion'
import { SolutionBadge, BADGE_META } from '../types/api'

interface BadgeProps {
  badge: SolutionBadge
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function Badge({ badge, size = 'md', showLabel = true }: BadgeProps) {
  const meta = BADGE_META[badge]
  if (!meta) return null

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses[size]}`}
      style={{
        backgroundColor: `${meta.color}20`,
        color: meta.color,
        border: `1px solid ${meta.color}40`,
      }}
      title={meta.description}
    >
      <span>{meta.icon}</span>
      {showLabel && <span>{meta.name}</span>}
    </motion.span>
  )
}

interface BadgeListProps {
  badges: SolutionBadge[]
  size?: 'sm' | 'md' | 'lg'
  showLabels?: boolean
  maxVisible?: number
}

export function BadgeList({ badges, size = 'sm', showLabels = false, maxVisible = 5 }: BadgeListProps) {
  if (!badges || badges.length === 0) return null

  const visibleBadges = badges.slice(0, maxVisible)
  const remainingCount = badges.length - maxVisible

  return (
    <div className="flex flex-wrap items-center gap-1">
      {visibleBadges.map((badge) => (
        <Badge key={badge} badge={badge} size={size} showLabel={showLabels} />
      ))}
      {remainingCount > 0 && (
        <span className="text-xs text-slate-400">+{remainingCount}</span>
      )}
    </div>
  )
}

interface MetricBadgeProps {
  icon: string
  value: string | number
  label: string
  color?: string
  size?: 'sm' | 'md'
}

export function MetricBadge({ icon, value, label, color = '#6366f1', size = 'md' }: MetricBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-medium ${sizeClasses[size]}`}
      style={{
        backgroundColor: `${color}15`,
        color: color,
      }}
      title={label}
    >
      <span>{icon}</span>
      <span>{value}</span>
    </span>
  )
}

interface EfficiencyScoreProps {
  score: number | null
  size?: 'sm' | 'md' | 'lg'
}

export function EfficiencyScore({ score, size = 'md' }: EfficiencyScoreProps) {
  if (score === null) return null

  const getColor = (s: number) => {
    if (s >= 80) return '#10b981' // green
    if (s >= 60) return '#6366f1' // indigo
    if (s >= 40) return '#fbbf24' // yellow
    return '#ef4444' // red
  }

  const sizeClasses = {
    sm: 'text-xs w-8 h-8',
    md: 'text-sm w-10 h-10',
    lg: 'text-base w-12 h-12',
  }

  const color = getColor(score)

  return (
    <div
      className={`flex items-center justify-center rounded-full font-bold ${sizeClasses[size]}`}
      style={{
        backgroundColor: `${color}20`,
        color: color,
        border: `2px solid ${color}`,
      }}
      title={`Efficiency Score: ${score.toFixed(0)}/100`}
    >
      {score.toFixed(0)}
    </div>
  )
}

export default Badge
