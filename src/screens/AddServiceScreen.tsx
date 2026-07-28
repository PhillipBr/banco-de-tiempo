import { useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";

import Header from "../components/Header";
import { styles } from "../theme/styles";
import { useAppContext } from "../context/AppContext";
import { categories } from "../data/categories";

import {
  createService,
  ServiceType,
} from "../lib/serviceApi";

export default function AddServiceScreen() {
  const { user } = useAppContext();

  const [serviceType, setServiceType] =
    useState<ServiceType>("offer");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [category, setCategory] =
    useState("Educación");

  const [mode, setMode] =
    useState("Remoto");

  const [isSaving, setIsSaving] =
    useState(false);

  const isRequest =
    serviceType === "request";

  const handleAddService = async () => {
    const normalizedTitle = title.trim();

    const normalizedDescription =
      description.trim();

    if (!normalizedTitle) {
      Alert.alert(
        "Título requerido",
        isRequest
          ? "Escribe un título corto para tu pedido."
          : "Escribe un título corto para tu servicio."
      );

      return;
    }

    if (!normalizedDescription) {
      Alert.alert(
        "Descripción requerida",
        isRequest
          ? "Explica qué ayuda necesitas."
          : "Explica en qué consiste el servicio."
      );

      return;
    }

    if (!category) {
      Alert.alert(
        "Categoría requerida",
        "Selecciona una categoría."
      );

      return;
    }

    if (!mode) {
      Alert.alert(
        "Modalidad requerida",
        "Selecciona una modalidad."
      );

      return;
    }

    if (!user?.name?.trim()) {
      Alert.alert(
        "Perfil incompleto",
        "No se encontró tu nombre de usuario."
      );

      return;
    }

    try {
      setIsSaving(true);

      await createService({
        provider_name: user.name.trim(),
        title: normalizedTitle,
        description: normalizedDescription,
        category,
        mode,
        credits: 1,
        avatar:
          user.avatar ||
          "https://i.pravatar.cc/300?img=12",
        rating: 4.8,
        service_type: serviceType,
      });

      Alert.alert(
        isRequest
          ? "Pedido publicado"
          : "Oferta publicada",
        isRequest
          ? "Tu pedido de ayuda fue publicado correctamente."
          : "Tu oferta fue publicada correctamente."
      );

      router.replace("/services");
    } catch (error: any) {
      console.error(
        "Error publicando:",
        error
      );

      Alert.alert(
        "Error",
        error?.message ||
          "No se pudo guardar la publicación."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.page}>
      <Header />

      <View style={styles.formSection}>
        <Text style={styles.screenTitle}>
          Publicar
        </Text>

        <Text style={styles.screenSubtitle}>
          Ofrece un servicio o solicita ayuda a la comunidad.
        </Text>

        <Text style={styles.cardTitle}>
          Tipo de publicación
        </Text>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              serviceType === "offer" &&
                styles.filterButtonActive,
            ]}
            onPress={() =>
              setServiceType("offer")
            }
            disabled={isSaving}
          >
            <Text
              style={[
                styles.filterButtonText,
                serviceType === "offer" &&
                  styles.filterButtonTextActive,
              ]}
            >
              Ofrezco un servicio
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              serviceType === "request" &&
                styles.filterButtonActive,
            ]}
            onPress={() =>
              setServiceType("request")
            }
            disabled={isSaving}
          >
            <Text
              style={[
                styles.filterButtonText,
                serviceType === "request" &&
                  styles.filterButtonTextActive,
              ]}
            >
              Necesito ayuda
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.cardTitle}>
          Título
        </Text>

        <TextInput
          placeholder={
            isRequest
              ? "Ejemplo: Ayuda para reparar mi bicicleta"
              : "Ejemplo: Clases de inglés"
          }
          placeholderTextColor="#999"
          value={title}
          onChangeText={setTitle}
          style={styles.input}
          editable={!isSaving}
          maxLength={80}
        />

        <Text
          style={{
            color: "#999",
            textAlign: "right",
            marginTop: 5,
            marginBottom: 18,
          }}
        >
          {title.length}/80
        </Text>

        <Text style={styles.cardTitle}>
          Descripción
        </Text>

        <TextInput
          placeholder={
            isRequest
              ? "Explica qué ayuda necesitas, cuándo la necesitas y cualquier detalle importante."
              : "Describe qué incluye el servicio, tu experiencia, disponibilidad y cualquier detalle importante."
          }
          placeholderTextColor="#999"
          value={description}
          onChangeText={setDescription}
          style={[
            styles.input,
            {
              minHeight: 130,
              textAlignVertical: "top",
              paddingTop: 14,
            },
          ]}
          editable={!isSaving}
          multiline
          numberOfLines={6}
          maxLength={600}
        />

        <Text
          style={{
            color: "#999",
            textAlign: "right",
            marginTop: 5,
            marginBottom: 18,
          }}
        >
          {description.length}/600
        </Text>

        <Text style={styles.cardTitle}>
          Categoría
        </Text>

        <View style={styles.filterRow}>
          {categories
            .filter(
              (item) => item !== "Todas"
            )
            .map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.filterButton,
                  category === item &&
                    styles.filterButtonActive,
                ]}
                onPress={() =>
                  setCategory(item)
                }
                disabled={isSaving}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    category === item &&
                      styles.filterButtonTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
        </View>

        <Text style={styles.cardTitle}>
          Modalidad
        </Text>

        <View style={styles.filterRow}>
          {["Remoto", "Presencial"].map(
            (item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.filterButton,
                  mode === item &&
                    styles.filterButtonActive,
                ]}
                onPress={() =>
                  setMode(item)
                }
                disabled={isSaving}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    mode === item &&
                      styles.filterButtonTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>

        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyStateTitle}>
            {isRequest
              ? "Pedido de ayuda"
              : "Oferta de servicio"}
          </Text>

          <Text style={styles.emptyStateText}>
            {isRequest
              ? "Los demás usuarios podrán ofrecerte ayuda."
              : "Los demás usuarios podrán solicitar tu servicio."}
          </Text>

          <Text style={styles.emptyStateText}>
            1 hora equivale a 1 crédito.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleAddService}
          disabled={isSaving}
        >
          <Text style={styles.primaryButtonText}>
            {isSaving
              ? "Publicando..."
              : isRequest
                ? "Publicar pedido"
                : "Publicar oferta"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            router.replace("/services")
          }
          disabled={isSaving}
        >
          <Text style={styles.backButtonText}>
            ← Volver a servicios
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}