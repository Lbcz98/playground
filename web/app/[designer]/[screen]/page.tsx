import { notFound } from 'next/navigation'
import { listProtos } from '../../protos'
import { Proto } from './Proto'

// Only what is in protos/ is reachable; anything else is a 404.
export const dynamicParams = false
export const generateStaticParams = () => listProtos().map(({ designer, screen }) => ({ designer, screen }))

export default function ProtoPage({ params }: { params: { designer: string; screen: string } }) {
  const proto = listProtos().find((p) => p.designer === params.designer && p.screen === params.screen)
  if (!proto) notFound()
  return <Proto designer={proto.designer} screen={proto.screen} kind={proto.kind} />
}
