import { useState } from "react";

import {
  Alert,
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

import { completeRequestTransaction } from "../lib/transactionApi";
import { getOrCreateConversation } from "../lib/messageApi";

type RequestCardProps = {
  item: AppRequest;
  currentUserId: string;
  onStatusChange?: () => void | Promise<void>;
};

function formatDate(dateValue?: string): string {
  if (!dateValue) {
    return "Sin fecha";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue.slice(0, 10);
  }

  return new Intl.DateTimeFormat("es-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
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

export default function RequestCard({
  item,
  currentUserId,
  onStatusChange,
}: RequestCardProps) {
  const [isProcessing, setIsProcessing] =
    useState(false);

  const [isOpeningChat, setIsOpeningChat] =
    useState(false);

  const isProvider =
    item.providerUserId === currentUserId;

  const isRequester =
    item.requesterUserId === currentUserId;

  const isParticipant = isProvider || isRequester;
  const isPending = item.status === "pending";

  const otherUserId = isProvider
    ? item.requesterUserId
    : item.providerUserId;

  const otherUserName = isProvider
    ? item.requesterName
    : item.providerName;

  const handleOpenChat = async () => {
    if (!isParticipant || !otherUserId) {
      Alert.alert(
        "Acceso denegado",
        "No se pudo identificar al otro participante."
      );
      return;
    }

    try {
      setIsOpeningChat(true);

      const conversation =
        await getOrCreateConversation({
          otherUserId,
          serviceId: item.serviceId || null,
          requestId: item.supabaseId,
          serviceName: item.serviceName,
        });

      router.push({
        pathname: "/chat/[id]",
        params: {
          id: conversation.id,
          name: otherUserName,
          serviceName: item.serviceName,
        },
      });
    } catch (error: any) {
      Alert.alert(
        "No se pudo abrir el chat",
        error?.message ||
          "Ocurrió un error creando la conversación."
      );
    } finally {
      setIsOpeningChat(false);
    }
  };

  const handleCompleteRequest = () => {
    Alert.alert(
      "Completar solicitud",
      `Se transferirán ${item.credits} ${
        item.credits === 1
          ? "crédito"
          : "créditos"
      } desde ${item.requesterName} hacia ${item.providerName}.`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Completar",
          onPress: async () => {
            try {
              setIsProcessing(true);

              await completeRequestTransaction(
                item.supabaseId
              );

              Alert.alert(
                "Solicitud completada",
                "La transacción fue registrada correctamente."
              );

              await onStatusChange?.();
            } catch (error: any) {
              Alert.alert(
                "No se pudo completar",
                error?.message ||
                  "Ocurrió un error procesando la transacción."
              );
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleCancelRequest = () => {
    Alert.alert(
      "Cancelar solicitud",
      "Esta acción marcará la solicitud como cancelada.",
      [
        {
          text: "Volver",
          style: "cancel",
        },
        {
          text: "Cancelar solicitud",
          style: "destructive",
          onPress: async () => {
            try {
              setIsProcessing(true);

              await cancelRequestInSupabase(
                item.supabaseId
              );

              Alert.alert(
                "Solicitud cancelada",
                "La solicitud fue cancelada correctamente."
              );

              await onStatusChange?.();
            } catch (error: any) {
              Alert.alert(
                "No se pudo cancelar",
                error?.message ||
                  "Ocurrió un error cancelando la solicitud."
              );
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.serviceCard}>
      <Text style={styles.cardTitle}>
        {item.serviceName}
      </Text>

      <Text style={styles.profileLine}>
        Proveedor: {item.providerName}
      </Text>

      <Text style={styles.profileLine}>
        Solicitante: {item.requesterName}
      </Text>

      <Text style={styles.profileLine}>
        Tiempo: {item.credits}{" "}
        {item.credits === 1 ? "hora" : "horas"}
      </Text>

      <Text style={styles.profileLine}>
        Fecha: {formatDate(item.date)}
      </Text>

      <Text style={styles.profileLine}>
        Estado: {getStatusLabel(item.status)}
      </Text>

      {isParticipant ? (
        <TouchableOpacity
          style={[
            styles.contactButton,
            {
              marginTop: 16,
            },
          ]}
          onPress={handleOpenChat}
          disabled={isOpeningChat || isProcessing}
        >
          <Text style={styles.primaryButtonText}>
            {isOpeningChat
              ? "Abriendo chat..."
              : `Contactar a ${otherUserName}`}
          </Text>
        </TouchableOpacity>
      ) : null}

      {isPending && isParticipant ? (
        <View
          style={{
            marginTop: 12,
            gap: 10,
          }}
        >
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleCompleteRequest}
            disabled={isProcessing || isOpeningChat}
          >
            <Text
              style={styles.primaryButtonText}
            >
              {isProcessing
                ? "Procesando..."
                : "Completar intercambio"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleCancelRequest}
            disabled={isProcessing || isOpeningChat}
          >
            <Text
              style={styles.primaryButtonText}
            >
              Cancelar solicitud
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {item.status === "completed" ? (
        <Text
          style={{
            marginTop: 14,
            fontWeight: "700",
          }}
        >
          Intercambio completado
        </Text>
      ) : null}

      {item.status === "cancelled" ? (
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