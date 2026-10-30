import { notFound } from 'next/navigation'
import { listProtos } from '../../protos'
import { Proto } from './Proto'

// Only what is in protos/ is reachable; anything else is a 404.
export const dynamicParams = false
export const generateStaticParams = () => listProtos().map(({ designer, screen }) => ({ designer, screen }))

export default async function ProtoPage({ params }: { params: Promise<{ designer: string; screen: string }> }) {
  const { designer, screen } = await params
  const proto = listProtos().find((p) => p.designer === designer && p.screen === screen)
  if (!proto) notFound()
  return <Proto designer={proto.designer} screen={proto.screen} kind={proto.kind} />
}
