import Link from 'next/link'
import { AlertBug } from '@/ui-kit/AlertBug'
import { ContentCard, ContentCardBody } from '@/ui-kit/ContentCard'
import { InteractivityButton } from '@/ui-kit/InteractivityButton'
import { Notification } from '@/ui-kit/Notification'
import { RoundedButton } from '@/ui-kit/RoundedButton'
import { WideButton } from '@/ui-kit/WideButton'
import { Screen } from '@/ui-kit/Screen'

export default function Fixture() {
  return <Screen model="alert" level={0}>
    <Link href="/ana/rail" style={{ display: 'inline-block' }}><InteractivityButton as="span" title="Opções de áudio" /></Link>
    <Link href="/ana/watch" style={{ display: 'inline-block' }}><WideButton as="span" label="Assistir" /></Link>
    <Link href="/ana/back" aria-label="Voltar" style={{ display: 'inline-block' }}><RoundedButton as="span" label="Voltar" /></Link>
    <Link href="/ana/message" style={{ display: 'inline-block' }}><Notification as="span" title="Aviso" /></Link>
    <Link href="/ana/bug" aria-label="Interativo" style={{ display: 'inline-block' }}><AlertBug as="span" label="Interativo" /></Link>
    <Link href="/ana/detail" style={{ display: 'inline-block' }}><ContentCard asLink><ContentCardBody quote="Detalhes" /></ContentCard></Link>
    <InteractivityButton title="Ação" />
  </Screen>
}
