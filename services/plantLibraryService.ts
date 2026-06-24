/**
 * Bitki kütüphanesi servisi
 * Firestore'daki bitki veri setinden arama ve filtreleme
 */
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAt,
  endAt,
} from 'firebase/firestore';
import { db } from './firebase';
import { PlantDataset } from '../types';

// Yerel cache - arama performansı için
let plantCache: PlantDataset[] = [];
let isCacheLoaded = false;

/**
 * Tüm bitkileri Firestore'dan yükle ve cache'e al
 */
export const loadPlantLibrary = async (): Promise<PlantDataset[]> => {
  if (isCacheLoaded && plantCache.length > 0) {
    return plantCache;
  }

  try {
    const querySnapshot = await getDocs(
      collection(db, 'plant_library')
    );
    plantCache = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PlantDataset[];
    isCacheLoaded = true;
    return plantCache;
  } catch (error) {
    console.error('Bitki kütüphanesi yüklenemedi:', error);
    // Fallback: Yerel JSON dosyasından yükle
    return loadFromLocalJSON();
  }
};

/**
 * Yerel JSON'dan yükle (fallback)
 */
const loadFromLocalJSON = async (): Promise<PlantDataset[]> => {
  try {
    const data = require('../assets/data/plant_dataset.json');
    plantCache = data as PlantDataset[];
    isCacheLoaded = true;
    return plantCache;
  } catch (error) {
    console.error('Yerel veri seti yüklenemedi:', error);
    return [];
  }
};

/**
 * Bitki adına göre arama (Autocomplete)
 * Debounced olarak çağrılmalı
 */
export const searchPlants = async (
  searchText: string,
  maxResults: number = 15
): Promise<PlantDataset[]> => {
  // Cache yüklenmemişse yükle
  if (!isCacheLoaded) {
    await loadPlantLibrary();
  }

  if (!searchText.trim()) {
    return [];
  }

  const normalizedSearch = searchText.toLowerCase().trim();

  // İsme göre filtreleme
  const results = plantCache
    .filter((plant) =>
      plant.name.toLowerCase().includes(normalizedSearch)
    )
    .slice(0, maxResults);

  return results;
};

/**
 * Kategoriye göre filtreleme
 */
export const getPlantsByCategory = async (
  category: string
): Promise<PlantDataset[]> => {
  if (!isCacheLoaded) {
    await loadPlantLibrary();
  }

  return plantCache.filter((plant) => plant.category === category);
};

/**
 * ID ile bitki bul
 */
export const getPlantById = async (
  id: string
): Promise<PlantDataset | undefined> => {
  if (!isCacheLoaded) {
    await loadPlantLibrary();
  }

  return plantCache.find((plant) => plant.id === id);
};

/**
 * Tüm kategorileri getir
 */
export const getCategories = async (): Promise<string[]> => {
  if (!isCacheLoaded) {
    await loadPlantLibrary();
  }

  const categories = [...new Set(plantCache.map((p) => p.category))];
  return categories.sort();
};

/**
 * Cache'i temizle (refresh için)
 */
export const clearCache = () => {
  plantCache = [];
  isCacheLoaded = false;
};
