/**
 * Bitki Profil & IoT Kontrol Ekranı [KRİTİK]
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../context/AuthContext';
import { getPlant, deletePlant } from '../../../services/firestore';
import {
  subscribeToDevice,
  setSystemActive,
  forceStopSystem,
  initializeDevice,
} from '../../../services/iotService';
import { updatePlant } from '../../../services/firestore';
import { UserPlant, DeviceState } from '../../../types';
import { Colors, Shadows, BorderRadius, FontSizes, Spacing } from '../../../constants/Colors';
import Svg, { Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');

// Nem Göstergesi Bileşeni
function MoistureGauge({ value, maxValue = 4095 }: { value: number; maxValue?: number }) {
  const size = 140;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(value / maxValue, 1);
  const strokeDashoffset = circumference * (1 - percentage);

  const getColor = () => {
    if (percentage > 0.6) return Colors.success;
    if (percentage > 0.3) return Colors.warning;
    return Colors.danger;
  };

  const getLabel = () => {
    if (percentage > 0.6) return 'Nemli';
    if (percentage > 0.3) return 'Normal';
    return 'Kuru';
  };

  return (
    <View style={gaugeStyles.container}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Arka plan çemberi */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.bgTertiary}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Değer çemberi */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor()}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={gaugeStyles.centerContent}>
        <Text style={[gaugeStyles.value, { color: getColor() }]}>{value}</Text>
        <Text style={gaugeStyles.label}>{getLabel()}</Text>
      </View>
    </View>
  );
}

const gaugeStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
  },
  value: {
    fontSize: FontSizes['2xl'],
    fontWeight: '800',
  },
  label: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
});

// Info kartı bileşeni
function InfoCard({
  icon,
  iconColor,
  label,
  value,
}: {
  icon: string;
  iconColor: string;
  label: string;
  value: string;
}) {
  return (
    <View style={infoStyles.card}>
      <View style={[infoStyles.iconBg, { backgroundColor: `${iconColor}20` }]}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={infoStyles.textContainer}>
        <Text style={infoStyles.label}>{label}</Text>
        <Text style={infoStyles.value} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  value: {
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    fontWeight: '700',
    marginTop: 2,
  },
});

export default function PlantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [plant, setPlant] = useState<UserPlant | null>(null);
  const [deviceState, setDeviceState] = useState<DeviceState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [pairingDeviceId, setPairingDeviceId] = useState('');
  const [isPairing, setIsPairing] = useState(false);

  // Bitki verilerini yükle
  useEffect(() => {
    if (!user || !id) return;

    const loadPlant = async () => {
      const plantData = await getPlant(user.uid, id);
      setPlant(plantData);
      setIsLoading(false);
    };

    loadPlant();
  }, [user, id]);

  // IoT cihazını dinle
  useEffect(() => {
    if (!plant?.deviceId) return; // Eğer cihaz eşleştirilmemişse dinleme

    const unsubscribe = subscribeToDevice(plant.deviceId, (state) => {
      if (state) {
        setDeviceState(state);
      } else {
        // Cihaz henüz oluşturulmamışsa başlat
        initializeDevice(plant.deviceId!, plant.waterStartADC, plant.waterStopADC);
      }
    });

    return () => unsubscribe();
  }, [plant?.deviceId]);

  // Sistemi başlat/durdur
  const handleToggleSystem = async () => {
    if (!user || !id || !deviceState || !plant?.deviceId) return;

    setIsToggling(true);
    try {
      await setSystemActive(plant.deviceId, user.uid, id, !deviceState.is_system_active);
    } catch (error) {
      Alert.alert('Hata', 'Sistem durumu değiştirilemedi.');
    } finally {
      setIsToggling(false);
    }
  };

  // Acil durdurma
  const handleForceStop = async () => {
    if (!user || !id || !plant?.deviceId) return;

    Alert.alert(
      '⚠️ Acil Durdurma',
      'Pompa anında durduracak. Emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'DURDUR',
          style: 'destructive',
          onPress: async () => {
            setIsStopping(true);
            try {
              await forceStopSystem(plant.deviceId!, user.uid, id);
            } catch (error) {
              Alert.alert('Hata', 'Acil durdurma başarısız.');
            } finally {
              setIsStopping(false);
            }
          },
        },
      ]
    );
  };

  // Cihaz eşleştirme
  const handlePairDevice = async () => {
    if (!user || !id || !pairingDeviceId.trim()) return;
    
    setIsPairing(true);
    try {
      await updatePlant(user.uid, id, { deviceId: pairingDeviceId.trim() });
      setPlant({ ...plant!, deviceId: pairingDeviceId.trim() });
      Alert.alert('Başarılı', 'Cihaz başarıyla eşleştirildi!');
    } catch (error) {
      Alert.alert('Hata', 'Cihaz eşleştirilirken bir sorun oluştu.');
    } finally {
      setIsPairing(false);
    }
  };

  // Eşleştirme kaldır
  const handleUnpairDevice = async () => {
    if (!user || !id) return;
    
    Alert.alert('Eşleştirmeyi Kaldır', 'Cihaz bağlantısını koparmak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Kaldır',
        style: 'destructive',
        onPress: async () => {
          try {
            await updatePlant(user.uid, id, { deviceId: '' }); // Firebase doesn't allow undefined easily in update, empty string is safer
            setPlant({ ...plant!, deviceId: '' });
            setDeviceState(null);
          } catch (error) {
            Alert.alert('Hata', 'Eşleştirme kaldırılamadı.');
          }
        }
      }
    ]);
  };

  // Bitki silme
  const handleDelete = () => {
    if (!user || !id) return;

    Alert.alert(
      'Bitkiyi Sil',
      `"${plant?.name}" bitkisini silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePlant(user.uid, id);
              router.back();
            } catch (error) {
              Alert.alert('Hata', 'Bitki silinemedi.');
            }
          },
        },
      ]
    );
  };

  if (isLoading || !plant) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const isActive = deviceState?.is_system_active ?? false;
  const moisture = deviceState?.sensor_data?.moisture ?? 0;
  const motorStatus = deviceState?.sensor_data?.motor_status ?? 0;
  
  // Hedef Nemi Hesapla
  const targetMoisturePercent = Math.round(((4095 - plant.waterStartADC) / 4095) * 100);
  
  // Çevrimiçi Durumu Kontrolü (Son 60 saniye içinde veri geldiyse)
  const lastUpdated = deviceState?.sensor_data?.last_updated ?? 0;
  const isOnline = lastUpdated > 0 && (Date.now() - lastUpdated) < 60000;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Image Header */}
        <View style={styles.heroContainer}>
          {plant.imageUri ? (
            <Image source={{ uri: plant.imageUri }} style={styles.heroImage} />
          ) : (
            <LinearGradient
              colors={[...Colors.gradientHero]}
              style={styles.heroPlaceholder}
            >
              <Ionicons name="leaf" size={80} color="rgba(255,255,255,0.3)" />
            </LinearGradient>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(15,23,42,0.8)', Colors.bgPrimary]}
            style={styles.heroOverlay}
          />

          {/* Back & Delete Buttons */}
          <View style={[styles.heroActions, { top: insets.top + 8 }]}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.heroActionButton}
            >
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              style={styles.heroActionButton}
            >
              <Ionicons name="trash-outline" size={22} color={Colors.danger} />
            </TouchableOpacity>
          </View>

          {/* Plant Name */}
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroTitle}>{plant.name}</Text>
            <View style={styles.heroCategoryBadge}>
              <Ionicons name="leaf-outline" size={14} color={Colors.primaryLight} />
              <Text style={styles.heroCategoryText}>{plant.category}</Text>
            </View>
          </View>
        </View>

        {/* IoT Kontrol Paneli (Eğer cihaz bağlıysa göster) */}
        {plant.deviceId && plant.deviceId !== '' ? (
          <View style={styles.controlPanel}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg }}>
              <Text style={styles.sectionTitleWithoutMargin}>
                <Ionicons name="hardware-chip-outline" size={18} color={Colors.primaryLight} />{' '}
                Donanım Kontrolü
              </Text>
              {/* Çevrimiçi/Çevrimdışı Rozeti */}
              <View style={[styles.onlineBadge, { backgroundColor: isOnline ? Colors.successSoft : Colors.dangerSoft }]}>
                <View style={[styles.onlineDot, { backgroundColor: isOnline ? Colors.success : Colors.danger }]} />
                <Text style={[styles.onlineText, { color: isOnline ? Colors.success : Colors.danger }]}>
                  {isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
                </Text>
              </View>
            </View>

            {/* Nem Göstergesi + Motor Durumu */}
            <View style={styles.sensorRow}>
              <View style={styles.gaugeContainer}>
                <Text style={styles.gaugeLabel}>Anlık Nem (%)</Text>
                <MoistureGauge value={moisture} maxValue={100} />
                <Text style={styles.targetMoistureText}>Hedef: %{targetMoisturePercent}</Text>
              </View>
              <View style={styles.motorStatusContainer}>
                <View
                  style={[
                    styles.motorBadge,
                    {
                      backgroundColor:
                        motorStatus === 1 ? Colors.successSoft : Colors.bgTertiary,
                    },
                  ]}
                >
                  <Ionicons
                    name={motorStatus === 1 ? 'water' : 'water-outline'}
                    size={28}
                    color={motorStatus === 1 ? Colors.success : Colors.textMuted}
                  />
                </View>
                <Text style={styles.motorLabel}>Pompa</Text>
                <Text
                  style={[
                    styles.motorStatus,
                    { color: motorStatus === 1 ? Colors.success : Colors.textMuted },
                  ]}
                >
                  {motorStatus === 1 ? 'AÇIK' : 'KAPALI'}
                </Text>
              </View>
            </View>

            {/* Kontrol Butonları */}
            <View style={styles.controlButtons}>
              {/* Sistemi Başlat/Durdur */}
              <TouchableOpacity
                onPress={handleToggleSystem}
                disabled={isToggling}
                activeOpacity={0.8}
                style={styles.controlButtonWrapper}
              >
                <LinearGradient
                  colors={
                    isActive
                      ? [Colors.warning, '#D97706']
                      : [...Colors.gradientPrimary]
                  }
                  style={styles.controlButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isToggling ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons
                        name={isActive ? 'pause-circle' : 'play-circle'}
                        size={26}
                        color="#fff"
                      />
                      <View>
                        <Text style={styles.controlButtonText}>
                          {isActive ? 'Sistemi Durdur' : 'Sistemi Başlat'}
                        </Text>
                        <Text style={styles.controlButtonSubtext}>
                          {isActive
                            ? 'Otomatik sulama aktif'
                            : 'Otomatik sulamayı başlat'}
                        </Text>
                      </View>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Force Stop Durumu */}
            {deviceState?.force_stop && (
              <View style={styles.forceStopBanner}>
                <Ionicons name="warning" size={20} color={Colors.warning} />
                <Text style={styles.forceStopText}>
                  Acil durdurma aktif! Sistemi yeniden başlatmak için "Sistemi Başlat" butonuna basın.
                </Text>
              </View>
            )}

            <TouchableOpacity 
              style={{marginTop: Spacing.xl, alignSelf: 'center'}}
              onPress={handleUnpairDevice}
            >
              <Text style={{color: Colors.danger, fontSize: FontSizes.sm, fontWeight: '600'}}>Cihaz Bağlantısını Kopar</Text>
            </TouchableOpacity>

          </View>
        ) : (
          /* Cihaz Eşleştirme UI */
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="hardware-chip" size={18} color={Colors.primaryLight} />{' '}
              Cihaz Eşleştir
            </Text>
            <View style={styles.pairingCard}>
              <Text style={styles.pairingDesc}>
                Bu bitkiyi sulayacak olan IoT cihazının kimliğini girin. (Örn: BITKI_MOTOR_01)
              </Text>
              
              <View style={[styles.pairingCodeBox, { padding: 0 }]}>
                <TextInput
                  style={{ flex: 1, color: Colors.textPrimary, padding: Spacing.md, fontSize: FontSizes.md }}
                  placeholder="Cihaz ID"
                  placeholderTextColor={Colors.textMuted}
                  value={pairingDeviceId}
                  onChangeText={setPairingDeviceId}
                  autoCapitalize="characters"
                />
              </View>

              <TouchableOpacity
                style={{ backgroundColor: Colors.primary, padding: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center', marginTop: Spacing.md }}
                onPress={handlePairDevice}
                disabled={isPairing || !pairingDeviceId.trim()}
              >
                {isPairing ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold' }}>Cihazı Eşleştir</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Bitki Bilgileri */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.primaryLight} />{' '}
            Bitki Bilgileri
          </Text>

          <View style={styles.infoGrid}>
            <InfoCard
              icon="water-outline"
              iconColor={Colors.info}
              label="Sulama Başlama (ADC)"
              value={plant.waterStartADC.toString()}
            />
            <InfoCard
              icon="water"
              iconColor={Colors.primary}
              label="Sulama Durma (ADC)"
              value={plant.waterStopADC.toString()}
            />
            <InfoCard
              icon="thermometer-outline"
              iconColor={Colors.warning}
              label="Sıcaklık Aralığı"
              value={`${plant.minTemp}°C - ${plant.maxTemp}°C`}
            />
            <InfoCard
              icon="trending-up"
              iconColor={Colors.success}
              label="Büyüme Hızı"
              value={`${plant.growthRate} cm/ay`}
            />
            <InfoCard
              icon="earth"
              iconColor="#A78BFA"
              label="Toprak Tipi"
              value={plant.soilType || 'Belirtilmemiş'}
            />
            <InfoCard
              icon="calendar-outline"
              iconColor={Colors.warning}
              label="Gübreleme Periyodu"
              value={`${plant.fertPeriod} gün`}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgPrimary,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  // Hero
  heroContainer: {
    height: 300,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 160,
  },
  heroActions: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroActionButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTextContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  heroTitle: {
    fontSize: FontSizes['3xl'],
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  heroCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryMuted,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  heroCategoryText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.primaryLight,
  },
  // Control Panel
  controlPanel: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
  },
  sectionTitleWithoutMargin: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  onlineText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
  },
  sensorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
    ...Shadows.small,
  },
  gaugeContainer: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  gaugeLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  targetMoistureText: {
    fontSize: FontSizes.xs,
    color: Colors.primary,
    fontWeight: '700',
    marginTop: Spacing.xs,
  },
  motorStatusContainer: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  motorBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  motorLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  motorStatus: {
    fontSize: FontSizes.md,
    fontWeight: '800',
  },
  controlButtons: {
    gap: Spacing.md,
  },
  controlButtonWrapper: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  controlButtonText: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: '#fff',
  },
  controlButtonSubtext: {
    fontSize: FontSizes.xs,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  forceStopBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.warningSoft,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  forceStopText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.warning,
    fontWeight: '500',
    lineHeight: 20,
  },
  // Info Section
  infoSection: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing['2xl'],
  },
  infoGrid: {
    gap: Spacing.md,
  },
  // Pairing
  pairingCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pairingDesc: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  pairingCodeBox: {
    backgroundColor: Colors.bgTertiary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  pairingLabel: {
    fontSize: FontSizes.xs,
    color: Colors.primaryLight,
    fontWeight: '700',
    width: 70,
  },
  pairingCode: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
  },
});
