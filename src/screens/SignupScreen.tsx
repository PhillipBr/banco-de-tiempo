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
import { useAuthContext } from "../context/AuthContext";
import { upsertProfileByName } from "../lib/profileApi";

export default function SignupScreen() {
  const { signUp } = useAuthContext();

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debugMessage, setDebugMessage] = useState("");

  const handleSignup = async () => {
    setDebugMessage("Creando cuenta...");

    if (!name.trim() || !city.trim() || !email.trim() || !password.trim()) {
      setDebugMessage("Error: faltan campos.");
      Alert.alert("Campos incompletos", "Completa nombre, ciudad, email y password.");
      return;
    }

    if (password.length < 6) {
      setDebugMessage("Error: password muy corto.");
      Alert.alert("Password débil", "Usa al menos 6 caracteres.");
      return;
    }

    try {
      setIsSubmitting(true);

      const cleanEmail = email.trim().toLowerCase();
      const cleanName = name.trim();

      const { errorMessage, successMessage } = await signUp(
        cleanEmail,
        password,
        cleanName
      );

      if (errorMessage) {
        setDebugMessage(`Supabase error: ${errorMessage}`);
        Alert.alert("Error creando cuenta", errorMessage);
        return;
      }

      setDebugMessage(successMessage || "Usuario creado en Auth. Creando profile...");

      await upsertProfileByName({
        name: cleanName,
        email: cleanEmail,
        city: city.trim(),
        avatar: "https://i.pravatar.cc/300?img=12",
        credits: 2,
      });

      setDebugMessage("Cuenta y perfil creados correctamente.");

      Alert.alert(
        "Cuenta creada",
        "Revisa Authentication → Users y Table Editor → profiles."
      );

      router.push("/login");
    } catch (error: any) {
      const message = error.message || "No se pudo crear la cuenta.";
      setDebugMessage(`Catch error: ${message}`);
      Alert.alert("Error", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.page}>
      <Header />

      <View style={styles.formSection}>
        <Text style={styles.screenTitle}>Crear Cuenta</Text>

        <Text style={styles.screenSubtitle}>
          Registro real con Supabase Auth.
        </Text>

        <TextInput
          placeholder="Nombre"
          placeholderTextColor="#999"
          value={name}
          onChangeText={setName}
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
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleSignup}
          disabled={isSubmitting}
        >
          <Text style={styles.primaryButtonText}>
            {isSubmitting ? "Creando..." : "Crear cuenta"}
          </Text>
        </TouchableOpacity>

        {debugMessage ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>Debug</Text>
            <Text style={styles.emptyStateText}>{debugMessage}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => router.push("/login")}
        >
          <Text style={styles.primaryButtonText}>Ya tengo cuenta</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/")}
        >
          <Text style={styles.backButtonText}>← Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}