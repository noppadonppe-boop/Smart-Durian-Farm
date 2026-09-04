import {
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore'
import { getDownloadURL, ref, uploadString, type FirebaseStorage } from 'firebase/storage'

import type { TreeQrAssetRepository } from '../../adapters/contracts'
import {
  canManageTreeRegister,
  normalizeTagCode,
  treeQrFormats,
  type TreeMutationContext,
  type TreeQrAsset,
  type TreeQrAssetDraft,
  type TreeQrFormat,
} from '../../domain/treeRegister'
import { rootCollection, rootDoc } from './firebaseDataRoot'

function requiredString(data: DocumentData, field: string): string {
  const value: unknown = data[field]
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Invalid Tree QR asset field: ${field}`)
  }
  return value
}

function qrFormat(value: unknown): TreeQrFormat {
  if (!treeQrFormats.includes(value as TreeQrFormat)) {
    throw new Error('Invalid Tree QR asset format')
  }
  return value as TreeQrFormat
}

function timestampLabel(value: unknown): string {
  if (!(value instanceof Timestamp)) return 'รอเวลาจาก Firebase'
  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value.toDate())
}

function assetId(positionId: string, format: TreeQrFormat): string {
  return `qr_${positionId}_${format.toLowerCase()}`
}

function storagePath(context: TreeMutationContext, draft: Pick<TreeQrAssetDraft, 'positionId' | 'format'>): string {
  return [
    'organizations',
    context.farm.organizationId,
    'farms',
    context.farm.farmId,
    'treeQr',
    draft.positionId,
    `${draft.format}.svg`,
  ].join('/')
}

function assetCollection(firestore: Firestore, context: TreeMutationContext) {
  return rootCollection(
    firestore,
    'organizations',
    context.farm.organizationId,
    'farms',
    context.farm.farmId,
    'treeQrAssets',
  )
}

async function assetFromDocument(
  document: { data: () => DocumentData },
  storage: FirebaseStorage,
): Promise<TreeQrAsset> {
  const data = document.data()
  const path = requiredString(data, 'storagePath')
  let storageUrl = ''
  try {
    storageUrl = await getDownloadURL(ref(storage, path))
  } catch {
    // Keep the metadata readable when an older object is missing or Storage is
    // temporarily unavailable. The UI can render the deterministic local SVG
    // while the asset is repaired.
  }
  return {
    qrAssetId: requiredString(data, 'qrAssetId'),
    organizationId: requiredString(data, 'organizationId'),
    farmId: requiredString(data, 'farmId'),
    positionId: requiredString(data, 'positionId'),
    tagCode: requiredString(data, 'tagCode'),
    format: qrFormat(data.format),
    payload: requiredString(data, 'payload'),
    storagePath: path,
    storageUrl,
    status: 'READY',
    createdAtLabel: timestampLabel(data.createdAt),
    exampleData: data.exampleData === true,
  }
}

export class FirebaseTreeQrAssetRepository implements TreeQrAssetRepository {
  constructor(
    private readonly firestore: Firestore,
    private readonly storage: FirebaseStorage,
    private readonly exampleData = false,
  ) {}

  async listQrAssets(context: TreeMutationContext): Promise<readonly TreeQrAsset[]> {
    const snapshot = await getDocs(assetCollection(this.firestore, context))
    return Promise.all(snapshot.docs.map((document) => assetFromDocument(document, this.storage)))
  }

  async createQrAsset(
    context: TreeMutationContext,
    draft: TreeQrAssetDraft,
  ): Promise<TreeQrAsset> {
    if (!canManageTreeRegister(context.farm)) {
      throw new Error('เฉพาะเจ้าขององค์กรหรือผู้จัดการสวนที่ใช้งานอยู่เท่านั้นที่สร้าง QR ได้')
    }
    if (!draft.positionId.trim() || !draft.tagCode.trim() || !draft.payload.trim() || !draft.svg.trim()) {
      throw new Error('ข้อมูล QR ไม่ครบถ้วน')
    }
    if (!treeQrFormats.includes(draft.format)) throw new Error('รูปแบบ QR ไม่ถูกต้อง')
    if (draft.svg.length > 1_000_000) throw new Error('ไฟล์ QR ใหญ่เกิน 1 MB')

    const positionReference = rootDoc(
      this.firestore,
      'organizations',
      context.farm.organizationId,
      'farms',
      context.farm.farmId,
      'treePositions',
      draft.positionId,
    )
    const position = await getDoc(positionReference)
    if (!position.exists()) throw new Error('ไม่พบตำแหน่งปลูกในสวนปัจจุบัน')
    const positionTag = normalizeTagCode(requiredString(position.data(), 'tagCode'))
    if (positionTag !== normalizeTagCode(draft.tagCode)) {
      throw new Error('TAG ID ไม่ตรงกับตำแหน่งปลูกที่เลือก')
    }

    const id = assetId(draft.positionId, draft.format)
    const assetReference = doc(assetCollection(this.firestore, context), id)
    const existing = await getDoc(assetReference)
    if (existing.exists()) return assetFromDocument(existing, this.storage)

    const path = storagePath(context, draft)
    await uploadString(ref(this.storage, path), draft.svg, 'raw', {
      contentType: 'image/svg+xml',
      customMetadata: {
        organizationId: context.farm.organizationId,
        farmId: context.farm.farmId,
        uploadedBy: context.actor.userId,
        positionId: draft.positionId,
        tagCode: draft.tagCode,
        qrFormat: draft.format,
        storageFileName: `${draft.format}.svg`,
        exampleData: String(this.exampleData),
        classification: this.exampleData ? 'SIMULATED/TEST ONLY' : 'OPERATIONAL',
      },
    })

    await setDoc(assetReference, {
      recordType: 'TREE_QR_ASSET',
      qrAssetId: id,
      organizationId: context.farm.organizationId,
      farmId: context.farm.farmId,
      positionId: draft.positionId,
      tagCode: draft.tagCode,
      format: draft.format,
      payload: draft.payload,
      storagePath: path,
      status: 'READY',
      exampleData: this.exampleData,
      createdBy: context.actor.userId,
      createdAt: serverTimestamp(),
    })

    const created = await getDoc(assetReference)
    if (!created.exists()) throw new Error('อัปโหลด QR แล้วแต่ไม่พบ metadata ใน Firebase')
    return assetFromDocument(created, this.storage)
  }
}
