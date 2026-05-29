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

export default function LoginScreen() {
  const { signIn } = useAuthContext();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");

  const handleLogin = async () => {
    setLoginError("");

    if (!email.trim() || !password.trim()) {
      setLoginError("Ingresa email y contraseña.");
      Alert.alert("Campos incompletos", "Ingresa email y contraseña.");
      return;
    }

    try {
      setIsSubmitting(true);

      const { errorMessage } = await signIn(
        email.trim().toLowerCase(),
        password
      );

      if (errorMessage) {
        setLoginError(
          "Email o contraseña incorrectos. Revisa tus datos e intenta nuevamente."
        );
        return;
      }

      router.replace("/");
    } catch (error: any) {
      setLoginError(
        error.message || "No se pudo iniciar sesión. Intenta nuevamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.page}>
      <Header />

      <View style={styles.formSection}>
        <Text style={styles.screenTitle}>Login</Text>

        <Text style={styles.screenSubtitle}>
          Inicia sesión con Supabase Auth.
        </Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setLoginError("");
          }}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            setLoginError("");
          }}
          secureTextEntry
          style={styles.input}
          returnKeyType="go"
          onSubmitEditing={handleLogin}
        />

        {loginError ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>No se pudo iniciar sesión</Text>
            <Text style={styles.emptyStateText}>{loginError}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleLogin}
          disabled={isSubmitting}
        >
          <Text style={styles.primaryButtonText}>
            {isSubmitting ? "Entrando..." : "Entrar"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => router.push("/signup")}
        >
          <Text style={styles.primaryButtonText}>Crear cuenta</Text>
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