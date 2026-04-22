import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/src/theme/colors';

interface Tag {
  id: string;
  name: string;
  color: string;
  icon?: string;
  isCustom?: boolean;
}

interface TagManagerProps {
  currentTags: string[];
  onTagsChange: (tags: string[]) => void;
  suggestedTags?: Tag[];
  popularTags?: Tag[];
}

const DEFAULT_SUGGESTED_TAGS: Tag[] = [
  { id: '1', name: 'Friend', color: '#4CAF50', icon: 'user' },
  { id: '2', name: 'Family', color: '#2196F3', icon: 'users' },
  { id: '3', name: 'Work', color: '#FF9800', icon: 'briefcase' },
  { id: '4', name: 'Business', color: '#9C27B0', icon: 'building' },
  { id: '5', name: 'Delivery', color: '#00BCD4', icon: 'truck' },
  { id: '6', name: 'Bank', color: '#795548', icon: 'dollar-sign' },
  { id: '7', name: 'Service', color: '#607D8B', icon: 'tool' },
  { id: '8', name: 'Doctor', color: '#E91E63', icon: 'activity' },
];

const POPULAR_TAGS: Tag[] = [
  { id: '9', name: 'Spam', color: '#FF5252', icon: 'alert-triangle' },
  { id: '10', name: 'Telemarketer', color: '#FF6B35', icon: 'phone-off' },
  { id: '11', name: 'Fraud', color: '#D32F2F', icon: 'shield-off' },
  { id: '12', name: 'Insurance', color: '#FF9800', icon: 'umbrella' },
  { id: '13', name: 'Loan', color: '#FFC107', icon: 'credit-card' },
  { id: '14', name: 'Political', color: '#9C27B0', icon: 'flag' },
];

const TAG_COLORS = [
  '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#00BCD4',
  '#795548', '#607D8B', '#E91E63', '#FF5252', '#3F51B5',
];

export function TagManager({
  currentTags,
  onTagsChange,
  suggestedTags = DEFAULT_SUGGESTED_TAGS,
  popularTags = POPULAR_TAGS,
}: TagManagerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);

  const handleAddTag = (tagName: string) => {
    if (!currentTags.includes(tagName)) {
      onTagsChange([...currentTags, tagName]);
    }
  };

  const handleRemoveTag = (tagName: string) => {
    onTagsChange(currentTags.filter(t => t !== tagName));
  };

  const handleAddCustomTag = () => {
    if (customTagInput.trim() && !currentTags.includes(customTagInput.trim())) {
      onTagsChange([...currentTags, customTagInput.trim()]);
      setCustomTagInput('');
    }
  };

  const allTags = [...suggestedTags, ...popularTags];
  const availableTags = allTags.filter(tag => !currentTags.includes(tag.name));

  return (
    <View>
      {/* Current Tags Display */}
      <View style={styles.currentTagsContainer}>
        <Text style={styles.sectionTitle}>Tags</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsScroll}>
          {currentTags.length === 0 ? (
            <Text style={styles.noTagsText}>No tags added</Text>
          ) : (
            currentTags.map((tag, index) => {
              const tagInfo = allTags.find(t => t.name === tag) || {
                name: tag,
                color: selectedColor,
                icon: 'tag',
              };
              return (
                <View key={index} style={[styles.tagChip, { backgroundColor: tagInfo.color + '20' }]}>
                  <View style={[styles.tagDot, { backgroundColor: tagInfo.color }]} />
                  <Text style={[styles.tagText, { color: tagInfo.color }]}>{tag}</Text>
                  <TouchableOpacity onPress={() => handleRemoveTag(tag)} style={styles.removeBtn}>
                    <Feather name="x" size={12} color={tagInfo.color} />
                  </TouchableOpacity>
                </View>
              );
            })
          )}
          <TouchableOpacity style={styles.addTagBtn} onPress={() => setModalVisible(true)}>
            <Feather name="plus" size={14} color={Colors.accent} />
            <Text style={styles.addTagText}>Add Tag</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Tag Selector Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Tags</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Custom Tag Input */}
            <View style={styles.customTagSection}>
              <Text style={styles.subsectionTitle}>Create Custom Tag</Text>
              <View style={styles.customTagRow}>
                <TextInput
                  style={styles.customTagInput}
                  placeholder="Enter tag name..."
                  placeholderTextColor={Colors.textMuted}
                  value={customTagInput}
                  onChangeText={setCustomTagInput}
                  maxLength={20}
                />
                <TouchableOpacity
                  style={[styles.addCustomBtn, { opacity: customTagInput.trim() ? 1 : 0.5 }]}
                  onPress={handleAddCustomTag}
                  disabled={!customTagInput.trim()}
                >
                  <Feather name="plus" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Color Picker */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorPicker}>
                {TAG_COLORS.map((color, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => setSelectedColor(color)}
                  >
                    {selectedColor === color && (
                      <Feather name="check" size={14} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Suggested Tags */}
            <Text style={styles.subsectionTitle}>Suggested Tags</Text>
            <View style={styles.suggestedTagsGrid}>
              {suggestedTags
                .filter(tag => !currentTags.includes(tag.name))
                .map(tag => (
                  <TouchableOpacity
                    key={tag.id}
                    style={[styles.suggestedTag, { backgroundColor: tag.color + '15' }]}
                    onPress={() => {
                      handleAddTag(tag.name);
                      setModalVisible(false);
                    }}
                  >
                    <Feather name={tag.icon as any} size={14} color={tag.color} />
                    <Text style={[styles.suggestedTagText, { color: tag.color }]}>{tag.name}</Text>
                  </TouchableOpacity>
                ))}
            </View>

            {/* Popular Tags */}
            <Text style={styles.subsectionTitle}>Popular Tags</Text>
            <View style={styles.suggestedTagsGrid}>
              {popularTags
                .filter(tag => !currentTags.includes(tag.name))
                .map(tag => (
                  <TouchableOpacity
                    key={tag.id}
                    style={[styles.suggestedTag, { backgroundColor: tag.color + '15' }]}
                    onPress={() => {
                      handleAddTag(tag.name);
                      setModalVisible(false);
                    }}
                  >
                    <Feather name={tag.icon as any} size={14} color={tag.color} />
                    <Text style={[styles.suggestedTagText, { color: tag.color }]}>{tag.name}</Text>
                  </TouchableOpacity>
                ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  currentTagsContainer: {
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  tagsScroll: {
    flexDirection: 'row',
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    gap: 6,
  },
  tagDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  removeBtn: {
    padding: 2,
  },
  addTagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.accent,
    borderStyle: 'dashed',
    gap: 4,
  },
  addTagText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: Colors.accent,
  },
  noTagsText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
    fontStyle: 'italic',
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
    maxHeight: '80%',
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
  customTagSection: {
    marginBottom: 20,
  },
  subsectionTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  customTagRow: {
    flexDirection: 'row',
    gap: 10,
  },
  customTagInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
  },
  addCustomBtn: {
    backgroundColor: Colors.accent,
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorPicker: {
    marginTop: 12,
    flexDirection: 'row',
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  suggestedTagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  suggestedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  suggestedTagText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
});
