import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";

import Header from "../components/Header";

import { styles } from "../theme/styles";
import { useAuthContext } from "../context/AuthContext";

import {
  deleteConversationInSupabase,
  getMessages,
  mapSupabaseMessageToAppMessage,
} from "../lib/messageApi";

import { getProfiles } from "../lib/profileApi";

export default function ConversationsScreen() {
  const { session } = useAuthContext();

  const [messages, setMessages] = useState<any[]>([]);
  const [displayNames, setDisplayNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      router.replace("/login");
      return;
    }

    loadMessages();
  }, [session]);

  const openChat = (conversation: string) => {
    router.push({
      pathname: "/chat/[name]",
      params: {
        name: conversation,
      },
    });
  };

  const loadMessages = async () => {
    try {
      setIsLoading(true);

      const profiles = await getProfiles();

      const data = await getMessages();
      const mappedMessages = data.map(mapSupabaseMessageToAppMessage);

      const namesMap: Record<string, string> = {};

      mappedMessages.forEach((message) => {
        const rawName = message.conversationWith;

        const foundProfile = profiles.find((profile) => {
          const emailPrefix = profile.email?.split("@")[0];

          return (
            profile.name === rawName ||
            profile.email === rawName ||
            emailPrefix === rawName
          );
        });

        namesMap[rawName] = foundProfile?.name || rawName;
      });

      setDisplayNames(namesMap);
      setMessages(mappedMessages);
    } catch (error) {
      console.log("Error cargando conversaciones:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const uniqueConversations = useMemo(() => {
    return Array.from(
      new Set(messages.map((message) => message.conversationWith))
    );
  }, [messages]);

  const handleDeleteConversation = async (conversation: string) => {
    const deleteChat = async () => {
      try {
        await deleteConversationInSupabase(conversation);
        await loadMessages();
      } catch (error: any) {
        Alert.alert(
          "Error",
          error.message || "No se pudo borrar la conversación."
        );
      }
    };

    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        `¿Seguro que quieres borrar el chat con ${
          displayNames[conversation] || conversation
        }?`
      );

      if (confirmed) {
        deleteChat();
      }

      return;
    }

    Alert.alert(
      "Borrar conversación",
      `¿Seguro que quieres borrar el chat con ${
        displayNames[conversation] || conversation
      }?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Borrar",
          style: "destructive",
          onPress: deleteChat,
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.page}>
      <Header />

      <View style={styles.formSection}>
        <Text style={styles.screenTitle}>Conversations</Text>

        <Text style={styles.screenSubtitle}>
          Conversaciones reales cargadas desde Supabase.
        </Text>

        <View style={{ height: 20 }} />

        {isLoading ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>
              Cargando conversaciones...
            </Text>
          </View>
        ) : uniqueConversations.length === 0 ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>Sin conversaciones</Text>

            <Text style={styles.emptyStateText}>
              Contacta proveedores para iniciar conversaciones.
            </Text>
          </View>
        ) : (
          uniqueConversations.map((conversation) => {
            const conversationMessages = messages.filter(
              (message) => message.conversationWith === conversation
            );

            const lastMessage =
              conversationMessages[conversationMessages.length - 1];

            const conversationName =
              displayNames[conversation] || conversation;

            return (
              <TouchableOpacity
                key={conversation}
                style={styles.conversationCard}
                activeOpacity={0.85}
                onPress={() => openChat(conversation)}
              >
                <Text style={styles.conversationName}>{conversationName}</Text>

                <Text style={styles.conversationPreview}>
                  {lastMessage?.text || "Sin mensajes"}
                </Text>

                <Text style={styles.historyMeta}>{lastMessage?.date}</Text>

                <View style={styles.heroButtons}>
                  <TouchableOpacity
                    style={styles.contactButton}
                    onPress={() => openChat(conversation)}
                  >
                    <Text style={styles.primaryButtonText}>Contactar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.outlineActionButton}
                    onPress={(event) => {
                      event.stopPropagation();

                      router.push({
                        pathname: "/provider-profile/[name]",
                        params: {
                          name: conversationName,
                        },
                      });
                    }}
                  >
                    <Text style={styles.outlineActionButtonText}>
                      Ver perfil
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.dangerButton}
                    onPress={(event) => {
                      event.stopPropagation();
                      handleDeleteConversation(conversation);
                    }}
                  >
                    <Text style={styles.primaryButtonText}>Borrar chat</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/")}
        >
          <Text style={styles.backButtonText}>← Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}