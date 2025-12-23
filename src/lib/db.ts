

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

  const unsubscribe = onSnapshot(docSnap => {
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
  const collRef = collection(db, 'diagnostic-tests');
  let unsubscribe: (() => void) | null = null;

  const setupListener = () => {
    const q = query(collRef, orderBy('id', 'asc'));
    return onSnapshot(
      q,
      async (querySnapshot) => {
        const tests: DiagnosticTest[] = [];
        for (const doc of querySnapshot.docs) {
          const testData = doc.data() as DiagnosticTest;
          const questionsCollRef = collection(
            db,
            `diagnostic-tests/${doc.id}/questions`
          );
          const questionsSnapshot = await getDocs(questionsCollRef);
          testData.totalQuestions = questionsSnapshot.size;
          tests.push(testData);
        }
        callback(tests);
      },
      async (serverError) => {
        console.error('Error fetching diagnostic tests:', serverError);
        const permissionError = new FirestorePermissionError({
          path: collRef.path,
          operation: 'list',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        callback([]);
      }
    );
  };

  getDocs(collRef)
    .then(async (snapshot) => {
      if (snapshot.empty) {
        console.log('No diagnostic tests found, seeding initial data...');
        await seedDiagnosticTests(db);
      }
      unsubscribe = setupListener();
    })
    .catch((err) => {
      console.error('Error checking for initial data:', err);
      // Even if checking fails (e.g., permissions), try to set up the listener.
      // The listener's own error handling will catch subsequent permission errors.
      unsubscribe = setupListener();
    });

  return () => {
    unsubscribe?.();
  };
}


export function getDiagnosticTest(db: Firestore, testId: string, callback: (test: DiagnosticTest | null) => void) {
  const docRef = doc(db, "diagnostic-tests", testId);
  const unsubscribe = onSnapshot(docSnap => {
    if (docSnap.exists()) {
      const testData = { id: parseInt(docSnap.id), ...docSnap.data() } as DiagnosticTest;
      const questionsCollRef = collection(db, `diagnostic-tests/${testId}/questions`);
      getDocs(questionsCollRef).then(questionsSnapshot => {
        testData.totalQuestions = questionsSnapshot.size;
        callback(testData);
      });
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

            // This transaction updates the totalQuestions count on the test document.
            // However, the UI currently recalculates this on the client side in getDiagnosticTests.
            // For consistency, we can leave this here for server-side accuracy.
            // transaction.update(testDocRef, { 
            //     totalQuestions: increment(1) 
            // });
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
  const questionsCollRef = collection(db, `diagnostic-tests/${testId}/questions`);

  try {
    const nextQuestionNumber = await getNextQuestionNumber(db, testId);
    
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

    addDoc(questionsCollRef, newQuestionData)
     .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: questionsCollRef.path,
            operation: 'create',
            requestResourceData: newQuestionData,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
    });

  } catch (serverError) {
    console.error("Error creating blank question: ", serverError);
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
    const questionDocRef = doc(db, `diagnostic-tests/${testId}/questions`, questionId);

    await deleteDoc(questionDocRef)
      .catch(async (serverError) => {
        console.error("Error deleting question: ", serverError);
        const permissionError = new FirestorePermissionError({
            path: questionDocRef.path,
            operation: 'delete',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
    });
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
    // 과학
    { semester: '초등 3-1', largeUnit: '1. 물질의 성질', mediumUnit: '물질의 성질', subUnit: '우리 생활 주변의 여러 가지 물질을 알아볼까요' },
    { semester: '초등 3-1', largeUnit: '1. 물질의 성질', mediumUnit: '물질의 성질', subUnit: '같은 물질로 만들어진 물체는 어떤 성질이 같을까요' },
    { semester: '초등 3-1', largeUnit: '1. 물질의 성질', mediumUnit: '물질의 성질', subUnit: '우리 생활에서는 물질의 어떤 성질을 이용할까요' },
    { semester: '초등 3-1', largeUnit: '2. 자석의 이용', mediumUnit: '자석의 이용', subUnit: '자석에 붙는 물체와 붙지 않는 물체를 분류해 볼까요' },
    { semester: '초등 3-1', largeUnit: '2. 자석의 이용', mediumUnit: '자석의 이용', subUnit: '자석의 다른 극끼리 또는 같은 극끼리 가까이하면 어떻게 될까요' },
    { semester: '초등 3-1', largeUnit: '2. 자석의 이용', mediumUnit: '자석의 이용', subUnit: '우리 생활에서는 자석을 어떻게 이용할까요' },
    { semester: '초등 3-1', largeUnit: '3. 동물의 한살이', mediumUnit: '동물의 한살이', subUnit: '알을 낳는 동물의 한살이는 어떠할까요' },
    { semester: '초등 3-1', largeUnit: '3. 동물의 한살이', mediumUnit: '동물의 한살이', subUnit: '새끼를 낳는 동물의 한살이는 어떠할까요' },
    { semester: '초등 3-1', largeUnit: '3. 동물의 한살이', mediumUnit: '동물의 한살이', subUnit: '배추흰나비의 한살이는 어떠할까요' },
    { semester: '초등 3-1', largeUnit: '3. 동물의 한살이', mediumUnit: '동물의 한살이', subUnit: '여러 가지 동물의 한살이를 비교해 볼까요' },
    { semester: '초등 3-1', largeUnit: '4. 지표의 변화', mediumUnit: '지표의 변화', subUnit: '흙은 어떻게 만들어질까요' },
    { semester: '초등 3-1', largeUnit: '4. 지표의 변화', mediumUnit: '지표의 변화', subUnit: '흐르는 물은 땅의 모습을 어떻게 변화시킬까요' },
    { semester: '초등 3-2', largeUnit: '1. 무게와 수평', mediumUnit: '무게와 수평', subUnit: '물체의 무게는 어떻게 비교할까요' },
    { semester: '초등 3-2', largeUnit: '1. 무게와 수평', mediumUnit: '무게와 수평', subUnit: '수평 잡기는 무엇일까요' },
    { semester: '초등 3-2', largeUnit: '1. 무게와 수평', mediumUnit: '무게와 수평', subUnit: '양팔저울로 물체의 무게를 어떻게 비교할까요' },
    { semester: '초등 3-2', largeUnit: '2. 식물의 한살이', mediumUnit: '식물의 한살이', subUnit: '씨가 싹 트는 데 어떤 조건이 필요할까요' },
    { semester: '초등 3-2', largeUnit: '2. 식물의 한살이', mediumUnit: '식물의 한살이', subUnit: '식물은 어떻게 자랄까요' },
    { semester: '초등 3-2', largeUnit: '2. 식물의 한살이', mediumUnit: '식물의 한살이', subUnit: '여러 가지 식물의 한살이를 비교해 볼까요' },
    { semester: '초등 3-2', largeUnit: '3. 액체와 기체', mediumUnit: '액체와 기체', subUnit: '액체의 부피는 어떻게 측정할까요' },
    { semester: '초등 3-2', largeUnit: '3. 액체와 기체', mediumUnit: '액체와 기체', subUnit: '기체는 공간을 차지할까요' },
    { semester: '초등 3-2', largeUnit: '3. 액체와 기체', mediumUnit: '액체와 기체', subUnit: '기체는 무게가 있을까요' },
    { semester: '초등 3-2', largeUnit: '3. 액체와 기체', mediumUnit: '액체와 기체', subUnit: '액체와 기체의 공통점과 차이점은 무엇일까요' },
    { semester: '초등 3-2', largeUnit: '4. 화산과 암석', mediumUnit: '화산과 암석', subUnit: '화산 활동으로 나오는 물질에는 무엇이 있을까요' },
    { semester: '초등 3-2', largeUnit: '4. 화산과 암석', mediumUnit: '화산과 암석', subUnit: '현무암과 화강암은 어떤 특징이 있을까요' },
    { semester: '초등 4-1', largeUnit: '1. 혼합물의 분리', mediumUnit: '혼합물의 분리', subUnit: '혼합물은 무엇일까요' },
    { semester: '초등 4-1', largeUnit: '1. 혼합물의 분리', mediumUnit: '혼합물의 분리', subUnit: '콩, 팥, 좁쌀이 섞인 혼합물을 어떻게 분리할까요' },
    { semester: '초등 4-1', largeUnit: '1. 혼합물의 분리', mediumUnit: '혼합물의 분리', subUnit: '고체 알갱이와 액체가 섞인 혼합물을 어떻게 분리할까요' },
    { semester: '초등 4-1', largeUnit: '1. 혼합물의 분리', mediumUnit: '혼합물의 분리', subUnit: '서로 섞이지 않는 액체 혼합물을 어떻게 분리할까요' },
    { semester: '초등 4-1', largeUnit: '2. 용액의 진하기', mediumUnit: '용액의 진하기', subUnit: '용해 전과 용해 후의 무게는 어떻게 될까요' },
    { semester: '초등 4-1', largeUnit: '2. 용액의 진하기', mediumUnit: '용액의 진하기', subUnit: '같은 양의 물에 넣는 용질의 양을 다르게 하면 용액의 진하기는 어떻게 될까요' },
    { semester: '초등 4-1', largeUnit: '2. 용액의 진하기', mediumUnit: '용액의 진하기', subUnit: '같은 양의 용질을 녹인 물의 양을 다르게 하면 용액의 진하기는 어떻게 될까요' },
    { semester: '초등 4-1', largeUnit: '3. 물체의 운동', mediumUnit: '물체의 운동', subUnit: '물체의 운동은 어떻게 나타낼까요' },
    { semester: '초등 4-1', largeUnit: '3. 물체의 운동', mediumUnit: '물체의 운동', subUnit: '물체의 빠르기는 어떻게 비교할까요' },
    { semester: '초등 4-1', largeUnit: '3. 물체의 운동', mediumUnit: '물체의 운동', subUnit: '속력은 어떻게 나타낼까요' },
    { semester: '초등 4-1', largeUnit: '4. 식물의 구조와 기능', mediumUnit: '식물의 구조와 기능', subUnit: '뿌리는 어떤 일을 할까요' },
    { semester: '초등 4-1', largeUnit: '4. 식물의 구조와 기능', mediumUnit: '식물의 구조와 기능', subUnit: '줄기는 어떤 일을 할까요' },
    { semester: '초등 4-1', largeUnit: '4. 식물의 구조와 기능', mediumUnit: '식물의 구조와 기능', subUnit: '잎은 어떤 일을 할까요' },
    { semester: '초등 4-1', largeUnit: '5. 동물의 구조와 기능', mediumUnit: '탐구활동', subUnit: '탐구 문제를 정하고 탐구 계획을 세워 볼까요' },
    { semester: '초등 4-1', largeUnit: '5. 동물의 구조와 기능', mediumUnit: '탐구활동', subUnit: '탐구 활동을 하고 탐구 결과를 발표해 볼까요' },
    { semester: '초등 4-2', largeUnit: '1. 생물과 환경', mediumUnit: '생물과 환경', subUnit: '생물은 환경과 어떤 관계를 맺으며 살아갈까요' },
    { semester: '초등 4-2', largeUnit: '1. 생물과 환경', mediumUnit: '생물과 환경', subUnit: '생태계는 어떤 요소로 이루어져 있을까요' },
    { semester: '초등 4-2', largeUnit: '1. 생물과 환경', mediumUnit: '생물과 환경', subUnit: '환경 오염은 생물에 어떤 영향을 미칠까요' },
    { semester: '초등 4-2', largeUnit: '2. 렌즈의 이용', mediumUnit: '렌즈의 이용', subUnit: '볼록 렌즈를 통과하는 빛은 어떻게 나아갈까요' },
    { semester: '초등 4-2', largeUnit: '2. 렌즈의 이용', mediumUnit: '렌즈의 이용', subUnit: '볼록 렌즈로 물체를 보면 어떻게 보일까요' },
    { semester: '초등 4-2', largeUnit: '2. 렌즈의 이용', mediumUnit: '렌즈의 이용', subUnit: '간이 사진기는 어떤 원리로 물체의 모습을 나타낼까요' },
    { semester: '초등 4-2', largeUnit: '2. 렌즈의 이용', mediumUnit: '렌즈의 이용', subUnit: '우리 생활에서 렌즈를 어떻게 이용할까요' },
    { semester: '초등 4-2', largeUnit: '3. 산과 염기', mediumUnit: '산과 염기', subUnit: '여러 가지 용액을 어떻게 분류할까요' },
    { semester: '초등 4-2', largeUnit: '3. 산과 염기', mediumUnit: '산과 염기', subUnit: '산성 용액과 염기성 용액에 지시약을 넣으면 어떻게 될까요' },
    { semester: '초등 4-2', largeUnit: '3. 산과 염기', mediumUnit: '산과 염기', subUnit: '산성 용액과 염기성 용액을 섞으면 어떻게 될까요' },
    { semester: '초등 4-2', largeUnit: '4. 지구와 달의 운동', mediumUnit: '지구와 달의 운동', subUnit: '지구의 자전 때문에 어떤 현상이 나타날까요' },
    { semester: '초등 4-2', largeUnit: '4. 지구와 달의 운동', mediumUnit: '지구와 달의 운동', subUnit: '달은 어떤 모양으로 변할까요' },
    { semester: '초등 4-2', largeUnit: '4. 지구와 달의 운동', mediumUnit: '지구와 달의 운동', subUnit: '계절에 따라 보이는 별자리가 달라지는 까닭은 무엇일까요' },
    { semester: '초등 5-1', largeUnit: '1. 여러 가지 기체', mediumUnit: '여러 가지 기체', subUnit: '산소는 어떤 성질이 있을까요' },
    { semester: '초등 5-1', largeUnit: '1. 여러 가지 기체', mediumUnit: '여러 가지 기체', subUnit: '이산화 탄소는 어떤 성질이 있을까요' },
    { semester: '초등 5-1', largeUnit: '1. 여러 가지 기체', mediumUnit: '여러 가지 기체', subUnit: '공기는 여러 가지 기체로 이루어져 있음을 어떻게 설명할까요' },
    { semester: '초등 5-1', largeUnit: '2. 우리 몸의 구조와 기능', mediumUnit: '우리 몸의 구조와 기능', subUnit: '소화 기관은 어떤 일을 할까요' },
    { semester: '초등 5-1', largeUnit: '2. 우리 몸의 구조와 기능', mediumUnit: '우리 몸의 구조와 기능', subUnit: '순환 기관은 어떤 일을 할까요' },
    { semester: '초등 5-1', largeUnit: '2. 우리 몸의 구조와 기능', mediumUnit: '우리 몸의 구조와 기능', subUnit: '호흡 기관과 배설 기관은 어떤 일을 할까요' },
    { semester: '초등 5-1', largeUnit: '2. 우리 몸의 구조와 기능', mediumUnit: '우리 몸의 구조와 기능', subUnit: '우리 몸의 여러 기관은 어떤 관계가 있을까요' },
    { semester: '초등 5-1', largeUnit: '3. 빛과 파동', mediumUnit: '빛과 파동', subUnit: '소리는 어떻게 전달될까요' },
    { semester: '초등 5-1', largeUnit: '3. 빛과 파동', mediumUnit: '빛과 파동', subUnit: '거울에 비친 물체의 모습은 실제 물체와 어떻게 다를까요' },
    { semester: '초등 5-1', largeUnit: '3. 빛과 파동', mediumUnit: '빛과 파동', subUnit: '빛이 다른 물질을 통과할 때 어떻게 나아갈까요' },
    { semester: '초등 5-1', largeUnit: '4. 지권의 변화', mediumUnit: '지권의 변화', subUnit: '지진이 발생하는 원인은 무엇일까요' },
    { semester: '초등 5-1', largeUnit: '4. 지권의 변화', mediumUnit: '지권의 변화', subUnit: '화산 활동은 우리에게 어떤 영향을 줄까요' },
    { semester: '초등 5-1', largeUnit: '4. 지권의 변화', mediumUnit: '지권의 변화', subUnit: '지진과 화산 활동은 서로 어떤 관련이 있을까요' },
    { semester: '초등 5-2', largeUnit: '1. 날씨의 변화', mediumUnit: '날씨의 변화', subUnit: '하루 동안 태양의 고도와 그림자 길이, 기온은 어떻게 변할까요' },
    { semester: '초등 5-2', largeUnit: '1. 날씨의 변화', mediumUnit: '날씨의 변화', subUnit: '계절에 따라 태양의 남중 고도와 낮과 밤의 길이, 기온은 어떻게 달라질까요' },
    { semester: '초등 5-2', largeUnit: '1. 날씨의 변화', mediumUnit: '날씨의 변화', subUnit: '기온과 습도를 측정하고, 이슬, 안개, 구름의 관계를 알아볼까요' },
    { semester: '초등 5-2', largeUnit: '1. 날씨의 변화', mediumUnit: '날씨의 변화', subUnit: '바람이 부는 까닭은 무엇일까요' },
    { semester: '초등 5-2', largeUnit: '2. 식물과 에너지', mediumUnit: '식물과 에너지', subUnit: '식물은 어떻게 양분을 만들까요' },
    { semester: '초등 5-2', largeUnit: '2. 식물과 에너지', mediumUnit: '식물과 에너지', subUnit: '생태계에서 생물은 어떻게 에너지를 얻을까요' },
    { semester: '초등 5-2', largeUnit: '3. 전기와 자기', mediumUnit: '전기 회로', subUnit: '전기 회로를 꾸며 전구에 불을 켜 볼까요' },
    { semester: '초등 5-2', largeUnit: '3. 전기와 자기', mediumUnit: '전기 회로', subUnit: '전류가 흐르는 전선 주위에는 어떤 성질이 생길까요' },
    { semester: '초등 5-2', largeUnit: '3. 전기와 자기', mediumUnit: '전기 회로', subUnit: '전기를 안전하게 사용하고 절약하는 방법은 무엇일까요' },
    { semester: '초등 5-2', largeUnit: '4. 화학 반응의 규칙', mediumUnit: '화학 반응의 규칙', subUnit: '물질이 타면 어떤 물질이 생길까요' },
    { semester: '초등 5-2', largeUnit: '4. 화학 반응의 규칙', mediumUnit: '화학 반응의 규칙', subUnit: '물이 얼거나 물을 끓이면 무게와 부피는 어떻게 될까요' },
    { semester: '초등 5-2', largeUnit: '4. 화학 반응의 규칙', mediumUnit: '화학 반응의 규칙', subUnit: '여러 가지 물질을 섞으면 어떤 변화가 생길까요' },
    { semester: '초등 6-1', largeUnit: '1. 물질의 구성', mediumUnit: '물질의 구성', subUnit: '물질을 이루는 기본 성분은 무엇일까요' },
    { semester: '초등 6-1', largeUnit: '1. 물질의 구성', mediumUnit: '물질의 구성', subUnit: '원소는 무엇일까요' },
    { semester: '초등 6-1', largeUnit: '1. 물질의 구성', mediumUnit: '물질의 구성', subUnit: '원자와 분자는 무엇일까요' },
    { semester: '초등 6-1', largeUnit: '1. 물질의 구성', mediumUnit: '물질의 구성', subUnit: '이온은 무엇일까요' },
    { semester: '초등 6-1', largeUnit: '2. 힘과 운동', mediumUnit: '힘과 운동', subUnit: '여러 가지 힘' },
    { semester: '초등 6-1', largeUnit: '2. 힘과 운동', mediumUnit: '힘과 운동', subUnit: '물체의 운동' },
    { semester: '초등 6-1', largeUnit: '3. 자극과 반응', mediumUnit: '자극과 반응', subUnit: '자극과 반응' },
    { semester: '초등 6-1', largeUnit: '3. 자극과 반응', mediumUnit: '자극과 반응', subUnit: '신경계' },
    { semester: '초등 6-1', largeUnit: '3. 자극과 반응', mediumUnit: '자극과 반응', subUnit: '호르몬' },
    { semester: '초등 6-1', largeUnit: '4. 식물과 에너지', mediumUnit: '식물과 에너지', subUnit: '광합성' },
    { semester: '초등 6-1', largeUnit: '4. 식물과 에너지', mediumUnit: '식물의 호흡', subUnit: '식물의 호흡' },
    { semester: '초등 6-1', largeUnit: '4. 식물과 에너지', mediumUnit: '양분의 저장과 사용', subUnit: '양분의 저장과 사용' },
    { semester: '초등 6-1', largeUnit: '5. 동물과 에너지', mediumUnit: '소화', subUnit: '소화' },
    { semester: '초등 6-1', largeUnit: '5. 동물과 에너지', mediumUnit: '순환', subUnit: '순환' },
    { semester: '초등 6-1', largeUnit: '5. 동물과 에너지', mediumUnit: '호흡', subUnit: '호흡' },
    { semester: '초등 6-1', largeUnit: '5. 동물과 에너지', mediumUnit: '배설', subUnit: '배설' },
    { semester: '초등 6-2', largeUnit: '1. 전기와 자기', mediumUnit: '전기와 자기', subUnit: '전기' },
    { semester: '초등 6-2', largeUnit: '1. 전기와 자기', mediumUnit: '전기와 자기', subUnit: '자기' },
    { semester: '초등 6-2', largeUnit: '2. 화학 반응의 규칙과 에너지 변화', mediumUnit: '화학 반응의 규칙과 에너지 변화', subUnit: '물질 변화와 화학 반응식' },
    { semester: '초등 6-2', largeUnit: '2. 화학 반응의 규칙과 에너지 변화', mediumUnit: '화학 반응의 규칙', subUnit: '화학 반응의 규칙' },
    { semester: '초등 6-2', largeUnit: '2. 화학 반응의 규칙과 에너지 변화', mediumUnit: '화학 반응에서의 에너지 출입', subUnit: '화학 반응에서의 에너지 출입' },
    { semester: '초등 6-2', largeUnit: '3. 생식과 발생', mediumUnit: '생식과 발생', subUnit: '세포 분열' },
    { semester: '초등 6-2', largeUnit: '3. 생식과 발생', mediumUnit: '생식', subUnit: '생식' },
    { semester: '초등 6-2', largeUnit: '3. 생식과 발생', mediumUnit: '사람의 발생', subUnit: '사람의 발생' },
    { semester: '초등 6-2', largeUnit: '4. 별과 우주', mediumUnit: '별과 우주', subUnit: '지구와 달' },
    { semester: '초등 6-2', largeUnit: '4. 별과 우주', mediumUnit: '태양계', subUnit: '태양계' },
    { semester: '초등 6-2', largeUnit: '4. 별과 우주', mediumUnit: '태양계 밖의 우주', subUnit: '태양계 밖의 우주' },
    { semester: '중등 1-1', largeUnit: '1. 화학 반응의 규칙성과 에너지 변화', mediumUnit: '화학 반응의 규칙성과 에너지 변화', subUnit: '화학 반응의 규칙' },
    { semester: '중등 1-1', largeUnit: '1. 화학 반응의 규칙성과 에너지 변화', mediumUnit: '화학 반응의 규칙성과 에너지 변화', subUnit: '화학 반응에서의 에너지' },
    { semester: '중등 1-1', largeUnit: '2. 기권과 날씨', mediumUnit: '기권과 날씨', subUnit: '기권' },
    { semester: '중등 1-1', largeUnit: '2. 기권과 날씨', mediumUnit: '기권과 날씨', subUnit: '날씨' },
    { semester: '중등 1-1', largeUnit: '3. 운동과 에너지', mediumUnit: '운동과 에너지', subUnit: '운동' },
    { semester: '중등 1-1', largeUnit: '3. 운동과 에너지', mediumUnit: '운동과 에너지', subUnit: '에너지' },
    { semester: '중등 1-1', largeUnit: '4. 자극과 반응', mediumUnit: '자극과 반응', subUnit: '감각 기관' },
    { semester: '중등 1-1', largeUnit: '4. 자극과 반응', mediumUnit: '자극과 반응', subUnit: '신경계와 호르몬' },
    { semester: '중등 1-2', largeUnit: '1. 운동과 에너지', mediumUnit: '운동과 에너지', subUnit: '일과 에너지' },
    { semester: '중등 1-2', largeUnit: '2. 화학 변화와 이온', mediumUnit: '화학 변화와 이온', subUnit: '이온' },
    { semester: '중등 1-2', largeUnit: '2. 화학 변화와 이온', mediumUnit: '화학 변화와 이온', subUnit: '앙금 생성 반응' },
    { semester: '중등 1-2', largeUnit: '2. 화학 변화와 이온', mediumUnit: '화학 변화와 이온', subUnit: '산과 염기' },
    { semester: '중등 1-2', largeUnit: '3. 지구와 우주', mediumUnit: '지구와 우주', subUnit: '지구의 운동' },
    { semester: '중등 1-2', largeUnit: '3. 지구와 우주', mediumUnit: '지구와 우주', subUnit: '달의 운동' },
    { semester: '중등 1-2', largeUnit: '3. 지구와 우주', mediumUnit: '태양계', subUnit: '태양계' },
    { semester: '중등 1-2', largeUnit: '4. 과학 기술과 인류 문명', mediumUnit: '통합과학', subUnit: '과학 기술' },
    { semester: '중등 2-1', largeUnit: '1. 물질의 구성', mediumUnit: '물질의 구성', subUnit: '원소' },
    { semester: '중등 2-1', largeUnit: '1. 물질의 구성', mediumUnit: '물질의 구성', subUnit: '원자와 분자' },
    { semester: '중등 2-1', largeUnit: '1. 물질의 구성', mediumUnit: '물질의 구성', subUnit: '이온' },
    { semester: '중등 2-1', largeUnit: '2. 전기와 자기', mediumUnit: '전기와 자기', subUnit: '전기' },
    { semester: '중등 2-1', largeUnit: '2. 전기와 자기', mediumUnit: '전기와 자기', subUnit: '자기' },
    { semester: '중등 2-1', largeUnit: '3. 태양계', mediumUnit: '태양계', subUnit: '지구와 달' },
    { semester: '중등 2-1', largeUnit: '3. 태양계', mediumUnit: '태양계', subUnit: '태양계의 구성' },
    { semester: '중등 2-1', largeUnit: '4. 식물의 구조와 기능', mediumUnit: '식물의 구조와 기능', subUnit: '식물의 구성 단계' },
    { semester: '중등 2-1', largeUnit: '4. 식물의 구조와 기능', mediumUnit: '식물의 구조와 기능', subUnit: '광합성' },
    { semester: '중등 2-1', largeUnit: '4. 식물의 구조와 기능', mediumUnit: '식물의 구조와 기능', subUnit: '식물의 호흡과 양분' },
    { semester: '중등 2-2', largeUnit: '1. 물질의 특성', mediumUnit: '물질의 특성', subUnit: '물질의 특성' },
    { semester: '중등 2-2', largeUnit: '1. 물질의 특성', mediumUnit: '혼합물의 분리', subUnit: '혼합물의 분리' },
    { semester: '중등 2-2', largeUnit: '2. 빛과 파동', mediumUnit: '빛', subUnit: '빛' },
    { semester: '중등 2-2', largeUnit: '2. 빛과 파동', mediumUnit: '파동', subUnit: '파동' },
    { semester: '중등 2-2', largeUnit: '3. 기권과 날씨', mediumUnit: '기권과 지구 기온', subUnit: '기권과 지구 기온' },
    { semester: '중등 2-2', largeUnit: '3. 기권과 날씨', mediumUnit: '구름과 강수', subUnit: '구름과 강수' },
    { semester: '중등 2-2', largeUnit: '3. 기권과 날씨', mediumUnit: '기압과 바람', subUnit: '기압과 바람' },
    { semester: '중등 2-2', largeUnit: '4. 소화, 순환, 호흡, 배설', mediumUnit: '소화', subUnit: '소화' },
    { semester: '중등 2-2', largeUnit: '4. 소화, 순환, 호흡, 배설', mediumUnit: '순환', subUnit: '순환' },
    { semester: '중등 2-2', largeUnit: '4. 소화, 순환, 호흡, 배설', mediumUnit: '호흡', subUnit: '호흡' },
    { semester: '중등 2-2', largeUnit: '4. 소화, 순환, 호흡, 배설', mediumUnit: '배설', subUnit: '배설' },
    { semester: '중등 3-1', largeUnit: '1. 화학 반응의 규칙과 에너지 변화', mediumUnit: '물질 변화와 화학 반응식', subUnit: '물질 변화와 화학 반응식' },
    { semester: '중등 3-1', largeUnit: '1. 화학 반응의 규칙과 에너지 변화', mediumUnit: '화학 반응의 법칙', subUnit: '화학 반응의 법칙' },
    { semester: '중등 3-1', largeUnit: '1. 화학 반응의 규칙과 에너지 변화', mediumUnit: '화학 반응에서의 에너지 출입', subUnit: '화학 반응에서의 에너지 출입' },
    { semester: '중등 3-1', largeUnit: '2. 기권과 날씨', mediumUnit: '기권과 우리 생활', subUnit: '기권과 우리 생활' },
    { semester: '중등 3-1', largeUnit: '2. 기권과 날씨', mediumUnit: '날씨의 변화', subUnit: '날씨의 변화' },
    { semester: '중등 3-1', largeUnit: '3. 운동과 에너지', mediumUnit: '운동', subUnit: '운동' },
    { semester: '중등 3-1', largeUnit: '3. 운동과 에너지', mediumUnit: '일과 에너지', subUnit: '일과 에너지' },
    { semester: '중등 3-1', largeUnit: '4. 자극과 반응', mediumUnit: '감각 기관', subUnit: '감각 기관' },
    { semester: '중등 3-1', largeUnit: '4. 자극과 반응', mediumUnit: '신경계와 호르몬', subUnit: '신경계와 호르몬' },
    { semester: '중등 3-2', largeUnit: '1. 과학 기술과 인류 문명', mediumUnit: '통합과학', subUnit: '과학 기술의 발달과 인류 문명' },
    { semester: '중등 3-2', largeUnit: '2. 생식과 유전', mediumUnit: '생식과 세포 분열', subUnit: '생식과 세포 분열' },
    { semester: '중등 3-2', largeUnit: '2. 생식과 유전', mediumUnit: '유전', subUnit: '유전' },
    { semester: '중등 3-2', largeUnit: '3. 별과 우주', mediumUnit: '별과 우주', subUnit: '별과 우주' },
    { semester: '중등 3-2', largeUnit: '4. 환경과 에너지', mediumUnit: '생태계', subUnit: '생태계' },
    { semester: '중등 3-2', largeUnit: '4. 환경과 에너지', mediumUnit: '환경 보전과 에너지', subUnit: '환경 보전과 에너지' },
];

export async function seedCurriculumUnits(db: Firestore) {
    const collRef = collection(db, "curriculum-units");
    const batch = writeBatch(db);
    let count = 0;

    const existingUnits = new Set<string>();
    const snapshot = await getDocs(collRef).catch(() => ({ docs: [] }));
    snapshot.docs.forEach(doc => {
        const data = doc.data();
        const key = `${data.semester}-${data.largeUnit}-${data.mediumUnit}-${data.subUnit}`;
        existingUnits.add(key);
    });

    for (const unit of initialCurriculumUnits) {
        const key = `${unit.semester}-${unit.largeUnit}-${unit.mediumUnit}-${unit.subUnit}`;
        if (!existingUnits.has(key)) {
            const docRef = doc(collRef);
            batch.set(docRef, { ...unit, createdAt: serverTimestamp() });
            count++;
        }
    }

    if (count > 0) {
        console.log(`Seeding ${count} new curriculum units...`);
        await batch.commit().catch(async (serverError) => {
            console.error("Error seeding curriculum units:", serverError);
            const permissionError = new FirestorePermissionError({
                path: collRef.path,
                operation: 'create',
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
        });
    } else {
        console.log("Curriculum units are already up to date.");
    }
}

export function getCurriculumUnits(db: Firestore, callback: (units: CurriculumUnit[]) => void) {
  const collRef = collection(db, 'curriculum-units');
  
  const unsubscribe = onSnapshot(
    collRef,
    (querySnapshot) => {
      let units: CurriculumUnit[] = [];
      querySnapshot.forEach((doc) => {
        units.push({ id: doc.id, ...doc.data() } as CurriculumUnit);
      });

      // Client-side sorting
      units.sort((a, b) => {
        const semesterOrder = [
          '초등 3-1', '초등 3-2', '초등 4-1', '초등 4-2', '초등 5-1', '초등 5-2',
          '초등 6-1', '초등 6-2', '중등 1-1', '중등 1-2', '중등 2-1', '중등 2-2',
          '중등 3-1', '중등 3-2',
        ];
        const aSemesterIndex = semesterOrder.indexOf(a.semester);
        const bSemesterIndex = semesterOrder.indexOf(b.semester);

        if (aSemesterIndex !== bSemesterIndex)
          return aSemesterIndex - bSemesterIndex;
        if (a.largeUnit < b.largeUnit) return -1;
        if (a.largeUnit > b.largeUnit) return 1;
        if (a.mediumUnit < b.mediumUnit) return -1;
        if (a.mediumUnit > b.mediumUnit) return 1;
        if (a.subUnit < b.subUnit) return -1;
        if (a.subUnit > b.subUnit) return 1;
        return 0;
      });

      callback(units);
    },
    async (serverError) => {
      console.error('Error fetching curriculum units:', serverError);
      const permissionError = new FirestorePermissionError({
        path: collRef.path,
        operation: 'list',
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
      callback([]);
    }
  );
  
  return unsubscribe;
}
