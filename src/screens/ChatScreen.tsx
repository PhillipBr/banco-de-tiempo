import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";

import Header from "../components/Header";

import { styles } from "../theme/styles";

import {
  useAuthContext,
} from "../context/AuthContext";

import {
  AppMessage,
  createMessageInSupabase,
  getConversationById,
  getMessagesByConversationId,
  isValidUuid,
  mapSupabaseMessageToAppMessage,
  markConversationAsRead,
  subscribeToConversationMessages,
} from "../lib/messageApi";

import {
  getProfileByUserId,
} from "../lib/profileApi";

function getFirstParam(
  value?: string | string[]
): string {
  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
}

function formatMessageTime(
  dateValue: string
): string {
  const date =
    new Date(dateValue);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "es-CA",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

export default function ChatScreen() {
  const params =
    useLocalSearchParams<{
      id?: string | string[];
      name?: string | string[];
      serviceName?: string | string[];
    }>();

  const conversationId =
    getFirstParam(
      params.id
    );

  const initialName =
    getFirstParam(
      params.name
    ) || "Usuario";

  const initialServiceName =
    getFirstParam(
      params.serviceName
    );

  console.log(
    "CHAT PARAMS:",
    params
  );

  console.log(
    "CHAT CONVERSATION ID:",
    conversationId
  );

  const {
    session,
    authUser,
    isAuthLoading,
  } = useAuthContext();

  const scrollRef =
    useRef<ScrollView | null>(
      null
    );

  const [
    otherUserId,
    setOtherUserId,
  ] = useState("");

  const [
    displayName,
    setDisplayName,
  ] = useState(
    initialName
  );

  const [
    serviceName,
    setServiceName,
  ] = useState(
    initialServiceName
  );

  const [
    messages,
    setMessages,
  ] = useState<AppMessage[]>(
    []
  );

  const [
    newMessage,
    setNewMessage,
  ] = useState("");

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSending,
    setIsSending,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const scrollToBottom =
    useCallback(() => {
      setTimeout(() => {
        scrollRef.current
          ?.scrollToEnd({
            animated: true,
          });
      }, 100);
    }, []);

  const loadConversation =
    useCallback(async () => {
      if (!authUser?.id) {
        return;
      }

      if (!conversationId) {
        setErrorMessage(
          "No se recibió el ID de la conversación."
        );

        setIsLoading(false);
        return;
      }

      if (
        !isValidUuid(
          conversationId
        )
      ) {
        console.error(
          "ID DE CONVERSACIÓN INVÁLIDO:",
          conversationId
        );

        setErrorMessage(
          `El ID recibido no es válido: ${conversationId}`
        );

        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const conversation =
          await getConversationById(
            conversationId
          );

        console.log(
          "CONVERSACIÓN CARGADA:",
          conversation
        );

        if (!conversation) {
          throw new Error(
            "La conversación no existe."
          );
        }

        const isParticipantOne =
          conversation
            .participant_one_id ===
          authUser.id;

        const isParticipantTwo =
          conversation
            .participant_two_id ===
          authUser.id;

        if (
          !isParticipantOne &&
          !isParticipantTwo
        ) {
          throw new Error(
            "No tienes acceso a esta conversación."
          );
        }

        const resolvedOtherUserId =
          isParticipantOne
            ? conversation
                .participant_two_id
            : conversation
                .participant_one_id;

        setOtherUserId(
          resolvedOtherUserId
        );

        setServiceName(
          conversation.service_name ||
            initialServiceName
        );

        let resolvedName =
          initialName;

        try {
          const otherProfile =
            await getProfileByUserId(
              resolvedOtherUserId
            );

          if (otherProfile) {
            resolvedName =
              otherProfile.name ||
              otherProfile.email ||
              initialName;
          }
        } catch (error) {
          console.log(
            "No se pudo cargar el nombre:",
            error
          );
        }

        setDisplayName(
          resolvedName
        );

        const messageData =
          await getMessagesByConversationId(
            conversationId
          );

        const mappedMessages =
          messageData.map(
            (message) =>
              mapSupabaseMessageToAppMessage(
                message,
                authUser.id,
                resolvedName
              )
          );

        setMessages(
          mappedMessages
        );

        await markConversationAsRead(
          conversationId
        );

        scrollToBottom();
      } catch (error: any) {
        console.error(
          "Error cargando conversación:",
          error
        );

        setErrorMessage(
          error?.message ||
            "No se pudo cargar la conversación."
        );
      } finally {
        setIsLoading(false);
      }
    }, [
      authUser?.id,
      conversationId,
      initialName,
      initialServiceName,
      scrollToBottom,
    ]);

  useFocusEffect(
    useCallback(() => {
      if (
        !isAuthLoading &&
        !session
      ) {
        router.replace(
          "/login"
        );

        return;
      }

      if (
        session &&
        authUser?.id
      ) {
        void loadConversation();
      }
    }, [
      session,
      authUser?.id,
      isAuthLoading,
      loadConversation,
    ])
  );

  useEffect(() => {
    if (
      !authUser?.id ||
      !isValidUuid(
        conversationId
      )
    ) {
      return;
    }

    const unsubscribe =
      subscribeToConversationMessages(
        conversationId,

        async (
          receivedMessage
        ) => {
          const mapped =
            mapSupabaseMessageToAppMessage(
              receivedMessage,
              authUser.id,
              displayName
            );

          setMessages(
            (
              currentMessages
            ) => {
              const alreadyExists =
                currentMessages.some(
                  (message) =>
                    message.id ===
                    mapped.id
                );

              if (alreadyExists) {
                return currentMessages;
              }

              return [
                ...currentMessages,
                mapped,
              ];
            }
          );

          if (
            receivedMessage
              .receiver_user_id ===
            authUser.id
          ) {
            try {
              await markConversationAsRead(
                conversationId
              );
            } catch (error) {
              console.log(
                "No se pudo marcar como leído:",
                error
              );
            }
          }

          scrollToBottom();
        }
      );

    return unsubscribe;
  }, [
    authUser?.id,
    conversationId,
    displayName,
    scrollToBottom,
  ]);

  const handleSendMessage =
    async () => {
      const content =
        newMessage.trim();

      if (
        !content ||
        isSending
      ) {
        return;
      }

      if (
        !authUser?.id ||
        !otherUserId ||
        !isValidUuid(
          conversationId
        )
      ) {
        Alert.alert(
          "Error",
          "No se pudo identificar correctamente la conversación."
        );

        return;
      }

      try {
        setIsSending(true);

        const createdMessage =
          await createMessageInSupabase({
            conversationId,

            senderUserId:
              authUser.id,

            receiverUserId:
              otherUserId,

            content,
          });

        setNewMessage("");

        const mapped =
          mapSupabaseMessageToAppMessage(
            createdMessage,
            authUser.id,
            displayName
          );

        setMessages(
          (
            currentMessages
          ) => {
            const alreadyExists =
              currentMessages.some(
                (message) =>
                  message.id ===
                  mapped.id
              );

            if (alreadyExists) {
              return currentMessages;
            }

            return [
              ...currentMessages,
              mapped,
            ];
          }
        );

        scrollToBottom();
      } catch (error: any) {
        console.error(
          "Error enviando mensaje:",
          error
        );

        Alert.alert(
          "No se pudo enviar",
          error?.message ||
            "Ocurrió un error enviando el mensaje."
        );
      } finally {
        setIsSending(false);
      }
    };

  if (
    isAuthLoading ||
    isLoading
  ) {
    return (
      <View style={styles.page}>
        <Header />

        <View
          style={
            styles.chatSection
          }
        >
          <Text
            style={
              styles.screenTitle
            }
          >
            Cargando conversación...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{
        flex: 1,
      }}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <View style={styles.page}>
        <Header />

        <View
          style={
            styles.chatSection
          }
        >
          <Text
            style={
              styles.screenTitle
            }
          >
            {displayName}
          </Text>

          <Text
            style={
              styles.screenSubtitle
            }
          >
            {serviceName
              ? `Conversación por: ${serviceName}`
              : "Conversación privada"}
          </Text>

          {errorMessage ? (
            <>
              <View
                style={
                  styles.emptyStateCard
                }
              >
                <Text
                  style={
                    styles.emptyStateTitle
                  }
                >
                  Error
                </Text>

                <Text
                  style={
                    styles.emptyStateText
                  }
                >
                  {errorMessage}
                </Text>
              </View>

              <TouchableOpacity
                style={
                  styles.backButton
                }
                onPress={() =>
                  router.replace(
                    "/conversations"
                  )
                }
              >
                <Text
                  style={
                    styles.backButtonText
                  }
                >
                  ← Volver a conversaciones
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <ScrollView
                ref={scrollRef}
                style={
                  styles.chatBox
                }
                contentContainerStyle={{
                  paddingVertical: 12,
                }}
                onContentSizeChange={
                  scrollToBottom
                }
              >
                {messages.length ===
                0 ? (
                  <View
                    style={
                      styles.emptyStateCard
                    }
                  >
                    <Text
                      style={
                        styles.emptyStateTitle
                      }
                    >
                      Sin mensajes
                    </Text>

                    <Text
                      style={
                        styles.emptyStateText
                      }
                    >
                      Escribe el primer mensaje
                      para iniciar la
                      conversación.
                    </Text>
                  </View>
                ) : (
                  messages.map(
                    (message) => (
                      <View
                        key={
                          message.id
                        }
                        style={{
                          alignSelf:
                            message.isMine
                              ? "flex-end"
                              : "flex-start",

                          maxWidth: "78%",

                          marginBottom: 10,

                          paddingVertical: 10,

                          paddingHorizontal: 14,

                          borderRadius: 14,

                          backgroundColor:
                            message.isMine
                              ? "#FFFFFF"
                              : "#292929",
                        }}
                      >
                        <Text
                          style={{
                            color:
                              message.isMine
                                ? "#111111"
                                : "#FFFFFF",

                            fontSize: 15,
                          }}
                        >
                          {message.text}
                        </Text>

                        <Text
                          style={{
                            color:
                              message.isMine
                                ? "#555555"
                                : "#AAAAAA",

                            fontSize: 11,

                            marginTop: 5,

                            textAlign:
                              "right",
                          }}
                        >
                          {formatMessageTime(
                            message.createdAt
                          )}
                        </Text>
                      </View>
                    )
                  )
                )}
              </ScrollView>

              <TextInput
                value={newMessage}
                onChangeText={
                  setNewMessage
                }
                placeholder={`Escribe a ${displayName}...`}
                placeholderTextColor="#999"
                style={[
                  styles.input,
                  {
                    minHeight: 54,
                    maxHeight: 130,
                  },
                ]}
                multiline
                maxLength={2000}
                editable={
                  !isSending
                }
              />

              <TouchableOpacity
                style={
                  styles.primaryButton
                }
                onPress={
                  handleSendMessage
                }
                disabled={
                  isSending ||
                  !newMessage.trim()
                }
              >
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  {isSending
                    ? "Enviando..."
                    : "Enviar"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  styles.backButton
                }
                onPress={() =>
                  router.replace(
                    "/conversations"
                  )
                }
              >
                <Text
                  style={
                    styles.backButtonText
                  }
                >
                  ← Volver a conversaciones
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}