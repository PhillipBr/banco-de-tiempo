import {
  useCallback,
  useState,
} from "react";

import {
  Alert,
  Image,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  router,
  useFocusEffect,
} from "expo-router";

import Header from "../components/Header";

import { styles } from "../theme/styles";

import {
  useAuthContext,
} from "../context/AuthContext";

import {
  ConversationSummary,
  deleteConversationInSupabase,
  getUserConversations,
} from "../lib/messageApi";

function formatConversationDate(
  dateValue?: string | null
): string {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();

  const isToday =
    date.getFullYear() ===
      now.getFullYear() &&
    date.getMonth() ===
      now.getMonth() &&
    date.getDate() ===
      now.getDate();

  if (isToday) {
    return new Intl.DateTimeFormat(
      "es-CA",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(date);
  }

  return new Intl.DateTimeFormat(
    "es-CA",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  ).format(date);
}

export default function ConversationsScreen() {
  const {
    session,
    authUser,
    isAuthLoading,
  } = useAuthContext();

  const [
    conversations,
    setConversations,
  ] = useState<
    ConversationSummary[]
  >([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const loadConversations =
    useCallback(async () => {
      if (!authUser?.id) {
        setConversations([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const data =
          await getUserConversations();

        setConversations(data);
      } catch (error: any) {
        console.error(
          "Error cargando conversaciones:",
          error
        );

        setErrorMessage(
          error?.message ||
            "No se pudieron cargar las conversaciones."
        );
      } finally {
        setIsLoading(false);
      }
    }, [authUser?.id]);

  useFocusEffect(
    useCallback(() => {
      if (
        !isAuthLoading &&
        !session
      ) {
        router.replace("/login");
        return;
      }

      if (
        session &&
        authUser?.id
      ) {
        loadConversations();
      }
    }, [
      session,
      authUser?.id,
      isAuthLoading,
      loadConversations,
    ])
  );

  const openChat = (
    conversation: ConversationSummary
  ) => {
    router.push({
      pathname: "/chat/[id]",

      params: {
        id:
          conversation.conversation_id,

        name:
          conversation.other_user_name,

        serviceName:
          conversation.service_name ||
          "",
      },
    });
  };

  const openProfile = (
    conversation: ConversationSummary
  ) => {
    router.push({
      pathname:
        "/provider-profile/[name]",

      params: {
        name:
          conversation.other_user_name,
      },
    });
  };

  const handleDeleteConversation = (
    conversation: ConversationSummary
  ) => {
    const hideChat = async () => {
      try {
        await deleteConversationInSupabase(
          conversation.conversation_id
        );

        await loadConversations();
      } catch (error: any) {
        Alert.alert(
          "Error",
          error?.message ||
            "No se pudo quitar la conversación."
        );
      }
    };

    const confirmationText =
      `¿Quieres quitar el chat con ${conversation.other_user_name}? ` +
      "La conversación seguirá disponible para la otra persona.";

    if (
      Platform.OS === "web" &&
      typeof window !== "undefined"
    ) {
      const confirmed =
        window.confirm(
          confirmationText
        );

      if (confirmed) {
        void hideChat();
      }

      return;
    }

    Alert.alert(
      "Quitar conversación",
      confirmationText,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Quitar",
          style: "destructive",
          onPress: () => {
            void hideChat();
          },
        },
      ]
    );
  };

  if (
    isAuthLoading ||
    isLoading
  ) {
    return (
      <ScrollView style={styles.page}>
        <Header />

        <View style={styles.formSection}>
          <Text style={styles.screenTitle}>
            Cargando conversaciones...
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={{
        paddingBottom: 50,
      }}
    >
      <Header />

      <View style={styles.formSection}>
        <Text style={styles.screenTitle}>
          Conversaciones
        </Text>

        <Text style={styles.screenSubtitle}>
          Mensajes relacionados con
          servicios e intercambios.
        </Text>

        <TouchableOpacity
          style={styles.contactButton}
          onPress={loadConversations}
        >
          <Text
            style={styles.primaryButtonText}
          >
            Recargar conversaciones
          </Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />

        {errorMessage ? (
          <View style={styles.emptyStateCard}>
            <Text
              style={styles.emptyStateTitle}
            >
              Error
            </Text>

            <Text
              style={styles.emptyStateText}
            >
              {errorMessage}
            </Text>
          </View>
        ) : null}

        {!errorMessage &&
        conversations.length === 0 ? (
          <View style={styles.emptyStateCard}>
            <Text
              style={styles.emptyStateTitle}
            >
              Sin conversaciones
            </Text>

            <Text
              style={styles.emptyStateText}
            >
              Contacta a un proveedor o
              solicitante para comenzar un
              chat.
            </Text>
          </View>
        ) : (
          conversations.map(
            (conversation) => {
              const unreadCount =
                Number(
                  conversation.unread_count
                ) || 0;

              return (
                <TouchableOpacity
                  key={
                    conversation.conversation_id
                  }
                  style={
                    styles.conversationCard
                  }
                  activeOpacity={0.85}
                  onPress={() =>
                    openChat(conversation)
                  }
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      marginBottom: 10,
                    }}
                  >
                    {conversation.other_user_avatar ? (
                      <Image
                        source={{
                          uri:
                            conversation.other_user_avatar,
                        }}
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          backgroundColor:
                            "#222222",
                        }}
                      />
                    ) : (
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          backgroundColor:
                            "#333333",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",
                        }}
                      >
                        <Text
                          style={{
                            color: "#FFFFFF",
                            fontSize: 20,
                            fontWeight: "700",
                          }}
                        >
                          {conversation
                            .other_user_name
                            ?.charAt(0)
                            .toUpperCase() ||
                            "U"}
                        </Text>
                      </View>
                    )}

                    <View
                      style={{
                        flex: 1,
                      }}
                    >
                      <View
                        style={{
                          flexDirection:
                            "row",
                          alignItems:
                            "center",
                          justifyContent:
                            "space-between",
                          gap: 10,
                        }}
                      >
                        <Text
                          style={
                            styles.conversationName
                          }
                        >
                          {
                            conversation.other_user_name
                          }
                        </Text>

                        {unreadCount > 0 ? (
                          <View
                            style={{
                              minWidth: 24,
                              height: 24,
                              paddingHorizontal: 7,
                              borderRadius: 12,
                              backgroundColor:
                                "#FFFFFF",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                            }}
                          >
                            <Text
                              style={{
                                color: "#000000",
                                fontWeight: "700",
                                fontSize: 12,
                              }}
                            >
                              {unreadCount}
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      {conversation.service_name ? (
                        <Text
                          style={
                            styles.historyMeta
                          }
                        >
                          {
                            conversation.service_name
                          }
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.conversationPreview,

                      unreadCount > 0
                        ? {
                            fontWeight: "700",
                          }
                        : null,
                    ]}
                    numberOfLines={2}
                  >
                    {conversation.last_message ||
                      "Sin mensajes todavía"}
                  </Text>

                  <Text
                    style={styles.historyMeta}
                  >
                    {formatConversationDate(
                      conversation.last_message_at ||
                        conversation.updated_at
                    )}
                  </Text>

                  <View
                    style={styles.heroButtons}
                  >
                    <TouchableOpacity
                      style={
                        styles.contactButton
                      }
                      onPress={(event) => {
                        event.stopPropagation();

                        openChat(
                          conversation
                        );
                      }}
                    >
                      <Text
                        style={
                          styles.primaryButtonText
                        }
                      >
                        Abrir chat
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={
                        styles.outlineActionButton
                      }
                      onPress={(event) => {
                        event.stopPropagation();

                        openProfile(
                          conversation
                        );
                      }}
                    >
                      <Text
                        style={
                          styles.outlineActionButtonText
                        }
                      >
                        Ver perfil
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={
                        styles.dangerButton
                      }
                      onPress={(event) => {
                        event.stopPropagation();

                        handleDeleteConversation(
                          conversation
                        );
                      }}
                    >
                      <Text
                        style={
                          styles.primaryButtonText
                        }
                      >
                        Quitar chat
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            }
          )
        )}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            router.push("/")
          }
        >
          <Text style={styles.backButtonText}>
            ← Volver al inicio
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}