/**
 * PlantCard - Bitki kartı bileşeni
 * Dashboard'da her bitki için gösterilen şık kart
 */
import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { UserPlant } from '../types';
import { Colors, Shadows, BorderRadius, FontSizes, Spacing } from '../constants/Colors';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;

interface PlantCardProps {
  plant: UserPlant;
  onPress: () => void;
}

const getCategoryIcon = (category: string): string => {
  switch (category) {
    case 'Sebzeler':
      return 'nutrition-outline';
    case 'Süs Bitkileri (İç Mekan)':
      return 'home-outline';
    case 'Süs Bitkileri (Dış Mekan)':
      return 'sunny-outline';
    case 'Tıbbi ve Aromatik Bitkiler':
      return 'medkit-outline';
    case 'Meyveler':
      return 'cafe-outline';
    case 'Kaktüs ve Sukulentler':
      return 'leaf-outline';
    default:
      return 'leaf-outline';
  }
};

const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'Sebzeler':
      return '#22C55E';
    case 'Süs Bitkileri (İç Mekan)':
      return '#A78BFA';
    case 'Süs Bitkileri (Dış Mekan)':
      return '#F59E0B';
    case 'Tıbbi ve Aromatik Bitkiler':
      return '#EC4899';
    case 'Meyveler':
      return '#F97316';
    case 'Kaktüs ve Sukulentler':
      return '#06B6D4';
    default:
      return Colors.primary;
  }
};

export default function PlantCard({ plant, onPress }: PlantCardProps) {
  const categoryColor = getCategoryColor(plant.category);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={styles.cardWrapper}
    >
      <View style={styles.card}>
        {/* Bitki Fotoğrafı */}
        <View style={styles.imageContainer}>
          {plant.imageUri ? (
            <Image source={{ uri: plant.imageUri }} style={styles.image} />
          ) : (
            <LinearGradient
              colors={[Colors.bgTertiary, Colors.bgSecondary]}
              style={styles.placeholderImage}
            >
              <Ionicons name="leaf" size={40} color={Colors.primaryLight} />
            </LinearGradient>
          )}

          {/* Aktif/Pasif Badge */}
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: plant.isSystemActive
                  ? Colors.successSoft
                  : Colors.dangerSoft,
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: plant.isSystemActive
                    ? Colors.success
                    : Colors.danger,
                },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                {
                  color: plant.isSystemActive
                    ? Colors.success
                    : Colors.danger,
                },
              ]}
            >
              {plant.isSystemActive ? 'Sulama: Açık' : 'Sulama: Kapalı'}
            </Text>
          </View>
        </View>

        {/* Bilgi Alanı */}
        <View style={styles.infoContainer}>
          <Text style={styles.plantName} numberOfLines={1}>
            {plant.name}
          </Text>

          {/* Kategori */}
          <View style={styles.categoryRow}>
            <Ionicons
              name={getCategoryIcon(plant.category) as any}
              size={14}
              color={categoryColor}
            />
            <Text style={[styles.categoryText, { color: categoryColor }]} numberOfLines={1}>
              {plant.category}
            </Text>
          </View>

          {/* Alt Bilgiler */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="water-outline" size={14} color={Colors.info} />
              <Text style={styles.statText}>
                {plant.waterStartADC}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="thermometer-outline" size={14} color={Colors.warning} />
              <Text style={styles.statText}>
                {plant.minTemp}°-{plant.maxTemp}°
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="trending-up-outline" size={14} color={Colors.success} />
              <Text style={styles.statText}>
                {plant.growthRate} cm
              </Text>
            </View>
          </View>
        </View>

        {/* Chevron */}
        <View style={styles.chevronContainer}>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginHorizontal: Spacing['2xl'],
    marginBottom: Spacing.lg,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  imageContainer: {
    width: 100,
    height: 120,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
  },
  infoContainer: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
    gap: 6,
  },
  plantName: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: Colors.border,
  },
  chevronContainer: {
    justifyContent: 'center',
    paddingRight: Spacing.md,
  },
});
