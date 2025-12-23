

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
  DocumentReference,
  Query,
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


// This function returns a query for all institutions.
export function getInstitutionsQuery(db: Firestore): Query {
  const collRef = collection(db, "institutions");
  return query(collRef, orderBy("createdAt", "desc"));
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

export async function seedDiagnosticTests(db: Firestore) {
    const collRef = collection(db, "diagnostic-tests");
    const batch = writeBatch(db);

    for (const test of initialDiagnosticTests) {
        const docRef = doc(collRef, String(test.id));
        batch.set(docRef, { ...test, totalQuestions: 0, createdAt: serverTimestamp() });
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

export function getDiagnosticTestsQuery(db: Firestore): Query {
    const collRef = collection(db, 'diagnostic-tests');
    return query(collRef, orderBy('id', 'asc'));
}

export function getDiagnosticTestDoc(db: Firestore, testId: string): DocumentReference {
  return doc(db, "diagnostic-tests", testId);
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

export function getQuestionsQuery(db: Firestore, testId: string): Query {
  const collRef = collection(db, `diagnostic-tests/${testId}/questions`);
  return query(collRef, orderBy("questionNumber", "asc"));
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
};

export const initialCurriculumUnits: CurriculumUnit[] = [
    // 과학
    { id: '1', semester: '초등 3-1', largeUnit: '1. 물질의 성질', mediumUnit: '물질의 성질', subUnit: '우리 생활 주변의 여러 가지 물질을 알아볼까요' },
    { id: '2', semester: '초등 3-1', largeUnit: '1. 물질의 성질', mediumUnit: '물질의 성질', subUnit: '같은 물질로 만들어진 물체는 어떤 성질이 같을까요' },
    { id: '3', semester: '초등 3-1', largeUnit: '1. 물질의 성질', mediumUnit: '물질의 성질', subUnit: '우리 생활에서는 물질의 어떤 성질을 이용할까요' },
    { id: '4', semester: '초등 3-1', largeUnit: '2. 자석의 이용', mediumUnit: '자석의 이용', subUnit: '자석에 붙는 물체와 붙지 않는 물체를 분류해 볼까요' },
    { id: '5', semester: '초등 3-1', largeUnit: '2. 자석의 이용', mediumUnit: '자석의 이용', subUnit: '자석의 다른 극끼리 또는 같은 극끼리 가까이하면 어떻게 될까요' },
    { id: '6', semester: '초등 3-1', largeUnit: '2. 자석의 이용', mediumUnit: '자석의 이용', subUnit: '우리 생활에서는 자석을 어떻게 이용할까요' },
    { id: '7', semester: '초등 3-1', largeUnit: '3. 동물의 한살이', mediumUnit: '동물의 한살이', subUnit: '알을 낳는 동물의 한살이는 어떠할까요' },
    { id: '8', semester: '초등 3-1', largeUnit: '3. 동물의 한살이', mediumUnit: '동물의 한살이', subUnit: '새끼를 낳는 동물의 한살이는 어떠할까요' },
    { id: '9', semester: '초등 3-1', largeUnit: '3. 동물의 한살이', mediumUnit: '동물의 한살이', subUnit: '배추흰나비의 한살이는 어떠할까요' },
    { id: '10', semester: '초등 3-1', largeUnit: '3. 동물의 한살이', mediumUnit: '동물의 한살이', subUnit: '여러 가지 동물의 한살이를 비교해 볼까요' },
    { id: '11', semester: '초등 3-1', largeUnit: '4. 지표의 변화', mediumUnit: '지표의 변화', subUnit: '흙은 어떻게 만들어질까요' },
    { id: '12', semester: '초등 3-1', largeUnit: '4. 지표의 변화', mediumUnit: '지표의 변화', subUnit: '흐르는 물은 땅의 모습을 어떻게 변화시킬까요' },
    { id: '13', semester: '초등 3-2', largeUnit: '1. 무게와 수평', mediumUnit: '무게와 수평', subUnit: '물체의 무게는 어떻게 비교할까요' },
    { id: '14', semester: '초등 3-2', largeUnit: '1. 무게와 수평', mediumUnit: '무게와 수평', subUnit: '수평 잡기는 무엇일까요' },
    { id: '15', semester: '초등 3-2', largeUnit: '1. 무게와 수평', mediumUnit: '무게와 수평', subUnit: '양팔저울로 물체의 무게를 어떻게 비교할까요' },
    { id: '16', semester: '초등 3-2', largeUnit: '2. 식물의 한살이', mediumUnit: '식물의 한살이', subUnit: '씨가 싹 트는 데 어떤 조건이 필요할까요' },
    { id: '17', semester: '초등 3-2', largeUnit: '2. 식물의 한살이', mediumUnit: '식물의 한살이', subUnit: '식물은 어떻게 자랄까요' },
    { id: '18', semester: '초등 3-2', largeUnit: '2. 식물의 한살이', mediumUnit: '식물의 한살이', subUnit: '여러 가지 식물의 한살이를 비교해 볼까요' },
    { id: '19', semester: '초등 3-2', largeUnit: '3. 액체와 기체', mediumUnit: '액체와 기체', subUnit: '액체의 부피는 어떻게 측정할까요' },
    { id: '20', semester: '초등 3-2', largeUnit: '3. 액체와 기체', mediumUnit: '액체와 기체', subUnit: '기체는 공간을 차지할까요' },
    { id: '21', semester: '초등 3-2', largeUnit: '3. 액체와 기체', mediumUnit: '액체와 기체', subUnit: '기체는 무게가 있을까요' },
    { id: '22', semester: '초등 3-2', largeUnit: '3. 액체와 기체', mediumUnit: '액체와 기체', subUnit: '액체와 기체의 공통점과 차이점은 무엇일까요' },
    { id: '23', semester: '초등 3-2', largeUnit: '4. 화산과 암석', mediumUnit: '화산과 암석', subUnit: '화산 활동으로 나오는 물질에는 무엇이 있을까요' },
    { id: '24', semester: '초등 3-2', largeUnit: '4. 화산과 암석', mediumUnit: '화산과 암석', subUnit: '현무암과 화강암은 어떤 특징이 있을까요' },
    { id: '25', semester: '초등 4-1', largeUnit: '1. 혼합물의 분리', mediumUnit: '혼합물의 분리', subUnit: '혼합물은 무엇일까요' },
    { id: '26', semester: '초등 4-1', largeUnit: '1. 혼합물의 분리', mediumUnit: '혼합물의 분리', subUnit: '콩, 팥, 좁쌀이 섞인 혼합물을 어떻게 분리할까요' },
    { id: '27', semester: '초등 4-1', largeUnit: '1. 혼합물의 분리', mediumUnit: '혼합물의 분리', subUnit: '고체 알갱이와 액체가 섞인 혼합물을 어떻게 분리할까요' },
    { id: '28', semester: '초등 4-1', largeUnit: '1. 혼합물의 분리', mediumUnit: '혼합물의 분리', subUnit: '서로 섞이지 않는 액체 혼합물을 어떻게 분리할까요' },
    { id: '29', semester: '초등 4-1', largeUnit: '2. 용액의 진하기', mediumUnit: '용액의 진하기', subUnit: '용해 전과 용해 후의 무게는 어떻게 될까요' },
    { id: '30', semester: '초등 4-1', largeUnit: '2. 용액의 진하기', mediumUnit: '용액의 진하기', subUnit: '같은 양의 물에 넣는 용질의 양을 다르게 하면 용액의 진하기는 어떻게 될까요' },
    { id: '31', semester: '초등 4-1', largeUnit: '2. 용액의 진하기', mediumUnit: '용액의 진하기', subUnit: '같은 양의 용질을 녹인 물의 양을 다르게 하면 용액의 진하기는 어떻게 될까요' },
    { id: '32', semester: '초등 4-1', largeUnit: '3. 물체의 운동', mediumUnit: '물체의 운동', subUnit: '물체의 운동은 어떻게 나타낼까요' },
    { id: '33', semester: '초등 4-1', largeUnit: '3. 물체의 운동', mediumUnit: '물체의 운동', subUnit: '물체의 빠르기는 어떻게 비교할까요' },
    { id: '34', semester: '초등 4-1', largeUnit: '3. 물체의 운동', mediumUnit: '물체의 운동', subUnit: '속력은 어떻게 나타낼까요' },
    { id: '35', semester: '초등 4-1', largeUnit: '4. 식물의 구조와 기능', mediumUnit: '식물의 구조와 기능', subUnit: '뿌리는 어떤 일을 할까요' },
    { id: '36', semester: '초등 4-1', largeUnit: '4. 식물의 구조와 기능', mediumUnit: '식물의 구조와 기능', subUnit: '줄기는 어떤 일을 할까요' },
    { id: '37', semester: '초등 4-1', largeUnit: '4. 식물의 구조와 기능', mediumUnit: '식물의 구조와 기능', subUnit: '잎은 어떤 일을 할까요' },
    { id: '38', semester: '초등 4-1', largeUnit: '5. 동물의 구조와 기능', mediumUnit: '탐구활동', subUnit: '탐구 문제를 정하고 탐구 계획을 세워 볼까요' },
    { id: '39', semester: '초등 4-1', largeUnit: '5. 동물의 구조와 기능', mediumUnit: '탐구활동', subUnit: '탐구 활동을 하고 탐구 결과를 발표해 볼까요' },
    { id: '40', semester: '초등 4-2', largeUnit: '1. 생물과 환경', mediumUnit: '생물과 환경', subUnit: '생물은 환경과 어떤 관계를 맺으며 살아갈까요' },
    { id: '41', semester: '초등 4-2', largeUnit: '1. 생물과 환경', mediumUnit: '생물과 환경', subUnit: '생태계는 어떤 요소로 이루어져 있을까요' },
    { id: '42', semester: '초등 4-2', largeUnit: '1. 생물과 환경', mediumUnit: '생물과 환경', subUnit: '환경 오염은 생물에 어떤 영향을 미칠까요' },
    { id: '43', semester: '초등 4-2', largeUnit: '2. 렌즈의 이용', mediumUnit: '렌즈의 이용', subUnit: '볼록 렌즈를 통과하는 빛은 어떻게 나아갈까요' },
    { id: '44', semester: '초등 4-2', largeUnit: '2. 렌즈의 이용', mediumUnit: '렌즈의 이용', subUnit: '볼록 렌즈로 물체를 보면 어떻게 보일까요' },
    { id: '45', semester: '초등 4-2', largeUnit: '2. 렌즈의 이용', mediumUnit: '렌즈의 이용', subUnit: '간이 사진기는 어떤 원리로 물체의 모습을 나타낼까요' },
    { id: '46', semester: '초등 4-2', largeUnit: '2. 렌즈의 이용', mediumUnit: '렌즈의 이용', subUnit: '우리 생활에서 렌즈를 어떻게 이용할까요' },
    { id: '47', semester: '초등 4-2', largeUnit: '3. 산과 염기', mediumUnit: '산과 염기', subUnit: '여러 가지 용액을 어떻게 분류할까요' },
    { id: '48', semester: '초등 4-2', largeUnit: '3. 산과 염기', mediumUnit: '산과 염기', subUnit: '산성 용액과 염기성 용액에 지시약을 넣으면 어떻게 될까요' },
    { id: '49', semester: '초등 4-2', largeUnit: '3. 산과 염기', mediumUnit: '산과 염기', subUnit: '산성 용액과 염기성 용액을 섞으면 어떻게 될까요' },
    { id: '50', semester: '초등 4-2', largeUnit: '4. 지구와 달의 운동', mediumUnit: '지구의 자전', subUnit: '하루 동안 태양과 달의 위치는 어떻게 달라질까요' },
    { id: '51', semester: '초등 4-2', largeUnit: '4. 지구와 달의 운동', mediumUnit: '달의 모양 변화', subUnit: '여러 날 동안 달의 모양과 위치는 어떻게 달라질까요' },
    { id: '52', semester: '초등 4-2', largeUnit: '4. 지구와 달의 운동', mediumUnit: '별자리', subUnit: '계절별 대표적인 별자리와 신화' },
    { id: '53', semester: '초등 5-1', largeUnit: '1. 온도와 열', mediumUnit: '온도와 열', subUnit: '따뜻한 물과 차가운 물을 섞으면 온도는 어떻게 될까요?' },
    { id: '54', semester: '초등 5-1', largeUnit: '1. 온도와 열', mediumUnit: '온도와 열', subUnit: '고체에서 열은 어떻게 이동할까요?' },
    { id: '55', semester: '초등 5-1', largeUnit: '1. 온도와 열', mediumUnit: '온도와 열', subUnit: '액체와 기체에서 열은 어떻게 이동할까요?' },
    { id: '56', semester: '초등 5-1', largeUnit: '2. 생물과 환경', mediumUnit: '생물과 환경', subUnit: '생태계는 무엇일까요?' },
    { id: '57', semester: '초등 5-1', largeUnit: '2. 생물과 환경', mediumUnit: '생물과 환경', subUnit: '생태계를 이루는 생물 요소는 어떻게 관계를 맺고 있을까요?' },
    { id: '58', semester: '초등 5-1', largeUnit: '2. 생물과 환경', mediumUnit: '생물과 환경', subUnit: '우리 생활에서 생태계를 보전하고 복원하기 위해 어떤 노력을 할까요?' },
    { id: '59', semester: '초등 5-1', largeUnit: '3. 용해와 용액', mediumUnit: '용해와 용액', subUnit: '용해 전후 무게는 어떻게 될까요?' },
    { id: '60', semester: '초등 5-1', largeUnit: '3. 용해와 용액', mediumUnit: '용해와 용액', subUnit: '용질의 종류나 물의 온도에 따라 용해되는 양은 어떻게 다를까요?' },
    { id: '61', semester: '초등 5-1', largeUnit: '3. 용해와 용액', mediumUnit: '용해와 용액', subUnit: '용액의 진하기는 어떻게 비교할까요?' },
    { id: '62', semester: '초등 5-1', largeUnit: '4. 물체의 운동', mediumUnit: '물체의 운동', subUnit: '물체의 운동은 어떻게 나타낼까요?' },
    { id: '63', semester: '초등 5-1', largeUnit: '4. 물체의 운동', mediumUnit: '물체의 운동', subUnit: '물체의 빠르기는 어떻게 비교할까요?' },
    { id: '64', semester: '초등 5-2', largeUnit: '1. 날씨와 우리 생활', mediumUnit: '날씨와 우리 생활', subUnit: '습도는 우리 생활에 어떤 영향을 줄까요?' },
    { id: '65', semester: '초등 5-2', largeUnit: '1. 날씨와 우리 생활', mediumUnit: '날씨와 우리 생활', subUnit: '바람은 왜 불까요?' },
    { id: '66', semester: '초등 5-2', largeUnit: '1. 날씨와 우리 생활', mediumUnit: '날씨와 우리 생활', subUnit: '계절에 따라 날씨가 변하는 까닭은 무엇일까요?' },
    { id: '67', semester: '초등 5-2', largeUnit: '2. 물질의 상태', mediumUnit: '물질의 상태', subUnit: '물은 상태가 어떻게 변할까요?' },
    { id: '68', semester: '초등 5-2', largeUnit: '2. 물질의 상태', mediumUnit: '물질의 상태', subUnit: '물질의 세 가지 상태의 특징은 무엇일까요?' },
    { id: '69', semester: '초등 5-2', largeUnit: '2. 물질의 상태', mediumUnit: '물질의 상태', subUnit: '우리 주변의 다양한 물질은 어떤 상태로 되어 있을까요?' },
    { id: '70', semester: '초등 5-2', largeUnit: '3. 산과 염기', mediumUnit: '산과 염기', subUnit: '여러 가지 용액을 어떻게 분류할 수 있을까요?' },
    { id: '71', semester: '초등 5-2', largeUnit: '3. 산과 염기', mediumUnit: '산과 염기', subUnit: '산성 용액과 염기성 용액은 어떤 성질이 있을까요?' },
    { id: '72', semester: '초등 5-2', largeUnit: '3. 산과 염기', mediumUnit: '산과 염기', subUnit: '산성 용액과 염기성 용액을 섞으면 어떻게 될까요?' },
    { id: '73', semester: '초등 5-2', largeUnit: '4. 우리 몸의 구조와 기능', mediumUnit: '우리 몸의 구조와 기능', subUnit: '소화 기관은 어떤 일을 할까요?' },
    { id: '74', semester: '초등 5-2', largeUnit: '4. 우리 몸의 구조와 기능', mediumUnit: '우리 몸의 구조와 기능', subUnit: '순환 기관, 호흡 기관, 배설 기관은 어떤 일을 할까요?' },
    { id: '75', semester: '초등 5-2', largeUnit: '4. 우리 몸의 구조와 기능', mediumUnit: '우리 몸의 구조와 기능', subUnit: '우리 몸의 여러 기관은 건강을 유지하기 위해 어떤 관계를 맺고 있을까요?' },
    { id: '76', semester: '초등 6-1', largeUnit: '1. 전기의 이용', mediumUnit: '전기의 이용', subUnit: '전구에 불이 켜지게 하려면 어떻게 해야 할까요?' },
    { id: '77', semester: '초등 6-1', largeUnit: '1. 전기의 이용', mediumUnit: '전기의 이용', subUnit: '전기 회로에서 전구의 연결 방법에 따라 전구의 밝기는 어떻게 달라질까요?' },
    { id: '78', semester: '초등 6-1', largeUnit: '1. 전기의 이용', mediumUnit: '전기의 이용', subUnit: '전기를 안전하게 사용하고 절약하는 방법에는 무엇이 있을까요?' },
    { id: '79', semester: '초등 6-1', largeUnit: '2. 계절의 변화', mediumUnit: '계절의 변화', subUnit: '하루 동안 태양 고도, 그림자 길이, 기온은 어떻게 변할까요?' },
    { id: '80', semester: '초등 6-1', largeUnit: '2. 계절의 변화', mediumUnit: '계절의 변화', subUnit: '계절에 따라 태양의 남중 고도, 낮과 밤의 길이, 기온은 어떻게 변할까요?' },
    { id: '81', semester: '초등 6-1', largeUnit: '2. 계절의 변화', mediumUnit: '계절의 변화', subUnit: '계절이 변하는 까닭은 무엇일까요?' },
    { id: '82', semester: '초등 6-1', largeUnit: '3. 연소와 소화', mediumUnit: '연소와 소화', subUnit: '물질이 탈 때 어떤 현상이 나타날까요?' },
    { id: '83', semester: '초등 6-1', largeUnit: '3. 연소와 소화', mediumUnit: '연소와 소화', subUnit: '불을 끄려면 어떻게 해야 할까요?' },
    { id: '84', semester: '초등 6-1', largeUnit: '4. 식물의 구조와 기능', mediumUnit: '식물의 구조와 기능', subUnit: '식물은 어떻게 양분을 만들고 사용할까요?' },
    { id: '85', semester: '초등 6-1', largeUnit: '4. 식물의 구조와 기능', mediumUnit: '식물의 구조와 기능', subUnit: '식물의 여러 부분은 어떤 일을 할까요?' },
    { id: '86', semester: '초등 6-2', largeUnit: '1. 자기장', mediumUnit: '자기장', subUnit: '자석 주위에 철가루는 어떻게 배열될까요?' },
    { id: '87', semester: '초등 6-2', largeUnit: '1. 자기장', mediumUnit: '자기장', subUnit: '전류가 흐르는 전선 주위에 나침반은 어떻게 움직일까요?' },
    { id: '88', semester: '초등 6-2', largeUnit: '1. 자기장', mediumUnit: '자기장', subUnit: '전자석은 어떤 성질이 있을까요?' },
    { id: '89', semester: '초등 6-2', largeUnit: '2. 식물과 에너지', mediumUnit: '식물과 에너지', subUnit: '식물은 어떻게 양분을 만들까요?' },
    { id: '90', semester: '초등 6-2', largeUnit: '2. 식물과 에너지', mediumUnit: '식물과 에너지', subUnit: '생태계에서 생물은 어떻게 에너지를 얻을까요?' },
    { id: '91', semester: '초등 6-2', largeUnit: '3. 여러 가지 기체', mediumUnit: '여러 가지 기체', subUnit: '산소는 어떤 성질이 있을까요?' },
    { id: '92', semester: '초등 6-2', largeUnit: '3. 여러 가지 기체', mediumUnit: '여러 가지 기체', subUnit: '이산화 탄소는 어떤 성질이 있을까요?' },
    { id: '93', semester: '초등 6-2', largeUnit: '4. 우리 몸의 구조와 기능', mediumUnit: '우리 몸의 구조와 기능', subUnit: '소화 기관은 어떤 일을 할까요?' },
    { id: '94', semester: '초등 6-2', largeUnit: '4. 우리 몸의 구조와 기능', mediumUnit: '우리 몸의 구조와 기능', subUnit: '순환 기관, 호흡 기관, 배설 기관은 어떤 일을 할까요?' },
    { id: '95', semester: '중등 1-1', largeUnit: '1. 지권의 변화', mediumUnit: '지권의 구조', subUnit: '지구계와 지권의 층상 구조' },
    { id: '96', semester: '중등 1-1', largeUnit: '1. 지권의 변화', mediumUnit: '지권의 구조', subUnit: '암석과 광물' },
    { id: '97', semester: '중등 1-1', largeUnit: '1. 지권의 변화', mediumUnit: '지권의 변화', subUnit: '풍화와 토양' },
    { id: '98', semester: '중등 1-1', largeUnit: '1. 지권의 변화', mediumUnit: '지권의 변화', subUnit: '판 구조론과 지각 변동' },
    { id: '99', semester: '중등 1-1', largeUnit: '2. 여러 가지 힘', mediumUnit: '여러 가지 힘', subUnit: '중력과 탄성력' },
    { id: '100', semester: '중등 1-1', largeUnit: '2. 여러 가지 힘', mediumUnit: '여러 가지 힘', subUnit: '마찰력과 부력' },
    { id: '101', semester: '중등 1-1', largeUnit: '3. 생물의 다양성', mediumUnit: '생물의 다양성', subUnit: '생물 다양성과 분류' },
    { id: '102', semester: '중등 1-1', largeUnit: '3. 생물의 다양성', mediumUnit: '생물의 다양성', subUnit: '원생생물계, 균계, 식물계, 동물계' },
    { id: '103', semester: '중등 1-1', largeUnit: '4. 기체의 성질', mediumUnit: '기체의 성질', subUnit: '입자 운동' },
    { id: '104', semester: '중등 1-1', largeUnit: '4. 기체의 성질', mediumUnit: '기체의 성질', subUnit: '기체의 압력과 부피' },
    { id: '105', semester: '중등 1-1', largeUnit: '4. 기체의 성질', mediumUnit: '기체의 성질', subUnit: '기체의 온도와 부피' },
    { id: '106', semester: '중등 1-2', largeUnit: '1. 물질의 구성', mediumUnit: '물질의 구성', subUnit: '원소와 원자' },
    { id: '107', semester: '중등 1-2', largeUnit: '1. 물질의 구성', mediumUnit: '물질의 구성', subUnit: '분자와 이온' },
    { id: '108', semester: '중등 1-2', largeUnit: '2. 빛과 파동', mediumUnit: '빛', subUnit: '빛의 성질' },
    { id: '109', semester: '중등 1-2', largeUnit: '2. 빛과 파동', mediumUnit: '빛', subUnit: '거울과 렌즈' },
    { id: '110', semester: '중등 1-2', largeUnit: '2. 빛과 파동', mediumUnit: '파동', subUnit: '파동의 성질' },
    { id: '111', semester: '중등 1-2', largeUnit: '3. 식물과 에너지', mediumUnit: '식물과 에너지', subUnit: '광합성과 식물의 호흡' },
    { id: '112', semester: '중등 1-2', largeUnit: '3. 식물과 에너지', mediumUnit: '식물과 에너지', subUnit: '식물의 물질 수송' },
    { id: '113', semester: '중등 1-2', largeUnit: '4. 수권과 해수의 순환', mediumUnit: '수권과 해수의 순환', subUnit: '수권의 분포와 활용' },
    { id: '114', semester: '중등 1-2', largeUnit: '4. 수권과 해수의 순환', mediumUnit: '수권과 해수의 순환', subUnit: '해수의 특성과 순환' },
    { id: '115', semester: '중등 2-1', largeUnit: '1. 물질의 특성', mediumUnit: '물질의 특성', subUnit: '순물질과 혼합물' },
    { id: '116', semester: '중등 2-1', largeUnit: '1. 물질의 특성', mediumUnit: '물질의 특성', subUnit: '밀도, 녹는점, 끓는점, 용해도' },
    { id: '117', semester: '중등 2-1', largeUnit: '1. 물질의 특성', mediumUnit: '혼합물의 분리', subUnit: '혼합물의 분리 방법' },
    { id: '118', semester: '중등 2-1', largeUnit: '2. 전기와 자기', mediumUnit: '전기', subUnit: '마찰 전기와 정전기 유도' },
    { id: '119', semester: '중등 2-1', largeUnit: '2. 전기와 자기', mediumUnit: '전기', subUnit: '전류, 전압, 저항' },
    { id: '120', semester: '중등 2-1', largeUnit: '2. 전기와 자기', mediumUnit: '자기', subUnit: '자기장과 자기력선' },
    { id: '121', semester: '중등 2-1', largeUnit: '2. 전기와 자기', mediumUnit: '자기', subUnit: '전류에 의한 자기장' },
    { id: '122', semester: '중등 2-1', largeUnit: '3. 태양계', mediumUnit: '태양계', subUnit: '지구와 달' },
    { id: '123', semester: '중등 2-1', largeUnit: '3. 태양계', mediumUnit: '태양계', subUnit: '태양계의 구성' },
    { id: '124', semester: '중등 2-1', largeUnit: '4. 동물과 에너지', mediumUnit: '동물과 에너지', subUnit: '소화, 순환, 호흡, 배설' },
    { id: '125', semester: '중등 2-2', largeUnit: '1. 화학 반응의 규칙', mediumUnit: '화학 반응의 규칙', subUnit: '물리 변화와 화학 변화' },
    { id: '126', semester: '중등 2-2', largeUnit: '1. 화학 반응의 규칙', mediumUnit: '화학 반응의 규칙', subUnit: '화학 반응식' },
    { id: '127', semester: '중등 2-2', largeUnit: '1. 화학 반응의 규칙', mediumUnit: '화학 반응의 규칙', subUnit: '질량 보존 법칙과 일정 성분비 법칙' },
    { id: '128', semester: '중등 2-2', largeUnit: '2. 여러 가지 운동', mediumUnit: '여러 가지 운동', subUnit: '속력과 등속 운동' },
    { id: '129', semester: '중등 2-2', largeUnit: '2. 여러 가지 운동', mediumUnit: '여러 가지 운동', subUnit: '자유 낙하 운동' },
    { id: '130', semester: '중등 2-2', largeUnit: '3. 자극과 반응', mediumUnit: '자극과 반응', subUnit: '감각 기관' },
    { id: '131', semester: '중등 2-2', largeUnit: '3. 자극과 반응', mediumUnit: '자극과 반응', subUnit: '신경계와 호르몬' },
    { id: '132', semester: '중등 2-2', largeUnit: '4. 기권과 날씨', mediumUnit: '기권과 날씨', subUnit: '기권의 층상 구조와 복사 평형' },
    { id: '133', semester: '중등 2-2', largeUnit: '4. 기권과 날씨', mediumUnit: '기권과 날씨', subUnit: '구름과 강수' },
    { id: '134', semester: '중등 2-2', largeUnit: '4. 기권과 날씨', mediumUnit: '기권과 날씨', subUnit: '기압과 바람' },
    { id: '135', semester: '중등 3-1', largeUnit: '1. 화학 반응과 에너지', mediumUnit: '화학 반응과 에너지', subUnit: '화학 반응에서의 에너지 출입' },
    { id: '136', semester: '중등 3-1', largeUnit: '2. 일과 에너지 전환', mediumUnit: '일과 에너지', subUnit: '일과 일률' },
    { id: '137', semester: '중등 3-1', largeUnit: '2. 일과 에너지 전환', mediumUnit: '일과 에너지', subUnit: '위치 에너지와 운동 에너지' },
    { id: '138', semester: '중등 3-1', largeUnit: '2. 일과 에너지 전환', mediumUnit: '에너지 전환과 보존', subUnit: '역학적 에너지 전환과 보존' },
    { id: '139', semester: '중등 3-1', largeUnit: '3. 생식과 유전', mediumUnit: '생식과 유전', subUnit: '세포 분열과 생식' },
    { id: '140', semester: '중등 3-1', largeUnit: '3. 생식과 유전', mediumUnit: '생식과 유전', subUnit: '사람의 유전' },
    { id: '141', semester: '중등 3-1', largeUnit: '4. 별과 우주', mediumUnit: '별과 우주', subUnit: '별의 특성' },
    { id: '142', semester: '중등 3-1', largeUnit: '4. 별과 우주', mediumUnit: '별과 우주', subUnit: '우리 은하와 외부 은하' },
    { id: '143', semester: '중등 3-1', largeUnit: '4. 별과 우주', mediumUnit: '별과 우주', subUnit: '우주 팽창' },
    { id: '144', semester: '중등 3-2', largeUnit: '1. 과학 기술과 인류 문명', mediumUnit: '과학 기술과 인류 문명', subUnit: '첨단 과학 기술과 신소재' },
    { id: '145', semester: '중등 3-2', largeUnit: '2. 전기 에너지', mediumUnit: '전기 에너지', subUnit: '전기 에너지의 발생' },
    { id: '146', semester: '중등 3-2', largeUnit: '2. 전기 에너지', mediumUnit: '전기 에너지', subUnit: '전기 에너지의 전환과 소비' },
    { id: '147', semester: '중등 3-2', largeUnit: '3. 환경과 에너지', mediumUnit: '생태계와 환경', subUnit: '생태계 평형' },
    { id: '148', semester: '중등 3-2', largeUnit: '3. 환경과 에너지', mediumUnit: '생태계와 환경', subUnit: '환경 보전과 지속 가능한 발전' },
].map((unit, index) => ({ ...unit, id: (index + 1).toString() }));

