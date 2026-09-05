export const canonicalRoles = new Set([
  'ORG_OWNER',
  'FARM_MANAGER',
  'AGRONOMIST',
  'WORKER',
  'SALES_INVENTORY',
  'VIEWER',
  'AUDITOR',
])

export function validateMasterAdminUpdate(input, actorUid, seedOwnerUid) {
  if (!input || typeof input !== 'object') throw new Error('ข้อมูลคำขอไม่ถูกต้อง')
  if (typeof input.uid !== 'string' || !/^[A-Za-z0-9:_-]{6,128}$/u.test(input.uid)) {
    throw new Error('UID ผู้ใช้ไม่ถูกต้อง')
  }
  if (typeof input.masterAdmin !== 'boolean') throw new Error('สถานะ MasterAdmin ไม่ถูกต้อง')
  if (!input.masterAdmin) {
    if (input.uid === actorUid) throw new Error('ไม่อนุญาตให้ปลดสิทธิ์ MasterAdmin ของบัญชีตนเอง')
    if (input.uid === seedOwnerUid) throw new Error('ไม่อนุญาตให้ปลดสิทธิ์ root owner')
    if (!canonicalRoles.has(input.fallbackRole)) throw new Error('Role หลังปลดสิทธิ์ไม่ถูกต้อง')
    if (typeof input.organizationId !== 'string' || !input.organizationId) {
      throw new Error('Organization หลังปลดสิทธิ์ไม่ถูกต้อง')
    }
    if (typeof input.farmId !== 'string' || !input.farmId) {
      throw new Error('Farm หลังปลดสิทธิ์ไม่ถูกต้อง')
    }
  }
  return input
}
