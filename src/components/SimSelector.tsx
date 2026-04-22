import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/src/theme/colors';

interface SimInfo {
  id: string;
  slot: number;
  carrier: string;
  number: string;
  label: string;
  isActive: boolean;
  color: string;
}

interface SimSelectorProps {
  sims: SimInfo[];
  selectedSim: string;
  onSelectSim: (simId: string) => void;
  compact?: boolean;
}

const MOCK_SIMS: SimInfo[] = [
  {
    id: 'sim1',
    slot: 1,
    carrier: 'Jio',
    number: '+91 98765 43210',
    label: 'Personal',
    isActive: true,
    color: '#4CAF50',
  },
  {
    id: 'sim2',
    slot: 2,
    carrier: 'Airtel',
    number: '+91 87654 32109',
    label: 'Work',
    isActive: true,
    color: '#2196F3',
  },
];

export function SimSelector({
  sims = MOCK_SIMS,
  selectedSim,
  onSelectSim,
  compact = false,
}: SimSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const activeSim = sims.find(s => s.id === selectedSim) || sims[0];

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        {sims.map((sim) => (
          <TouchableOpacity
            key={sim.id}
            style={[
              styles.compactSim,
              selectedSim === sim.id ? styles.compactSimActive : null,
              { borderColor: sim.color },
            ]}
            onPress={() => onSelectSim(sim.id)}
          >
            <View style={[styles.compactDot, { backgroundColor: sim.color }]} />
            <Text style={styles.compactLabel}>{sim.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity style={styles.selector} onPress={() => setModalVisible(true)}>
        <View style={[styles.simIcon, { backgroundColor: activeSim.color + '20' }]}>
          <MaterialIcons name="sim-card" size={20} color={activeSim.color} />
        </View>
        <View style={styles.simInfo}>
          <Text style={styles.simLabel}>{activeSim.label}</Text>
          <Text style={styles.simNumber}>{activeSim.number}</Text>
        </View>
        <Text style={styles.simCarrier}>{activeSim.carrier}</Text>
        <Feather name="chevron-down" size={18} color={Colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select SIM</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {sims.map((sim) => (
              <TouchableOpacity
                key={sim.id}
                style={[
                  styles.simOption,
                  selectedSim === sim.id && styles.simOptionActive,
                ]}
                onPress={() => {
                  onSelectSim(sim.id);
                  setModalVisible(false);
                }}
              >
                <View style={[styles.simIconLarge, { backgroundColor: sim.color + '20' }]}>
                  <MaterialIcons name="sim-card" size={28} color={sim.color} />
                </View>
                <View style={styles.simOptionInfo}>
                  <Text style={styles.simOptionLabel}>{sim.label}</Text>
                  <Text style={styles.simOptionNumber}>{sim.number}</Text>
                  <View style={styles.simDetails}>
                    <Text style={styles.simOptionCarrier}>{sim.carrier}</Text>
                    <Text style={styles.simSlot}>Slot {sim.slot}</Text>
                  </View>
                </View>
                {selectedSim === sim.id && (
                  <MaterialIcons name="check-circle" size={24} color={Colors.accent} />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.manageBtn} onPress={() => setModalVisible(false)}>
              <Feather name="settings" size={16} color={Colors.accent} />
              <Text style={styles.manageText}>Manage SIM Preferences</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

interface SimStatsProps {
  sims: SimInfo[];
  stats: {
    calls: number;
    duration: string;
    data: string;
  }[];
}

export function SimStats({ sims, stats }: SimStatsProps) {
  return (
    <View style={styles.statsContainer}>
      {sims.map((sim, index) => (
        <View key={sim.id} style={[styles.simStatCard, { borderLeftColor: sim.color }]}>
          <View style={styles.simStatHeader}>
            <View style={[styles.simDot, { backgroundColor: sim.color }]} />
            <Text style={styles.simStatLabel}>{sim.label}</Text>
            <Text style={styles.simStatCarrier}>{sim.carrier}</Text>
          </View>
          <View style={styles.simStatRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats[index]?.calls || 0}</Text>
              <Text style={styles.statLabel}>Calls</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats[index]?.duration || '0m'}</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats[index]?.data || '0MB'}</Text>
              <Text style={styles.statLabel}>Data</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  compactContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  compactSim: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    gap: 6,
  },
  compactSimActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  compactDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  compactLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: Colors.textPrimary,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },
  simIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simInfo: {
    flex: 1,
  },
  simLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  simNumber: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
  },
  simCarrier: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.accent,
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.gradientStart,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  simOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  simOptionActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: Colors.accent + '40',
  },
  simIconLarge: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simOptionInfo: {
    flex: 1,
    marginLeft: 16,
  },
  simOptionLabel: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  simOptionNumber: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  simDetails: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  simOptionCarrier: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: Colors.accent,
  },
  simSlot: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
  },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginTop: 8,
    gap: 8,
  },
  manageText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: Colors.accent,
  },
  statsContainer: {
    gap: 12,
  },
  simStatCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
  },
  simStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  simDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  simStatLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  simStatCarrier: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
    marginLeft: 'auto',
  },
  simStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
    marginTop: 2,
  },
});
