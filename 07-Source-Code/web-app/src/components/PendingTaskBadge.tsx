interface PendingTaskBadgeProps {
  count: number
  placement?: 'inline' | 'corner'
}

export function PendingTaskBadge({
  count,
  placement = 'inline',
}: PendingTaskBadgeProps) {
  if (count <= 0) return null

  const label = `มีคำขอรอดำเนินการ ${count} รายการ`

  return (
    <span
      aria-label={label}
      className={`pending-task-badge pending-task-badge--${placement}`}
      title={label}
    >
      {count}
    </span>
  )
}
