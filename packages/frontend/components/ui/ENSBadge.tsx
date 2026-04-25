interface Props { name: string; color?: string }
export default function ENSBadge({ name, color = '#7BBFFF' }: Props) {
  return (
    <span style={{
      fontFamily: 'monospace',
      fontSize: '10px',
      color,
      background: 'rgba(30,111,255,0.08)',
      border: '0.5px solid rgba(30,111,255,0.3)',
      padding: '1px 6px',
      borderRadius: '3px',
    }}>
      {name}
    </span>
  )
}
