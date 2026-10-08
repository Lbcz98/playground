/** Phase 9D: the deviation contract's shape and the plumbing that carries it. */
import { describe, expect, it } from 'vitest'
import {
  BLUEPRINT_DOCUMENT_KEYS,
  BLUEPRINT_NODE_KEYS,
  BLUEPRINT_SCREEN_KEYS,
  nodeKeysFor,
} from './blueprint'
import { treeToBlueprint } from '@/interpreter/interpret'
import { makeNode } from '@/model/nodeTree'

describe('keys', () => {
  it('lets only an Exploratory node carry a deviation', () => {
    expect(nodeKeysFor('faithful')).toEqual(BLUEPRINT_NODE_KEYS)
    expect(nodeKeysFor('faithful')).not.toContain('deviation')
    expect(nodeKeysFor('exploratory')).toEqual([...BLUEPRINT_NODE_KEYS, 'deviation'])
  })

  it('has mode on the document and on a further screen, and no reuse anywhere (9E)', () => {
    expect(BLUEPRINT_DOCUMENT_KEYS).toContain('mode')
    expect(BLUEPRINT_SCREEN_KEYS).toContain('mode')
    for (const keys of [BLUEPRINT_DOCUMENT_KEYS, BLUEPRINT_SCREEN_KEYS, nodeKeysFor('exploratory')]) {
      expect(keys).not.toContain('reuse')
    }
  })
})

describe('the deviation travels with its node', () => {
  const deviation = { ruleId: 'layout.slots', why: 'footer first' }

  it('treeToBlueprint keeps it, and omits it when there is none', () => {
    const child = makeNode('Stack')
    child.deviation = deviation
    const doc = treeToBlueprint(makeNode('Stack', {}, [child, makeNode('Stack')]))
    expect(doc.root.children?.[0].deviation).toEqual(deviation)
    expect(doc.root.children?.[1]).not.toHaveProperty('deviation')
  })

  it('survives an undo/redo snapshot of the tree', () => {
    const node = makeNode('Stack')
    node.deviation = deviation
    expect(structuredClone(node).deviation).toEqual(deviation)
  })
})
