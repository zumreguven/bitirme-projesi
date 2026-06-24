/**
 * Ayarlar Ekranı
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { signOut } from '../../services/auth';
import { db } from '../../services/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Colors, Shadows, BorderRadius, FontSizes, Spacing } from '../../constants/Colors';
import { useRouter } from 'expo-router';


function SettingsItem({
  icon,
  iconColor,
  title,
  subtitle,
  onPress,
  isDestructive,
}: {
  icon: string;
  iconColor: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  isDestructive?: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.settingsItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.settingsItemIcon, { backgroundColor: `${iconColor}20` }]}>
        <Ionicons name={icon as any} size={22} color={iconColor} />
      </View>
      <View style={styles.settingsItemText}>
        <Text
          style={[
            styles.settingsItemTitle,
            isDestructive && { color: Colors.danger },
          ]}
        >
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.settingsItemSubtitle}>{subtitle}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadDataset = async () => {
    Alert.alert(
      'Veri Setini Yükle',
      "2000 bitkilik veri setini Firestore'a yüklemek istiyor musunuz? Bu işlem biraz sürebilir.",
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Yükle',
          onPress: async () => {
            setIsUploading(true);
            try {
              const dataset = require('../../assets/data/plant_dataset.json');
              // Sadece ilk 100 tanesini yükleyelim test için. Hepsi istenirse dilimlenebilir.
              // Çoklu yükleme için batch kullanılmalı ama basitlik açısından direkt setDoc
              let successCount = 0;
              for (const plant of dataset) {
                await setDoc(doc(db, 'plant_library', plant.id), plant);
                successCount++;
                if (successCount >= 100) break; // Hepsini yüklemek çok zaman alabilir ve kotayı doldurabilir
              }
              Alert.alert('Başarılı', `${successCount} bitki Firestore'a yüklendi.`);
            } catch (error) {
              console.error(error);
              Alert.alert('Hata', 'Veri yüklenirken hata oluştu.');
            } finally {
              setIsUploading(false);
            }
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert('Çıkış Yap', 'Hesabınızdan çıkış yapmak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Çıkış Yap',
        style: 'destructive',
        onPress: async () => {
          setIsLoggingOut(true);
          try {
            await signOut();
          } catch (error) {
            Alert.alert('Hata', 'Çıkış yapılırken bir sorun oluştu.');
          } finally {
            setIsLoggingOut(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ayarlar</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profil Kartı */}
        <View style={styles.profileCard}>
          <LinearGradient
            colors={[...Colors.gradientPrimary]}
            style={styles.avatarGradient}
          >
            <Text style={styles.avatarText}>
              {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
            </Text>
          </LinearGradient>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {user?.displayName || 'Kullanıcı'}
            </Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>
        </View>

        {/* Genel */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>Genel</Text>
          <View style={styles.sectionCard}>
            <SettingsItem
              icon="leaf"
              iconColor={Colors.primary}
              title="Bitkilerim"
              subtitle="Tüm bitkilerinizi yönetin"
              onPress={() => router.push('/')}
            />
            <SettingsItem
              icon="hardware-chip-outline"
              iconColor={Colors.info}
              title="ESP32 Cihaz Bilgisi"
              subtitle="IoT cihaz eşleştirme detayları"
              onPress={() => Alert.alert('Bilgi', 'ESP32 cihazınızın eşleştirme kodlarını ilgili bitkinin detay ekranının alt kısmından alabilirsiniz.')}
            />
          </View>
        </View>

        {/* Uygulama */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>Uygulama</Text>
          <View style={styles.sectionCard}>
            <SettingsItem
              icon="information-circle-outline"
              iconColor={Colors.textSecondary}
              title="Hakkında"
              subtitle="Versiyon 1.0.0"
            />
            <TouchableOpacity style={styles.settingsItem} onPress={handleUploadDataset}>
              <View style={[styles.settingsItemIcon, { backgroundColor: `${Colors.warning}20` }]}>
                {isUploading ? (
                  <ActivityIndicator size="small" color={Colors.warning} />
                ) : (
                  <Ionicons name="cloud-upload-outline" size={22} color={Colors.warning} />
                )}
              </View>
              <View style={styles.settingsItemText}>
                <Text style={styles.settingsItemTitle}>Veri Setini Yükle</Text>
                <Text style={styles.settingsItemSubtitle}>2000 Bitkiyi Firestore'a aktar</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Çıkış */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionCard}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleSignOut}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <ActivityIndicator size="small" color={Colors.danger} />
              ) : (
                <>
                  <Ionicons name="log-out-outline" size={22} color={Colors.danger} />
                  <Text style={styles.logoutText}>Çıkış Yap</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Bitki Sulama v1.0.0{'\n'}
          ESP32-S3 Akıllı Sulama Sistemi
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  header: {
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.xl,
  },
  headerTitle: {
    fontSize: FontSizes['2xl'],
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 100,
  },
  // Profile
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing['2xl'],
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  avatarGradient: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: FontSizes['2xl'],
    fontWeight: '800',
    color: '#fff',
  },
  profileInfo: {
    marginLeft: Spacing.lg,
    flex: 1,
  },
  profileName: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  profileEmail: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  // Sections
  sectionContainer: {
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  sectionCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  settingsItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsItemText: {
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  settingsItemSubtitle: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  logoutText: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.danger,
  },
  footer: {
    textAlign: 'center',
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: Spacing['2xl'],
    lineHeight: 18,
  },
});
