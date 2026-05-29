import { Alert, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";

import { ServiceRequest, useAppContext } from "../context/AppContext";
import { styles } from "../theme/styles";
import { updateRequestStatus } from "../lib/requestApi";
import {
  getProfileByName,
  updateProfileCreditsByName,
} from "../lib/profileApi";

type RequestCardProps = {
  item: ServiceRequest;
  onStatusChange?: () => void;
};

export default function RequestCard({ item, onStatusChange }: RequestCardProps) {
  const { user, updateUser } = useAppContext();

  const isIncoming = item.providerName === user.name;
  const isOutgoing = item.requesterName === user.name;

  const handleComplete = async () => {
    if (!item.supabaseId) {
      Alert.alert("Error", "Esta solicitud no tiene ID de Supabase.");
      return;
    }

    try {
      if (isOutgoing) {
        const requesterProfile = await getProfileByName(item.requesterName);

        if (requesterProfile.credits < item.credits) {
          Alert.alert(
            "Créditos insuficientes",
            "No tienes créditos suficientes para completar esta solicitud."
          );
          return;
        }

        const newRequesterCredits = requesterProfile.credits - item.credits;

        await updateProfileCreditsByName(
          item.requesterName,
          newRequesterCredits
        );

        if (item.requesterName === user.name) {
          updateUser({
            credits: newRequesterCredits,
          });
        }
      }

      if (isIncoming) {
        const providerProfile = await getProfileByName(item.providerName);

        const newProviderCredits = providerProfile.credits + item.credits;

        await updateProfileCreditsByName(
          item.providerName,
          newProviderCredits
        );

        if (item.providerName === user.name) {
          updateUser({
            credits: newProviderCredits,
          });
        }
      }

      await updateRequestStatus(item.supabaseId, "completed");

      Alert.alert("Servicio completado", "Créditos y solicitud actualizados.");

      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo completar.");
    }
  };

  const handleCancel = async () => {
    if (!item.supabaseId) {
      Alert.alert("Error", "Esta solicitud no tiene ID de Supabase.");
      return;
    }

    try {
      await updateRequestStatus(item.supabaseId, "cancelled");

      Alert.alert("Solicitud cancelada", "La solicitud fue actualizada.");

      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo cancelar.");
    }
  };

  return (
    <View style={styles.requestCard}>
      <Text style={styles.servicePerson}>{item.serviceName}</Text>

      <Text style={styles.serviceDetail}>
        Tipo: {isIncoming ? "Recibida" : isOutgoing ? "Enviada" : "General"}
      </Text>

      <Text style={styles.serviceDetail}>Proveedor: {item.providerName}</Text>
      <Text style={styles.serviceDetail}>Solicitante: {item.requesterName}</Text>
      <Text style={styles.serviceDetail}>Fecha: {item.date}</Text>
      <Text style={styles.serviceCost}>Créditos: {item.credits}</Text>
      <Text style={styles.requestStatus}>Estado: {item.status}</Text>

      {item.status === "pending" && (
        <>
          <TouchableOpacity style={styles.primaryButton} onPress={handleComplete}>
            <Text style={styles.primaryButtonText}>Marcar como completado</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dangerButton} onPress={handleCancel}>
            <Text style={styles.primaryButtonText}>Cancelar solicitud</Text>
          </TouchableOpacity>
        </>
      )}

      {item.status === "completed" && isOutgoing && (
        <TouchableOpacity
          style={styles.outlineActionButton}
          onPress={() =>
            router.push({
              pathname: "/review/[id]",
              params: {
                id: item.supabaseId || item.id.toString(),
              },
            })
          }
        >
          <Text style={styles.outlineActionButtonText}>Calificar servicio</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}