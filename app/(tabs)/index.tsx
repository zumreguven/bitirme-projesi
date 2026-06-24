/**
 * Dashboard - Bitkilerim Ana Ekranı
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { subscribePlants } from '../../services/firestore';
import PlantCard from '../../components/PlantCard';
import { UserPlant } from '../../types';
import { Colors, Shadows, BorderRadius, FontSizes, Spacing } from '../../constants/Colors';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [plants, setPlants] = useState<UserPlant[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribePlants(user.uid, (updatedPlants) => {
      setPlants(updatedPlants);
      setIsLoading(false);
      setRefreshing(false);
    });

    return () => unsubscribe();
  }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Listener otomatik güncelleyecek
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'İyi Günler';
    return 'İyi Akşamlar';
  };

  const getDateStr = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    };
    return now.toLocaleDateString('tr-TR', options);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <LinearGradient
          colors={[...Colors.gradientPrimary]}
          style={styles.emptyIcon}
        >
          <Ionicons name="leaf-outline" size={56} color="#fff" />
        </LinearGradient>
      </View>
      <Text style={styles.emptyTitle}>Henüz bitkiniz yok</Text>
      <Text style={styles.emptySubtitle}>
        İlk bitkinizi ekleyerek akıllı{'\n'}sulama sistemini kurmaya başlayın
      </Text>
      <View style={styles.emptyArrow}>
        <Ionicons name="arrow-down" size={28} color={Colors.primaryLight} />
      </View>
    </View>
  );

  const activePlants = plants.filter((p) => p.isSystemActive).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>
            {getGreeting()},{' '}
            <Text style={styles.userName}>
              {user?.displayName || 'Kullanıcı'}
            </Text>{' '}
            👋
          </Text>
          <Text style={styles.dateText}>{getDateStr()}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.plantCount}>
            <Ionicons name="leaf" size={16} color={Colors.primaryLight} />
            <Text style={styles.plantCountText}>{plants.length}</Text>
          </View>
        </View>
      </View>

      {/* Stats Bar */}
      {plants.length > 0 && (
        <View style={styles.statsBar}>
          <View style={styles.statCard}>
            <View style={[styles.statIconBg, { backgroundColor: Colors.primaryMuted }]}>
              <Ionicons name="leaf" size={18} color={Colors.primaryLight} />
            </View>
            <View>
              <Text style={styles.statValue}>{plants.length}</Text>
              <Text style={styles.statLabel}>Toplam Bitki</Text>
            </View>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <View style={[styles.statIconBg, { backgroundColor: Colors.successSoft }]}>
              <Ionicons name="pulse" size={18} color={Colors.success} />
            </View>
            <View>
              <Text style={styles.statValue}>{activePlants}</Text>
              <Text style={styles.statLabel}>Aktif Sistem</Text>
            </View>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <View style={[styles.statIconBg, { backgroundColor: Colors.infoSoft }]}>
              <Ionicons name="water" size={18} color={Colors.info} />
            </View>
            <View>
              <Text style={styles.statValue}>{plants.length - activePlants}</Text>
              <Text style={styles.statLabel}>Pasif</Text>
            </View>
          </View>
        </View>
      )}

      {/* Plant List */}
      <FlatList
        data={plants}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PlantCard
            plant={item}
            onPress={() => router.push(`/(tabs)/plant/${item.id}`)}
          />
        )}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primaryLight}
            colors={[Colors.primary]}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          plants.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  userName: {
    fontWeight: '800',
    color: Colors.primaryLight,
  },
  dateText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: 4,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  plantCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  plantCountText: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.primaryLight,
  },
  statsBar: {
    flexDirection: 'row',
    marginHorizontal: Spacing['2xl'],
    marginBottom: Spacing.xl,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSizes.lg,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
  },
  listContent: {
    paddingBottom: 100,
    paddingTop: Spacing.sm,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['4xl'],
  },
  emptyIconContainer: {
    marginBottom: Spacing['2xl'],
  },
  emptyIcon: {
    width: 112,
    height: 112,
    borderRadius: BorderRadius['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.glow,
  },
  emptyTitle: {
    fontSize: FontSizes['2xl'],
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyArrow: {
    marginTop: Spacing['3xl'],
    opacity: 0.6,
  },
});
