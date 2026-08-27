import { initializeApp } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

export const app = initializeApp()
export const db = getFirestore(app)
export { Timestamp }
