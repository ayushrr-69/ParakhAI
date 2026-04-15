import { StyleSheet, View, FlatList, Pressable, Platform, TextInput, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { AppText } from '@/components/common/AppText';
import { AppShell } from '@/components/layout/AppShell';
import { theme } from '@/theme';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '@/contexts/AuthContext';
import { messagingService, Message } from '@/services/messaging';

export function ChatScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { profile, user } = useAuth();

  const targetName = route.params?.targetName || route.params?.coachName || 'Chat';
  const targetUserId = route.params?.targetId || route.params?.coachId || route.params?.athleteId;

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!targetUserId) return;

    const loadMessages = async () => {
      const history = await messagingService.getMessages(targetUserId);
      setMessages(history);
      setLoading(false);
    };

    loadMessages();

    // Real-time subscription — deduplicates & scrolls to end
    const subscription = messagingService.subscribeToMessages(user!.id, targetUserId, (newMsg) => {
      setMessages(prev => {
        if (prev.find(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [targetUserId]);

  const handleSendMessage = async () => {
    const text = message.trim();
    if (!text || !targetUserId || sending) return;

    // 1. Optimistically add to local state immediately so it's visible
    const optimisticMsg: Message = {
      id: `optimistic-${Date.now()}`,
      sender_id: user!.id,
      receiver_id: targetUserId,
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setMessage('');
    setSending(true);

    // 2. Actually send — if success, the real-time sub will swap the optimistic msg
    const sent = await messagingService.sendMessage(targetUserId, text);
    setSending(false);

    if (!sent) {
      // rollback if failed
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
    }
  };

  const renderMessage = ({ item: msg }: { item: Message }) => {
    const isMe = msg.sender_id === user?.id;
    return (
      <View style={[
        styles.messageBubble,
        isMe ? styles.myMessage : styles.theirMessage,
        !isMe && { borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1 }
      ]}>
        <AppText
          variant="bodySmall"
          weight="semibold"
          color={isMe ? theme.colors.textDark : theme.colors.textPrimary}
        >
          {msg.content}
        </AppText>
        <AppText
          variant="tiny"
          style={styles.messageTime}
          color={isMe ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.4)'}
        >
          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </AppText>
      </View>
    );
  };

  return (
    <AppShell noPaddingTop edges={['bottom']} contentStyle={{ flex: 1 }}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <AppText variant="bodySmall" weight="bold" color={theme.colors.primary}>BACK</AppText>
        </Pressable>
        <View style={styles.headerInfo}>
          <AppText variant="title" weight="bold" color={theme.colors.textPrimary}>{targetName}</AppText>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: theme.colors.success, shadowColor: theme.colors.success, shadowOpacity: 0.5, shadowRadius: 4 }]} />
            <AppText variant="tiny" weight="bold" color={theme.colors.success} style={{ letterSpacing: 0.5 }}>ACTIVE NOW</AppText>
          </View>
        </View>
        <View style={{ width: 60 }} />
      </View>

      {/* Messages — FlatList is better than ScrollView for chats */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {loading ? (
          <ActivityIndicator color={theme.colors.primary} style={{ flex: 1, alignSelf: 'center' }} />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {/* Input bar — always at the bottom, above keyboard */}
        <View style={styles.inputArea}>
          <TextInput
            style={styles.textInput}
            placeholder={profile?.role === 'coach' ? 'Message your athlete...' : 'Message your coach...'}
            placeholderTextColor={theme.colors.placeholder}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={1000}
          />
          <Pressable
            style={[styles.sendBtn, (!message.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSendMessage}
            disabled={!message.trim() || sending}
          >
            <AppText variant="bodySmall" weight="bold" color={theme.colors.textDark}>SEND</AppText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 28,
    paddingBottom: 16,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backBtn: {
    width: 60,
    paddingVertical: 8,
  },
  headerInfo: {
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.success,
    marginRight: 6,
  },
  chatContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 8,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 14,
    borderRadius: 20,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomLeftRadius: 4,
  },
  messageTime: {
    marginTop: 4,
    fontSize: 10,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    backgroundColor: theme.colors.background,
    gap: 10,
  },
  textInput: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 14,
    color: theme.colors.textPrimary,
    fontFamily: theme.fontFamily.medium,
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sendBtn: {
    width: 72,
    height: 48,
    backgroundColor: theme.colors.primary,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
