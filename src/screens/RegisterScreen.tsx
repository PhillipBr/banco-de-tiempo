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
import { useAuthContext } from "../context/AuthContext";

import {
  mapSupabaseProfileToAppUser,
  upsertProfileByUserId,
} from "../lib/profileApi";

export default function RegisterScreen() {
  const { updateUser, user } = useAppContext();
  const { authUser } = useAuthContext();

  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || authUser?.email || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [city, setCity] = useState(user.city || "");
  const [offeredService, setOfferedService] = useState(
    user.offeredServices[0] || ""
  );

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async () => {
    if (!authUser?.id) {
      Alert.alert("Error", "No hay sesión activa.");
      return;
    }

    if (!name || !email || !city || !offeredService) {
      Alert.alert(
        "Campos incompletos",
        "Completa nombre, email, ciudad y servicio."
      );
      return;
    }

    try {
      setIsSaving(true);

      const savedProfile = await upsertProfileByUserId({
        user_id: authUser.id,
        name,
        email,
        phone,
        city,
        avatar: user.avatar || "https://i.pravatar.cc/300?img=12",
        credits: user.credits || 2,
      });

      const mappedUser = mapSupabaseProfileToAppUser(savedProfile);

      updateUser({
        ...mappedUser,
        offeredServices: [offeredService],
        neededServices: user.neededServices,
        history: user.history,
      });

      Alert.alert("Perfil guardado", "Tu perfil fue guardado en tu cuenta.");

      router.push("/profile");
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo guardar el perfil.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.page}>
      <Header />

      <View style={styles.formSection}>
        <Text style={styles.screenTitle}>Crear / Editar Perfil</Text>

        <Text style={styles.screenSubtitle}>
          Guarda tu perfil asociado a tu sesión.
        </Text>

        <TextInput
          placeholder="Nombre"
          placeholderTextColor="#999"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />

        <TextInput
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        <TextInput
          placeholder="Teléfono"
          placeholderTextColor="#999"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          style={styles.input}
        />

        <TextInput
          placeholder="Ciudad"
          placeholderTextColor="#999"
          value={city}
          onChangeText={setCity}
          style={styles.input}
        />

        <TextInput
          placeholder="Servicio que puedo ofrecer"
          placeholderTextColor="#999"
          value={offeredService}
          onChangeText={setOfferedService}
          style={styles.input}
        />

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleSaveProfile}
          disabled={isSaving}
        >
          <Text style={styles.primaryButtonText}>
            {isSaving ? "Guardando..." : "Guardar perfil"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/profile")}
        >
          <Text style={styles.backButtonText}>← Volver al perfil</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}