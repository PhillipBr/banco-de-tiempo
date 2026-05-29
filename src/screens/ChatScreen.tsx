import { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import Header from "../components/Header";
import ChatBubble from "../components/ChatBubble";

import { styles } from "../theme/styles";
import { useAuthContext } from "../context/AuthContext";

import {
  createMessageInSupabase,
  getMessages,
  mapSupabaseMessageToAppMessage,
} from "../lib/messageApi";

import {
  getOrCreateProfileByUserId,
  getProfiles,
  mapSupabaseProfileToAppUser,
} from "../lib/profileApi";

export default function ChatScreen() {
  const { name } = useLocalSearchParams();
  const { session, authUser } = useAuthContext();

  const conversationWith = name ? String(name) : "Comunidad";

  const [currentUserName, setCurrentUserName] = useState("");
  const [conversationDisplayName, setConversationDisplayName] =
    useState(conversationWith);

  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!session || !authUser?.id) {
      router.replace("/login");
      return;
    }

    loadCurrentProfile();
    loadMessages();
  }, [conversationWith, session, authUser?.id]);

  const resolveName = async (value: string) => {
    const profiles = await getProfiles();

    const foundProfile = profiles.find((profile) => {
      const emailPrefix = profile.email?.split("@")[0];

      return (
        profile.name === value ||
        profile.email === value ||
        emailPrefix === value
      );
    });

    return foundProfile?.name || value;
  };

  const loadCurrentProfile = async () => {
    if (!authUser?.id) return;

    const profile = await getOrCreateProfileByUserId(
      authUser.id,
      authUser.email
    );

    const mappedUser = mapSupabaseProfileToAppUser(profile);
    setCurrentUserName(mappedUser.name);
  };

  const loadMessages = async () => {
    try {
      setIsLoading(true);

      const profiles = await getProfiles();

      const getDisplayName = (value: string) => {
        const foundProfile = profiles.find((profile) => {
          const emailPrefix = profile.email?.split("@")[0];

          return (
            profile.name === value ||
            profile.email === value ||
            emailPrefix === value
          );
        });

        return foundProfile?.name || value;
      };

      setConversationDisplayName(getDisplayName(conversationWith));

      const data = await getMessages();
      const mappedMessages = data.map(mapSupabaseMessageToAppMessage);

      const filteredMessages = mappedMessages
        .filter((message) => message.conversationWith === conversationWith)
        .map((message) => ({
          ...message,
          sender: getDisplayName(message.sender),
        }));

      setMessages(filteredMessages);
    } catch (error) {
      console.log("Error cargando mensajes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    let senderName = currentUserName;

    if (!senderName) {
      if (!authUser?.id) return;

      const profile = await getOrCreateProfileByUserId(
        authUser.id,
        authUser.email
      );

      senderName = profile.name;
      setCurrentUserName(profile.name);
    }

    try {
      setIsSending(true);

      await createMessageInSupabase({
        conversation_with: conversationWith,
        sender: senderName,
        text: newMessage.trim(),
      });

      setNewMessage("");
      await loadMessages();
    } catch (error) {
      console.log("Error enviando mensaje:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={styles.page}>
      <Header />

      <View style={styles.chatSection}>
        <Text style={styles.screenTitle}>Chat</Text>

        <Text style={styles.screenSubtitle}>
          Conversación con {conversationDisplayName}
        </Text>

        <ScrollView style={styles.chatBox}>
          {isLoading ? (
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyStateTitle}>Cargando mensajes...</Text>
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyStateTitle}>Sin mensajes</Text>

              <Text style={styles.emptyStateText}>
                Escribe el primer mensaje para iniciar la conversación.
              </Text>
            </View>
          ) : (
            messages.map((message) => (
              <ChatBubble
                key={message.supabaseId || message.id}
                message={message}
              />
            ))
          )}
        </ScrollView>

        <TextInput
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder={`Escribe a ${conversationDisplayName}...`}
          placeholderTextColor="#999"
          style={styles.input}
          returnKeyType="send"
          onSubmitEditing={handleSendMessage}
        />

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleSendMessage}
          disabled={isSending}
        >
          <Text style={styles.primaryButtonText}>
            {isSending ? "Enviando..." : "Enviar"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/conversations")}
        >
          <Text style={styles.backButtonText}>← Volver a conversaciones</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}