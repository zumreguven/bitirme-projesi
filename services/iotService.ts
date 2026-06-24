/**
 * IoT Cihaz servisi - Firebase Realtime Database
 * ESP32 ile haberleşme
 */
import {
  ref,
  set,
  update,
  onValue,
  off,
  DataSnapshot,
} from 'firebase/database';
import { rtdb } from './firebase';
import { DeviceState } from '../types';
import { updatePlant } from './firestore';

/**
 * Cihaz state yolunu oluştur
 */
const getDevicePath = (deviceId: string) =>
  `devices/${deviceId}`;

/**
 * Cihaz durumunu başlat (ilk kurulum)
 */
export const initializeDevice = async (
  deviceId: string,
  waterStartADC: number,
  waterStopADC: number
) => {
  const deviceRef = ref(rtdb, getDevicePath(deviceId));
  const initialState: DeviceState = {
    is_system_active: false,
    force_stop: false,
    waterStartADC,
    waterStopADC,
    sensor_data: {
      moisture: 0,
      motor_status: 0,
      last_updated: Date.now(),
    },
  };
  await set(deviceRef, initialState);
};

/**
 * Sistemi başlat/durdur
 */
export const setSystemActive = async (
  deviceId: string,
  userId: string,
  plantId: string,
  active: boolean
) => {
  const deviceRef = ref(rtdb, getDevicePath(deviceId));
  await update(deviceRef, {
    is_system_active: active,
    force_stop: false, // Sistemi başlatınca force_stop'u sıfırla
  });

  // Ana ekrandaki kartların güncellenmesi için Firestore'u da senkronize et
  await updatePlant(userId, plantId, {
    isSystemActive: active
  });
};

/**
 * Acil durdurma
 */
export const forceStopSystem = async (
  deviceId: string,
  userId: string,
  plantId: string
) => {
  const deviceRef = ref(rtdb, getDevicePath(deviceId));
  await update(deviceRef, {
    is_system_active: false,
    force_stop: true,
  });

  // Ana ekrandaki kartların güncellenmesi için Firestore'u da senkronize et
  await updatePlant(userId, plantId, {
    isSystemActive: false
  });
};

/**
 * Sulama eşiklerini güncelle
 */
export const updateWateringThresholds = async (
  deviceId: string,
  waterStartADC: number,
  waterStopADC: number
) => {
  const deviceRef = ref(rtdb, getDevicePath(deviceId));
  await update(deviceRef, {
    waterStartADC,
    waterStopADC,
  });
};

/**
 * Cihaz durumunu gerçek zamanlı dinle
 */
export const subscribeToDevice = (
  deviceId: string,
  callback: (state: DeviceState | null) => void
) => {
  const deviceRef = ref(rtdb, getDevicePath(deviceId));

  const listener = onValue(deviceRef, (snapshot: DataSnapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as DeviceState);
    } else {
      callback(null);
    }
  });

  // Unsubscribe fonksiyonu döndür
  return () => off(deviceRef);
};
