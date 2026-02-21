export function Swatch({ color }: { color: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span
        style={{
          display: 'inline-block',
          width: 10,
          height: 10,
          borderRadius: 2,
          backgroundColor: color,
          border: '1px solid rgba(255,255,255,0.1)'
        }}
      />
      <code>{`'${color}'`}</code>
    </span>
  );
}
