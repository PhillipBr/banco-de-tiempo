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
import { createService } from "../lib/serviceApi";

export default function AddServiceScreen() {
  const { user } = useAppContext();

  const [service, setService] = useState("");
  const [category, setCategory] = useState("Educación");
  const [mode, setMode] = useState("Remoto");
  const [isSaving, setIsSaving] = useState(false);

  const handleAddService = async () => {
    if (!service || !category || !mode) {
      Alert.alert(
        "Campos incompletos",
        "Completa servicio, categoría y modalidad."
      );
      return;
    }

    try {
      setIsSaving(true);

      await createService({
        provider_name: user.name,
        title: service,
        category,
        mode,
        credits: 1,
        avatar: user.avatar || "https://i.pravatar.cc/300?img=12",
        rating: 4.8,
      });

      Alert.alert("Servicio publicado", "Tu servicio fue guardado en Supabase.");

      router.push("/services");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "No se pudo publicar el servicio."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.page}>
      <Header />

      <View style={styles.formSection}>
        <Text style={styles.screenTitle}>Agregar Servicio</Text>

        <Text style={styles.screenSubtitle}>
          Publica un servicio real guardado en Supabase.
        </Text>

        <TextInput
          placeholder="Servicio que ofrezco"
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
          onPress={handleAddService}
          disabled={isSaving}
        >
          <Text style={styles.primaryButtonText}>
            {isSaving ? "Guardando..." : "Agregar servicio"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/services")}
        >
          <Text style={styles.backButtonText}>← Volver a servicios</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}