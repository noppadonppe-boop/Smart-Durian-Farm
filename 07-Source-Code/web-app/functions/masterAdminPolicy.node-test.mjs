import test from 'node:test'
import assert from 'node:assert/strict'

import { validateMasterAdminUpdate } from './masterAdminPolicy.mjs'

const revoke = {
  uid: 'target-user',
  masterAdmin: false,
  organizationId: 'org-1',
  farmId: 'farm-1',
  fallbackRole: 'FARM_MANAGER',
}

test('accepts a valid grant and revoke request', () => {
  assert.equal(validateMasterAdminUpdate({ ...revoke, masterAdmin: true }, 'actor-user', 'root-user').masterAdmin, true)
  assert.equal(validateMasterAdminUpdate(revoke, 'actor-user', 'root-user').fallbackRole, 'FARM_MANAGER')
})

test('rejects self-revocation and root-owner revocation', () => {
  assert.throws(() => validateMasterAdminUpdate(revoke, 'target-user', 'root-user'), /ตนเอง/u)
  assert.throws(() => validateMasterAdminUpdate(revoke, 'actor-user', 'target-user'), /root owner/u)
})

test('rejects a non-canonical fallback role', () => {
  assert.throws(
    () => validateMasterAdminUpdate({ ...revoke, fallbackRole: 'MasterAdmin' }, 'actor-user', 'root-user'),
    /Role/u,
  )
})
