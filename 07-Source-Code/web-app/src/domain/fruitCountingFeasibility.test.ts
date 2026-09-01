import { describe, expect, it } from 'vitest'

import { runDeterministicFruitCount } from './fruitCountingFeasibility'

describe('AIFC deterministic fruit count mock', () => {
  it('offers repeatable single, multi-view and video results', () => {
    const first = runDeterministicFruitCount('MID_SEASON', 'MULTI_VIEW', 'aifc-session-001')
    const retry = runDeterministicFruitCount('MID_SEASON', 'MULTI_VIEW', 'aifc-session-001')

    expect(retry).toEqual(first)
    expect(first.engineKind).toBe('DETERMINISTIC_MOCK')
    expect(first.aiVisibleCount).toBeGreaterThan(first.trackedCount)
    expect(first.proposedReviewedCount).toBe(first.trackedCount - first.uncertainCount)
    expect(first.limitationNote).toContain('SIMULATED/TEST ONLY')
  })

  it('does not turn flowering into a fruit count', () => {
    expect(() => runDeterministicFruitCount('FLOWERING', 'SINGLE_VIEW', 'aifc-session-002'))
      .toThrow('ช่วงออกดอก')
  })
})
