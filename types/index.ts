/**
 * TypeScript tip tanımlamaları
 */

// Bitki veri seti tipi (JSON'dan gelen)
export interface PlantDataset {
  id: string;
  name: string;
  category: PlantCategory;
  growthRate: number;        // cm/ay
  fertPeriod: number;        // gün
  waterStartADC: number;     // Sulama başlama eşiği
  waterStopADC: number;      // Sulama durma eşiği
  soilType: string;
  minTemp: number;           // °C
  maxTemp: number;           // °C
}

// Kullanıcının eklediği bitki
export interface UserPlant {
  id: string;                // Firestore document ID
  userId: string;
  name: string;
  category: PlantCategory;
  growthRate: number;
  fertPeriod: number;
  waterStartADC: number;
  waterStopADC: number;
  soilType: string;
  minTemp: number;
  maxTemp: number;
  imageUri: string | null;   // Lokal dosya yolu
  datasetId: string | null;  // Veri setinden seçildiyse
  deviceId?: string;         // Eşleştirilmiş IoT Cihaz ID'si (örn: BITKI_MOTOR_01)
  isSystemActive: boolean;
  createdAt: number;         // timestamp
  updatedAt: number;
}

// IoT cihaz durumu (Realtime Database)
export interface DeviceState {
  is_system_active: boolean;
  force_stop: boolean;
  waterStartADC: number;
  waterStopADC: number;
  sensor_data: {
    moisture: number;
    motor_status: number;    // 0: Kapalı, 1: Açık
    last_updated: number;
  };
}

// Bitki kategorileri
export type PlantCategory =
  | 'Sebzeler'
  | 'Süs Bitkileri (İç Mekan)'
  | 'Süs Bitkileri (Dış Mekan)'
  | 'Tıbbi ve Aromatik Bitkiler'
  | 'Meyveler'
  | 'Kaktüs ve Sukulentler';

// Auth kullanıcı
export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

// Form verileri
export interface PlantFormData {
  name: string;
  category: string;
  growthRate: string;
  fertPeriod: string;
  waterStartADC: string;
  waterStopADC: string;
  soilType: string;
  minTemp: string;
  maxTemp: string;
  imageUri: string | null;
  datasetId: string | null;
}

// Kategori ikon eşleştirmeleri
export interface CategoryIcon {
  name: string;
  icon: string;
  color: string;
}
