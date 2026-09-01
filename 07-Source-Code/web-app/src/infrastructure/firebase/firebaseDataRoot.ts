import {
  collection,
  doc,
  type CollectionReference,
  type DocumentData,
  type DocumentReference,
  type Firestore,
} from 'firebase/firestore'

export const firebaseDataRoot = Object.freeze({
  collection: 'durian-smartfarm',
  document: 'root',
  schemaVersion: '2.0.0',
})

export const firebaseDataRootSegments = [
  firebaseDataRoot.collection,
  firebaseDataRoot.document,
] as const

export function rootDocument(
  firestore: Firestore,
): DocumentReference<DocumentData> {
  return doc(firestore, ...firebaseDataRootSegments)
}

export function rootDoc(
  firestore: Firestore,
  ...segments: string[]
): DocumentReference<DocumentData> {
  return doc(firestore, ...firebaseDataRootSegments, ...segments)
}

export function rootCollection(
  firestore: Firestore,
  ...segments: string[]
): CollectionReference<DocumentData> {
  return collection(firestore, ...firebaseDataRootSegments, ...segments)
}
