import Link from 'next/link'
import { listProtos } from './protos'

export default function Index() {
  const byDesigner = new Map<string, string[]>()
  for (const { designer, screen } of listProtos()) byDesigner.set(designer, [...(byDesigner.get(designer) ?? []), screen])
  return (
    <main style={{ maxWidth: 720, margin: '48px auto', padding: '0 16px' }}>
      <h1>Protótipos DTV</h1>
      {[...byDesigner].map(([designer, screens]) => (
        <section key={designer}>
          <h2>{designer}</h2>
          <ul>
            {screens.map((screen) => (
              <li key={screen}>
                <Link href={`/${designer}/${screen}`}>{screen}</Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  )
}
