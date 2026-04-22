import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/src/theme/colors';
import { GlassCard } from '@/src/components/GlassCard';

export default function PrivacyCenterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [privacyLevel, setPrivacyLevel] = useState<'public' | 'contacts' | 'private'>('contacts');
  const [settings, setSettings] = useState({
    showProfilePicture: true,
    showLastSeen: false,
    showLocation: false,
    allowSearchByName: true,
    allowSearchByNumber: true,
    shareCallHistory: false,
    autoBlockUnknown: false,
    hideFromDirectory: false,
    dataSharing: false,
    analyticsEnabled: true,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const SettingItem = ({
    icon,
    title,
    subtitle,
    value,
    onToggle,
    destructive,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    value: boolean;
    onToggle: () => void;
    destructive?: boolean;
  }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <View style={[styles.iconBox, destructive && styles.iconBoxDestructive]}>
          <Feather name={icon as any} size={18} color={destructive ? Colors.spam : Colors.accent} />
        </View>
        <View>
          <Text style={[styles.settingTitle, destructive && styles.destructiveText]}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: 'rgba(255,255,255,0.2)', true: Colors.accent + '80' }}
        thumbColor={value ? Colors.accent : '#FFFFFF'}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.bgBlob} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Center</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: bottomPad + 20 }}>
        {/* Visibility Level */}
        <Text style={styles.sectionTitle}>Who can see my profile?</Text>
        <GlassCard style={styles.visibilityCard}>
          {(['public', 'contacts', 'private'] as const).map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.visibilityOption,
                privacyLevel === level && styles.visibilityOptionActive,
              ]}
              onPress={() => setPrivacyLevel(level)}
            >
              <View style={styles.visibilityIcon}>
                <MaterialIcons
                  name={
                    level === 'public' ? 'public' :
                    level === 'contacts' ? 'people' : 'lock'
                  }
                  size={22}
                  color={privacyLevel === level ? Colors.accent : Colors.textSecondary}
                />
              </View>
              <View style={styles.visibilityInfo}>
                <Text style={[
                  styles.visibilityTitle,
                  privacyLevel === level && styles.visibilityTitleActive,
                ]}>
                  {level === 'public' ? 'Everyone' :
                   level === 'contacts' ? 'My Contacts' : 'Nobody'}
                </Text>
                <Text style={styles.visibilitySubtitle}>
                  {level === 'public' ? 'Anyone can find and view your profile' :
                   level === 'contacts' ? 'Only saved contacts can see your info' :
                   'Your profile is completely hidden'}
                </Text>
              </View>
              {privacyLevel === level && (
                <MaterialIcons name="check-circle" size={22} color={Colors.accent} />
              )}
            </TouchableOpacity>
          ))}
        </GlassCard>

        {/* Profile Visibility Settings */}
        <Text style={styles.sectionTitle}>Profile Visibility</Text>
        <GlassCard>
          <SettingItem
            icon="image"
            title="Show Profile Picture"
            subtitle="Allow others to see your photo"
            value={settings.showProfilePicture}
            onToggle={() => toggleSetting('showProfilePicture')}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="clock"
            title="Show Last Seen"
            subtitle="Show when you were last active"
            value={settings.showLastSeen}
            onToggle={() => toggleSetting('showLastSeen')}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="map-pin"
            title="Show Location"
            subtitle="Display your city/region"
            value={settings.showLocation}
            onToggle={() => toggleSetting('showLocation')}
          />
        </GlassCard>

        {/* Search Settings */}
        <Text style={styles.sectionTitle}>Search Settings</Text>
        <GlassCard>
          <SettingItem
            icon="search"
            title="Search by Name"
            subtitle="People can find you by name"
            value={settings.allowSearchByName}
            onToggle={() => toggleSetting('allowSearchByName')}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="phone"
            title="Search by Number"
            subtitle="People can find you by phone"
            value={settings.allowSearchByNumber}
            onToggle={() => toggleSetting('allowSearchByNumber')}
          />
        </GlassCard>

        {/* Data & Privacy */}
        <Text style={styles.sectionTitle}>Data & Privacy</Text>
        <GlassCard>
          <SettingItem
            icon="share-2"
            title="Share Call History"
            subtitle="Contribute to spam detection"
            value={settings.shareCallHistory}
            onToggle={() => toggleSetting('shareCallHistory')}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="shield"
            title="Auto-block Unknown"
            subtitle="Block calls from unsaved numbers"
            value={settings.autoBlockUnknown}
            onToggle={() => toggleSetting('autoBlockUnknown')}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="eye-off"
            title="Hide from Directory"
            subtitle="Remove from public listings"
            value={settings.hideFromDirectory}
            onToggle={() => toggleSetting('hideFromDirectory')}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="users"
            title="Data Sharing"
            subtitle="Share data with partners"
            value={settings.dataSharing}
            onToggle={() => toggleSetting('dataSharing')}
            destructive
          />
        </GlassCard>

        {/* Data Management */}
        <Text style={styles.sectionTitle}>Data Management</Text>
        <GlassCard style={styles.dataCard}>
          <TouchableOpacity style={styles.dataAction}>
            <View style={styles.dataActionLeft}>
              <Feather name="download" size={20} color={Colors.accent} />
              <View>
                <Text style={styles.dataActionTitle}>Download My Data</Text>
                <Text style={styles.dataActionSubtitle}>Get a copy of all your data</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.dataAction}>
            <View style={styles.dataActionLeft}>
              <Feather name="trash-2" size={20} color={Colors.error} />
              <View>
                <Text style={[styles.dataActionTitle, styles.destructiveText]}>Clear Call History</Text>
                <Text style={styles.dataActionSubtitle}>Delete all call records</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.dataAction}>
            <View style={styles.dataActionLeft}>
              <Feather name="alert-triangle" size={20} color={Colors.spam} />
              <View>
                <Text style={[styles.dataActionTitle, styles.destructiveText]}>Delete Account</Text>
                <Text style={styles.dataActionSubtitle}>Permanently remove all data</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gradientStart },
  bgBlob: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: Colors.gradientEnd, top: -100, right: -100, opacity: 0.5,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 16,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  content: { flex: 1 },
  sectionTitle: {
    fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary,
    marginHorizontal: 20, marginTop: 20, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  visibilityCard: { padding: 8 },
  visibilityOption: {
    flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12,
  },
  visibilityOptionActive: { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  visibilityIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)', alignItems: 'center', justifyContent: 'center',
  },
  visibilityInfo: { flex: 1, marginLeft: 12 },
  visibilityTitle: { fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.textPrimary },
  visibilityTitleActive: { color: Colors.accent },
  visibilitySubtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 2 },
  settingItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 16,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)', alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  iconBoxDestructive: { backgroundColor: 'rgba(255, 82, 82, 0.15)' },
  settingTitle: { fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.textPrimary },
  settingSubtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 2 },
  destructiveText: { color: Colors.error },
  divider: {
    height: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 16,
  },
  dataCard: { padding: 0 },
  dataAction: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 16,
  },
  dataActionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  dataActionTitle: { fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.textPrimary },
  dataActionSubtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 2 },
});
