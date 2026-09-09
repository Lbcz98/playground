import { describe, expect, it } from 'vitest'
import { addUsage, extractBlueprintJson, unwrapBlueprint } from './types'

describe('extractBlueprintJson', () => {
  it('parses a bare JSON object', () => {
    expect(extractBlueprintJson('{"version":1,"root":{"type":"Stack"}}')).toEqual({
      version: 1,
      root: { type: 'Stack' },
    })
  })

  it('strips a ```json fence', () => {
    const text = 'Here you go:\n```json\n{"version":1,"root":{"type":"Stack"}}\n```\n'
    expect(extractBlueprintJson(text)).toEqual({ version: 1, root: { type: 'Stack' } })
  })

  it('recovers an object embedded in prose', () => {
    const text = 'Sure! {"version":1,"root":{"type":"Stack","children":[]}} Hope that helps.'
    expect(extractBlueprintJson(text)).toEqual({
      version: 1,
      root: { type: 'Stack', children: [] },
    })
  })

  it('throws when there is no object', () => {
    expect(() => extractBlueprintJson('I cannot do that')).toThrow()
  })
})

describe('unwrapBlueprint', () => {
  it('unwraps a { blueprint } envelope', () => {
    expect(unwrapBlueprint({ blueprint: { version: 1 } })).toEqual({ version: 1 })
  })
  it('passes a bare document through', () => {
    expect(unwrapBlueprint({ version: 1, root: {} })).toEqual({ version: 1, root: {} })
  })
})

describe('addUsage', () => {
  it('sums tokens and cost across pipeline steps and tracks the estimate flag', () => {
    const a = { inputTokens: 100, outputTokens: 20, costUsd: 0.001, costEstimated: true }
    const b = { inputTokens: 300, outputTokens: 80, costUsd: 0.004, costEstimated: false }
    expect(addUsage(a, b)).toEqual({
      inputTokens: 400,
      outputTokens: 100,
      costUsd: 0.005,
      costEstimated: true,
    })
    expect(addUsage(undefined, b)).toMatchObject({ inputTokens: 300, costEstimated: false })
  })
})
