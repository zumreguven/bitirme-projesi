/**
 * Firebase Authentication servisleri
 */
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

/**
 * E-posta ile kayıt ol
 */
export const signUp = async (
  email: string,
  password: string,
  displayName?: string
) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  // Profil güncelleme
  if (displayName) {
    await updateProfile(userCredential.user, { displayName });
  }

  // Firestore'a kullanıcı dokümanı oluştur
  await setDoc(doc(db, 'users', userCredential.user.uid), {
    email,
    displayName: displayName || null,
    createdAt: serverTimestamp(),
  });

  return userCredential.user;
};

/**
 * E-posta ile giriş yap
 */
export const signIn = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );
  return userCredential.user;
};

/**
 * Çıkış yap
 */
export const signOut = async () => {
  await firebaseSignOut(auth);
};

/**
 * Auth durumu değişikliklerini dinle
 */
export const onAuthStateChanged = (callback: (user: User | null) => void) => {
  return firebaseOnAuthStateChanged(auth, callback);
};
