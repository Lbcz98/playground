import { describe, expect, it } from 'vitest'
import { readRequest } from './request-signals'
import { SCREENFLOW_MANIFEST } from './screenflow-manifest'
import { W3C_MANIFEST } from '@/shared/fixtures/w3cManifest'
import PHRASES from './__fixtures__/request-signals.pt.json'

describe('readRequest — real Portuguese requests, traps included', () => {
  it.each(PHRASES)('$phrase', ({ phrase, components, unknown, explores }) => {
    const read = readRequest(phrase, SCREENFLOW_MANIFEST)
    expect(read.components.sort()).toEqual([...components].sort())
    expect(read.unknown.sort()).toEqual([...unknown].sort())
    expect(read.exploration.length > 0).toBe(explores)
  })

  it('matches an imported system by its own ids and names only', () => {
    expect(readRequest('A container with a button', W3C_MANIFEST).components.sort()).toEqual(['Button', 'Container'])
    // The Portuguese aliases belong to the built-in components, not to a same-named import.
    expect(readRequest('um botão', W3C_MANIFEST).components).toEqual([])
  })
})
