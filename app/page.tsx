export const runtime = 'edge'

export default function HomePage() {
  return (
    <div style={{ background: '#08090E', color: '#EEE8D5', minHeight: '100vh', padding: '48px', fontFamily: 'sans-serif' }}>
      <h1>GrindRoom</h1>
      <p>Worker is alive. Env check: SUPABASE_URL present = {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'YES' : 'NO'}</p>
    </div>
  )
}
