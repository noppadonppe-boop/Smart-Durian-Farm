import type { TreeQrAssetRepository } from '../contracts'
import {
  canDeleteTreePositions,
  canManageTreeRegister,
  type TreeMutationContext,
  type TreeQrAsset,
  type TreeQrAssetDraft,
} from '../../domain/treeRegister'

function assetKey(context: TreeMutationContext, positionId: string, format: TreeQrAsset['format']): string {
  return `${context.farm.organizationId}:${context.farm.farmId}:${positionId}:${format}`
}

export class MockTreeQrAssetRepository implements TreeQrAssetRepository {
  private readonly assets = new Map<string, TreeQrAsset>()

  listQrAssets(context: TreeMutationContext): Promise<readonly TreeQrAsset[]> {
    return Promise.resolve(
      [...this.assets.values()]
        .filter((asset) =>
          asset.organizationId === context.farm.organizationId && asset.farmId === context.farm.farmId,
        )
        .map((asset) => structuredClone(asset)),
    )
  }

  createQrAsset(context: TreeMutationContext, draft: TreeQrAssetDraft): Promise<TreeQrAsset> {
    if (!canManageTreeRegister(context.farm)) {
      throw new Error('เฉพาะเจ้าขององค์กรหรือผู้จัดการสวนที่ใช้งานอยู่เท่านั้นที่สร้าง QR ได้')
    }
    if (!draft.positionId.trim() || !draft.tagCode.trim() || !draft.payload.trim() || !draft.svg.trim()) {
      throw new Error('ข้อมูล QR ไม่ครบถ้วน')
    }

    const key = assetKey(context, draft.positionId, draft.format)
    const existing = this.assets.get(key)
    if (existing) return Promise.resolve(structuredClone(existing))

    const asset: TreeQrAsset = {
      qrAssetId: `qr_${crypto.randomUUID().replaceAll('-', '')}`,
      organizationId: context.farm.organizationId,
      farmId: context.farm.farmId,
      positionId: draft.positionId,
      tagCode: draft.tagCode,
      format: draft.format,
      payload: draft.payload,
      storagePath: `mock://organizations/${context.farm.organizationId}/farms/${context.farm.farmId}/treeQr/${draft.positionId}/${draft.format}.svg`,
      storageUrl: '',
      status: 'READY',
      createdAtLabel: 'เมื่อสักครู่ · เวลาจำลองในเครื่อง',
      exampleData: true,
    }
    this.assets.set(key, asset)
    return Promise.resolve(structuredClone(asset))
  }

  deleteQrAssets(context: TreeMutationContext, positionIds: readonly string[]): Promise<number> {
    if (!canDeleteTreePositions(context.farm, context.isSystemAdmin)) {
      throw new Error('เฉพาะ MasterAdmin หรือเจ้าของสวนที่ใช้งานอยู่เท่านั้นที่ลบ QR ได้')
    }
    const selectedIds = new Set(positionIds)
    let deletedCount = 0
    for (const [key, asset] of this.assets) {
      if (
        asset.organizationId === context.farm.organizationId &&
        asset.farmId === context.farm.farmId &&
        selectedIds.has(asset.positionId)
      ) {
        this.assets.delete(key)
        deletedCount += 1
      }
    }
    return Promise.resolve(deletedCount)
  }
}
