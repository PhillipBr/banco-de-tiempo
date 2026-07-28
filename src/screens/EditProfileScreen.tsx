import {
  useCallback,
  useState,
} from "react";

import {
  Alert,
  Image,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  router,
  useFocusEffect,
} from "expo-router";

import * as ImagePicker from "expo-image-picker";

import Header from "../components/Header";

import { styles } from "../theme/styles";

import {
  useAppContext,
} from "../context/AppContext";

import {
  useAuthContext,
} from "../context/AuthContext";

import {
  getOrCreateProfileByUserId,
  mapSupabaseProfileToAppUser,
  updateProfileByUserId,
} from "../lib/profileApi";

import {
  uploadProfileAvatar,
} from "../lib/avatarApi";

const DEFAULT_AVATAR =
  "https://i.pravatar.cc/300?img=12";

export default function EditProfileScreen() {
  const {
    session,
    authUser,
    isAuthLoading,
  } = useAuthContext();

  const {
    user,
    updateUser,
  } = useAppContext();

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [city, setCity] =
    useState("Toronto");

  const [community, setCommunity] =
    useState("");

  const [bio, setBio] =
    useState("");

  const [
    skillsText,
    setSkillsText,
  ] = useState("");

  /*
   * URL remota que ya está guardada
   * en la tabla profiles.
   */
  const [avatar, setAvatar] =
    useState(DEFAULT_AVATAR);

  /*
   * URI temporal de la nueva foto
   * seleccionada desde el dispositivo.
   */
  const [
    selectedImageUri,
    setSelectedImageUri,
  ] = useState("");

  const [
    selectedImageMimeType,
    setSelectedImageMimeType,
  ] = useState<string | null>(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  /*
   * Carga los datos actuales desde Supabase.
   */
  const loadProfile =
    useCallback(async () => {
      if (!authUser?.id) {
        return;
      }

      try {
        setIsLoading(true);

        const profile =
          await getOrCreateProfileByUserId(
            authUser.id,
            authUser.email
          );

        setName(profile.name ?? "");
        setEmail(profile.email ?? "");
        setPhone(profile.phone ?? "");

        setCity(
          profile.city ||
          "Toronto"
        );

        setCommunity(
          profile.community ?? ""
        );

        setBio(profile.bio ?? "");

        setSkillsText(
          (profile.skills ?? []).join(
            ", "
          )
        );

        setAvatar(
          profile.avatar ||
          DEFAULT_AVATAR
        );

        setSelectedImageUri("");
        setSelectedImageMimeType(null);
      } catch (error: any) {
        console.error(
          "Error cargando perfil:",
          error
        );

        Alert.alert(
          "Error",
          error?.message ||
            "No se pudo cargar el perfil."
        );
      } finally {
        setIsLoading(false);
      }
    }, [
      authUser?.id,
      authUser?.email,
    ]);

  /*
   * Cada vez que se abre la pantalla,
   * revisa la sesión y carga el perfil.
   */
  useFocusEffect(
    useCallback(() => {
      if (
        !isAuthLoading &&
        !session
      ) {
        router.replace("/login");
        return;
      }

      if (
        session &&
        authUser?.id
      ) {
        loadProfile();
      }
    }, [
      session,
      authUser?.id,
      isAuthLoading,
      loadProfile,
    ])
  );

  /*
   * Convierte:
   *
   * Matemáticas, Tecnología, Inglés
   *
   * en:
   *
   * ["Matemáticas", "Tecnología", "Inglés"]
   */
  const parseSkills = (): string[] => {
    return Array.from(
      new Set(
        skillsText
          .split(",")
          .map((skill) =>
            skill.trim()
          )
          .filter(Boolean)
      )
    );
  };

  /*
   * HANDLE significa "manejar".
   *
   * Esta función maneja la selección
   * de una imagen desde el dispositivo.
   */
  const handlePickImage = async () => {
    try {
      /*
       * En Android e iOS pedimos permiso.
       * En navegador no es necesario.
       */
      if (Platform.OS !== "web") {
        const permissionResult =
          await ImagePicker
            .requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
          Alert.alert(
            "Permiso requerido",
            "Debes permitir acceso a tus fotos para seleccionar una imagen."
          );

          return;
        }
      }

      const result =
        await ImagePicker
          .launchImageLibraryAsync({
            mediaTypes:
              ImagePicker
                .MediaTypeOptions
                .Images,

            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });

      if (result.canceled) {
        return;
      }

      const selectedAsset =
        result.assets?.[0];

      if (!selectedAsset?.uri) {
        Alert.alert(
          "Error",
          "No se pudo leer la imagen seleccionada."
        );

        return;
      }

      setSelectedImageUri(
        selectedAsset.uri
      );

      setSelectedImageMimeType(
        selectedAsset.mimeType ??
          null
      );
    } catch (error: any) {
      console.error(
        "Error seleccionando imagen:",
        error
      );

      Alert.alert(
        "Error",
        error?.message ||
          "No se pudo seleccionar la imagen."
      );
    }
  };

  /*
   * Cancela la nueva imagen seleccionada.
   * No elimina la foto antigua.
   */
  const handleRemoveSelectedImage =
    () => {
      setSelectedImageUri("");
      setSelectedImageMimeType(null);
    };

  /*
   * Esta función:
   *
   * 1. Valida los datos.
   * 2. Sube la imagen a Supabase Storage.
   * 3. Obtiene la URL pública.
   * 4. Guarda la URL en profiles.avatar.
   * 5. Actualiza el AppContext.
   */
  const handleSaveProfile = async () => {
    const normalizedName =
      name.trim();

    if (!normalizedName) {
      Alert.alert(
        "Nombre requerido",
        "Escribe tu nombre."
      );

      return;
    }

    if (!authUser?.id) {
      Alert.alert(
        "Error",
        "No se encontró el usuario autenticado."
      );

      return;
    }

    try {
      setIsSaving(true);

      /*
       * Primero usamos la foto existente.
       */
      let finalAvatarUrl =
        avatar || DEFAULT_AVATAR;

      /*
       * Cuando existe una foto local nueva,
       * la subimos a Supabase Storage.
       */
      if (selectedImageUri) {
        finalAvatarUrl =
          await uploadProfileAvatar({
            userId: authUser.id,
            uri: selectedImageUri,
            mimeType:
              selectedImageMimeType,
          });
      }

      /*
       * Guardamos toda la información
       * en la tabla profiles.
       */
      const updatedProfile =
        await updateProfileByUserId(
          authUser.id,
          {
            name: normalizedName,

            email:
              email.trim() ||
              authUser.email ||
              "",

            phone: phone.trim(),

            city: city.trim(),

            community:
              community.trim(),

            bio: bio.trim(),

            skills: parseSkills(),

            avatar: finalAvatarUrl,
          }
        );

      /*
       * Convertimos el perfil de Supabase
       * al formato utilizado por AppContext.
       */
      const mappedUser =
        mapSupabaseProfileToAppUser(
          updatedProfile
        );

      /*
       * Actualizamos los datos locales
       * sin borrar el historial.
       */
      updateUser({
        ...mappedUser,

        offeredServices:
          user.offeredServices,

        neededServices:
          user.neededServices,

        history: user.history,
      });

      setAvatar(finalAvatarUrl);
      setSelectedImageUri("");
      setSelectedImageMimeType(null);

      Alert.alert(
        "Perfil actualizado",
        "Tus datos y tu foto fueron guardados correctamente."
      );

      router.replace("/profile");
    } catch (error: any) {
      console.error(
        "Error actualizando perfil:",
        error
      );

      Alert.alert(
        "Error",
        error?.message ||
          "No se pudo actualizar el perfil."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (
    isAuthLoading ||
    isLoading
  ) {
    return (
      <ScrollView
        style={styles.page}
      >
        <Header />

        <View
          style={styles.formSection}
        >
          <Text
            style={styles.screenTitle}
          >
            Cargando perfil...
          </Text>
        </View>
      </ScrollView>
    );
  }

  if (!session) {
    return (
      <ScrollView
        style={styles.page}
      >
        <Header />

        <View
          style={styles.formSection}
        >
          <Text
            style={styles.screenTitle}
          >
            Necesitas iniciar sesión
          </Text>

          <TouchableOpacity
            style={
              styles.primaryButton
            }
            onPress={() =>
              router.replace("/login")
            }
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              Ir a Login
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  const previewAvatar =
    selectedImageUri ||
    avatar ||
    DEFAULT_AVATAR;

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={{
        paddingBottom: 60,
      }}
    >
      <Header />

      <View
        style={styles.formSection}
      >
        <Text
          style={styles.screenTitle}
        >
          Editar perfil
        </Text>

        <Text
          style={styles.screenSubtitle}
        >
          Actualiza tu información,
          comunidad, habilidades y foto.
        </Text>

        <Image
          source={{
            uri: previewAvatar,
          }}
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            alignSelf: "center",
            marginTop: 18,
            marginBottom: 16,
            backgroundColor: "#222222",
          }}
        />

        <TouchableOpacity
          onPress={handlePickImage}
          disabled={isSaving}
          style={{
            alignSelf: "center",
            backgroundColor: "#ffffff",
            paddingVertical: 12,
            paddingHorizontal: 26,
            borderRadius: 8,
            marginBottom: 12,
            opacity: isSaving ? 0.6 : 1,
          }}
        >
          <Text
            style={{
              color: "#000000",
              fontSize: 15,
              fontWeight: "700",
            }}
          >
            Seleccionar foto
          </Text>
        </TouchableOpacity>

        {selectedImageUri ? (
          <>
            <Text
              style={{
                color: "#7ee787",
                textAlign: "center",
                marginBottom: 10,
              }}
            >
              Nueva foto seleccionada
            </Text>

            <TouchableOpacity
              onPress={
                handleRemoveSelectedImage
              }
              disabled={isSaving}
              style={{
                alignSelf: "center",
                borderWidth: 1,
                borderColor: "#ffffff",
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderRadius: 8,
                marginBottom: 22,
                opacity:
                  isSaving ? 0.6 : 1,
              }}
            >
              <Text
                style={{
                  color: "#ffffff",
                  fontSize: 14,
                  fontWeight: "600",
                }}
              >
                Cancelar nueva foto
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <View
            style={{
              marginBottom: 22,
            }}
          />
        )}

        <Text
          style={styles.cardTitle}
        >
          Nombre
        </Text>

        <TextInput
          placeholder="Tu nombre"
          placeholderTextColor="#999"
          value={name}
          onChangeText={setName}
          style={styles.input}
          editable={!isSaving}
          maxLength={80}
        />

        <Text
          style={styles.cardTitle}
        >
          Email
        </Text>

        <TextInput
          placeholder="correo@ejemplo.com"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          editable={!isSaving}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text
          style={styles.cardTitle}
        >
          Teléfono
        </Text>

        <TextInput
          placeholder="Teléfono opcional"
          placeholderTextColor="#999"
          value={phone}
          onChangeText={setPhone}
          style={styles.input}
          editable={!isSaving}
          keyboardType="phone-pad"
        />

        <Text
          style={styles.cardTitle}
        >
          Ciudad
        </Text>

        <TextInput
          placeholder="Toronto"
          placeholderTextColor="#999"
          value={city}
          onChangeText={setCity}
          style={styles.input}
          editable={!isSaving}
          maxLength={80}
        />

        <Text
          style={styles.cardTitle}
        >
          Comunidad o barrio
        </Text>

        <TextInput
          placeholder="Ejemplo: Kensington Market"
          placeholderTextColor="#999"
          value={community}
          onChangeText={setCommunity}
          style={styles.input}
          editable={!isSaving}
          maxLength={100}
        />

        <Text
          style={styles.cardTitle}
        >
          Biografía
        </Text>

        <TextInput
          placeholder="Cuenta brevemente quién eres y cómo puedes contribuir a la comunidad."
          placeholderTextColor="#999"
          value={bio}
          onChangeText={setBio}
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
            color: "#999999",
            textAlign: "right",
            marginTop: 5,
            marginBottom: 18,
          }}
        >
          {bio.length}/600
        </Text>

        <Text
          style={styles.cardTitle}
        >
          Habilidades
        </Text>

        <TextInput
          placeholder="Matemáticas, Inglés, Tecnología, Reparaciones"
          placeholderTextColor="#999"
          value={skillsText}
          onChangeText={setSkillsText}
          style={[
            styles.input,
            {
              minHeight: 90,
              textAlignVertical: "top",
              paddingTop: 14,
            },
          ]}
          editable={!isSaving}
          multiline
          numberOfLines={4}
          maxLength={400}
        />

        <Text
          style={[
            styles.screenSubtitle,
            {
              marginBottom: 10,
            },
          ]}
        >
          Separa cada habilidad con una
          coma.
        </Text>

        <View
          style={styles.filterRow}
        >
          {parseSkills().map(
            (skill) => (
              <View
                key={skill}
                style={
                  styles.filterButton
                }
              >
                <Text
                  style={
                    styles.filterButtonText
                  }
                >
                  {skill}
                </Text>
              </View>
            )
          )}
        </View>

        <TouchableOpacity
          style={
            styles.primaryButton
          }
          onPress={
            handleSaveProfile
          }
          disabled={isSaving}
        >
          <Text
            style={
              styles.primaryButtonText
            }
          >
            {isSaving
              ? "Guardando..."
              : "Guardar cambios"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            router.replace("/profile")
          }
          disabled={isSaving}
        >
          <Text
            style={
              styles.backButtonText
            }
          >
            ← Volver al perfil
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}