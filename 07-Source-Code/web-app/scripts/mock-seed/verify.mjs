import { collection, collectionGroup, doc, getDoc, getDocs } from 'firebase/firestore'
import { getMetadata, ref } from 'firebase/storage'

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, received ${actual}`)
  }
}

async function count(firestore, path) {
  return (await getDocs(collection(firestore, ...path))).size
}

async function countGroup(firestore, name) {
  return (await getDocs(collectionGroup(firestore, name))).size
}

export async function verifySeed({ firestore, storage, packs, rootSegments = [], userMappings, modules, results }) {
  const organizationId = packs.foundation.organization.organizationId
  const foundation = results.foundation
  assertEqual(userMappings.size, packs.foundation.users.length, 'Auth test accounts')
  if (rootSegments.length > 0) {
    assertEqual((await getDoc(doc(firestore, ...rootSegments))).exists() ? 1 : 0, foundation.rootDocuments, 'Root documents')
  }
  assertEqual((await getDocs(collection(firestore, ...rootSegments, 'organizations'))).size, foundation.organizations, 'Organizations')
  assertEqual(await count(firestore, [...rootSegments, 'organizations', organizationId, 'members']), foundation.organizationMembers, 'Organization members')
  assertEqual(await count(firestore, [...rootSegments, 'organizations', organizationId, 'farms']), foundation.farms, 'Farms')
  assertEqual(await countGroup(firestore, 'members'), foundation.organizationMembers + foundation.farmMembers, 'All memberships')

  if (modules.includes('trees')) {
    assertEqual(await countGroup(firestore, 'treePositions'), results.trees.treePositions, 'Tree positions')
    assertEqual(await countGroup(firestore, 'plantingCycles'), results.trees.plantingCycles, 'Planting cycles')
    assertEqual(await count(firestore, [...rootSegments, 'positionRoutes']), results.trees.positionRoutes, 'Position routes')
  }

  if (modules.includes('work')) {
    assertEqual(await countGroup(firestore, 'workOrders'), results.work.workOrders, 'Work orders')
    assertEqual(await countGroup(firestore, 'careEvents'), results.work.careRecords, 'Care events')
    assertEqual(await countGroup(firestore, 'diseaseIncidents'), results.work.diseaseIncidents, 'Disease incidents')
    assertEqual(await countGroup(firestore, 'photos'), results.work.diseasePhotos, 'Disease photo placeholders')
    for (const work of packs.work.workOrders) {
      for (const photo of [
        ...(work.instructionPhotos ?? []),
        ...(work.report?.photos ?? []),
      ]) {
        const metadata = await getMetadata(ref(storage, photo.storagePath))
        if (metadata.customMetadata?.classification !== 'SIMULATED/TEST ONLY') {
          throw new Error(`Storage object is not classified as mock: ${photo.storagePath}`)
        }
      }
    }
  }

  if (modules.includes('commercial')) {
    assertEqual(await countGroup(firestore, 'cropCycles'), results.commercial.cropCycles, 'Crop cycles')
    assertEqual(await countGroup(firestore, 'fruitObservations'), results.commercial.fruitObservations, 'Fruit observations')
    assertEqual(await countGroup(firestore, 'harvestLots'), results.commercial.harvestLots, 'Harvest lots')
    assertEqual(await countGroup(firestore, 'salesLots'), results.commercial.salesLots, 'Sales lots')
    assertEqual(await countGroup(firestore, 'inventoryItems'), results.commercial.inventoryItems, 'Inventory items')
    assertEqual(await countGroup(firestore, 'inventoryMovements'), results.commercial.inventoryMovements, 'Inventory movements')
    for (const observation of packs.commercial.fruitObservations.filter((item) => item.countingMode === 'AI_ASSISTED')) {
      if (observation.valueQuality !== 'ESTIMATED' || observation.countMethod === 'FULL_COUNT') {
        throw new Error(`Unsafe AIFC fixture: ${observation.observationId}`)
      }
    }
  }

  if (modules.includes('operations')) {
    assertEqual(await countGroup(firestore, 'dashboardViews'), results.operations.dashboardViews, 'Dashboard views')
    assertEqual(await countGroup(firestore, 'offlineOperations'), results.operations.offlineOperations, 'Offline operations')
    assertEqual(await countGroup(firestore, 'masterConflicts'), results.operations.masterConflicts, 'Master conflicts')
    assertEqual(await countGroup(firestore, 'photoRecoveries'), results.operations.photoRecoveries, 'Photo recoveries')
  }

  if (modules.includes('disease-analysis')) {
    assertEqual(
      await countGroup(firestore, 'diseaseAnalysisSessions'),
      results['disease-analysis'].diseaseAnalysisSessions,
      'Disease Analysis sessions',
    )
    for (const session of packs.diseaseAnalysis.analysisSessions) {
      const snapshot = await getDoc(doc(
        firestore,
        ...rootSegments,
        'organizations',
        session.organizationId,
        'farms',
        session.farmId,
        'diseaseAnalysisSessions',
        session.analysisSessionId,
      ))
      if (!snapshot.exists() || snapshot.data().diagnosisWritebackStatus !== 'NOT_WRITTEN') {
        throw new Error(`Disease Analysis diagnosis boundary failed: ${session.analysisSessionId}`)
      }
    }
  }

  return Object.values(results).reduce(
    (sum, result) => sum + Object.values(result).reduce((subtotal, value) => subtotal + value, 0),
    0,
  )
}
