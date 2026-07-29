import { useState } from "react";

import {
  Alert,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { router } from "expo-router";

import { styles } from "../theme/styles";

import {
  AppRequest,
  cancelRequestInSupabase,
} from "../lib/requestApi";

import {
  completeRequestTransaction,
} from "../lib/transactionApi";

import {
  getOrCreateConversation,
  isValidUuid,
} from "../lib/messageApi";

type RequestCardProps = {
  item: AppRequest;

  currentUserId: string;

  onStatusChange?: () =>
    void | Promise<void>;
};

function formatDate(
  dateValue?: string
): string {
  if (!dateValue) {
    return "Sin fecha";
  }

  const date =
    new Date(dateValue);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return dateValue.slice(
      0,
      10
    );
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

function getStatusLabel(
  status: AppRequest["status"]
): string {
  switch (status) {
    case "pending":
      return "Pendiente";

    case "completed":
      return "Completada";

    case "cancelled":
      return "Cancelada";

    default:
      return status;
  }
}

function showMessage(
  title: string,
  message: string
): void {
  if (
    Platform.OS === "web" &&
    typeof window !== "undefined"
  ) {
    window.alert(
      `${title}\n\n${message}`
    );

    return;
  }

  Alert.alert(
    title,
    message
  );
}

export default function RequestCard({
  item,
  currentUserId,
  onStatusChange,
}: RequestCardProps) {
  const [
    isProcessing,
    setIsProcessing,
  ] = useState(false);

  const [
    isOpeningChat,
    setIsOpeningChat,
  ] = useState(false);

  const isProvider =
    item.providerUserId ===
    currentUserId;

  const isRequester =
    item.requesterUserId ===
    currentUserId;

  const isParticipant =
    isProvider ||
    isRequester;

  const isPending =
    item.status ===
    "pending";

  const otherUserId =
    isProvider
      ? item.requesterUserId
      : item.providerUserId;

  const otherUserName =
    isProvider
      ? item.requesterName
      : item.providerName;

  const handleOpenChat =
    async () => {
      if (!isParticipant) {
        showMessage(
          "Acceso denegado",
          "No eres participante de esta solicitud."
        );

        return;
      }

      if (
        !otherUserId ||
        !isValidUuid(
          otherUserId
        )
      ) {
        showMessage(
          "Usuario no disponible",
          "No se pudo identificar correctamente al otro participante."
        );

        return;
      }

      if (
        !item.supabaseId ||
        !isValidUuid(
          item.supabaseId
        )
      ) {
        showMessage(
          "Solicitud no disponible",
          "La solicitud no contiene un UUID válido."
        );

        return;
      }

      if (
        isOpeningChat ||
        isProcessing
      ) {
        return;
      }

      try {
        setIsOpeningChat(true);

        const conversation =
          await getOrCreateConversation({
            otherUserId,

            serviceId:
              item.serviceId &&
              isValidUuid(
                item.serviceId
              )
                ? item.serviceId
                : null,

            requestId:
              item.supabaseId,

            serviceName:
              item.serviceName,
          });

        if (
          !conversation?.id ||
          !isValidUuid(
            conversation.id
          )
        ) {
          throw new Error(
            "No se recibió un UUID válido para la conversación."
          );
        }

        router.push({
          pathname:
            "/chat/[id]",

          params: {
            id:
              conversation.id,

            name:
              otherUserName,

            serviceName:
              item.serviceName,
          },
        });
      } catch (error: any) {
        console.error(
          "Error abriendo chat:",
          error
        );

        showMessage(
          "No se pudo abrir el chat",
          error?.message ||
            "Ocurrió un error creando la conversación."
        );
      } finally {
        setIsOpeningChat(false);
      }
    };

  const executeCompleteRequest =
    async () => {
      try {
        setIsProcessing(true);

        const transaction =
          await completeRequestTransaction(
            item.supabaseId
          );

        console.log(
          "Transacción completada:",
          transaction
        );

        showMessage(
          "Intercambio completado",
          `${item.credits} ${
            item.credits === 1
              ? "crédito fue transferido"
              : "créditos fueron transferidos"
          } a ${item.providerName}.`
        );

        await onStatusChange?.();
      } catch (error: any) {
        console.error(
          "Error completando solicitud:",
          error
        );

        showMessage(
          "No se pudo completar",
          error?.message ||
            "Ocurrió un error procesando la transferencia."
        );
      } finally {
        setIsProcessing(false);
      }
    };

  const handleCompleteRequest =
    async () => {
      if (!isRequester) {
        showMessage(
          "Confirmación pendiente",
          "Solo el solicitante puede confirmar que recibió el servicio y transferir los créditos."
        );

        return;
      }

      if (!isPending) {
        showMessage(
          "Solicitud no disponible",
          "Esta solicitud ya no está pendiente."
        );

        return;
      }

      if (
        !item.supabaseId ||
        !isValidUuid(
          item.supabaseId
        )
      ) {
        showMessage(
          "Solicitud no válida",
          "No se encontró un UUID válido para esta solicitud."
        );

        return;
      }

      if (
        isProcessing ||
        isOpeningChat
      ) {
        return;
      }

      const confirmationMessage =
        `Confirmas que recibiste el servicio "${item.serviceName}".\n\n` +
        `Se transferirán ${item.credits} ${
          item.credits === 1
            ? "crédito"
            : "créditos"
        } desde tu cuenta hacia ${item.providerName}.`;

      if (
        Platform.OS === "web" &&
        typeof window !== "undefined"
      ) {
        const confirmed =
          window.confirm(
            `Confirmar servicio\n\n${confirmationMessage}`
          );

        if (confirmed) {
          await executeCompleteRequest();
        }

        return;
      }

      Alert.alert(
        "Confirmar servicio",
        confirmationMessage,
        [
          {
            text: "Volver",
            style: "cancel",
          },
          {
            text: "Confirmar y pagar",
            onPress: () => {
              void executeCompleteRequest();
            },
          },
        ]
      );
    };

  const executeCancelRequest =
    async () => {
      try {
        setIsProcessing(true);

        await cancelRequestInSupabase(
          item.supabaseId
        );

        showMessage(
          "Solicitud cancelada",
          "La solicitud fue cancelada correctamente."
        );

        await onStatusChange?.();
      } catch (error: any) {
        console.error(
          "Error cancelando solicitud:",
          error
        );

        showMessage(
          "No se pudo cancelar",
          error?.message ||
            "Ocurrió un error cancelando la solicitud."
        );
      } finally {
        setIsProcessing(false);
      }
    };

  const handleCancelRequest =
    async () => {
      if (!isParticipant) {
        showMessage(
          "Acceso denegado",
          "No eres participante de esta solicitud."
        );

        return;
      }

      if (!isPending) {
        showMessage(
          "Solicitud no disponible",
          "Esta solicitud ya no está pendiente."
        );

        return;
      }

      if (
        !item.supabaseId ||
        !isValidUuid(
          item.supabaseId
        )
      ) {
        showMessage(
          "Solicitud no válida",
          "No se encontró un UUID válido para esta solicitud."
        );

        return;
      }

      if (
        isProcessing ||
        isOpeningChat
      ) {
        return;
      }

      const confirmationMessage =
        "Esta acción marcará la solicitud como cancelada y no transferirá créditos.";

      if (
        Platform.OS === "web" &&
        typeof window !== "undefined"
      ) {
        const confirmed =
          window.confirm(
            `Cancelar solicitud\n\n${confirmationMessage}`
          );

        if (confirmed) {
          await executeCancelRequest();
        }

        return;
      }

      Alert.alert(
        "Cancelar solicitud",
        confirmationMessage,
        [
          {
            text: "Volver",
            style: "cancel",
          },
          {
            text: "Cancelar solicitud",
            style: "destructive",
            onPress: () => {
              void executeCancelRequest();
            },
          },
        ]
      );
    };

  return (
    <View
      style={
        styles.serviceCard
      }
    >
      <Text
        style={
          styles.cardTitle
        }
      >
        {item.serviceName}
      </Text>

      <Text
        style={
          styles.profileLine
        }
      >
        Proveedor:{" "}
        {item.providerName}
      </Text>

      <Text
        style={
          styles.profileLine
        }
      >
        Solicitante:{" "}
        {item.requesterName}
      </Text>

      <Text
        style={
          styles.profileLine
        }
      >
        Tiempo:{" "}
        {item.credits}{" "}
        {item.credits === 1
          ? "hora"
          : "horas"}
      </Text>

      <Text
        style={
          styles.profileLine
        }
      >
        Fecha:{" "}
        {formatDate(
          item.date
        )}
      </Text>

      <Text
        style={
          styles.profileLine
        }
      >
        Estado:{" "}
        {getStatusLabel(
          item.status
        )}
      </Text>

      {isProvider ? (
        <Text
          style={
            styles.screenSubtitle
          }
        >
          Tú eres el proveedor de este
          servicio.
        </Text>
      ) : null}

      {isRequester ? (
        <Text
          style={
            styles.screenSubtitle
          }
        >
          Tú solicitaste este servicio.
        </Text>
      ) : null}

      {isParticipant ? (
        <TouchableOpacity
          style={[
            styles.contactButton,

            {
              marginTop: 16,
            },

            isOpeningChat ||
            isProcessing
              ? {
                  opacity: 0.6,
                }
              : null,
          ]}
          onPress={
            handleOpenChat
          }
          disabled={
            isOpeningChat ||
            isProcessing
          }
        >
          <Text
            style={
              styles.primaryButtonText
            }
          >
            {isOpeningChat
              ? "Abriendo chat..."
              : `Contactar a ${otherUserName}`}
          </Text>
        </TouchableOpacity>
      ) : null}

      {isPending &&
      isRequester ? (
        <View
          style={{
            marginTop: 12,
            gap: 10,
          }}
        >
          <TouchableOpacity
            style={[
              styles.primaryButton,

              isProcessing ||
              isOpeningChat
                ? {
                    opacity: 0.6,
                  }
                : null,
            ]}
            onPress={
              handleCompleteRequest
            }
            disabled={
              isProcessing ||
              isOpeningChat
            }
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              {isProcessing
                ? "Procesando transferencia..."
                : "Confirmar servicio y pagar"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.dangerButton,

              isProcessing ||
              isOpeningChat
                ? {
                    opacity: 0.6,
                  }
                : null,
            ]}
            onPress={
              handleCancelRequest
            }
            disabled={
              isProcessing ||
              isOpeningChat
            }
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              {isProcessing
                ? "Procesando..."
                : "Cancelar solicitud"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {isPending &&
      isProvider ? (
        <View
          style={{
            marginTop: 14,
          }}
        >
          <Text
            style={
              styles.screenSubtitle
            }
          >
            Esperando que{" "}
            {item.requesterName} confirme
            el servicio y transfiera los
            créditos.
          </Text>

          <TouchableOpacity
            style={[
              styles.dangerButton,
              isProcessing && {
                opacity: 0.6,
              },
            ]}
            onPress={
              handleCancelRequest
            }
            disabled={
              isProcessing
            }
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              {isProcessing
                ? "Procesando..."
                : "Cancelar solicitud"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {item.status ===
      "completed" ? (
        <Text
          style={{
            marginTop: 14,
            fontWeight: "700",
          }}
        >
          Intercambio completado
        </Text>
      ) : null}

      {item.status ===
      "cancelled" ? (
        <Text
          style={{
            marginTop: 14,
            fontWeight: "700",
          }}
        >
          Solicitud cancelada
        </Text>
      ) : null}
    </View>
  );
}