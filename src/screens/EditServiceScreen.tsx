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
import { categories } from "../data/categories";
import {
  getServices,
  mapSupabaseServiceToAppService,
  updateServiceById,
} from "../lib/serviceApi";

export default function EditServiceScreen() {
  const { id } = useLocalSearchParams();

  const serviceId = String(id);

  const [selectedService, setSelectedService] = useState<any>(null);
  const [service, setService] = useState("");
  const [category, setCategory] = useState("Educación");
  const [mode, setMode] = useState("Remoto");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSelectedService();
  }, []);

  const loadSelectedService = async () => {
    try {
      setIsLoading(true);

      const data = await getServices();
      const mappedServices = data.map(mapSupabaseServiceToAppService);

      const foundService = mappedServices.find(
        (item) => item.supabaseId === serviceId
      );

      if (foundService) {
        setSelectedService(foundService);
        setService(foundService.service);
        setCategory(foundService.category);
        setMode(foundService.mode);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo cargar el servicio.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateService = async () => {
    if (!selectedService?.supabaseId) return;

    if (!service || !category || !mode) {
      Alert.alert(
        "Campos incompletos",
        "Completa servicio, categoría y modalidad."
      );
      return;
    }

    try {
      setIsSaving(true);

      await updateServiceById(selectedService.supabaseId, {
        title: service,
        category,
        mode,
        credits: selectedService.credits || 1,
      });

      Alert.alert("Servicio actualizado", "El servicio fue actualizado en Supabase.");

      router.push("/my-services");
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo actualizar el servicio.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <ScrollView style={styles.page}>
        <Header />

        <View style={styles.formSection}>
          <Text style={styles.screenTitle}>Cargando servicio...</Text>
        </View>
      </ScrollView>
    );
  }

  if (!selectedService) {
    return (
      <ScrollView style={styles.page}>
        <Header />

        <View style={styles.formSection}>
          <Text style={styles.screenTitle}>Servicio no encontrado</Text>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push("/my-services")}
          >
            <Text style={styles.backButtonText}>← Volver a mis servicios</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.page}>
      <Header />

      <View style={styles.formSection}>
        <Text style={styles.screenTitle}>Editar Servicio</Text>

        <Text style={styles.screenSubtitle}>
          Actualiza tu servicio real en Supabase.
        </Text>

        <TextInput
          placeholder="Servicio"
          placeholderTextColor="#999"
          value={service}
          onChangeText={setService}
          style={styles.input}
        />

        <Text style={styles.cardTitle}>Categoría</Text>

        <View style={styles.filterRow}>
          {categories
            .filter((item) => item !== "Todas")
            .map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.filterButton,
                  category === item && styles.filterButtonActive,
                ]}
                onPress={() => setCategory(item)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    category === item && styles.filterButtonTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
        </View>

        <Text style={styles.cardTitle}>Modalidad</Text>

        <View style={styles.filterRow}>
          {["Remoto", "Presencial"].map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.filterButton,
                mode === item && styles.filterButtonActive,
              ]}
              onPress={() => setMode(item)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  mode === item && styles.filterButtonTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleUpdateService}
          disabled={isSaving}
        >
          <Text style={styles.primaryButtonText}>
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/my-services")}
        >
          <Text style={styles.backButtonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}