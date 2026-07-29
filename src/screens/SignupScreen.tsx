import {
  useState,
} from "react";

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

import {
  supabase,
} from "../lib/supabase";

export default function SignupScreen() {
  const [
    name,
    setName,
  ] = useState("");

  const [
    city,
    setCity,
  ] = useState("");

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    debugMessage,
    setDebugMessage,
  ] = useState("");

  const handleSignup =
    async () => {
      const cleanName =
        name.trim();

      const cleanCity =
        city.trim();

      const cleanEmail =
        email
          .trim()
          .toLowerCase();

      setDebugMessage(
        "Creando cuenta..."
      );

      if (
        !cleanName ||
        !cleanCity ||
        !cleanEmail ||
        !password.trim()
      ) {
        setDebugMessage(
          "Error: faltan campos."
        );

        Alert.alert(
          "Campos incompletos",
          "Completa nombre, ciudad, email y password."
        );

        return;
      }

      if (password.length < 6) {
        setDebugMessage(
          "Error: password muy corto."
        );

        Alert.alert(
          "Password débil",
          "Usa al menos 6 caracteres."
        );

        return;
      }

      try {
        setIsSubmitting(true);

        const {
          data: authData,
          error: authError,
        } = await supabase.auth.signUp({
          email:
            cleanEmail,

          password,

          options: {
            data: {
              name:
                cleanName,
            },
          },
        });

        if (authError) {
          throw authError;
        }

        const createdUser =
          authData.user;

        if (!createdUser?.id) {
          throw new Error(
            "Supabase no devolvió el UUID del usuario."
          );
        }

        setDebugMessage(
          "Usuario creado en Auth. Creando perfil..."
        );

        const {
          error: profileError,
        } = await supabase
          .from("profiles")
          .upsert(
            {
              user_id:
                createdUser.id,

              name:
                cleanName,

              email:
                cleanEmail,

              city:
                cleanCity,

              avatar:
                "https://i.pravatar.cc/300?img=12",

              credits:
                2,
            },
            {
              onConflict:
                "user_id",
            }
          );

        if (profileError) {
          throw profileError;
        }

        setDebugMessage(
          "Cuenta y perfil creados correctamente."
        );

        Alert.alert(
          "Cuenta creada",
          authData.session
            ? "Tu cuenta fue creada correctamente."
            : "Tu cuenta fue creada. Revisa tu correo si Supabase solicita confirmación."
        );

        router.replace("/login");
      } catch (error: any) {
        const message =
          error?.message ||
          "No se pudo crear la cuenta.";

        console.error(
          "Error creando cuenta:",
          error
        );

        setDebugMessage(
          `Error: ${message}`
        );

        Alert.alert(
          "Error",
          message
        );
      } finally {
        setIsSubmitting(false);
      }
    };

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={{
        paddingBottom: 50,
      }}
    >
      <Header />

      <View style={styles.formSection}>
        <Text style={styles.screenTitle}>
          Crear cuenta
        </Text>

        <Text
          style={styles.screenSubtitle}
        >
          Registro real con Supabase
          Auth.
        </Text>

        <TextInput
          placeholder="Nombre"
          placeholderTextColor="#999"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          style={styles.input}
          editable={!isSubmitting}
        />

        <TextInput
          placeholder="Ciudad"
          placeholderTextColor="#999"
          value={city}
          onChangeText={setCity}
          autoCapitalize="words"
          style={styles.input}
          editable={!isSubmitting}
        />

        <TextInput
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          style={styles.input}
          editable={!isSubmitting}
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          style={styles.input}
          editable={!isSubmitting}
        />

        <TouchableOpacity
          style={[
            styles.primaryButton,

            isSubmitting && {
              opacity: 0.6,
            },
          ]}
          onPress={() => {
            void handleSignup();
          }}
          disabled={isSubmitting}
        >
          <Text
            style={
              styles.primaryButtonText
            }
          >
            {isSubmitting
              ? "Creando..."
              : "Crear cuenta"}
          </Text>
        </TouchableOpacity>

        {debugMessage ? (
          <View
            style={
              styles.emptyStateCard
            }
          >
            <Text
              style={
                styles.emptyStateTitle
              }
            >
              Estado
            </Text>

            <Text
              style={
                styles.emptyStateText
              }
            >
              {debugMessage}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.contactButton}
          onPress={() =>
            router.push("/login")
          }
          disabled={isSubmitting}
        >
          <Text
            style={
              styles.primaryButtonText
            }
          >
            Ya tengo cuenta
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            router.push("/")
          }
          disabled={isSubmitting}
        >
          <Text
            style={
              styles.backButtonText
            }
          >
            ← Volver al inicio
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}