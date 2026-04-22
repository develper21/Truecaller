import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/src/theme/colors';
import { GlassCard } from '@/src/components/GlassCard';
import { getMyBusiness, updateMyBusiness, BusinessAccount } from '@/src/api';

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const BUSINESS_CATEGORIES = ['Healthcare', 'Finance', 'Education', 'Retail', 'Technology', 'Real Estate', 'Other'];

export default function BusinessProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [business, setBusiness] = useState<BusinessAccount | null>(null);
  const [hasBusiness, setHasBusiness] = useState(false);

  useEffect(() => {
    loadBusiness();
  }, []);

  const loadBusiness = async () => {
    try {
      setLoading(true);
      const data = await getMyBusiness();
      setBusiness(data);
      setHasBusiness(true);
    } catch (error) {
      console.error('Failed to load business:', error);
      setHasBusiness(false);
    } finally {
      setLoading(false);
    }
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Loading business profile...</Text>
      </View>
    );
  }

  if (!hasBusiness || !business) {
    return (
      <View style={[styles.container, styles.centered]}>
        <MaterialIcons name="business" size={64} color={Colors.textMuted} />
        <Text style={styles.noBusinessTitle}>No Business Account</Text>
        <Text style={styles.noBusinessText}>Create a business account to get started</Text>
        <TouchableOpacity style={styles.createBtn} onPress={() => {/* TODO: Navigate to business creation */}}>
          <Text style={styles.createBtnText}>Create Business Account</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSave = async () => {
    if (!business) return;
    try {
      setSaving(true);
      await updateMyBusiness({
        companyName: business.companyName,
        description: business.description,
        website: business.website,
        email: business.email,
        workingHours: business.workingHours,
        callIntent: business.callIntent,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save business:', error);
    } finally {
      setSaving(false);
    }
  };

  const getVerificationBadge = () => {
    if (business.verificationTier === 'gold') {
      return { icon: 'verified', color: '#FFD700', text: 'Gold Verified' };
    }
    if (business.verificationTier === 'silver') {
      return { icon: 'verified', color: '#C0C0C0', text: 'Silver Verified' };
    }
    return { icon: 'verified', color: '#CD7F32', text: 'Verified' };
  };

  const badge = business ? getVerificationBadge() : getVerificationBadge();

  return (
    <View style={styles.container}>
      <View style={styles.bgBlob} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Business Profile</Text>
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.editBtn}>
          <Feather name={isEditing ? 'check' : 'edit-2'} size={20} color={Colors.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: bottomPad + 20 }}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={[styles.verificationBadge, { backgroundColor: badge.color + '20' }]}>
            <MaterialIcons name="verified" size={12} color={badge.color} />
            <Text style={[styles.verificationText, { color: badge.color }]}>{badge.text}</Text>
          </View>

          {isEditing ? (
            <TextInput
              style={styles.nameInput}
              value={business.companyName}
              onChangeText={(text) => setBusiness({ ...business, companyName: text })}
              autoFocus
            />
          ) : (
            <Text style={styles.businessName}>{business.companyName}</Text>
          )}

          <View style={styles.ratingRow}>
            <MaterialIcons name="star" size={18} color="#FFC107" />
            <Text style={styles.rating}>{business.customerRating || 0}</Text>
            <Text style={styles.reviewCount}>({business.reviewCount} reviews)</Text>
          </View>
        </View>

        {/* Category */}
        <Text style={styles.sectionTitle}>Business Category</Text>
        <View style={styles.categoryGrid}>
          {BUSINESS_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                business.category === cat && styles.categoryChipActive,
              ]}
              onPress={() => isEditing && setBusiness({ ...business, category: cat })}
              disabled={!isEditing}
            >
              <Text style={[
                styles.categoryText,
                business.category === cat && styles.categoryTextActive,
              ]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Contact Info */}
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <GlassCard>
          <View style={styles.contactItem}>
            <Feather name="phone" size={18} color={Colors.accent} />
            <Text style={styles.contactText}>{'Business Number'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.contactItem}>
            <Feather name="mail" size={18} color={Colors.accent} />
            {isEditing ? (
              <TextInput
                style={styles.contactInput}
                value={business.email || ''}
                onChangeText={(text) => setBusiness({ ...business, email: text })}
              />
            ) : (
              <Text style={styles.contactText}>{business.email || 'Not set'}</Text>
            )}
          </View>
          <View style={styles.divider} />
          <View style={styles.contactItem}>
            <Feather name="globe" size={18} color={Colors.accent} />
            {isEditing ? (
              <TextInput
                style={styles.contactInput}
                value={business.website || ''}
                onChangeText={(text) => setBusiness({ ...business, website: text })}
              />
            ) : (
              <Text style={styles.contactText}>{business.website || 'Not set'}</Text>
            )}
          </View>
          <View style={styles.divider} />
          <View style={styles.contactItem}>
            <Feather name="map-pin" size={18} color={Colors.accent} />
            {isEditing ? (
              <TextInput
                style={styles.contactInput}
                value={business.address || ''}
                onChangeText={(text) => setBusiness({ ...business, address: text })}
              />
            ) : (
              <Text style={styles.contactText}>{business.address || 'Not set'}</Text>
            )}
          </View>
        </GlassCard>

        {/* Working Hours */}
        <Text style={styles.sectionTitle}>Working Hours</Text>
        <GlassCard>
          {WEEK_DAYS.map((day) => {
            const dayData = business.workingHours?.[day.toLowerCase() as keyof BusinessAccount['workingHours']] || { isOpen: false, open: '', close: '' };
            return (
              <View key={day}>
                <View style={styles.hoursRow}>
                  <Text style={styles.dayText}>{day}</Text>
                  {isEditing ? (
                    <View style={styles.hoursEdit}>
                      <TouchableOpacity
                        style={[styles.openToggle, dayData.isOpen && styles.openToggleActive]}
                        onPress={() => {
                          const updated = { 
                            ...business.workingHours,
                            [day.toLowerCase()]: { ...dayData, isOpen: !dayData.isOpen }
                          };
                          setBusiness({ ...business, workingHours: updated });
                        }}
                      >
                        <Text style={styles.openToggleText}>
                          {dayData.isOpen ? 'Open' : 'Closed'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text style={styles.hoursText}>
                      {dayData.isOpen ? `${dayData.open} - ${dayData.close}` : 'Closed'}
                    </Text>
                  )}
                </View>
                {day !== 'Sun' && <View style={styles.divider} />}
              </View>
            );
          })}
        </GlassCard>

        {/* Call Intent */}
        <Text style={styles.sectionTitle}>Services / Call Intent</Text>
        <View style={styles.servicesContainer}>
          {business.callIntent?.map((intent, index) => (
            <View key={index} style={styles.serviceChip}>
              <Text style={styles.serviceText}>{intent}</Text>
              {isEditing && (
                <TouchableOpacity onPress={() => {
                  const updated = (business.callIntent || []).filter((_, i) => i !== index);
                  setBusiness({ ...business, callIntent: updated });
                }}>
                  <Feather name="x" size={14} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          ))}
          {isEditing && (
            <TouchableOpacity style={styles.addServiceChip}>
              <Feather name="plus" size={16} color={Colors.accent} />
              <Text style={styles.addServiceText}>Add Service</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats */}
        <Text style={styles.sectionTitle}>Business Stats</Text>
        <GlassCard style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{business.totalCalls?.toLocaleString() || '0'}</Text>
            <Text style={styles.statLabel}>Total Calls</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{business.reviewCount || '0'}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{business.customerRating || '0'}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </GlassCard>

        {/* Verification Status */}
        <Text style={styles.sectionTitle}>Verification</Text>
        <GlassCard style={styles.verifyCard}>
          <View style={styles.verifyIcon}>
            <MaterialIcons name="verified-user" size={40} color={badge.color} />
          </View>
          <Text style={styles.verifyTitle}>Business Verified</Text>
          <Text style={styles.verifySubtitle}>
            Your business profile has been verified with {badge.text} status
          </Text>
          <TouchableOpacity style={styles.upgradeBtn}>
            <Text style={styles.upgradeText}>Upgrade Verification</Text>
          </TouchableOpacity>
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gradientStart },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { color: Colors.textSecondary, marginTop: 16, fontFamily: 'Inter_500Medium' },
  noBusinessTitle: { color: Colors.textPrimary, fontSize: 20, fontFamily: 'Inter_700Bold', marginTop: 16 },
  noBusinessText: { color: Colors.textSecondary, fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: 8, textAlign: 'center' },
  createBtn: { marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: Colors.accent, borderRadius: 24 },
  createBtnText: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
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
  editBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1 },
  profileHeader: { alignItems: 'center', paddingVertical: 20 },
  verificationBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12, marginTop: 12,
  },
  verificationText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  businessName: { fontSize: 24, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginTop: 12 },
  nameInput: {
    fontSize: 20, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 8,
    paddingHorizontal: 16, paddingVertical: 8, marginTop: 12, minWidth: 250,
    textAlign: 'center',
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  rating: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  reviewCount: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  sectionTitle: {
    fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary,
    marginHorizontal: 20, marginTop: 24, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  categoryGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20,
  },
  categoryChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  categoryText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  categoryTextActive: { color: '#FFFFFF' },
  contactItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16,
  },
  contactInput: {
    flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.textPrimary,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  contactText: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.textPrimary },
  divider: {
    height: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 16,
  },
  hoursRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 16,
  },
  dayText: { fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.textPrimary, width: 40 },
  hoursText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  hoursEdit: { flexDirection: 'row', gap: 8 },
  openToggle: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  openToggleActive: { backgroundColor: Colors.success + '30' },
  openToggleText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textPrimary },
  servicesContainer: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20,
  },
  serviceChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  serviceText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textPrimary },
  addServiceChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.accent, borderStyle: 'dashed',
  },
  addServiceText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.accent },
  statsCard: { flexDirection: 'row', justifyContent: 'space-around', padding: 20 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 24, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  statLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginTop: 4 },
  verifyCard: { alignItems: 'center', padding: 24 },
  verifyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255, 215, 0, 0.15)', alignItems: 'center', justifyContent: 'center',
  },
  verifyTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginTop: 16 },
  verifySubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textMuted, textAlign: 'center', marginTop: 8 },
  upgradeBtn: {
    marginTop: 16, paddingHorizontal: 20, paddingVertical: 10,
    backgroundColor: Colors.accent, borderRadius: 20,
  },
  upgradeText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#FFFFFF' },
});
