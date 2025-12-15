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
} from 'firebase/firestore';

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
  createdAt: Timestamp;
  updatedAt: Timestamp;
};


// A helper function to remove commas from a string
const parseCurrency = (value: string | undefined): number => {
    if (!value) return 0;
    const parsed = parseInt(value.replace(/[^0-9]/g, ''), 10);
    return isNaN(parsed) ? 0 : parsed;
};

// This function saves a new institution document to Firestore.
export async function createInstitution(db: Firestore, institutionData: any) {
  try {
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


    const docRef = await addDoc(collection(db, 'institutions'), docData);
    console.log('Document written with ID: ', docRef.id);
    return docRef.id;
  } catch (e) {
    console.error('Error adding document: ', e);
    throw new Error('Failed to create institution');
  }
}

// This function fetches all institutions from Firestore in real-time.
export function getInstitutions(db: Firestore, callback: (institutions: Institution[]) => void) {
  const q = query(collection(db, "institutions"), orderBy("createdAt", "desc"));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const institutions: Institution[] = [];
    querySnapshot.forEach((doc) => {
      institutions.push({ id: doc.id, ...doc.data() } as Institution);
    });
    callback(institutions);
  }, (error) => {
    console.error("Error fetching institutions:", error);
  });

  return unsubscribe; // Return the unsubscribe function to clean up the listener
}

// This function fetches a single institution from Firestore in real-time.
export function getInstitution(db: Firestore, id: string, callback: (institution: Institution | null) => void) {
  const docRef = doc(db, "institutions", id);

  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() } as Institution);
    } else {
      console.log("No such document!");
      callback(null);
    }
  }, (error) => {
    console.error("Error fetching institution:", error);
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

    