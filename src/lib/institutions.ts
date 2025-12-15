'use client';
import {
  collection,
  addDoc,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';

// A helper function to remove commas from a string
const parseCurrency = (value: string | undefined): number => {
    if (!value) return 0;
    return parseInt(value.replace(/[^0-9]/g, ''), 10) || 0;
};

// This function saves a new institution document to Firestore.
export async function createInstitution(db: Firestore, institutionData: any) {
  try {
    const docRef = await addDoc(collection(db, 'institutions'), {
      ...institutionData,
      fees: {
        minFee: parseCurrency(institutionData.minFee),
        perStudentFee: parseCurrency(institutionData.perStudentFee),
        perStudentFee1: parseCurrency(institutionData.perStudentFee1),
        perStudentFee2: parseCurrency(institutionData.perStudentFee2),
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log('Document written with ID: ', docRef.id);
    return docRef.id;
  } catch (e) {
    console.error('Error adding document: ', e);
    throw new Error('Failed to create institution');
  }
}
