
'use client';
import {
  collection,
  addDoc,
  serverTimestamp,
  type Firestore,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  FieldValue,
  writeBatch,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

//
// Institutions
//

export type ServiceChangeReservation = {
  effectiveDate: Timestamp;
  serviceStatus: "일시정지" | "정상" | "무료사용" | "미납정지";
  franchiseType: "가맹전" | "스탠다드" | "슬림" | "학교";
  serviceType: "수학+과학" | "수학" | "과학";
};

export type Institution = {
  id: string;
  name: string;
  ownerName: string;
  loginId: string;
  ownerContact: string;
  email?: string;
  branch1: string;
  branch2?: string;
  everydayKoreanName?: string;
  dokdoName?: string;
  address?: {
    zipCode?: string;
    address?: string;
    addressDetail?: string;
  };
  managerName?: string;
  managerContact?: string;
  attachmentUrl?: string;
  lastContractDate?: Timestamp;
  serviceStatus: "일시정지" | "정상" | "무료사용" | "미납정지";
  franchiseType?: "가맹전" | "스탠다드" | "슬림" | "학교";
  serviceType: "수학+과학" | "수학" | "과학";
  fees: {
    minFee: number;
    perStudentFee?: number;
    perStudentFee1?: number;
    perStudentFee2?: number;
  };
  memo?: string;
  franchiseFeeAmount?: number;
  franchiseFeePaidAt?: Timestamp;
  trainingFeeAmount?: number;
  trainingFeePaidAt?: Timestamp;
  serviceChangeReservation?: ServiceChangeReservation | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};


// A helper function to remove commas from a string
const parseCurrency = (value: string | undefined | null): number => {
    if (!value) return 0;
    const parsed = parseInt(String(value).replace(/[^0-9]/g, ''), 10);
    return isNaN(parsed) ? 0 : parsed;
};

// This function saves a new institution document to Firestore.
export async function createInstitution(db: Firestore, institutionData: any) {
  const { password, lastContractDate, ...dataToSave } = institutionData;

  const docData: any = {
    ...dataToSave,
    fees: {
      minFee: parseCurrency(institutionData.minFee),
      perStudentFee: parseCurrency(institutionData.perStudentFee),
      perStudentFee1: parseCurrency(institutionData.perStudentFee1),
      perStudentFee2: parseCurrency(institutionData.perStudentFee2),
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (lastContractDate && lastContractDate instanceof Date) {
    docData.lastContractDate = Timestamp.fromDate(lastContractDate);
  } else {
    delete docData.lastContractDate;
  }
  
  // In Firestore, 'undefined' is not a supported data type. 
  // If the attachment is not provided, it can be undefined, so we remove it from the object before saving.
  if (docData.attachment === undefined) {
    delete docData.attachment;
  }

  const collRef = collection(db, 'institutions');
  addDoc(collRef, docData)
    .then(docRef => {
        console.log('Document written with ID: ', docRef.id);
        return docRef.id;
    })
    .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: collRef.path,
          operation: 'create',
          requestResourceData: docData,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
    });
}

// This function updates an existing institution document in Firestore.
export async function updateInstitution(db: Firestore, id: string, institutionData: any) {
    const docRef = doc(db, "institutions", id);
    const { lastContractDate, ...dataToSave } = institutionData;

    const docData: any = {
        ...dataToSave,
        fees: {
            minFee: parseCurrency(institutionData.minFee),
            perStudentFee: parseCurrency(institutionData.perStudentFee),
            perStudentFee1: parseCurrency(institutionData.perStudentFee1),
            perStudentFee2: parseCurrency(institutionData.perStudentFee2),
        },
        updatedAt: serverTimestamp(),
    };

    if (lastContractDate && lastContractDate instanceof Date) {
        docData.lastContractDate = Timestamp.fromDate(lastContractDate);
    } else if (lastContractDate === null || lastContractDate === undefined) {
        docData.lastContractDate = null;
    }

    if (docData.attachment === undefined) {
        delete docData.attachment;
    }
    
    Object.keys(docData).forEach(key => {
        if (docData[key] === '') {
            delete docData[key];
        }
    });

    updateDoc(docRef, docData)
      .then(() => {
        console.log('Document updated with ID: ', id);
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: docData,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
}

// This function updates a fee payment status for an institution.
export async function updateFeePayment(db: Firestore, id: string, feeType: 'franchiseFee' | 'trainingFee', amount: number) {
  const docRef = doc(db, 'institutions', id);
  const dataToUpdate: { [key: string]: any } = {};
  dataToUpdate[`${feeType}Amount`] = amount;
  dataToUpdate[`${feeType}PaidAt`] = serverTimestamp();
  dataToUpdate.updatedAt = serverTimestamp();

  updateDoc(docRef, dataToUpdate)
    .then(() => {
        console.log(`${feeType} payment updated for document ID: `, id);
    })
    .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: dataToUpdate,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
    });
}

// This function deletes an institution document from Firestore.
export async function deleteInstitution(db: Firestore, id: string) {
    const docRef = doc(db, "institutions", id);
    deleteDoc(docRef)
      .then(() => {
          console.log('Document deleted with ID: ', id);
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
}


// This function fetches all institutions from Firestore in real-time.
export function getInstitutions(db: Firestore, callback: (institutions: Institution[]) => void) {
  const collRef = collection(db, "institutions");
  const q = query(collRef, orderBy("createdAt", "desc"));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const institutions: Institution[] = [];
    querySnapshot.forEach((doc) => {
      institutions.push({ id: doc.id, ...doc.data() } as Institution);
    });
    callback(institutions);
  }, async (serverError) => {
    const permissionError = new FirestorePermissionError({
        path: collRef.path,
        operation: 'list',
    } satisfies SecurityRuleContext);
    errorEmitter.emit('permission-error', permissionError);
    callback([]);
  });

  return unsubscribe; // Return the unsubscribe function to clean up the listener
}

// This function fetches a single institution from Firestore in real-time.
export function getInstitution(db: Firestore, id: string, callback: (institution: Institution | null) => void) {
  if (!id) {
    callback(null);
    return () => {};
  }
  const docRef = doc(db, "institutions", id);

  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() } as Institution);
    } else {
      console.log("No such document!");
      callback(null);
    }
  }, async (serverError) => {
    const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: 'get',
    } satisfies SecurityRuleContext);
    errorEmitter.emit('permission-error', permissionError);
    callback(null);
  });

  return unsubscribe;
}


// This function checks if a loginId already exists in the institutions collection.
export async function checkLoginIdExists(db: Firestore, loginId: string): Promise<boolean> {
  const q = query(collection(db, "institutions"), where("loginId", "==", loginId));
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
}

// This function saves a service change reservation to Firestore.
export async function updateServiceReservation(db: Firestore, id: string, reservation: Omit<ServiceChangeReservation, 'effectiveDate'> & { effectiveDate: Date }) {
    const docRef = doc(db, "institutions", id);
    const reservationData = {
        ...reservation,
        effectiveDate: Timestamp.fromDate(reservation.effectiveDate),
    };
    const dataToUpdate = {
        serviceChangeReservation: reservationData,
        updatedAt: serverTimestamp(),
    };
    updateDoc(docRef, dataToUpdate)
      .then(() => {
        console.log('Service reservation updated for document ID: ', id);
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: dataToUpdate,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
}

// This function cancels a service change reservation.
export async function cancelServiceReservation(db: Firestore, id: string) {
    const docRef = doc(db, "institutions", id);
    const dataToUpdate = {
        serviceChangeReservation: null,
        updatedAt: serverTimestamp(),
    };
    updateDoc(docRef, dataToUpdate)
      .then(() => {
          console.log('Service reservation cancelled for document ID: ', id);
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: dataToUpdate
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
}

//
// Diagnostic Tests
//

export type DiagnosticTest = {
  id: number;
  semesterName: string;
  totalQuestions: number;
  createdAt: Timestamp;
  status: '검수전' | '검수완료';
};

const initialDiagnosticTests: Omit<DiagnosticTest, 'createdAt'>[] = [
    { id: 15, semesterName: '초등 3학년 1학기', totalQuestions: 25, status: '검수전' },
    { id: 16, semesterName: '초등 3학년 2학기', totalQuestions: 25, status: '검수전' },
    { id: 17, semesterName: '초등 4학년 1학기', totalQuestions: 25, status: '검수전' },
    { id: 18, semesterName: '초등 4학년 2학기', totalQuestions: 25, status: '검수전' },
    { id: 19, semesterName: '초등 5학년 1학기', totalQuestions: 25, status: '검수전' },
    { id: 20, semesterName: '초등 5학년 2학기', totalQuestions: 25, status: '검수전' },
    { id: 21, semesterName: '초등 6학년 1학기', totalQuestions: 25, status: '검수전' },
    { id: 22, semesterName: '초등 6학년 2학기', totalQuestions: 25, status: '검수전' },
    { id: 23, semesterName: '중등 1학년 1학기', totalQuestions: 30, status: '검수전' },
    { id: 24, semesterName: '중등 1학년 2학기', totalQuestions: 30, status: '검수전' },
    { id: 25, semesterName: '중등 2학년 1학기', totalQuestions: 30, status: '검수전' },
    { id: 26, semesterName: '중등 2학년 2학기', totalQuestions: 30, status: '검수전' },
    { id: 27, semesterName: '중등 3학년 1학기', totalQuestions: 30, status: '검수전' },
    { id: 28, semesterName: '중등 3학년 2학기', totalQuestions: 30, status: '검수전' },
];

async function seedDiagnosticTests(db: Firestore) {
    const collRef = collection(db, "diagnostic-tests");
    const batch = writeBatch(db);

    initialDiagnosticTests.forEach(test => {
        const docRef = doc(collRef, String(test.id));
        batch.set(docRef, { ...test, createdAt: serverTimestamp() });
    });

    await batch.commit().catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: collRef.path,
            operation: 'create',
            requestResourceData: initialDiagnosticTests,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
    });
}


export function getDiagnosticTests(db: Firestore, callback: (tests: DiagnosticTest[]) => void) {
  const collRef = collection(db, "diagnostic-tests");
  const q = query(collRef, orderBy("id", "asc"));

  const unsubscribe = onSnapshot(q, async (querySnapshot) => {
    if (querySnapshot.empty) {
        console.log("No diagnostic tests found, seeding initial data...");
        await seedDiagnosticTests(db);
        // After seeding, the onSnapshot listener will be triggered again with the new data.
    } else {
        const tests: DiagnosticTest[] = [];
        querySnapshot.forEach((doc) => {
            tests.push({ ...doc.data() } as DiagnosticTest);
        });
        callback(tests);
    }
  }, async (serverError) => {
    const permissionError = new FirestorePermissionError({
        path: collRef.path,
        operation: 'list',
    } satisfies SecurityRuleContext);
    errorEmitter.emit('permission-error', permissionError);
    callback([]);
  });

  return unsubscribe;
}
