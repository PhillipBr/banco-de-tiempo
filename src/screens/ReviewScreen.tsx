import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import Header from "../components/Header";
import { styles } from "../theme/styles";
import { useAppContext } from "../context/AppContext";
import {
  getRequests,
  mapSupabaseRequestToAppRequest,
} from "../lib/requestApi";
import { createReviewInSupabase } from "../lib/reviewApi";

export default function ReviewScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAppContext();

  const requestId = String(id);

  const [request, setRequest] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadRequest();
  }, []);

  const loadRequest = async () => {
    try {
      setIsLoading(true);

      const data = await getRequests();
      const mappedRequests = data.map(mapSupabaseRequestToAppRequest);

      const foundRequest = mappedRequests.find(
        (item) =>
          item.supabaseId === requestId ||
          item.id.toString() === requestId
      );

      if (foundRequest) {
        setRequest(foundRequest);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo cargar la solicitud.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveReview = async () => {
    if (!request?.serviceId) {
      Alert.alert("Error", "La solicitud no tiene servicio asociado.");
      return;
    }

    if (!comment.trim()) {
      Alert.alert("Comentario requerido", "Escribe un comentario breve.");
      return;
    }

    try {
      setIsSaving(true);

      await createReviewInSupabase({
        service_id: String(request.serviceId),
        provider_name: request.providerName,
        reviewer_name: user.name,
        rating,
        comment,
      });

      Alert.alert("Review guardada", "Tu calificación fue registrada en Supabase.");

      router.push("/requests");
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo guardar la review.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <ScrollView style={styles.page}>
        <Header />

        <View style={styles.formSection}>
          <Text style={styles.screenTitle}>Cargando solicitud...</Text>
        </View>
      </ScrollView>
    );
  }

  if (!request) {
    return (
      <ScrollView style={styles.page}>
        <Header />

        <View style={styles.formSection}>
          <Text style={styles.screenTitle}>Solicitud no encontrada</Text>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push("/requests")}
          >
            <Text style={styles.backButtonText}>← Volver a solicitudes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.page}>
      <Header />

      <View style={styles.formSection}>
        <Text style={styles.screenTitle}>Calificar Servicio</Text>

        <Text style={styles.screenSubtitle}>
          Evalúa tu experiencia con {request.providerName}.
        </Text>

        <View style={styles.confirmCard}>
          <Text style={styles.servicePerson}>{request.serviceName}</Text>
          <Text style={styles.serviceDetail}>Proveedor: {request.providerName}</Text>
          <Text style={styles.serviceDetail}>Fecha: {request.date}</Text>
        </View>

        <Text style={styles.cardTitle}>Calificación</Text>

        <View style={styles.filterRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              style={[
                styles.filterButton,
                rating === star && styles.filterButtonActive,
              ]}
              onPress={() => setRating(star)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  rating === star && styles.filterButtonTextActive,
                ]}
              >
                {star} ⭐
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          placeholder="Escribe un comentario..."
          placeholderTextColor="#999"
          value={comment}
          onChangeText={setComment}
          style={styles.input}
          multiline
        />

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleSaveReview}
          disabled={isSaving}
        >
          <Text style={styles.primaryButtonText}>
            {isSaving ? "Guardando..." : "Guardar review"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/requests")}
        >
          <Text style={styles.backButtonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}