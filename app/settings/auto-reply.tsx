import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Platform,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/src/theme/colors';
import { GlassCard } from '@/src/components/GlassCard';

const { width } = Dimensions.get('window');

const DEFAULT_TEMPLATES = [
  {
    id: '1',
    name: 'Busy',
    message: "Hi, I'm busy right now. I'll call you back soon.",
    isActive: true,
    icon: 'briefcase',
  },
  {
    id: '2',
    name: 'In Meeting',
    message: "I'm in a meeting. Will get back to you shortly.",
    isActive: false,
    icon: 'users',
  },
  {
    id: '3',
    name: 'Driving',
    message: "I'm driving right now. I'll call you when I reach.",
    isActive: false,
    icon: 'truck',
  },
  {
    id: '4',
    name: 'On Vacation',
    message: "I'm on vacation. I'll respond when I return.",
    isActive: false,
    icon: 'sun',
  },
  {
    id: '5',
    name: 'Custom',
    message: '',
    isActive: false,
    icon: 'edit-2',
    isCustom: true,
  },
];

export default function AutoReplyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [enabled, setEnabled] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState('1');
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [customMessage, setCustomMessage] = useState('');
  const [autoReplyTo, setAutoReplyTo] = useState({
    everyone: false,
    contacts: true,
    unknown: false,
  });
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [silentHours, setSilentHours] = useState({ enabled: true, from: '22:00', to: '07:00' });

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const activeTemplate = templates.find(t => t.id === selectedTemplate);

  return (
    <View style={styles.container}>
      <View style={styles.bgBlob} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Auto Reply</Text>
        <Switch
          value={enabled}
          onValueChange={setEnabled}
          trackColor={{ false: 'rgba(255,255,255,0.2)', true: Colors.success + '80' }}
          thumbColor={enabled ? Colors.success : '#FFFFFF'}
        />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: bottomPad + 20 }}>
        {/* Status */}
        <GlassCard style={[styles.statusCard, enabled && styles.statusCardActive]}>
          <View style={[styles.statusIcon, enabled && styles.statusIconActive]}>
            <MaterialIcons name="reply" size={28} color={enabled ? Colors.success : Colors.textMuted} />
          </View>
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>Auto Reply is {enabled ? 'ON' : 'OFF'}</Text>
            <Text style={styles.statusSubtitle}>
              {enabled 
                ? `Responding with: ${activeTemplate?.name}`
                : 'Enable to automatically reply to calls'}
            </Text>
          </View>
        </GlassCard>

        {/* Templates */}
        <Text style={styles.sectionTitle}>Quick Templates</Text>
        <View style={styles.templatesGrid}>
          {templates.map((template) => (
            <TouchableOpacity
              key={template.id}
              style={[
                styles.templateCard,
                selectedTemplate === template.id && styles.templateCardActive,
              ]}
              onPress={() => setSelectedTemplate(template.id)}
            >
              <View style={[
                styles.templateIcon,
                selectedTemplate === template.id && styles.templateIconActive,
              ]}>
                <Feather name={template.icon as any} size={20} color={selectedTemplate === template.id ? Colors.accent : Colors.textSecondary} />
              </View>
              <Text style={[
                styles.templateName,
                selectedTemplate === template.id && styles.templateNameActive,
              ]}>{template.name}</Text>
              {selectedTemplate === template.id && (
                <MaterialIcons name="check-circle" size={16} color={Colors.accent} style={styles.templateCheck} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom Message */}
        <Text style={styles.sectionTitle}>Message</Text>
        <GlassCard style={styles.messageCard}>
          <TextInput
            style={styles.messageInput}
            multiline
            numberOfLines={4}
            placeholder="Enter your auto-reply message..."
            placeholderTextColor={Colors.textMuted}
            value={activeTemplate?.isCustom ? customMessage : activeTemplate?.message}
            onChangeText={(text) => {
              if (activeTemplate?.isCustom) {
                setCustomMessage(text);
              }
            }}
            editable={enabled}
          />
          <Text style={styles.charCount}>
            {(activeTemplate?.isCustom ? customMessage.length : activeTemplate?.message.length) || 0}/160
          </Text>
        </GlassCard>

        {/* Reply To */}
        <Text style={styles.sectionTitle}>Reply To</Text>
        <GlassCard>
          <View style={styles.replyOption}>
            <View style={styles.replyOptionLeft}>
              <Feather name="users" size={18} color={Colors.accent} />
              <Text style={styles.replyOptionText}>My Contacts</Text>
            </View>
            <Switch
              value={autoReplyTo.contacts}
              onValueChange={(v) => setAutoReplyTo({ ...autoReplyTo, contacts: v })}
              trackColor={{ false: 'rgba(255,255,255,0.2)', true: Colors.accent + '80' }}
              thumbColor={autoReplyTo.contacts ? Colors.accent : '#FFFFFF'}
              disabled={!enabled}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.replyOption}>
            <View style={styles.replyOptionLeft}>
              <Feather name="help-circle" size={18} color={Colors.textSecondary} />
              <Text style={styles.replyOptionText}>Unknown Numbers</Text>
            </View>
            <Switch
              value={autoReplyTo.unknown}
              onValueChange={(v) => setAutoReplyTo({ ...autoReplyTo, unknown: v })}
              trackColor={{ false: 'rgba(255,255,255,0.2)', true: Colors.accent + '80' }}
              thumbColor={autoReplyTo.unknown ? Colors.accent : '#FFFFFF'}
              disabled={!enabled}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.replyOption}>
            <View style={styles.replyOptionLeft}>
              <Feather name="globe" size={18} color={Colors.textSecondary} />
              <Text style={styles.replyOptionText}>Everyone</Text>
            </View>
            <Switch
              value={autoReplyTo.everyone}
              onValueChange={(v) => {
                setAutoReplyTo({
                  everyone: v,
                  contacts: v,
                  unknown: v,
                });
              }}
              trackColor={{ false: 'rgba(255,255,255,0.2)', true: Colors.accent + '80' }}
              thumbColor={autoReplyTo.everyone ? Colors.accent : '#FFFFFF'}
              disabled={!enabled}
            />
          </View>
        </GlassCard>

        {/* Schedule */}
        <Text style={styles.sectionTitle}>Schedule</Text>
        <GlassCard>
          <View style={styles.scheduleRow}>
            <View style={styles.scheduleLeft}>
              <MaterialIcons name="schedule" size={20} color={Colors.accent} />
              <View>
                <Text style={styles.scheduleTitle}>Scheduled Auto-Reply</Text>
                <Text style={styles.scheduleSubtitle}>Automatically send during set hours</Text>
              </View>
            </View>
            <Switch
              value={scheduleEnabled}
              onValueChange={setScheduleEnabled}
              trackColor={{ false: 'rgba(255,255,255,0.2)', true: Colors.accent + '80' }}
              thumbColor={scheduleEnabled ? Colors.accent : '#FFFFFF'}
              disabled={!enabled}
            />
          </View>
          {scheduleEnabled && (
            <View style={styles.timeRow}>
              <View style={styles.timeInput}>
                <Text style={styles.timeLabel}>From</Text>
                <TextInput
                  style={styles.timeField}
                  value={silentHours.from}
                  onChangeText={(t) => setSilentHours({ ...silentHours, from: t })}
                  editable={enabled}
                />
              </View>
              <Text style={styles.timeSeparator}>to</Text>
              <View style={styles.timeInput}>
                <Text style={styles.timeLabel}>To</Text>
                <TextInput
                  style={styles.timeField}
                  value={silentHours.to}
                  onChangeText={(t) => setSilentHours({ ...silentHours, to: t })}
                  editable={enabled}
                />
              </View>
            </View>
          )}
        </GlassCard>

        {/* Silent Hours */}
        <GlassCard style={styles.silentCard}>
          <View style={styles.silentRow}>
            <View style={styles.silentLeft}>
              <MaterialIcons name="nights-stay" size={20} color={Colors.textSecondary} />
              <View>
                <Text style={styles.silentTitle}>Silent Hours</Text>
                <Text style={styles.silentSubtitle}>No auto-reply during {silentHours.from} - {silentHours.to}</Text>
              </View>
            </View>
            <Switch
              value={silentHours.enabled}
              onValueChange={(v) => setSilentHours({ ...silentHours, enabled: v })}
              trackColor={{ false: 'rgba(255,255,255,0.2)', true: Colors.accent + '80' }}
              thumbColor={silentHours.enabled ? Colors.accent : '#FFFFFF'}
              disabled={!enabled}
            />
          </View>
        </GlassCard>

        {/* Stats */}
        <Text style={styles.sectionTitle}>Auto-Reply Stats</Text>
        <GlassCard style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>42</Text>
            <Text style={styles.statLabel}>Sent Today</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>156</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>1,247</Text>
            <Text style={styles.statLabel}>All Time</Text>
          </View>
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
  templatesGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 16,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  content: { flex: 1 },
  statusCard: {
    flexDirection: 'row', alignItems: 'center', margin: 20, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusCardActive: { borderColor: Colors.success + '50' },
  statusIcon: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.08)', alignItems: 'center', justifyContent: 'center',
  },
  statusIconActive: { backgroundColor: Colors.success + '20' },
  statusInfo: { marginLeft: 14, flex: 1 },
  statusTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  statusSubtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 2 },
  sectionTitle: {
    fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary,
    marginHorizontal: 20, marginTop: 24, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  templateCard: {
    width: (Dimensions.get('window').width - 60) / 3,
    alignItems: 'center', padding: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  templateCardActive: {
    backgroundColor: Colors.accent + '20', borderColor: Colors.accent,
  },
  templateIcon: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)', alignItems: 'center', justifyContent: 'center',
  },
  templateIconActive: { backgroundColor: Colors.accent + '30' },
  templateName: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textSecondary, marginTop: 8 },
  templateNameActive: { color: Colors.textPrimary },
  templateCheck: { position: 'absolute', top: 8, right: 8 },
  messageCard: { padding: 16 },
  messageInput: {
    fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.textPrimary,
    minHeight: 80, textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted,
    textAlign: 'right', marginTop: 8,
  },
  replyOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 16,
  },
  replyOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  replyOptionText: { fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)', marginHorizontal: 16 },
  scheduleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 16,
  },
  scheduleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  scheduleTitle: { fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.textPrimary },
  scheduleSubtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 2 },
  timeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingBottom: 16,
  },
  timeInput: { flex: 1 },
  timeLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginBottom: 6 },
  timeField: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary,
    textAlign: 'center',
  },
  timeSeparator: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 20 },
  silentCard: { marginTop: 12 },
  silentRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14,
  },
  silentLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  silentTitle: { fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.textPrimary },
  silentSubtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 2 },
  statsCard: { flexDirection: 'row', justifyContent: 'space-around', padding: 20 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 24, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  statLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)' },
});

