import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/src/theme/colors';
import { GlassInput } from '@/src/components/GlassInput';
import { GlassButton } from '@/src/components/GlassButton';
import { AvatarBadge } from '@/src/components/AvatarBadge';
import { getProfile, updateProfile, Profile } from '@/src/api';

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');

  // Load profile data
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await getProfile();
      setProfile(data);
      setDisplayName(data.displayName || '');
      setBio(data.bio || '');
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateProfile({
        displayName,
        bio,
      });
      router.back();
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { paddingTop: topPad }]} contentContainerStyle={{ paddingBottom: 60 }}>
      <View style={styles.bgBlob} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <>
          <View style={styles.avatarSection}>
            <AvatarBadge name={displayName || profile?.displayName || 'User'} size={80} />
            <TouchableOpacity style={styles.editAvatarBtn}>
              <Feather name="camera" size={14} color={Colors.accent} />
              <Text style={styles.editAvatarText}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <GlassInput label="Display Name" value={displayName} onChangeText={setDisplayName} />
            <View style={{ height: 12 }} />
            <GlassInput label="Bio" value={bio} onChangeText={setBio} />
            <View style={{ height: 24 }} />
            <GlassButton title={saving ? 'Saving...' : 'Save Changes'} onPress={handleSave} fullWidth />
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gradientStart },
  bgBlob: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: Colors.accent, opacity: 0.07, top: -60, right: -60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
  backBtn: { padding: 8 },
  title: { color: Colors.textPrimary, fontSize: 17, fontFamily: 'Inter_700Bold' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: Colors.textSecondary, fontSize: 16, fontFamily: 'Inter_500Medium' },
  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  editAvatarBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(146,95,226,0.12)', borderWidth: 1, borderColor: 'rgba(146,95,226,0.3)' },
  editAvatarText: { color: Colors.accent, fontSize: 13, fontFamily: 'Inter_500Medium' },
  form: { paddingHorizontal: 20 },
});
