import { Alert, Platform, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";

import { styles } from "../theme/styles";
import { Service, useAppContext } from "../context/AppContext";
import { deleteServiceById } from "../lib/serviceApi";

type MyServiceCardProps = {
  item: Service;
};

export default function MyServiceCard({ item }: MyServiceCardProps) {
  const { createIncomingRequest } = useAppContext();

  const deleteFromSupabase = async () => {
    try {
      if (!item.supabaseId) {
        Alert.alert("Error", "Este servicio no tiene ID de Supabase.");
        return;
      }

      await deleteServiceById(item.supabaseId);

      Alert.alert(
        "Servicio eliminado",
        "El servicio fue eliminado de Supabase. Recarga la lista."
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo eliminar el servicio.");
    }
  };

  const confirmDelete = () => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "¿Seguro que quieres eliminar este servicio?"
      );

      if (confirmed) {
        deleteFromSupabase();
      }

      return;
    }

    Alert.alert(
      "Eliminar servicio",
      "¿Seguro que quieres eliminar este servicio?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: deleteFromSupabase,
        },
      ]
    );
  };

  const simulateIncomingRequest = () => {
    createIncomingRequest(item);

    Alert.alert(
      "Solicitud recibida",
      "Se creó una solicitud pendiente para este servicio."
    );

    router.push("/requests");
  };

  return (
    <View style={styles.serviceCard}>
      <Text style={styles.servicePerson}>{item.person}</Text>

      <Text style={styles.serviceName}>{item.service}</Text>

      <Text style={styles.serviceDetail}>Categoría: {item.category}</Text>

      <Text style={styles.serviceDetail}>Modalidad: {item.mode}</Text>

      <Text style={styles.serviceCost}>{item.credits} crédito / hora</Text>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={simulateIncomingRequest}
      >
        <Text style={styles.primaryButtonText}>Simular solicitud recibida</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.contactButton}
        onPress={() =>
          router.push({
            pathname: "/edit-service/[id]",
            params: {
              id: item.supabaseId || item.id.toString(),
            },
          })
        }
      >
        <Text style={styles.primaryButtonText}>Editar servicio</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.dangerButton} onPress={confirmDelete}>
        <Text style={styles.primaryButtonText}>Eliminar servicio</Text>
      </TouchableOpacity>
    </View>
  );
}