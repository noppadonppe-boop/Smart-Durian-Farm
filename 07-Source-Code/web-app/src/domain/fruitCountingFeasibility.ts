import type { CropStage } from './commercialTraceability'

export const aiCaptureMethods = ['SINGLE_VIEW', 'MULTI_VIEW', 'VIDEO_SEQUENCE'] as const

export type AiCaptureMethod = (typeof aiCaptureMethods)[number]

export const aiCaptureMethodLabels: Record<AiCaptureMethod, string> = {
  SINGLE_VIEW: 'AI จากภาพเดียว — เห็นเฉพาะบางส่วน',
  MULTI_VIEW: 'AI จากหลายภาพ — ตัดรายการซ้ำ',
  VIDEO_SEQUENCE: 'AI จากวิดีโอ — ติดตามผลข้ามเฟรม',
}
export interface DeterministicFruitCountResult {
  countSessionId: string
  stage: CropStage
  captureMethod: AiCaptureMethod
  aiVisibleCount: number
  trackedCount: number
  uncertainCount: number
  proposedReviewedCount: number
  limitationNote: string
  engineKind: 'DETERMINISTIC_MOCK'
  exampleData: boolean
}

const mockResults: Record<AiCaptureMethod, Omit<
  DeterministicFruitCountResult,
  'countSessionId' | 'stage' | 'captureMethod'
>> = {
  SINGLE_VIEW: {
    aiVisibleCount: 42,
    trackedCount: 42,
    uncertainCount: 5,
    proposedReviewedCount: 37,
    limitationNote: 'SIMULATED/TEST ONLY — ภาพเดียวเห็นเฉพาะผลจำลองในมุมนี้ ห้ามถือเป็น Full Count',
    engineKind: 'DETERMINISTIC_MOCK',
    exampleData: true,
  },
  MULTI_VIEW: {
    aiVisibleCount: 84,
    trackedCount: 63,
    uncertainCount: 4,
    proposedReviewedCount: 59,
    limitationNote: 'SIMULATED/TEST ONLY — หลายภาพมีรายการซ้ำที่ mock engine รวมเป็น track และยังต้องให้คนตรวจ',
    engineKind: 'DETERMINISTIC_MOCK',
    exampleData: true,
  },
  VIDEO_SEQUENCE: {
    aiVisibleCount: 96,
    trackedCount: 68,
    uncertainCount: 3,
    proposedReviewedCount: 65,
    limitationNote: 'SIMULATED/TEST ONLY — วิดีโอและ tracking เป็นผลจำลอง ไม่ใช่หลักฐานจากกล้องหรือสวนจริง',
    engineKind: 'DETERMINISTIC_MOCK',
    exampleData: true,
  },
}

export function runDeterministicFruitCount(
  stage: CropStage,
  captureMethod: AiCaptureMethod,
  countSessionId: string,
): DeterministicFruitCountResult {
  if (stage === 'FLOWERING') {
    throw new Error('ช่วงออกดอกยังไม่ใช้ AI นับผล ให้ใช้การบันทึกด้วยคนหรือสถานะยังไม่ทราบ')
  }
  const normalizedSessionId = countSessionId.trim()
  if (!normalizedSessionId) throw new Error('ต้องมี Count Session ID')
  const result = mockResults[captureMethod]
  if (!result) throw new Error('ไม่รองรับวิธี AI ที่เลือก')
  return {
    countSessionId: normalizedSessionId,
    stage,
    captureMethod,
    ...result,
  }
}
