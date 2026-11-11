import Link from 'next/link'
import { listProtos } from './protos'

export default function Index() {
  const byDesigner = new Map<string, { screen: string; kind: string }[]>()
  for (const { designer, screen, kind } of listProtos()) byDesigner.set(designer, [...(byDesigner.get(designer) ?? []), { screen, kind }])
  return (
    <main style={{ maxWidth: 720, margin: '48px auto', padding: '0 16px' }}>
      <h1>Protótipos DTV</h1>
      {[...byDesigner].map(([designer, screens]) => (
        <section key={designer}>
          <h2>{designer}</h2>
          <ul>
            {screens.map(({ screen, kind }) => (
              <li key={screen}>
                <Link href={`/${designer}/${screen}`}>{screen}</Link>
                {kind === 'flow' ? ' (fluxo — use as setas e Enter)' : ''}
              </li>
            ))}
          </ul>
        </section>
      ))}
      <section>
        <h2>Diagnóstico</h2>
        <ul>
          <li>
            <a href="/video-test.html">Teste de vídeo (Chrome 68)</a>
          </li>
        </ul>
      </section>
    </main>
  )
}
