/**
 * Firestore CRUD işlemleri - Kullanıcı bitkileri
 */
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { UserPlant, PlantFormData } from '../types';

/**
 * Yeni bitki ekle
 */
export const addPlant = async (
  userId: string,
  formData: PlantFormData
): Promise<string> => {
  const plantData = {
    userId,
    name: formData.name,
    category: formData.category,
    growthRate: parseFloat(formData.growthRate) || 0,
    fertPeriod: parseInt(formData.fertPeriod) || 0,
    waterStartADC: parseInt(formData.waterStartADC) || 0,
    waterStopADC: parseInt(formData.waterStopADC) || 0,
    soilType: formData.soilType,
    minTemp: parseInt(formData.minTemp) || 0,
    maxTemp: parseInt(formData.maxTemp) || 0,
    imageUri: formData.imageUri,
    datasetId: formData.datasetId,
    isSystemActive: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const docRef = await addDoc(
    collection(db, 'users', userId, 'plants'),
    plantData
  );
  return docRef.id;
};

/**
 * Bitki güncelle
 */
export const updatePlant = async (
  userId: string,
  plantId: string,
  data: Partial<UserPlant>
) => {
  const plantRef = doc(db, 'users', userId, 'plants', plantId);
  await updateDoc(plantRef, {
    ...data,
    updatedAt: Date.now(),
  });
};

/**
 * Bitki sil
 */
export const deletePlant = async (userId: string, plantId: string) => {
  await deleteDoc(doc(db, 'users', userId, 'plants', plantId));
};

/**
 * Tek bitki getir
 */
export const getPlant = async (
  userId: string,
  plantId: string
): Promise<UserPlant | null> => {
  const docSnap = await getDoc(doc(db, 'users', userId, 'plants', plantId));
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as UserPlant;
  }
  return null;
};

/**
 * Kullanıcının tüm bitkilerini getir
 */
export const getUserPlants = async (userId: string): Promise<UserPlant[]> => {
  const q = query(
    collection(db, 'users', userId, 'plants'),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as UserPlant)
  );
};

/**
 * Bitkileri gerçek zamanlı dinle
 */
export const subscribePlants = (
  userId: string,
  callback: (plants: UserPlant[]) => void
): Unsubscribe => {
  const q = query(
    collection(db, 'users', userId, 'plants'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const plants = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as UserPlant)
    );
    callback(plants);
  });
};
