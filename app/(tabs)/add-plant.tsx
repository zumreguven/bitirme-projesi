/**
 * Bitki Ekleme Ekranı - Arama, Autocomplete, Form
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  FlatList,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useAuth } from '../../context/AuthContext';
import { addPlant } from '../../services/firestore';
import { initializeDevice } from '../../services/iotService';
import { searchPlants } from '../../services/plantLibraryService';
import { PlantDataset, PlantFormData } from '../../types';
import { Colors, Shadows, BorderRadius, FontSizes, Spacing } from '../../constants/Colors';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  'Sebzeler',
  'Süs Bitkileri (İç Mekan)',
  'Süs Bitkileri (Dış Mekan)',
  'Tıbbi ve Aromatik Bitkiler',
  'Meyveler',
  'Kaktüs ve Sukulentler',
];

export default function AddPlantScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<PlantDataset[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const [formData, setFormData] = useState<PlantFormData>({
    name: '',
    category: '',
    growthRate: '',
    fertPeriod: '',
    waterStartADC: '',
    waterStopADC: '',
    soilType: '',
    minTemp: '',
    maxTemp: '',
    imageUri: null,
    datasetId: null,
  });

  // Debounced arama
  useEffect(() => {
    if (!searchText.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      const results = await searchPlants(searchText, 10);
      setSearchResults(results);
      setShowResults(true);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText]);

  // Bitki seçildiğinde formu doldur
  const selectPlant = (plant: PlantDataset) => {
    setFormData({
      name: plant.name,
      category: plant.category,
      growthRate: plant.growthRate.toString(),
      fertPeriod: plant.fertPeriod.toString(),
      waterStartADC: plant.waterStartADC.toString(),
      waterStopADC: plant.waterStopADC.toString(),
      soilType: plant.soilType,
      minTemp: plant.minTemp.toString(),
      maxTemp: plant.maxTemp.toString(),
      imageUri: formData.imageUri,
      datasetId: plant.id,
    });
    setSearchText(plant.name);
    setShowResults(false);
  };

  // Fotoğraf seçme
  const pickImage = async (fromCamera: boolean) => {
    try {
      const permissionResult = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('İzin Gerekli', 'Fotoğraf erişimi için izin vermeniz gerekiyor.');
        return;
      }

      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        // Fotoğrafı kalıcı dizine kopyala
        const fileName = `plant_${Date.now()}.jpg`;
        const destDir = `${FileSystem.documentDirectory}plant_images/`;
        await FileSystem.makeDirectoryAsync(destDir, { intermediates: true });
        const destUri = `${destDir}${fileName}`;
        await FileSystem.copyAsync({ from: asset.uri, to: destUri });

        setFormData((prev) => ({ ...prev, imageUri: destUri }));
      }
    } catch (error) {
      console.error('Fotoğraf seçme hatası:', error);
    }
  };

  // Form gönderme
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Hata', 'Lütfen bitki adını girin.');
      return;
    }
    if (!formData.waterStartADC || !formData.waterStopADC) {
      Alert.alert('Hata', 'Lütfen sulama eşik değerlerini girin.');
      return;
    }
    if (!user) return;

    setIsSubmitting(true);
    try {
      const plantId = await addPlant(user.uid, formData);

      // IoT cihazını artık burada başlatmıyoruz. Cihaz eşleştirildiğinde [id].tsx içinde başlatılacak.

      Alert.alert('Başarılı!', `${formData.name} başarıyla eklendi! 🌱`, [
        { text: 'Tamam', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Bitki ekleme hatası:', error);
      Alert.alert('Hata', 'Bitki eklenirken bir sorun oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof PlantFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yeni Bitki Ekle</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Arama Bölümü */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="search" size={16} color={Colors.primaryLight} />{' '}
              Bitki Ara
            </Text>
            <Text style={styles.sectionSubtitle}>
              Veri setinden bitki seçin veya manuel ekleyin
            </Text>

            <View style={styles.searchContainer}>
              <Ionicons
                name="search-outline"
                size={20}
                color={Colors.textMuted}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Bitki adı yazın..."
                placeholderTextColor={Colors.textMuted}
                value={searchText}
                onChangeText={setSearchText}
                autoCapitalize="words"
              />
              {isSearching && (
                <ActivityIndicator
                  size="small"
                  color={Colors.primaryLight}
                  style={styles.searchLoader}
                />
              )}
              {searchText.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchText('');
                    setShowResults(false);
                  }}
                  style={styles.clearButton}
                >
                  <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Autocomplete Sonuçları */}
            {showResults && searchResults.length > 0 && (
              <View style={styles.resultsContainer}>
                {searchResults.map((plant) => (
                  <TouchableOpacity
                    key={plant.id}
                    style={styles.resultItem}
                    onPress={() => selectPlant(plant)}
                  >
                    <View style={styles.resultLeft}>
                      <Ionicons name="leaf" size={18} color={Colors.primaryLight} />
                      <View>
                        <Text style={styles.resultName}>{plant.name}</Text>
                        <Text style={styles.resultCategory}>{plant.category}</Text>
                      </View>
                    </View>
                    <Ionicons name="add-circle-outline" size={22} color={Colors.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Fotoğraf Ekleme */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="camera" size={16} color={Colors.primaryLight} />{' '}
              Fotoğraf
            </Text>

            {formData.imageUri ? (
              <View style={styles.imagePreviewContainer}>
                <Image
                  source={{ uri: formData.imageUri }}
                  style={styles.imagePreview}
                />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setFormData((prev) => ({ ...prev, imageUri: null }))}
                >
                  <Ionicons name="close-circle" size={28} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.imagePickerRow}>
                <TouchableOpacity
                  style={styles.imagePickerButton}
                  onPress={() => pickImage(true)}
                >
                  <Ionicons name="camera-outline" size={32} color={Colors.primaryLight} />
                  <Text style={styles.imagePickerText}>Kamera</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.imagePickerButton}
                  onPress={() => pickImage(false)}
                >
                  <Ionicons name="images-outline" size={32} color={Colors.primaryLight} />
                  <Text style={styles.imagePickerText}>Galeri</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Form Alanları */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="create" size={16} color={Colors.primaryLight} />{' '}
              Bitki Bilgileri
            </Text>

            {/* Bitki Adı */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Bitki Adı *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="leaf-outline" size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.fieldInput}
                  value={formData.name}
                  onChangeText={(v) => updateField('name', v)}
                  placeholder="Bitki adını girin"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </View>

            {/* Kategori */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Kategori</Text>
              <TouchableOpacity
                style={styles.inputContainer}
                onPress={() => setShowCategoryPicker(true)}
              >
                <Ionicons name="grid-outline" size={18} color={Colors.textMuted} />
                <Text
                  style={[
                    styles.fieldInput,
                    !formData.category && { color: Colors.textMuted },
                  ]}
                >
                  {formData.category || 'Kategori seçin'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Toprak Tipi */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Toprak Tipi</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="earth-outline" size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.fieldInput}
                  value={formData.soilType}
                  onChangeText={(v) => updateField('soilType', v)}
                  placeholder="Toprak tipini girin"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </View>

            {/* İki Sütunlu Alanlar */}
            <View style={styles.rowFields}>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>Sulama Başlama (ADC) *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="water-outline" size={18} color={Colors.info} />
                  <TextInput
                    style={styles.fieldInput}
                    value={formData.waterStartADC}
                    onChangeText={(v) => updateField('waterStartADC', v)}
                    placeholder="Ör: 3000"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>Sulama Durma (ADC) *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="water" size={18} color={Colors.primary} />
                  <TextInput
                    style={styles.fieldInput}
                    value={formData.waterStopADC}
                    onChangeText={(v) => updateField('waterStopADC', v)}
                    placeholder="Ör: 2200"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            <View style={styles.rowFields}>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>Min Sıcaklık (°C)</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="thermometer-outline" size={18} color={Colors.info} />
                  <TextInput
                    style={styles.fieldInput}
                    value={formData.minTemp}
                    onChangeText={(v) => updateField('minTemp', v)}
                    placeholder="Ör: 15"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>Max Sıcaklık (°C)</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="thermometer" size={18} color={Colors.danger} />
                  <TextInput
                    style={styles.fieldInput}
                    value={formData.maxTemp}
                    onChangeText={(v) => updateField('maxTemp', v)}
                    placeholder="Ör: 35"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            <View style={styles.rowFields}>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>Büyüme Hızı (cm/ay)</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="trending-up" size={18} color={Colors.success} />
                  <TextInput
                    style={styles.fieldInput}
                    value={formData.growthRate}
                    onChangeText={(v) => updateField('growthRate', v)}
                    placeholder="Ör: 5.0"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>Gübreleme (Gün)</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="calendar-outline" size={18} color={Colors.warning} />
                  <TextInput
                    style={styles.fieldInput}
                    value={formData.fertPeriod}
                    onChangeText={(v) => updateField('fertPeriod', v)}
                    placeholder="Ör: 30"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Kaydet Butonu */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
            style={styles.submitWrapper}
          >
            <LinearGradient
              colors={[...Colors.gradientPrimary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.submitButton, isSubmitting && styles.submitDisabled]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  <Text style={styles.submitText}>Bitkiyi Kaydet</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Kategori Seçici Modal */}
      <Modal
        visible={showCategoryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Kategori Seçin</Text>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryItem,
                  formData.category === cat && styles.categoryItemActive,
                ]}
                onPress={() => {
                  updateField('category', cat);
                  setShowCategoryPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.categoryItemText,
                    formData.category === cat && styles.categoryItemTextActive,
                  ]}
                >
                  {cat}
                </Text>
                {formData.category === cat && (
                  <Ionicons name="checkmark" size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgGlass,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 40,
  },
  section: {
    marginBottom: Spacing['2xl'],
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 52,
    paddingHorizontal: Spacing.md,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    height: '100%',
  },
  searchLoader: {
    marginLeft: Spacing.sm,
  },
  clearButton: {
    marginLeft: Spacing.sm,
  },
  resultsContainer: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  resultLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  resultName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  resultCategory: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  imagePickerRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  imagePickerButton: {
    flex: 1,
    height: 120,
    backgroundColor: Colors.bgInput,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  imagePickerText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.lg,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 14,
  },
  fieldContainer: {
    marginBottom: Spacing.lg,
  },
  fieldLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 48,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  fieldInput: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    height: '100%',
  },
  rowFields: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  halfField: {
    flex: 1,
  },
  submitWrapper: {
    marginTop: Spacing.md,
    marginBottom: Spacing['4xl'],
  },
  submitButton: {
    height: 56,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadows.glow,
  },
  submitDisabled: {
    opacity: 0.7,
  },
  submitText: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: '#fff',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.bgSecondary,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing['2xl'],
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  categoryItemActive: {
    backgroundColor: Colors.primaryMuted,
  },
  categoryItemText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  categoryItemTextActive: {
    color: Colors.primaryLight,
    fontWeight: '700',
  },
});
