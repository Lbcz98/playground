import { Flow } from '../../../web/app/[designer]/[screen]/FlowPlayer'
import { Screen } from '@/ui-kit/Screen'
import type { FlowFile } from '@/shared/export/flowFile'
import { useState } from 'react'

type Deferred = { name: string; resolve(value: { default: unknown }): void; reject(error: Error): void }
const flowRequests: Deferred[] = []
const stateRequests: Deferred[] = []
const defer = (list: Deferred[], name: string): Promise<{ default: unknown }> => new Promise((resolve, reject) => {
  list.push({ name, resolve, reject })
})

const screen = () => <Screen model="alert" level={0} />
const data: FlowFile = {
  start: 'home',
  transitions: [
    { from: 'home', key: 'up', to: 'rail' },
    { from: 'rail', key: 'enter', to: 'detail' },
  ],
}
let unmount = () => {}

Object.assign(window, {
  __fixture: {
    flowRequests,
    stateRequests,
    acceptFlow(index: number) { flowRequests[index].resolve({ default: data }) },
    failFlow(index: number) { flowRequests[index].reject(new Error('flow failed')) },
    acceptState(name: string, index = 0) { stateRequests.filter((r) => r.name === name)[index].resolve({ default: screen }) },
    failState(name: string, index = 0) { stateRequests.filter((r) => r.name === name)[index].reject(new Error(`${name} failed`)) },
    unmount() { unmount() },
  },
})

export default function Fixture() {
  const [mounted, setMounted] = useState(true)
  unmount = () => setMounted(false)
  return mounted ? <Flow flow={() => defer(flowRequests, 'flow')} state={(name) => defer(stateRequests, name)} /> : null
}
