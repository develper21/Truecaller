import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/src/theme/colors';
import { GlassCard } from '@/src/components/GlassCard';
import { AvatarBadge } from '@/src/components/AvatarBadge';
import { getProfile, Profile, logout } from '@/src/api/auth';
import { getUserData } from '@/src/api/client';

const SETTINGS = [
  {
    section: 'Account',
    items: [
      { icon: 'user', label: 'Edit Profile', route: '/edit-profile' },
      { icon: 'eye', label: 'Who Viewed My Profile', route: '/who-viewed' },
      { icon: 'star', label: 'Favorites', route: '/favorites' },
    ],
  },
  {
    section: 'Preferences',
    items: [
      { icon: 'bell', label: 'Notifications', route: '/settings/notifications' },
      { icon: 'lock', label: 'Privacy', route: '/settings/privacy' },
      { icon: 'shield', label: 'Security', route: '/settings/security' },
      { icon: 'globe', label: 'Language', route: '/settings/language' },
    ],
  },
  {
    section: 'Support',
    items: [
      { icon: 'help-circle', label: 'Help & Support', route: '/help' },
      { icon: 'info', label: 'About TrueGuard', route: '/about' },
    ],
  },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userPhone, setUserPhone] = useState<string>('');

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  // Fetch profile from API
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const profileData = await getProfile();
      setProfile(profileData);
      
      // Get user phone from stored data
      const userData = await getUserData();
      if (userData?.phoneNumber) {
        setUserPhone(userData.phoneNumber);
      }
    } catch (err: any) {
      console.error('Failed to fetch profile:', err);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load profile on mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch (err: any) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: bottomPad + 80 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.bgBlob} />

      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Text style={styles.title}>Profile</Text>
      </View>

      {/* Profile Card */}
      <View style={styles.profileSection}>
        <GlassCard style={styles.profileCard}>
          <View style={styles.profileRow}>
            <AvatarBadge name={profile?.displayName || 'User'} avatarUrl={profile?.avatarUrl} size={64} />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile?.displayName || 'User'}</Text>
              <Text style={styles.profilePhone}>{userPhone || '+91 **********'}</Text>
              <View style={styles.verifiedRow}>
                <Feather name="check-circle" size={13} color={profile?.isVerified ? Colors.success : Colors.textMuted} />
                <Text style={styles.verifiedText}>{profile?.isVerified ? 'Verified Account' : 'Unverified Account'}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => router.push('/edit-profile')}>
              <Feather name="edit-2" size={18} color={Colors.accent} />
            </TouchableOpacity>
          </View>
          <View style={styles.profileStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>48</Text>
              <Text style={styles.statLabel}>Profile Views</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>12</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: Colors.spam }]}>3</Text>
              <Text style={styles.statLabel}>Blocked</Text>
            </View>
          </View>
        </GlassCard>

        {/* Quick Toggles */}
        <GlassCard style={styles.togglesCard}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <Feather name="moon" size={18} color={Colors.accent} />
              <Text style={styles.toggleLabel}>Dark Mode</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: Colors.accent }}
              thumbColor="#FFFFFF"
            />
          </View>
          <View style={[styles.toggleRow, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)' }]}>
            <View style={styles.toggleLeft}>
              <Feather name="bell" size={18} color={Colors.accent} />
              <Text style={styles.toggleLabel}>Push Notifications</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: Colors.accent }}
              thumbColor="#FFFFFF"
            />
          </View>
        </GlassCard>
      </View>

      {/* Settings Sections */}
      {SETTINGS.map((section) => (
        <View key={section.section} style={styles.section}>
          <Text style={styles.sectionLabel}>{section.section}</Text>
          <GlassCard style={styles.sectionCard} noBorder>
            {section.items.map((item, i) => (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.menuItem,
                  i < section.items.length - 1 && styles.menuItemBorder,
                ]}
                onPress={() => router.push(item.route as any)}
              >
                <View style={styles.menuIcon}>
                  <Feather name={item.icon as any} size={16} color={Colors.accent} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Feather name="chevron-right" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </GlassCard>
        </View>
      ))}

      {/* Logout */}
      <View style={styles.section}>
        <GlassCard style={styles.sectionCard} noBorder>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.replace('/login')}>
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(255,82,82,0.1)' }]}>
              <Feather name="log-out" size={16} color={Colors.error} />
            </View>
            <Text style={[styles.menuLabel, { color: Colors.error }]}>Sign Out</Text>
          </TouchableOpacity>
        </GlassCard>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gradientStart },
  bgBlob: {
    position: 'absolute', width: 280, height: 280, borderRadius: 140,
    backgroundColor: Colors.accent, top: -80, right: -80, opacity: 0.08,
  },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  title: { color: Colors.textPrimary, fontSize: 24, fontFamily: 'Inter_700Bold' },
  profileSection: { paddingHorizontal: 16, gap: 10, marginBottom: 4 },
  profileCard: { padding: 16 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  profileInfo: { flex: 1 },
  profileName: { color: Colors.textPrimary, fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  profilePhone: { color: Colors.textSecondary, fontSize: 14, fontFamily: 'Inter_400Regular', marginBottom: 4 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedText: { color: Colors.success, fontSize: 12, fontFamily: 'Inter_500Medium' },
  profileStats: { flexDirection: 'row', paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { color: Colors.textPrimary, fontSize: 20, fontFamily: 'Inter_700Bold' },
  statLabel: { color: Colors.textSecondary, fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 4 },
  togglesCard: { padding: 0 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  toggleLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  toggleLabel: { color: Colors.textPrimary, fontSize: 15, fontFamily: 'Inter_500Medium' },
  section: { paddingHorizontal: 16, marginBottom: 4 },
  sectionLabel: {
    color: Colors.textSecondary, fontSize: 12, fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 14,
  },
  sectionCard: { padding: 0, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
  menuIcon: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(146,95,226,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { flex: 1, color: Colors.textPrimary, fontSize: 15, fontFamily: 'Inter_400Regular' },
});
