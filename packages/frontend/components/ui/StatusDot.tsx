interface Props {
  status: 'active' | 'idle' | 'thinking' | 'error'
  size?: 'sm' | 'md'
}
const colors = { active: '#10B981', idle: '#4B5563', thinking: '#6366F1', error: '#EF4444' }
export default function StatusDot({ status, size = 'sm' }: Props) {
  const px = size === 'sm' ? '6px' : '9px'
  return (
    <span style={{
      display: 'inline-block', width: px, height: px, borderRadius: '50%',
      background: colors[status],
      boxShadow: status === 'active' ? `0 0 6px ${colors[status]}` : 'none',
      animation: status === 'thinking' ? 'pulse 1s infinite' : 'none',
      flexShrink: 0,
    }} />
  )
}
