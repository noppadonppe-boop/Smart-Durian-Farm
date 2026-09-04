import { useEffect, useState } from 'react'
import { onSnapshot, query, setDoc, getDocs } from 'firebase/firestore'
import { createFirebaseLiveClients } from '../infrastructure/firebase/firebaseClient'
import type { UserProfile, Project, UserRole } from '../domain/auth'
import { userRoles } from '../domain/auth'
import { rootCollection, rootDoc } from '../infrastructure/firebase/firebaseDataRoot'
import { useAuth } from '../security/AuthContext'

export function UserManagementPage() {
  const { isSystemAdmin } = useAuth()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const { firestore } = createFirebaseLiveClients()

  useEffect(() => {
    const q = query(rootCollection(firestore, 'users'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(d => d.data() as UserProfile)
      setUsers(usersData)
    })
    return () => unsubscribe()
  }, [firestore])

  useEffect(() => {
    const fetchProjects = async () => {
      const q = query(rootCollection(firestore, 'projects'))
      const snapshot = await getDocs(q)
      const projectsData = snapshot.docs.map(d => d.data() as Project)
      setProjects(projectsData)
    }
    void fetchProjects()
  }, [firestore])

  const updateUser = async (uid: string, updates: Partial<UserProfile>) => {
    try {
      const ref = rootDoc(firestore, 'users', uid)
      await setDoc(ref, updates, { merge: true })
    } catch (error) {
      console.error('Update failed', error)
      alert('เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่')
    }
  }

  if (!isSystemAdmin) {
    return <div className="form-error">ไม่มีสิทธิ์เข้าถึง</div>
  }

  return (
    <div className="admin-container" style={{ padding: '2rem' }}>
      <h1>จัดการผู้ใช้งาน (MasterAdmin)</h1>
      <table className="data-table" style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>โปรไฟล์</th>
            <th>ชื่อ-นามสกุล</th>
            <th>ตำแหน่ง</th>
            <th>สถานะ</th>
            <th>สิทธิ์ (Roles)</th>
            <th>โครงการที่รับผิดชอบ</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.uid}>
              <td>
                {u.photoURL ? (
                  <img src={u.photoURL} alt="Profile" style={{ width: '40px', borderRadius: '50%' }} />
                ) : (
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ccc' }} />
                )}
              </td>
              <td>{u.firstName} {u.lastName}<br/><small>{u.email}</small></td>
              <td>{u.position}</td>
              <td>
                <select 
                  value={u.status} 
                  onChange={(e) => void updateUser(u.uid, { status: e.target.value as UserProfile['status'] })}
                >
                  <option value="pending">รออนุมัติ</option>
                  <option value="approved">อนุมัติแล้ว</option>
                  <option value="rejected">ปฏิเสธ</option>
                </select>
              </td>
              <td>
                <select 
                  multiple 
                  value={u.role}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions).map(o => o.value as UserRole)
                    void updateUser(u.uid, { role: selected })
                  }}
                  style={{ zIndex: 10010, minHeight: '80px' }}
                >
                  {userRoles.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </td>
              <td>
                <select 
                  multiple 
                  value={u.assignedProjects || []}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions).map(o => o.value)
                    void updateUser(u.uid, { assignedProjects: selected })
                  }}
                  style={{ minHeight: '80px' }}
                >
                  {projects.map(p => (
                    <option key={p.projectId} value={p.projectId}>{p.projectName}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
