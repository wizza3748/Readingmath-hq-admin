

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
  runTransaction,
  increment,
  setDoc,
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

const initialDiagnosticTests: Omit<DiagnosticTest, 'createdAt' | 'totalQuestions'>[] = [
    { id: 15, semesterName: '초등 3학년 1학기', status: '검수전' },
    { id: 16, semesterName: '초등 3학년 2학기', status: '검수전' },
    { id: 17, semesterName: '초등 4학년 1학기', status: '검수전' },
    { id: 18, semesterName: '초등 4학년 2학기', status: '검수전' },
    { id: 19, semesterName: '초등 5학년 1학기', status: '검수전' },
    { id: 20, semesterName: '초등 5학년 2학기', status: '검수전' },
    { id: 21, semesterName: '초등 6학년 1학기', status: '검수전' },
    { id: 22, semesterName: '초등 6학년 2학기', status: '검수전' },
    { id: 23, semesterName: '중등 1학년 1학기', status: '검수전' },
    { id: 24, semesterName: '중등 1학년 2학기', status: '검수전' },
    { id: 25, semesterName: '중등 2학년 1학기', status: '검수전' },
    { id: 26, semesterName: '중등 2학년 2학기', status: '검수전' },
    { id: 27, semesterName: '중등 3학년 1학기', status: '검수전' },
    { id: 28, semesterName: '중등 3학년 2학기', status: '검수전' },
];

async function seedDiagnosticTests(db: Firestore) {
    const collRef = collection(db, "diagnostic-tests");
    const batch = writeBatch(db);

    for (const test of initialDiagnosticTests) {
        const docRef = doc(collRef, String(test.id));
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
             batch.set(docRef, { ...test, totalQuestions: 0, createdAt: serverTimestamp() });
        }
    }

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
    } else {
        const tests: DiagnosticTest[] = [];
        for (const doc of querySnapshot.docs) {
            const testData = doc.data() as DiagnosticTest;
            const questionsCollRef = collection(db, `diagnostic-tests/${doc.id}/questions`);
            const questionsSnapshot = await getDocs(questionsCollRef);
            testData.totalQuestions = questionsSnapshot.size;
            tests.push(testData);
        }
        callback(tests);
    }
  }, async (serverError) => {
    console.error("Error fetching diagnostic tests:", serverError);
    const permissionError = new FirestorePermissionError({
        path: collRef.path,
        operation: 'list',
    } satisfies SecurityRuleContext);
    errorEmitter.emit('permission-error', permissionError);
    callback([]);
  });

  return unsubscribe;
}

export function getDiagnosticTest(db: Firestore, testId: string, callback: (test: DiagnosticTest | null) => void) {
  const docRef = doc(db, "diagnostic-tests", testId);
  const unsubscribe = onSnapshot(docRef, async (docSnap) => {
    if (docSnap.exists()) {
      const testData = { id: parseInt(docSnap.id), ...docSnap.data() } as DiagnosticTest;
      const questionsCollRef = collection(db, `diagnostic-tests/${testId}/questions`);
      const questionsSnapshot = await getDocs(questionsCollRef);
      testData.totalQuestions = questionsSnapshot.size;
      callback(testData);
    } else {
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

export async function updateDiagnosticTestStatus(db: Firestore, testId: string, status: '검수전' | '검수완료') {
    const docRef = doc(db, 'diagnostic-tests', testId);
    const dataToUpdate = { status, updatedAt: serverTimestamp() };
    await updateDoc(docRef, dataToUpdate)
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: dataToUpdate,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
}

//
// Questions
//

export type Question = {
    id: string;
    questionNumber: number;
    questionType: '유형' | '서술형';
    difficulty: '하' | '중하' | '중' | '중상' | '상';
    subUnitType: string;
    contentArea: '물리' | '생명과학' | '지구과학' | '화학' | '탐구활동' | '통합과학' | string;
    behavioralArea: '개념이해력' | '문제해결력' | '문해력' | '추론력';
    prompt: string;
    viewContent?: string;
    answerType?: '입력형' | '선지형' | '순서맞추기';
    answers?: any[];
    solution?: string;
    videoUrl?: string;
    problemSolving?: string;
    solutionCount?: number;
    isExtended: boolean;
    isReviewed: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export function getQuestions(db: Firestore, testId: string, callback: (questions: Question[]) => void) {
  const collRef = collection(db, `diagnostic-tests/${testId}/questions`);
  const q = query(collRef, orderBy("questionNumber", "asc"));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const questions: Question[] = [];
    querySnapshot.forEach((doc) => {
      questions.push({ id: doc.id, ...doc.data() } as Question);
    });
    callback(questions);
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

export async function getNextQuestionNumber(db: Firestore, testId: string): Promise<number> {
    const collRef = collection(db, `diagnostic-tests/${testId}/questions`);
    const q = query(collRef, orderBy("questionNumber", "desc"));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return 1;
    }
    const lastQuestion = querySnapshot.docs[0].data() as Question;
    return lastQuestion.questionNumber + 1;
}

export async function createQuestion(db: Firestore, testId: string, questionData: Partial<Omit<Question, 'id'>>) {
    const testDocRef = doc(db, 'diagnostic-tests', testId);
    const questionsCollRef = collection(db, `diagnostic-tests/${testId}/questions`);
    
    const data = {
        ...questionData,
        isExtended: false,
        solutionCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    try {
        await runTransaction(db, async (transaction) => {
            const testDoc = await transaction.get(testDocRef);
            if (!testDoc.exists()) {
                throw "Test document does not exist!";
            }

            const newQuestionRef = doc(questionsCollRef);
            transaction.set(newQuestionRef, data);

            transaction.update(testDocRef, { 
                totalQuestions: increment(1) 
            });
        });
    } catch (serverError) {
        console.error("Transaction failed: ", serverError);
        const permissionError = new FirestorePermissionError({
            path: questionsCollRef.path,
            operation: 'create',
            requestResourceData: data,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        throw serverError; // Re-throw the error after logging
    }
}

export async function createBlankQuestion(db: Firestore, testId: string, questionType: '유형' | '서술형') {
  const testDocRef = doc(db, 'diagnostic-tests', testId);
  const questionsCollRef = collection(db, `diagnostic-tests/${testId}/questions`);

  try {
    await runTransaction(db, async (transaction) => {
      const testDoc = await transaction.get(testDocRef);
      if (!testDoc.exists()) {
        throw new Error("Test document does not exist!");
      }

      const questionsQuery = query(questionsCollRef, orderBy("questionNumber", "desc"));
      const questionsSnapshot = await getDocs(questionsQuery);
      const nextQuestionNumber = questionsSnapshot.empty ? 1 : (questionsSnapshot.docs[0].data().questionNumber || 0) + 1;

      const newQuestionRef = doc(questionsCollRef);
      const newQuestionData = {
        questionNumber: nextQuestionNumber,
        questionType: questionType,
        isReviewed: false,
        isExtended: false,
        difficulty: '중',
        behavioralArea: '개념이해력',
        subUnitType: '',
        contentArea: '',
        prompt: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      transaction.set(newQuestionRef, newQuestionData);
    });
  } catch (serverError) {
    console.error("Transaction failed: ", serverError);
    const permissionError = new FirestorePermissionError({
        path: questionsCollRef.path,
        operation: 'create',
        requestResourceData: { questionType },
    } satisfies SecurityRuleContext);
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  }
}


export async function updateQuestion(db: Firestore, testId: string, questionId: string, questionData: Partial<Omit<Question, 'id'>>) {
    const docRef = doc(db, `diagnostic-tests/${testId}/questions`, questionId);
    const data = { 
        ...questionData,
        updatedAt: serverTimestamp() 
    };
    await updateDoc(docRef, data)
     .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: data,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
    });
}

export async function deleteQuestion(db: Firestore, testId: string, questionId: string) {
    const testDocRef = doc(db, 'diagnostic-tests', testId);
    const questionDocRef = doc(db, `diagnostic-tests/${testId}/questions`, questionId);

    try {
        await runTransaction(db, async (transaction) => {
            const testDoc = await transaction.get(testDocRef);
            if (!testDoc.exists()) {
                throw "Test document does not exist!";
            }

            transaction.update(testDocRef, {
                totalQuestions: increment(-1)
            });
            transaction.delete(questionDocRef);
        });
    } catch (serverError) {
        console.error("Transaction failed: ", serverError);
        const permissionError = new FirestorePermissionError({
            path: questionDocRef.path,
            operation: 'delete',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
    }
}

export async function updateQuestionExtended(db: Firestore, testId: string, questionId: string, isExtended: boolean) {
    const docRef = doc(db, `diagnostic-tests/${testId}/questions`, questionId);
    const data = { isExtended, updatedAt: serverTimestamp() };
    await updateDoc(docRef, data)
     .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: data,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
    });
}

//
// Curriculum
//
export type CurriculumUnit = {
    id: string;
    semester: string;
    largeUnit: string;
    mediumUnit: string;
    subUnit: string;
    createdAt: Timestamp;
};

const initialCurriculumUnits: Omit<CurriculumUnit, 'id' | 'createdAt'>[] = [
    { semester: '초등 3-1', largeUnit: '1단원-덧셈과 뺄셈', mediumUnit: '덧셈', subUnit: '(1) 받아올림이 없는 세 자리 수의 덧셈' },
    { semester: '초등 3-1', largeUnit: '1단원-덧셈과 뺄셈', mediumUnit: '덧셈', subUnit: '(2) 받아올림이 있는 세 자리 수의 덧셈' },
    { semester: '초등 3-1', largeUnit: '1단원-덧셈과 뺄셈', mediumUnit: '뺄셈', subUnit: '(3) 받아내림이 없는 세 자리수의 뺄셈' },
    { semester: '초등 3-1', largeUnit: '1단원-덧셈과 뺄셈', mediumUnit: '뺄셈', subUnit: '(4) 받아내림이 있는 세 자리수의 뺄셈' },
    { semester: '초등 3-1', largeUnit: '2단원-평면도형', mediumUnit: '도형', subUnit: '(1) 선분, 반직선, 직선' },
    { semester: '초등 3-1', largeUnit: '2단원-평면도형', mediumUnit: '도형', subUnit: '(2) 각, 직각' },
    { semester: '초등 3-1', largeUnit: '2단원-평면도형', mediumUnit: '도형', subUnit: '(3) 직각삼각형, 직사각형, 정사각형' },
    { semester: '초등 3-1', largeUnit: '3단원-나눗셈', mediumUnit: '나눗셈', subUnit: '(1) 똑같이 나누기' },
];

async function seedCurriculumUnits(db: Firestore) {
    const collRef = collection(db, "curriculum-units");
    const batch = writeBatch(db);

    for (const unit of initialCurriculumUnits) {
        const docRef = doc(collRef);
        batch.set(docRef, { ...unit, createdAt: serverTimestamp() });
    }

    await batch.commit().catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: collRef.path,
            operation: 'create',
            requestResourceData: initialCurriculumUnits,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
    });
}

export function getCurriculumUnits(db: Firestore, callback: (units: CurriculumUnit[]) => void) {
    const collRef = collection(db, "curriculum-units");
    const q = query(collRef, orderBy("semester"), orderBy("largeUnit"), orderBy("mediumUnit"), orderBy("subUnit"));
  
    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      if (querySnapshot.empty) {
          console.log("No curriculum units found, seeding initial data...");
          await seedCurriculumUnits(db);
      } else {
          const units: CurriculumUnit[] = [];
          querySnapshot.forEach((doc) => {
            units.push({ id: doc.id, ...doc.data() } as CurriculumUnit);
          });
          callback(units);
      }
    }, async (serverError) => {
      console.error("Error fetching curriculum units:", serverError);
      const permissionError = new FirestorePermissionError({
          path: collRef.path,
          operation: 'list',
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
      callback([]);
    });
  
    return unsubscribe;
}

    