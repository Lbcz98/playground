import { listProtos } from '../../protos'
import { Proto } from './Proto'

// Only what is in protos/ is reachable; anything else is a 404.
export const dynamicParams = false
export const generateStaticParams = listProtos

export default function ProtoPage({ params }: { params: { designer: string; screen: string } }) {
  return <Proto designer={params.designer} screen={params.screen} />
}
