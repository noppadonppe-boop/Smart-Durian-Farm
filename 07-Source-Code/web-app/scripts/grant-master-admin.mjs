import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const projectId = 'durian-smartfarm'

function argument(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

const configuredProject = argument('--project') ?? process.env.FIREBASE_PROJECT_ID ?? process.env.GCLOUD_PROJECT
const uid = argument('--uid')
const confirmed = process.argv.includes('--confirm-production-admin')

if (configuredProject !== projectId) {
  throw new Error(`ปฏิเสธ Firebase project: ต้องระบุ --project ${projectId} เท่านั้น`)
}
if (!uid || !/^[A-Za-z0-9:_-]{6,128}$/u.test(uid)) {
  throw new Error('ต้องระบุ --uid เป็น Firebase Auth UID ที่ถูกต้อง')
}

console.log(JSON.stringify({
  projectId,
  uid: `${uid.slice(0, 4)}…${uid.slice(-3)}`,
  action: 'SET masterAdmin=true',
  mode: confirmed ? 'WRITE' : 'DRY_RUN',
}, null, 2))

if (!confirmed) {
  console.log('Dry run: เพิ่ม --confirm-production-admin หลังตรวจ UID แล้ว')
  process.exit(0)
}

const app = getApps()[0] ?? initializeApp({
  credential: applicationDefault(),
  projectId,
})
const auth = getAuth(app)
const user = await auth.getUser(uid)
await auth.setCustomUserClaims(uid, {
  ...(user.customClaims ?? {}),
  masterAdmin: true,
})

console.log('ตั้งค่า masterAdmin=true สำเร็จ ผู้ใช้ต้องออกจากระบบแล้วเข้าใหม่เพื่อรับ token ล่าสุด')
