/** Phase 9D: the deviation contract's shape and the plumbing that carries it. */
import { beforeEach, describe, expect, it } from 'vitest'
import {
  BLUEPRINT_DOCUMENT_KEYS,
  BLUEPRINT_NODE_KEYS,
  BLUEPRINT_SCREEN_KEYS,
  nodeKeysFor,
} from './blueprint'
import { treeToBlueprint } from '@/interpreter/interpret'
import { makeNode } from '@/model/nodeTree'
import { useFlowStore } from '@/store/flowStore'

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

  beforeEach(() => useFlowStore.getState().reset())

  it('replaceDocument copies the root’s deviation, and clears it when the new root has none', () => {
    const root = makeNode('Stack')
    root.deviation = deviation
    useFlowStore.getState().replaceDocument(root, 'test')
    expect(useFlowStore.getState().tree.deviation).toEqual(deviation)
    useFlowStore.getState().replaceDocument(makeNode('Stack'), 'test')
    expect(useFlowStore.getState().tree).not.toHaveProperty('deviation')
  })
})
