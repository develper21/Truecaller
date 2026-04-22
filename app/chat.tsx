import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Colors } from '@/src/theme/colors';
import { getMessages, sendMessage, Message, markThreadAsRead } from '@/src/api/messages';

export default function ChatScreen() {
  const { id, phoneNumber } = useLocalSearchParams<{ id: string; phoneNumber: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const threadId = parseInt(id, 10);

  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [contactName, setContactName] = useState('Unknown');
  const flatListRef = useRef<FlatList>(null);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  // Fetch messages from API
  const fetchMessages = useCallback(async () => {
    if (!threadId) return;
    try {
      setLoading(true);
      const messagesData = await getMessages(threadId, 50);
      setChatMessages(messagesData);
      // Mark thread as read
      await markThreadAsRead(threadId);
    } catch (err: any) {
      console.error('Failed to fetch messages:', err);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  // Load messages on mount
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  async function send() {
    if (!input.trim() || !threadId) return;
    const messageText = input.trim();
    setInput('');
    
    try {
      const newMessage = await sendMessage(threadId, { content: messageText });
      setChatMessages((prev) => [...prev, newMessage]);
    } catch (err: any) {
      console.error('Failed to send message:', err);
      Alert.alert('Error', 'Failed to send message');
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: topPad }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={styles.bgBlob} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{contactName}</Text>
          <Text style={styles.headerNum}>{phoneNumber || 'Unknown'}</Text>
        </View>
        <TouchableOpacity style={styles.callBtn}>
          <Feather name="phone" size={18} color={Colors.accent} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={chatMessages}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const isMine = item.senderId !== threadId;
          const timeStr = new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return (
            <View style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}>
              <Text style={[styles.bubbleText, isMine && styles.myBubbleText]}>{item.content}</Text>
              <Text style={[styles.bubbleTime, isMine && styles.myBubbleTime]}>{timeStr}</Text>
            </View>
          );
        }}
      />

      {/* Input */}
      <View style={[styles.inputRow, { paddingBottom: bottomPad + 8 }]}>
        <TextInput
          style={styles.textInput}
          placeholder="Type a message..."
          placeholderTextColor={Colors.textMuted}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !input.trim() && { opacity: 0.4 }]}
          onPress={send}
          disabled={!input.trim()}
        >
          <Feather name="send" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gradientStart },
  bgBlob: {
    position: 'absolute', width: 250, height: 250, borderRadius: 125,
    backgroundColor: Colors.gradientEnd, top: -60, right: -80, opacity: 0.6,
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)',
    gap: 12,
  },
  backBtn: { padding: 6 },
  headerInfo: { flex: 1 },
  headerName: { color: Colors.textPrimary, fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  headerNum: { color: Colors.textSecondary, fontSize: 12, fontFamily: 'Inter_400Regular' },
  callBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(146,95,226,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  bubble: {
    maxWidth: '75%', borderRadius: 16, padding: 12,
    paddingBottom: 8, alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  myBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.accent,
    borderColor: 'transparent',
  },
  theirBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  bubbleText: { color: Colors.textPrimary, fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  myBubbleText: { color: '#FFFFFF' },
  bubbleTime: { color: Colors.textMuted, fontSize: 10, fontFamily: 'Inter_400Regular', marginTop: 4, alignSelf: 'flex-end' },
  myBubbleTime: { color: 'rgba(255,255,255,0.6)' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)',
  },
  textInput: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
    color: Colors.textPrimary, fontSize: 14, fontFamily: 'Inter_400Regular',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', maxHeight: 100,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
});
