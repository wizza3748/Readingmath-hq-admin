
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

export const initialDiagnosticTests: Omit<DiagnosticTest, 'createdAt' | 'totalQuestions'>[] = [
    { id: 15, semesterName: '초등 3학년 1학기', status: '검수전' },
    { id: 16, semesterName: '초등 3학년 1학기(쌍둥이)', status: '검수전' },
    { id: 17, semesterName: '초등 3학년 2학기', status: '검수전' },
    { id: 18, semesterName: '초등 3학년 2학기(쌍둥이)', status: '검수전' },
    { id: 19, semesterName: '초등 4학년 1학기', status: '검수전' },
    { id: 20, semesterName: '초등 4학년 1학기(쌍둥이)', status: '검수전' },
    { id: 21, semesterName: '초등 4학년 2학기', status: '검수전' },
    { id: 22, semesterName: '초등 4학년 2학기(쌍둥이)', status: '검수전' },
    { id: 23, semesterName: '초등 5학년 1학기', status: '검수전' },
    { id: 24, semesterName: '초등 5학년 1학기(쌍둥이)', status: '검수전' },
    { id: 25, semesterName: '초등 5학년 2학기', status: '검수전' },
    { id: 26, semesterName: '초등 5학년 2학기(쌍둥이)', status: '검수전' },
    { id: 27, semesterName: '초등 6학년 1학기', status: '검수전' },
    { id: 28, semesterName: '초등 6학년 1학기(쌍둥이)', status: '검수전' },
    { id: 29, semesterName: '초등 6학년 2학기', status: '검수전' },
    { id: 30, semesterName: '초등 6학년 2학기(쌍둥이)', status: '검수전' },
    { id: 31, semesterName: '중등 1학년 1학기', status: '검수전' },
    { id: 32, semesterName: '중등 1학년 1학기(쌍둥이)', status: '검수전' },
    { id: 33, semesterName: '중등 1학년 2학기', status: '검수전' },
    { id: 34, semesterName: '중등 1학년 2학기(쌍둥이)', status: '검수전' },
    { id: 35, semesterName: '중등 2학년 1학기', status: '검수전' },
    { id: 36, semesterName: '중등 2학년 1학기(쌍둥이)', status: '검수전' },
    { id: 37, semesterName: '중등 2학년 2학기', status: '검수전' },
    { id: 38, semesterName: '중등 2학년 2학기(쌍둥이)', status: '검수전' },
    { id: 39, semesterName: '중등 3학년 1학기', status: '검수전' },
    { id: 40, semesterName: '중등 3학년 1학기(쌍둥이)', status: '검수전' },
    { id: 41, semesterName: '중등 3학년 2학기', status: '검수전' },
    { id: 42, semesterName: '중등 3학년 2학기(쌍둥이)', status: '검수전' },
];

export async function seedDiagnosticTests(db: Firestore) {
    const collRef = collection(db, "diagnostic-tests");
    const snapshot = await getDocs(collRef);
    const existingIds = new Set(snapshot.docs.map(doc => parseInt(doc.id)));

    const batch = writeBatch(db);
    let itemsAdded = 0;

    for (const test of initialDiagnosticTests) {
        if (!existingIds.has(test.id)) {
            const docRef = doc(collRef, String(test.id));
            batch.set(docRef, { ...test, totalQuestions: 0, createdAt: serverTimestamp() });
            itemsAdded++;
        }
    }

    if (itemsAdded > 0) {
        await batch.commit().catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: collRef.path,
                operation: 'create',
                requestResourceData: initialDiagnosticTests.filter(test => !existingIds.has(test.id)),
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
        });
        console.log(`${itemsAdded} missing diagnostic tests have been seeded.`);
    } else {
        console.log("All diagnostic tests already exist in the database.");
    }
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
    questionType: '객관식' | '서술형' | '유형';
    difficulty: '하' | '중하' | '중' | '중상' | '상';
    subUnitType: string;
    contentArea: '물리' | '생명과학' | '지구과학' | '화학' | '탐구활동' | '통합과학' | string;
    behavioralArea: '개념이해력' | '문제해결력' | '문해력' | '추론력';
    prompt: string;
    viewContent?: string;
    answerType?: '입력형' | '선지형' | '순서맞추기';
    answers?: any[];
    solution?: string;
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
        questionType: questionData.questionType === '유형' ? '객관식' : questionData.questionType,
        isExtended: false,
        isReviewed: false,
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

export async function createBlankQuestion(db: Firestore, testId: string, questionType: '객관식' | '서술형') {
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

const cleanupObject = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(cleanupObject);
    }

    const newObj: { [key: string]: any } = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            if (value !== undefined) {
                newObj[key] = cleanupObject(value);
            }
        }
    }
    return newObj;
};

export async function updateQuestion(db: Firestore, testId: string, questionId: string, questionData: Partial<Omit<Question, 'id'>>) {
    const docRef = doc(db, `diagnostic-tests/${testId}/questions`, questionId);
    
    const cleanedData = cleanupObject(questionData);

    const data = { 
        ...cleanedData,
        questionType: questionData.questionType === '유형' ? '객관식' : questionData.questionType,
        updatedAt: serverTimestamp() 
    };

    await updateDoc(docRef, data)
     .catch(async (serverError) => {
        console.error("Error updating document:", serverError);
        console.error("Data sent:", data);
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
    const questionsCollRef = collection(db, `diagnostic-tests/${testId}/questions`);

    try {
        await runTransaction(db, async (transaction) => {
            // 1. Delete the specified question
            transaction.delete(questionDocRef);

            // 2. Get all remaining questions, ordered by their current questionNumber
            const allQuestionsQuery = query(questionsCollRef, orderBy("questionNumber", "asc"));
            const allQuestionsSnap = await getDocs(allQuestionsQuery);
            
            const batch = writeBatch(db);
            let currentNumber = 1;

            // 3. Iterate and re-number remaining questions
            allQuestionsSnap.forEach((docSnap) => {
                // Don't re-number the one we are deleting in this transaction
                if (docSnap.id !== questionId) {
                    const docRef = doc(db, `diagnostic-tests/${testId}/questions`, docSnap.id);
                    batch.update(docRef, { questionNumber: currentNumber });
                    currentNumber++;
                }
            });
            
            await batch.commit();
        });
    } catch (serverError: any) {
        console.error("Error deleting or re-numbering questions:", serverError);
        const permissionError = new FirestorePermissionError({
            path: questionDocRef.path,
            operation: 'delete',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        throw serverError; // Re-throw the error
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
    contentArea: string;
};

export const initialCurriculumUnits: CurriculumUnit[] = [
    { id: '1', semester: '초등 3학년 1학기', largeUnit: '1단원-힘과 우리 생활', mediumUnit: '(1) 물체를 밀거나 당기기, 수평잡기(힘과 관련된 현상)', subUnit: '', contentArea: '물리' },
    { id: '2', semester: '초등 3학년 1학기', largeUnit: '1단원-힘과 우리 생활', mediumUnit: '(2) 물체의 무게 측정과 도구의 이용(저울로 물체의 무게를 재는 방법)', subUnit: '', contentArea: '물리' },
    { id: '3', semester: '초등 3학년 1학기', largeUnit: '1단원-힘과 우리 생활', mediumUnit: '(2) 물체의 무게 측정과 도구의 이용(수평 잡기로 무게 비교하기)', subUnit: '', contentArea: '물리' },
    { id: '4', semester: '초등 3학년 1학기', largeUnit: '1단원-힘과 우리 생활', mediumUnit: '(2) 물체의 무게 측정과 도구의 이용(용수철 저울로 물체의 무게 비교하기)', subUnit: '', contentArea: '물리' },
    { id: '5', semester: '초등 3학년 1학기', largeUnit: '1단원-힘과 우리 생활', mediumUnit: '(2) 물체의 무게 측정과 도구의 이용(힘을 줄여주는 지레와 빗면)', subUnit: '', contentArea: '물리' },
    { id: '6', semester: '초등 3학년 1학기', largeUnit: '1단원-힘과 우리 생활', mediumUnit: '(2) 물체의 무게 측정과 도구의 이용(수평 잡기로 무게 비교하기)', subUnit: '', contentArea: '물리' },
    { id: '7', semester: '초등 3학년 1학기', largeUnit: '1단원-힘과 우리 생활', mediumUnit: '(2) 물체의 무게 측정과 도구의 이용(힘을 줄여주는 지레와 빗면)', subUnit: '', contentArea: '물리' },
    { id: '8', semester: '초등 3학년 1학기', largeUnit: '2단원-동물의 생활', mediumUnit: '(1) 우리 주변의 동물(특징에 따른 동물의 분류)', subUnit: '', contentArea: '생명과학' },
    { id: '9', semester: '초등 3학년 1학기', largeUnit: '2단원-동물의 생활', mediumUnit: '(2) 동물의 사는 곳에 따른 특징(동물의 특징을 이용한 생활용품)', subUnit: '', contentArea: '생명과학' },
    { id: '10', semester: '초등 3학년 1학기', largeUnit: '2단원-동물의 생활', mediumUnit: '(2) 동물의 사는 곳에 따른 특징(땅에 사는 동물)', subUnit: '', contentArea: '생명과학' },
    { id: '11', semester: '초등 3학년 1학기', largeUnit: '2단원-동물의 생활', mediumUnit: '(2) 동물의 사는 곳에 따른 특징(사막, 극지방, 높은 산에 사는 동물)', subUnit: '', contentArea: '생명과학' },
    { id: '12', semester: '초등 3학년 1학기', largeUnit: '2단원-동물의 생활', mediumUnit: '(1) 우리 주변의 동물(특징에 따른 동물의 분류)', subUnit: '', contentArea: '생명과학' },
    { id: '13', semester: '초등 3학년 1학기', largeUnit: '2단원-동물의 생활', mediumUnit: '(1) 우리 주변에 사는 동물(우리 주변에 사는 동물)', subUnit: '', contentArea: '생명과학' },
    { id: '14', semester: '초등 3학년 1학기', largeUnit: '2단원-동물의 생활', mediumUnit: '(2) 동물의 사는 곳에 따른 특징(동물의 특징을 이용한 생활용품)', subUnit: '', contentArea: '생명과학' },
    { id: '15', semester: '초등 3학년 1학기', largeUnit: '3단원-식물의 생활', mediumUnit: '(1) 우리 주변의 식물(잎의 특징에 따른 식물 분류)', subUnit: '', contentArea: '생명과학' },
    { id: '16', semester: '초등 3학년 1학기', largeUnit: '3단원-식물의 생활', mediumUnit: '(2) 식물의 사는 곳에 따른 특징(식물의 특징을 이용한 생활용품)', subUnit: '', contentArea: '생명과학' },
    { id: '17', semester: '초등 3학년 1학기', largeUnit: '3단원-식물의 생활', mediumUnit: '(2) 식물의 사는 곳에 따른 특징(들이나 산에 사는 식물)', subUnit: '', contentArea: '생명과학' },
    { id: '18', semester: '초등 3학년 1학기', largeUnit: '3단원-식물의 생활', mediumUnit: '(2) 식물의 사는 곳에 따른 특징(강이나 연못에 사는 식물)', subUnit: '', contentArea: '생명과학' },
    { id: '19', semester: '초등 3학년 1학기', largeUnit: '3단원-식물의 생활', mediumUnit: '(2) 식물의 사는 곳에 따른 특징(사막이나 갯벌, 높은 산에 사는 식물)', subUnit: '', contentArea: '생명과학' },
    { id: '20', semester: '초등 3학년 1학기', largeUnit: '3단원-식물의 생활', mediumUnit: '(1) 우리 주변의 식물(잎의 특징에 따른 식물 분류)', subUnit: '', contentArea: '생명과학' },
    { id: '21', semester: '초등 3학년 1학기', largeUnit: '3단원-식물의 생활', mediumUnit: '(2) 식물의 사는 곳에 따른 특징(식물의 특징을 이용한 생활용품)', subUnit: '', contentArea: '생명과학' },
    { id: '22', semester: '초등 3학년 1학기', largeUnit: '4단원-생물의 한살이', mediumUnit: '(1) 여러 가지 생물의 한살이(1)(배추흰나비의 한살이)', subUnit: '', contentArea: '생명과학' },
    { id: '23', semester: '초등 3학년 1학기', largeUnit: '4단원-생물의 한살이', mediumUnit: '(2) 여러 가지 생물의 한살이(2)(식물이 자라는데 필요한 조건)', subUnit: '', contentArea: '생명과학' },
    { id: '24', semester: '초등 3학년 1학기', largeUnit: '4단원-생물의 한살이', mediumUnit: '(2) 여러 가지 생물의 한살이(2)(여러 가지 동물의 한살이)', subUnit: '', contentArea: '생명과학' },
    { id: '25', semester: '초등 3학년 1학기', largeUnit: '4단원-생물의 한살이', mediumUnit: '(2) 여러 가지 생물의 한살이(2)(여러 가지 식물의 한살이)', subUnit: '', contentArea: '생명과학' },
    { id: '26', semester: '초등 3학년 1학기', largeUnit: '4단원-생물의 한살이', mediumUnit: '(2) 여러 가지 생물의 한살이(2)(씨가 싹 트는데 필요한 조건)', subUnit: '', contentArea: '생명과학' },
    { id: '27', semester: '초등 3학년 1학기', largeUnit: '4단원-생물의 한살이', mediumUnit: '(2) 여러 가지 생물의 한살이(2)(씨가 싹 트는데 필요한 조건)', subUnit: '', contentArea: '생명과학' },
    { id: '28', semester: '초등 3학년 1학기', largeUnit: '4단원-생물의 한살이', mediumUnit: '(2) 여러 가지 생물의 한살이(2)(식물이 자라는데 필요한 조건)', subUnit: '', contentArea: '생명과학' },
    { id: '29', semester: '초등 4학년 1학기', largeUnit: '1단원-자석의 이용', mediumUnit: '(1) 자석과 힘과 자석의 극, 자석의 작용(자석과 물체 사이에 작용하는 힘)', subUnit: '', contentArea: '물리' },
    { id: '30', semester: '초등 4학년 1학기', largeUnit: '1단원-자석의 이용', mediumUnit: '(2) 나침반과 자석, 자석의 활용(나침반과 자석 사이에 작용하는 힘)', subUnit: '', contentArea: '물리' },
    { id: '31', semester: '초등 4학년 1학기', largeUnit: '1단원-자석의 이용', mediumUnit: '(1) 자석과 힘과 자석의 극, 자석의 작용(자석의 극)', subUnit: '', contentArea: '물리' },
    { id: '32', semester: '초등 4학년 1학기', largeUnit: '1단원-자석의 이용', mediumUnit: '(1) 자석과 힘과 자석의 극, 자석의 작용(자석과 자석 사이에 작용하는 힘)', subUnit: '', contentArea: '물리' },
    { id: '33', semester: '초등 4학년 1학기', largeUnit: '1단원-자석의 이용', mediumUnit: '(2) 나침반과 자석, 자석의 활용(자석을 이용한 장치)', subUnit: '', contentArea: '물리' },
    { id: '34', semester: '초등 4학년 1학기', largeUnit: '1단원-자석의 이용', mediumUnit: '(1) 자석과 힘과 자석의 극, 자석의 작용(자석과 자석 사이에 작용하는 힘)', subUnit: '', contentArea: '물리' },
    { id: '35', semester: '초등 4학년 1학기', largeUnit: '1단원-자석의 이용', mediumUnit: '(2) 나침반과 자석, 자석의 활용(나침반과 자석 사이에 작용하는 힘)', subUnit: '', contentArea: '물리' },
    { id: '36', semester: '초등 4학년 1학기', largeUnit: '2단원-물의 상태 변화', mediumUnit: '(1) 물의 상태 변화, 얼음의 변화(물의 상태 변화)', subUnit: '', contentArea: '화학' },
    { id: '37', semester: '초등 4학년 1학기', largeUnit: '2단원-물의 상태 변화', mediumUnit: '(1) 물의 상태 변화, 얼음의 변화(물이 얼 때와 녹을 때의 변화)', subUnit: '', contentArea: '화학' },
    { id: '38', semester: '초등 4학년 1학기', largeUnit: '2단원-물의 상태 변화', mediumUnit: '(2) 물과 기체의 변화, 물 부족(물이 증발할 때의 변화)', subUnit: '', contentArea: '화학' },
    { id: '39', semester: '초등 4학년 1학기', largeUnit: '2단원-물의 상태 변화', mediumUnit: '(2) 물과 기체의 변화, 물 부족(물이 끓을 때의 변화)', subUnit: '', contentArea: '화학' },
    { id: '40', semester: '초등 4학년 1학기', largeUnit: '2단원-물의 상태 변화', mediumUnit: '(2) 물과 기체의 변화, 물 부족(수증기가 응결할 때의 변화)', subUnit: '', contentArea: '화학' },
    { id: '41', semester: '초등 4학년 1학기', largeUnit: '2단원-물의 상태 변화', mediumUnit: '(1) 물의 상태 변화, 얼음의 변화(물의 상태 변화)', subUnit: '', contentArea: '화학' },
    { id: '42', semester: '초등 4학년 1학기', largeUnit: '2단원-물의 상태 변화', mediumUnit: '(1) 물의 상태 변화, 얼음의 변화(물이 얼 때와 녹을 때의 변화)', subUnit: '', contentArea: '화학' },
    { id: '43', semester: '초등 4학년 1학기', largeUnit: '3단원-땅의 변화', mediumUnit: '(1) 흐르는 물과 땅의 변화(강 주변 지형의 특징)', subUnit: '', contentArea: '지구과학' },
    { id: '44', semester: '초등 4학년 1학기', largeUnit: '3단원-땅의 변화', mediumUnit: '(2) 화산과 지진(화성암이 만들어지는 장소)', subUnit: '', contentArea: '지구과학' },
    { id: '45', semester: '초등 4학년 1학기', largeUnit: '3단원-땅의 변화', mediumUnit: '(1) 흐르는 물과 땅의 변화(흐르는 물에 의한 흙 언덕의 변화)', subUnit: '', contentArea: '지구과학' },
    { id: '46', semester: '초등 4학년 1학기', largeUnit: '3단원-땅의 변화', mediumUnit: '(2) 화산과 지진(화성암이 만들어지는 장소)', subUnit: '', contentArea: '지구과학' },
    { id: '47', semester: '초등 4학년 1학기', largeUnit: '3단원-땅의 변화', mediumUnit: '(2) 화산과 지진(화산 활동이 우리 생활에 미치는 영향)', subUnit: '', contentArea: '지구과학' },
    { id: '48', semester: '초등 4학년 1학기', largeUnit: '3단원-땅의 변화', mediumUnit: '(1) 흐르는 물과 땅의 변화(강 주변 지형의 특징)', subUnit: '', contentArea: '지구과학' },
    { id: '49', semester: '초등 4학년 1학기', largeUnit: '3단원-땅의 변화', mediumUnit: '(2) 화산과 지진(화성암이 만들어지는 장소)', subUnit: '', contentArea: '지구과학' },
    { id: '50', semester: '초등 4학년 1학기', largeUnit: '4단원-다양한 생물과 우리 생활', mediumUnit: '(1) 균류와 원생생물, 세균(버섯과 곰팡이의 특징과 사는 곳)', subUnit: '', contentArea: '생명과학' },
    { id: '51', semester: '초등 4학년 1학기', largeUnit: '4단원-다양한 생물과 우리 생활', mediumUnit: '(1) 균류와 원생생물, 세균(세균의 특징과 사는 곳)', subUnit: '', contentArea: '생명과학' },
    { id: '52', semester: '초등 4학년 1학기', largeUnit: '4단원-다양한 생물과 우리 생활', mediumUnit: '(1) 균류와 원생생물, 세균(해캄과 짚신벌레의 특징과 사는 곳)', subUnit: '', contentArea: '생명과학' },
    { id: '53', semester: '초등 4학년 1학기', largeUnit: '4단원-다양한 생물과 우리 생활', mediumUnit: '(2) 다양한 생물의 활용. 생명과학(다양한 생물이 우리 생활에 미치는 영향)', subUnit: '', contentArea: '생명과학' },
    { id: '54', semester: '초등 4학년 1학기', largeUnit: '4단원-다양한 생물과 우리 생활', mediumUnit: '(2) 다양한 생물의 활용. 생명과학(생명과학이 우리 생활에 이용되는 예)', subUnit: '', contentArea: '생명과학' },
    { id: '55', semester: '초등 4학년 1학기', largeUnit: '4단원-다양한 생물과 우리 생활', mediumUnit: '(1) 균류와 원생생물, 세균(해캄과 짚신벌레의 특징과 사는 곳)', subUnit: '', contentArea: '생명과학' },
    { id: '56', semester: '초등 4학년 1학기', largeUnit: '4단원-다양한 생물과 우리 생활', mediumUnit: '(1) 균류와 원생생물, 세균(세균의 특징과 사는 곳)', subUnit: '', contentArea: '생명과학' },
    { id: '57', semester: '초등 5학년 1학기', largeUnit: '1단원-지층과 화석', mediumUnit: '(1) 지층의 특징과 생성 과정(지층의 특징과 생성)', subUnit: '', contentArea: '지구과학' },
    { id: '58', semester: '초등 5학년 1학기', largeUnit: '1단원-지층과 화석', mediumUnit: '(2) 화석의 생성과 화석으로 알 수 있는 사실(화석으로 알 수 있는 사실)', subUnit: '', contentArea: '지구과학' },
    { id: '59', semester: '초등 5학년 1학기', largeUnit: '1단원-지층과 화석', mediumUnit: '(1) 지층의 특징과 생성 과정(퇴적암의 분류)', subUnit: '', contentArea: '지구과학' },
    { id: '60', semester: '초등 5학년 1학기', largeUnit: '1단원-지층과 화석', mediumUnit: '(2) 화석의 생성과 화석으로 알 수 있는 사실(화석의 생성)', subUnit: '', contentArea: '지구과학' },
    { id: '61', semester: '초등 5학년 1학기', largeUnit: '1단원-지층과 화석', mediumUnit: '(2) 화석의 생성과 화석으로 알 수 있는 사실(화석으로 알 수 있는 사실)', subUnit: '', contentArea: '지구과학' },
    { id: '62', semester: '초등 5학년 1학기', largeUnit: '1단원-지층과 화석', mediumUnit: '(1) 지층의 특징과 생성 과정(지층의 특징과 생성)', subUnit: '', contentArea: '지구과학' },
    { id: '63', semester: '초등 5학년 1학기', largeUnit: '1단원-지층과 화석', mediumUnit: '(2) 화석의 생성과 화석으로 알 수 있는 사실(화석으로 알 수 있는 사실)', subUnit: '', contentArea: '지구과학' },
    { id: '64', semester: '초등 5학년 1학기', largeUnit: '2단원-빛의 성질', mediumUnit: '(1) 빛의 직진과 반사(빛의 반사)', subUnit: '', contentArea: '물리' },
    { id: '65', semester: '초등 5학년 1학기', largeUnit: '2단원-빛의 성질', mediumUnit: '(2) 빛의 굴절(빛의 굴절)', subUnit: '', contentArea: '물리' },
    { id: '66', semester: '초등 5학년 1학기', largeUnit: '2단원-빛의 성질', mediumUnit: '(1) 빛의 직진과 반사(빛의 반사)', subUnit: '', contentArea: '물리' },
    { id: '67', semester: '초등 5학년 1학기', largeUnit: '2단원-빛의 성질', mediumUnit: '(2) 빛의 굴절(빛의 굴절)', subUnit: '', contentArea: '물리' },
    { id: '68', semester: '초등 5학년 1학기', largeUnit: '2단원-빛의 성질', mediumUnit: '(2) 빛의 굴절(거울과 렌즈의 쓰임새)', subUnit: '', contentArea: '물리' },
    { id: '69', semester: '초등 5학년 1학기', largeUnit: '2단원-빛의 성질', mediumUnit: '(1) 빛의 직진과 반사(빛의 반사)', subUnit: '', contentArea: '물리' },
    { id: '70', semester: '초등 5학년 1학기', largeUnit: '2단원-빛의 성질', mediumUnit: '(2) 빛의 굴절(거울과 렌즈의 쓰임새)', subUnit: '', contentArea: '물리' },
    { id: '71', semester: '초등 5학년 1학기', largeUnit: '3단원-용해와 용액', mediumUnit: '(1) 용해, 용질의 무게 비교, 용질의 종류와 용해되는 양(용해되기 전과 후의 무게 비교)', subUnit: '', contentArea: '화학' },
    { id: '72', semester: '초등 5학년 1학기', largeUnit: '3단원-용해와 용액', mediumUnit: '(2) 물의 온도와 용질이 용해되는 양, 용액의 진하기(물에 녹는  용질의 양에 영향을 미치는 요인)', subUnit: '', contentArea: '화학' },
    { id: '73', semester: '초등 5학년 1학기', largeUnit: '3단원-용해와 용액', mediumUnit: '(2) 물의 온도와 용질이 용해되는 양, 용액의 진하기(물에 녹는  용질의 양에 영향을 미치는 요인)', subUnit: '', contentArea: '화학' },
    { id: '74', semester: '초등 5학년 1학기', largeUnit: '3단원-용해와 용액', mediumUnit: '(2) 물의 온도와 용질이 용해되는 양, 용액의 진하기(용액의 진하기)', subUnit: '', contentArea: '화학' },
    { id: '75', semester: '초등 5학년 1학기', largeUnit: '3단원-용해와 용액', mediumUnit: '(2) 물의 온도와 용질이 용해되는 양, 용액의 진하기(우리 생활에서 용액이 쓰이는 사례)', subUnit: '', contentArea: '화학' },
    { id: '76', semester: '초등 5학년 1학기', largeUnit: '3단원-용해와 용액', mediumUnit: '(2) 물의 온도와 용질이 용해되는 양, 용액의 진하기(물에 녹는  용질의 양에 영향을 미치는 요인)', subUnit: '', contentArea: '화학' },
    { id: '77', semester: '초등 5학년 1학기', largeUnit: '3단원-용해와 용액', mediumUnit: '(2) 물의 온도와 용질이 용해되는 양, 용액의 진하기(용액의 진하기)', subUnit: '', contentArea: '화학' },
    { id: '78', semester: '초등 5학년 1학기', largeUnit: '4단원-우리 몸의 구조와 기능', mediumUnit: '(1) 우리 몸속 기관의 생김새와 하는 일(소화기관의 구조와 기능)', subUnit: '', contentArea: '생명과학' },
    { id: '79', semester: '초등 5학년 1학기', largeUnit: '4단원-우리 몸의 구조와 기능', mediumUnit: '(1) 우리 몸속 기관의 생김새와 하는 일(순환기관의 구조와 기능)', subUnit: '', contentArea: '생명과학' },
    { id: '80', semester: '초등 5학년 1학기', largeUnit: '4단원-우리 몸의 구조와 기능', mediumUnit: '(2) 배설기관, 자극과 반응, 운동할 때 몸의 변화(우리 몸은 어떻게 움직일까요)', subUnit: '', contentArea: '생명과학' },
    { id: '81', semester: '초등 5학년 1학기', largeUnit: '4단원-우리 몸의 구조와 기능', mediumUnit: '(1) 우리 몸속 기관의 생김새와 하는 일(호흡기관의 구조와 기능)', subUnit: '', contentArea: '생명과학' },
    { id: '82', semester: '초등 5학년 1학기', largeUnit: '4단원-우리 몸의 구조와 기능', mediumUnit: '(2) 배설기관, 자극과 반응, 운동할 때 몸의 변화(배설기관의 구조와 기능)', subUnit: '', contentArea: '생명과학' },
    { id: '83', semester: '초등 5학년 1학기', largeUnit: '4단원-우리 몸의 구조와 기능', mediumUnit: '(1) 우리 몸속 기관의 생김새와 하는 일(소화기관의 구조와 기능)', subUnit: '', contentArea: '생명과학' },
    { id: '84', semester: '초등 5학년 1학기', largeUnit: '4단원-우리 몸의 구조와 기능', mediumUnit: '(2) 배설기관, 자극과 반응, 운동할 때 몸의 변화(우리 몸의 여러 기관은 서로 관련되어 있을까요)', subUnit: '', contentArea: '생명과학' },
    { id: '85', semester: '초등 6학년 1학기', largeUnit: '1단원-산과 염기', mediumUnit: '(2) 산성 용액과 염기성 용액의 성질(산성 용액과 염기성 용액의 성질을 관찰해 볼까요)', subUnit: '', contentArea: '화학' },
    { id: '86', semester: '초등 6학년 1학기', largeUnit: '1단원-산과 염기', mediumUnit: '(2) 산성 용액과 염기성 용액의 성질(산성 용액과 염기성 용액을 섞으면 어떻게 될까요)', subUnit: '', contentArea: '화학' },
    { id: '87', semester: '초등 6학년 1학기', largeUnit: '1단원-산과 염기', mediumUnit: '(1) 용액의 분류와 지시약(지시약을 이용하여 여러 가지 용액을 분류해 볼까요)', subUnit: '', contentArea: '화학' },
    { id: '88', semester: '초등 6학년 1학기', largeUnit: '1단원-산과 염기', mediumUnit: '(2) 산성 용액과 염기성 용액의 성질(산성 용액과 염기성 용액의 성질을 관찰해 볼까요)', subUnit: '', contentArea: '화학' },
    { id: '89', semester: '초등 6학년 1학기', largeUnit: '1단원-산과 염기', mediumUnit: '(2) 산성 용액과 염기성 용액의 성질(산성 용액과 염기성 용액을 이용하는 예를 알아볼까요)', subUnit: '', contentArea: '화학' },
    { id: '90', semester: '초등 6학년 1학기', largeUnit: '1단원-산과 염기', mediumUnit: '(2) 산성 용액과 염기성 용액의 성질(산성 용액과 염기성 용액의 성질을 관찰해 볼까요)', subUnit: '', contentArea: '화학' },
    { id: '91', semester: '초등 6학년 1학기', largeUnit: '1단원-산과 염기', mediumUnit: '(2) 산성 용액과 염기성 용액의 성질(산성 용액과 염기성 용액을 이용하는 예를 알아볼까요)', subUnit: '', contentArea: '화학' },
    { id: '92', semester: '초등 6학년 1학기', largeUnit: '2단원-물체의 운동', mediumUnit: '(1) 물체의 운동과 빠르기(같은 시간 동안 이동한 물체의 빠르기를 비교해 볼까요)', subUnit: '', contentArea: '물리' },
    { id: '93', semester: '초등 6학년 1학기', largeUnit: '2단원-물체의 운동', mediumUnit: '(2) 속력과 안전(물체의 빠르기를 속력으로 비교해 볼까요)', subUnit: '', contentArea: '물리' },
    { id: '94', semester: '초등 6학년 1학기', largeUnit: '2단원-물체의 운동', mediumUnit: '(1) 물체의 운동과 빠르기(물체의 운동은 어떻게 표현할까요)', subUnit: '', contentArea: '물리' },
    { id: '95', semester: '초등 6학년 1학기', largeUnit: '2단원-물체의 운동', mediumUnit: '(2) 속력과 안전(물체의 속력은 어떻게 구할까요)', subUnit: '', contentArea: '물리' },
    { id: '96', semester: '초등 6학년 1학기', largeUnit: '2단원-물체의 운동', mediumUnit: '(2) 속력과 안전(속력과 관련된 안전 수칙과 안전 장치를 조사해 볼까요)', subUnit: '', contentArea: '물리' },
    { id: '97', semester: '초등 6학년 1학기', largeUnit: '2단원-물체의 운동', mediumUnit: '(1) 물체의 운동과 빠르기(같은 시간 동안 이동한 물체의 빠르기를 비교해 볼까요)', subUnit: '', contentArea: '물리' },
    { id: '98', semester: '초등 6학년 1학기', largeUnit: '2단원-물체의 운동', mediumUnit: '(2) 속력과 안전(물체의 빠르기를 속력으로 비교해 볼까요)', subUnit: '', contentArea: '물리' },
    { id: '99', semester: '초등 6학년 1학기', largeUnit: '3단원-식물의 구조와 기능', mediumUnit: '(1) 뿌리, 줄기, 잎(식물을 이루는 세포를 관찰해 볼까요)', subUnit: '', contentArea: '생명과학' },
    { id: '100', semester: '초등 6학년 1학기', largeUnit: '3단원-식물의 구조와 기능', mediumUnit: '(1) 뿌리, 줄기, 잎(줄기의 구조와 기능을 알아볼까요)', subUnit: '', contentArea: '생명과학' },
    { id: '101', semester: '초등 6학년 1학기', largeUnit: '3단원-식물의 구조와 기능', mediumUnit: '(1) 뿌리, 줄기, 잎(뿌리의 구조와 기능을 알아볼까요)', subUnit: '', contentArea: '생명과학' },
    { id: '102', semester: '초등 6학년 1학기', largeUnit: '3단원-식물의 구조와 기능', mediumUnit: '(1) 뿌리, 줄기, 잎(잎의 구조와 잎에서 만드는 양분을 알아볼까요)', subUnit: '', contentArea: '생명과학' },
    { id: '103', semester: '초등 6학년 1학기', largeUnit: '3단원-식물의 구조와 기능', mediumUnit: '(2) 꽃과 열매(꽃의 구조와 기능을 알아볼까요)', subUnit: '', contentArea: '생명과학' },
    { id: '104', semester: '초등 6학년 1학기', largeUnit: '3단원-식물의 구조와 기능', mediumUnit: '(1) 뿌리, 줄기, 잎(잎의 구조와 잎에서 만드는 양분을 알아볼까요)', subUnit: '', contentArea: '생명과학' },
    { id: '105', semester: '초등 6학년 1학기', largeUnit: '3단원-식물의 구조와 기능', mediumUnit: '(2) 꽃과 열매(식물의 각 기관이 어떻게 관련되어 있을까요)', subUnit: '', contentArea: '생명과학' },
    { id: '106', semester: '초등 6학년 1학기', largeUnit: '4단원-지구의 운동', mediumUnit: '(1) 지구의 자전(지구의 자전은 무엇일까요)', subUnit: '', contentArea: '지구과학' },
    { id: '107', semester: '초등 6학년 1학기', largeUnit: '4단원-지구의 운동', mediumUnit: '(2) 지구의 공전(지구의 공전은 무엇일까요)', subUnit: '', contentArea: '지구과학' },
    { id: '108', semester: '초등 6학년 1학기', largeUnit: '4단원-지구의 운동', mediumUnit: '(1) 지구의 자전(하루 동안 태양과 별의 위치는 어떻게 달라질까요)', subUnit: '', contentArea: '지구과학' },
    { id: '109', semester: '초등 6학년 1학기', largeUnit: '4단원-지구의 운동', mediumUnit: '(1) 지구의 자전(낮과 밤이 생기는 까닭은 무엇일까요)', subUnit: '', contentArea: '지구과학' },
    { id: '110', semester: '초등 6학년 1학기', largeUnit: '4단원-지구의 운동', mediumUnit: '(2) 지구의 공전(계절별 대표적인 별자리가 달라지는 까닭은 무엇일까요)', subUnit: '', contentArea: '지구과학' },
    { id: '111', semester: '초등 6학년 1학기', largeUnit: '4단원-지구의 운동', mediumUnit: '(1) 지구의 자전(낮과 밤이 생기는 까닭은 무엇일까요)', subUnit: '', contentArea: '지구과학' },
    { id: '112', semester: '초등 6학년 1학기', largeUnit: '4단원-지구의 운동', mediumUnit: '(2) 지구의 공전(계절별 대표적인 별자리가 달라지는 까닭은 무엇일까요)', subUnit: '', contentArea: '지구과학' },
    { id: '113', semester: '중등 1학년 1학기', largeUnit: '1단원-과학과 인류의 지속 가능한 삶', mediumUnit: '(1) 과학적 탐구방법과 과학과 인류문명 지속 가능한 삶과 과학 기술(첨단 과학 기술과 미래 사회)', subUnit: '', contentArea: '물리' },
    { id: '114', semester: '중등 1학년 1학기', largeUnit: '1단원-과학과 인류의 지속 가능한 삶', mediumUnit: '(1) 과학적 탐구방법과 과학과 인류문명 지속 가능한 삶과 과학 기술(지속 가능한 삶을 위한 활동 방안 실천하기)', subUnit: '', contentArea: '물리' },
    { id: '115', semester: '중등 1학년 1학기', largeUnit: '1단원-과학과 인류의 지속 가능한 삶', mediumUnit: '(1) 과학적 탐구방법과 과학과 인류문명 지속 가능한 삶과 과학 기술(과학적 탐구 방법)', subUnit: '', contentArea: '생명과학' },
    { id: '116', semester: '중등 1학년 1학기', largeUnit: '1단원-과학과 인류의 지속 가능한 삶', mediumUnit: '(1) 과학적 탐구방법과 과학과 인류문명 지속 가능한 삶과 과학 기술(과학과 인류 문명)', subUnit: '', contentArea: '물리' },
    { id: '117', semester: '중등 1학년 1학기', largeUnit: '1단원-과학과 인류의 지속 가능한 삶', mediumUnit: '(1) 과학적 탐구방법과 과학과 인류문명 지속 가능한 삶과 과학 기술(과학 기술과 지속 가능한 삶)', subUnit: '', contentArea: '물리' },
    { id: '118', semester: '중등 1학년 1학기', largeUnit: '1단원-과학과 인류의 지속 가능한 삶', mediumUnit: '(1) 과학적 탐구방법과 과학과 인류문명 지속 가능한 삶과 과학 기술(씨가 싹 트는데 필요한 조건)', subUnit: '', contentArea: '생명과학' },
    { id: '119', semester: '중등 1학년 1학기', largeUnit: '1단원-과학과 인류의 지속 가능한 삶', mediumUnit: '(1) 과학적 탐구방법과 과학과 인류문명 지속 가능한 삶과 과학 기술(과학 기술과 지속 가능한 삶)', subUnit: '', contentArea: '지구과학' },
    { id: '120', semester: '중등 1학년 1학기', largeUnit: '2단원-생물의 구성과 다양성', mediumUnit: '(1) 생물의 구성(생물의 구성 단계)', subUnit: '', contentArea: '생명과학' },
    { id: '121', semester: '중등 1학년 1학기', largeUnit: '2단원-생물의 구성과 다양성', mediumUnit: '(4) 생물다양성과 보전(생물다양성의 보존의 필요성)', subUnit: '', contentArea: '생명과학' },
    { id: '122', semester: '중등 1학년 1학기', largeUnit: '2단원-생물의 구성과 다양성', mediumUnit: '(2) 생물의 다양성(생물다양성)', subUnit: '', contentArea: '생명과학' },
    { id: '123', semester: '중등 1학년 1학기', largeUnit: '2단원-생물의 구성과 다양성', mediumUnit: '(3) 생물의 5계(생물의 분류 방법)', subUnit: '', contentArea: '생명과학' },
    { id: '124', semester: '중등 1학년 1학기', largeUnit: '2단원-생물의 구성과 다양성', mediumUnit: '(3) 생물의 5계(생물의 분류)', subUnit: '', contentArea: '생명과학' },
    { id: '125', semester: '중등 1학년 1학기', largeUnit: '2단원-생물의 구성과 다양성', mediumUnit: '(1) 생물의 구성(생물의 구성 단계)', subUnit: '', contentArea: '생명과학' },
    { id: '126', semester: '중등 1학년 1학기', largeUnit: '2단원-생물의 구성과 다양성', mediumUnit: '(2) 생물의 다양성(생물다양성)', subUnit: '', contentArea: '생명과학' },
    { id: '127', semester: '중등 1학년 1학기', largeUnit: '3단원-열', mediumUnit: '(1) 열의 이동(열평형)', subUnit: '', contentArea: '물리' },
    { id: '128', semester: '중등 1학년 1학기', largeUnit: '3단원-열', mediumUnit: '(2) 비열과 열팽창(열팽창)', subUnit: '', contentArea: '물리' },
    { id: '129', semester: '중등 1학년 1학기', largeUnit: '3단원-열', mediumUnit: '(1) 열의 이동(온도와 입자 운동)', subUnit: '', contentArea: '물리' },
    { id: '130', semester: '중등 1학년 1학기', largeUnit: '3단원-열', mediumUnit: '(1) 열의 이동(열의 이동)', subUnit: '', contentArea: '물리' },
    { id: '131', semester: '중등 1학년 1학기', largeUnit: '3단원-열', mediumUnit: '(2) 비열과 열팽창(비열)', subUnit: '', contentArea: '물리' },
    { id: '132', semester: '중등 1학년 1학기', largeUnit: '3단원-열', mediumUnit: '(1) 열의 이동(열평형)', subUnit: '', contentArea: '물리' },
    { id: '133', semester: '중등 1학년 1학기', largeUnit: '3단원-열', mediumUnit: '(2) 비열과 열팽창(열팽창)', subUnit: '', contentArea: '물리' },
    { id: '134', semester: '중등 1학년 1학기', largeUnit: '4단원-물질의 상태 변화', mediumUnit: '(2) 물질의 상태와 상태 변화(물의 상태 변화)', subUnit: '', contentArea: '화학' },
    { id: '135', semester: '중등 1학년 1학기', largeUnit: '4단원-물질의 상태 변화', mediumUnit: '(2) 물질의 상태와 상태 변화(상태 변화와 입자 배열의 변화)', subUnit: '', contentArea: '화학' },
    { id: '136', semester: '중등 1학년 1학기', largeUnit: '4단원-물질의 상태 변화', mediumUnit: '(1) 입자의 운동(입자의 운동)', subUnit: '', contentArea: '화학' },
    { id: '137', semester: '중등 1학년 1학기', largeUnit: '4단원-물질의 상태 변화', mediumUnit: '(3) 상태변화와 열에너지(열에너지를 흡수하는 상태 변화)', subUnit: '', contentArea: '화학' },
    { id: '138', semester: '중등 1학년 1학기', largeUnit: '4단원-물질의 상태 변화', mediumUnit: '(3) 상태변화와 열에너지(열에너지를 방출하는 상태 변화)', subUnit: '', contentArea: '화학' },
    { id: '139', semester: '중등 1학년 1학기', largeUnit: '4단원-물질의 상태 변화', mediumUnit: '(2) 물질의 상태와 상태 변화(상태 변화와 입자 배열의 변화)', subUnit: '', contentArea: '화학' },
    { id: '140', semester: '중등 1학년 1학기', largeUnit: '4단원-물질의 상태 변화', mediumUnit: '(3) 상태변화와 열에너지(상태 변화와 열에너지의 이용)', subUnit: '', contentArea: '화학' },
    { id: '141', semester: '중등 2학년 1학기', largeUnit: '1단원-물질의 특성', mediumUnit: '(2) 밀도와 용해도(밀도)', subUnit: '', contentArea: '화학' },
    { id: '142', semester: '중등 2학년 1학기', largeUnit: '1단원-물질의 특성', mediumUnit: '(2) 밀도와 용해도(용해도)', subUnit: '', contentArea: '화학' },
    { id: '143', semester: '중등 2학년 1학기', largeUnit: '1단원-물질의 특성', mediumUnit: '(3) 혼합물의 분리(밀도 차를 이용한 분리)', subUnit: '', contentArea: '화학' },
    { id: '144', semester: '중등 2학년 1학기', largeUnit: '1단원-물질의 특성', mediumUnit: '(3) 혼합물의 분리(용해도 차를 이용한 분리)', subUnit: '', contentArea: '화학' },
    { id: '145', semester: '중등 2학년 1학기', largeUnit: '1단원-물질의 특성', mediumUnit: '(3) 혼합물의 분리(끓는점 차를 이용한 분리)', subUnit: '', contentArea: '화학' },
    { id: '146', semester: '중등 2학년 1학기', largeUnit: '1단원-물질의 특성', mediumUnit: '(1) 순물질과 혼합물, 녹는점과 어는점, 끓는점(순물질과 혼합물)', subUnit: '', contentArea: '화학' },
    { id: '147', semester: '중등 2학년 1학기', largeUnit: '1단원-물질의 특성', mediumUnit: '(3) 혼합물의 분리(여러 가지 방법으로 혼합물 분리하기)', subUnit: '', contentArea: '화학' },
    { id: '148', semester: '중등 2학년 1학기', largeUnit: '2단원-지권의 변화', mediumUnit: '(1) 지구계와 지구 내부의 구조(지권의 층상 구조)', subUnit: '', contentArea: '지구과학' },
    { id: '149', semester: '중등 2학년 1학기', largeUnit: '2단원-지권의 변화', mediumUnit: '(2) 암석과 암석의 순환(지각을 이루는 암석)', subUnit: '', contentArea: '지구과학' },
    { id: '150', semester: '중등 2학년 1학기', largeUnit: '2단원-지권의 변화', mediumUnit: '(1) 지구계와 지구 내부의 구조(지구계의 구성 요소)', subUnit: '', contentArea: '지구과학' },
    { id: '151', semester: '중등 2학년 1학기', largeUnit: '2단원-지권의 변화', mediumUnit: '(3) 광물과 토양(암석을 이루는 광물)', subUnit: '', contentArea: '지구과학' },
    { id: '152', semester: '중등 2학년 1학기', largeUnit: '2단원-지권의 변화', mediumUnit: '(4) 지권의 운동(대륙이동설)', subUnit: '', contentArea: '지구과학' },
    { id: '153', semester: '중등 2학년 1학기', largeUnit: '2단원-지권의 변화', mediumUnit: '(2) 암석과 암석의 순환(지각을 이루는 암석)', subUnit: '', contentArea: '지구과학' },
    { id: '154', semester: '중등 2학년 1학기', largeUnit: '2단원-지권의 변화', mediumUnit: '(3) 광물과 토양(풍화와 토양의 생성)', subUnit: '', contentArea: '지구과학' },
    { id: '155', semester: '중등 2학년 1학기', largeUnit: '3단원-빛과 파동', mediumUnit: '(1) 물체를 보는 과정과 반사와 굴절, 평면 거울의 상(빛의 굴절)', subUnit: '', contentArea: '물리' },
    { id: '156', semester: '중등 2학년 1학기', largeUnit: '3단원-빛과 파동', mediumUnit: '(3) 파동과 소리(파동의 발생과 전달)', subUnit: '', contentArea: '물리' },
    { id: '157', semester: '중등 2학년 1학기', largeUnit: '3단원-빛과 파동', mediumUnit: '(1) 물체를 보는 과정과 반사와 굴절, 평면 거울의 상(빛의 반사)', subUnit: '', contentArea: '물리' },
    { id: '158', semester: '중등 2학년 1학기', largeUnit: '3단원-빛과 파동', mediumUnit: '(2) 거울과 렌즈에 의한 상, 물체의 색과 빛의 합성(빛의 합성)', subUnit: '', contentArea: '물리' },
    { id: '159', semester: '중등 2학년 1학기', largeUnit: '3단원-빛과 파동', mediumUnit: '(3) 파동과 소리(소리의 특성)', subUnit: '', contentArea: '물리' },
    { id: '160', semester: '중등 2학년 1학기', largeUnit: '3단원-빛과 파동', mediumUnit: '(2) 거울과 렌즈에 의한 상, 물체의 색과 빛의 합성(평면 거울에 상이 생기는 원리)', subUnit: '', contentArea: '물리' },
    { id: '161', semester: '중등 2학년 1학기', largeUnit: '3단원-빛과 파동', mediumUnit: '(2) 거울과 렌즈에 의한 상, 물체의 색과 빛의 합성(거울과 렌즈)', subUnit: '', contentArea: '물리' },
    { id: '162', semester: '중등 2학년 1학기', largeUnit: '4단원-물질의 구성', mediumUnit: '(1) 원소(원소와 화합물)', subUnit: '', contentArea: '화학' },
    { id: '163', semester: '중등 2학년 1학기', largeUnit: '4단원-물질의 구성', mediumUnit: '(3) 이온(이온의 이동)', subUnit: '', contentArea: '화학' },
    { id: '164', semester: '중등 2학년 1학기', largeUnit: '4단원-물질의 구성', mediumUnit: '(1) 원소(원소와 화합물의 표현)', subUnit: '', contentArea: '화학' },
    { id: '165', semester: '중등 2학년 1학기', largeUnit: '4단원-물질의 구성', mediumUnit: '(2) 원자와 분자(원자의 구조)', subUnit: '', contentArea: '화학' },
    { id: '166', semester: '중등 2학년 1학기', largeUnit: '4단원-물질의 구성', mediumUnit: '(2) 원자와 분자(물질을 구성하는 입자)', subUnit: '', contentArea: '화학' },
    { id: '167', semester: '중등 2학년 1학기', largeUnit: '4단원-물질의 구성', mediumUnit: '(1) 원소(원소와 화합물)', subUnit: '', contentArea: '화학' },
    { id: '168', semester: '중등 2학년 1학기', largeUnit: '4단원-물질의 구성', mediumUnit: '(3) 이온(이온의 이동)', subUnit: '', contentArea: '화학' },
    { id: '169', semester: '중등 3학년 1학기', largeUnit: '1단원-화학 반응의 규칙과 에너지 변화', mediumUnit: '(1) 물질 변화와 화학 반응식(물리 변화와 화학 변화)', subUnit: '', contentArea: '물리' },
    { id: '170', semester: '중등 3학년 1학기', largeUnit: '1단원-화학 반응의 규칙과 에너지 변화', mediumUnit: '(3) 기체 반응 법칙, 화학 반응에서의 에너지 출입(기체 반응 법칙)', subUnit: '', contentArea: '물리' },
    { id: '171', semester: '중등 3학년 1학기', largeUnit: '1단원-화학 반응의 규칙과 에너지 변화', mediumUnit: '(1) 물질 변화와 화학 반응식(화학 반응식)', subUnit: '', contentArea: '생명과학' },
    { id: '172', semester: '중등 3학년 1학기', largeUnit: '1단원-화학 반응의 규칙과 에너지 변화', mediumUnit: '(2) 질량 보존 법칙, 일정 성분비 법칙(질량 보존 법칙)', subUnit: '', contentArea: '물리' },
    { id: '173', semester: '중등 3학년 1학기', largeUnit: '1단원-화학 반응의 규칙과 에너지 변화', mediumUnit: '(2) 질량 보존 법칙, 일정 성분비 법칙(일정 성분비 법칙)', subUnit: '', contentArea: '물리' },
    { id: '174', semester: '중등 3학년 1학기', largeUnit: '1단원-화학 반응의 규칙과 에너지 변화', mediumUnit: '(1) 물질 변화와 화학 반응식(물리 변화와 화학 변화)', subUnit: '', contentArea: '생명과학' },
    { id: '175', semester: '중등 3학년 1학기', largeUnit: '1단원-화학 반응의 규칙과 에너지 변화', mediumUnit: '(3) 기체 반응 법칙, 화학 반응에서의 에너지 출입(에너지 출입을 활용하는 예)', subUnit: '', contentArea: '지구과학' },
    { id: '176', semester: '중등 3학년 1학기', largeUnit: '2단원-기권과 날씨', mediumUnit: '(1) 기권과 지구 기온(기권의 층상 구조)', subUnit: '', contentArea: '생명과학' },
    { id: '177', semester: '중등 3학년 1학기', largeUnit: '2단원-기권과 날씨', mediumUnit: '(4) 날씨의 변화(기단과 전선)', subUnit: '', contentArea: '생명과학' },
    { id: '178', semester: '중등 3학년 1학기', largeUnit: '2단원-기권과 날씨', mediumUnit: '(2) 구름과 강수(대기 중의 수증기)', subUnit: '', contentArea: '생명과학' },
    { id: '179', semester: '중등 3학년 1학기', largeUnit: '2단원-기권과 날씨', mediumUnit: '(2) 구름과 강수(구름의 생성 과정)', subUnit: '', contentArea: '생명과학' },
    { id: '180', semester: '중등 3학년 1학기', largeUnit: '2단원-기권과 날씨', mediumUnit: '(3) 기압과 바람(바람)', subUnit: '', contentArea: '생명과학' },
    { id: '181', semester: '중등 3학년 1학기', largeUnit: '2단원-기권과 날씨', mediumUnit: '(3) 기압과 바람(기압과 날씨)', subUnit: '', contentArea: '생명과학' },
    { id: '182', semester: '중등 3학년 1학기', largeUnit: '2단원-기권과 날씨', mediumUnit: '(4) 날씨의 변화(날씨와 일기도)', subUnit: '', contentArea: '생명과학' },
    { id: '183', semester: '중등 3학년 1학기', largeUnit: '3단원-운동과 에너지', mediumUnit: '(1) 운동(자유 낙하 운동)', subUnit: '', contentArea: '물리' },
    { id: '184', semester: '중등 3학년 1학기', largeUnit: '3단원-운동과 에너지', mediumUnit: '(2) 일과 에너지(일)', subUnit: '', contentArea: '물리' },
    { id: '185', semester: '중등 3학년 1학기', largeUnit: '3단원-운동과 에너지', mediumUnit: '(1) 운동(등속 운동)', subUnit: '', contentArea: '물리' },
    { id: '186', semester: '중등 3학년 1학기', largeUnit: '3단원-운동과 에너지', mediumUnit: '(2) 일과 에너지(중력에 의한 위치 에너지)', subUnit: '', contentArea: '물리' },
    { id: '187', semester: '중등 3학년 1학기', largeUnit: '3단원-운동과 에너지', mediumUnit: '(2) 일과 에너지(운동 에너지)', subUnit: '', contentArea: '물리' },
    { id: '188', semester: '중등 3학년 1학기', largeUnit: '3단원-운동과 에너지', mediumUnit: '(1) 운동(질량이 다른 물체의 자유 낙하 운동)', subUnit: '', contentArea: '물리' },
    { id: '189', semester: '중등 3학년 1학기', largeUnit: '3단원-운동과 에너지', mediumUnit: '(2) 일과 에너지(일과 에너지의 관계)', subUnit: '', contentArea: '물리' },
    { id: '190', semester: '중등 3학년 1학기', largeUnit: '4단원-자극과 반응', mediumUnit: '(1) 감각 기관(눈의 구조와 기능)', subUnit: '', contentArea: '화학' },
    { id: '191', semester: '중등 3학년 1학기', largeUnit: '4단원-자극과 반응', mediumUnit: '(2) 신경계와 호르몬(뉴런의 구조와 기능)', subUnit: '', contentArea: '화학' },
    { id: '192', semester: '중등 3학년 1학기', largeUnit: '4단원-자극과 반응', mediumUnit: '(1) 감각 기관(귀 구조와 기능)', subUnit: '', contentArea: '화학' },
    { id: '193', semester: '중등 3학년 1학기', largeUnit: '4단원-자극과 반응', mediumUnit: '(2) 신경계와 호르몬(신경계의 구조와 기능)', subUnit: '', contentArea: '화학' },
    { id: '194', semester: '중등 3학년 1학기', largeUnit: '4단원-자극과 반응', mediumUnit: '(2) 신경계와 호르몬(호르몬의 조절 작용)', subUnit: '', contentArea: '화학' },
    { id: '195', semester: '중등 3학년 1학기', largeUnit: '4단원-자극과 반응', mediumUnit: '(2) 신경계와 호르몬(자극에 따른 반응의 경로)', subUnit: '', contentArea: '화학' },
    { id: '196', semester: '중등 3학년 1학기', largeUnit: '4단원-자극과 반응', mediumUnit: '(2) 신경계와 호르몬(항상성 유지)', subUnit: '', contentArea: '화학' },
].map((unit, index) => ({ ...unit, id: (index + 1).toString() }));






    
