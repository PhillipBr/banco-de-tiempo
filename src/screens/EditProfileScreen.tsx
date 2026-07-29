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

import {
  styles,
} from "../theme/styles";

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

import {
  formatCoordinate,
  LocationVisibility,
  requestCurrentLocation,
  reverseGeocodeCoordinates,
} from "../lib/locationApi";

const DEFAULT_AVATAR =
  "https://i.pravatar.cc/300?img=12";

const locationVisibilityOptions: {
  value: LocationVisibility;
  title: string;
  description: string;
}[] = [
  {
    value: "hidden",
    title: "Oculta",
    description:
      "Tu ubicación no aparecerá en búsquedas cercanas.",
  },
  {
    value: "community",
    title: "Comunidad",
    description:
      "Permite encontrarte cerca, sin mostrar coordenadas exactas.",
  },
  {
    value: "public",
    title: "Pública",
    description:
      "Tu ubicación aproximada podrá usarse en mapas comunitarios.",
  },
];

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

  const [
    name,
    setName,
  ] = useState("");

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    phone,
    setPhone,
  ] = useState("");

  const [
    city,
    setCity,
  ] = useState("Toronto");

  const [
    community,
    setCommunity,
  ] = useState("");

  const [
    bio,
    setBio,
  ] = useState("");

  const [
    skillsText,
    setSkillsText,
  ] = useState("");

  const [
    avatar,
    setAvatar,
  ] = useState(
    DEFAULT_AVATAR
  );

  const [
    selectedImageUri,
    setSelectedImageUri,
  ] = useState("");

  const [
    selectedImageMimeType,
    setSelectedImageMimeType,
  ] = useState<string | null>(
    null
  );

  const [
    latitude,
    setLatitude,
  ] = useState<number | null>(
    null
  );

  const [
    longitude,
    setLongitude,
  ] = useState<number | null>(
    null
  );

  const [
    locationVisibility,
    setLocationVisibility,
  ] =
    useState<LocationVisibility>(
      "community"
    );

  const [
    isLoadingLocation,
    setIsLoadingLocation,
  ] = useState(false);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

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

        setName(
          profile.name ?? ""
        );

        setEmail(
          profile.email ?? ""
        );

        setPhone(
          profile.phone ?? ""
        );

        setCity(
          profile.city ||
            "Toronto"
        );

        setCommunity(
          profile.community ?? ""
        );

        setBio(
          profile.bio ?? ""
        );

        setSkillsText(
          (
            profile.skills ?? []
          ).join(", ")
        );

        setAvatar(
          profile.avatar ||
            DEFAULT_AVATAR
        );

        setLatitude(
          profile.latitude
        );

        setLongitude(
          profile.longitude
        );

        setLocationVisibility(
          profile.location_visibility ||
            "community"
        );

        setSelectedImageUri("");
        setSelectedImageMimeType(
          null
        );
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

  useFocusEffect(
    useCallback(() => {
      if (
        !isAuthLoading &&
        !session
      ) {
        router.replace(
          "/login"
        );

        return;
      }

      if (
        session &&
        authUser?.id
      ) {
        void loadProfile();
      }
    }, [
      session,
      authUser?.id,
      isAuthLoading,
      loadProfile,
    ])
  );

  const parseSkills =
    (): string[] => {
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

  const handlePickImage =
    async () => {
      try {
        if (
          Platform.OS !==
          "web"
        ) {
          const permissionResult =
            await ImagePicker
              .requestMediaLibraryPermissionsAsync();

          if (
            !permissionResult.granted
          ) {
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

              allowsEditing:
                true,

              aspect:
                [1, 1],

              quality:
                0.8,
            });

        if (result.canceled) {
          return;
        }

        const selectedAsset =
          result.assets?.[0];

        if (
          !selectedAsset?.uri
        ) {
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

  const handleRemoveSelectedImage =
    () => {
      setSelectedImageUri("");
      setSelectedImageMimeType(
        null
      );
    };

  const handleUseCurrentLocation =
    async () => {
      try {
        setIsLoadingLocation(
          true
        );

        const coordinates =
          await requestCurrentLocation();

        setLatitude(
          coordinates.latitude
        );

        setLongitude(
          coordinates.longitude
        );

        if (
          locationVisibility ===
          "hidden"
        ) {
          setLocationVisibility(
            "community"
          );
        }

        const address =
          await reverseGeocodeCoordinates(
            coordinates.latitude,
            coordinates.longitude
          );

        if (address) {
          if (
            address.city &&
            (
              !city.trim() ||
              city.trim() ===
                "Toronto"
            )
          ) {
            setCity(
              address.city
            );
          }

          if (
            address.community &&
            !community.trim()
          ) {
            setCommunity(
              address.community
            );
          }
        }

        Alert.alert(
          "Ubicación obtenida",
          "Tu ubicación aproximada está lista. Presiona Guardar cambios para actualizar el perfil."
        );
      } catch (error: any) {
        console.error(
          "Error obteniendo ubicación:",
          error
        );

        Alert.alert(
          "No se pudo obtener la ubicación",
          error?.message ||
            "Revisa los permisos del navegador o dispositivo."
        );
      } finally {
        setIsLoadingLocation(
          false
        );
      }
    };

  const handleRemoveLocation =
    () => {
      setLatitude(null);
      setLongitude(null);
      setLocationVisibility(
        "hidden"
      );

      Alert.alert(
        "Ubicación eliminada",
        "Presiona Guardar cambios para confirmar."
      );
    };

  const handleSaveProfile =
    async () => {
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

        let finalAvatarUrl =
          avatar ||
          DEFAULT_AVATAR;

        if (selectedImageUri) {
          finalAvatarUrl =
            await uploadProfileAvatar({
              userId:
                authUser.id,

              uri:
                selectedImageUri,

              mimeType:
                selectedImageMimeType,
            });
        }

        const updatedProfile =
          await updateProfileByUserId(
            authUser.id,
            {
              name:
                normalizedName,

              email:
                email.trim() ||
                authUser.email ||
                "",

              phone:
                phone.trim(),

              city:
                city.trim(),

              community:
                community.trim(),

              bio:
                bio.trim(),

              skills:
                parseSkills(),

              avatar:
                finalAvatarUrl,

              latitude,

              longitude,

              location_visibility:
                locationVisibility,
            }
          );

        const mappedUser =
          mapSupabaseProfileToAppUser(
            updatedProfile
          );

        updateUser({
          ...mappedUser,

          offeredServices:
            user.offeredServices,

          neededServices:
            user.neededServices,

          history:
            user.history,
        });

        setAvatar(
          finalAvatarUrl
        );

        setSelectedImageUri("");

        setSelectedImageMimeType(
          null
        );

        Alert.alert(
          "Perfil actualizado",
          "Tus datos, foto y configuración de ubicación fueron guardados."
        );

        router.replace(
          "/profile"
        );
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
              router.replace(
                "/login"
              )
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

  const hasLocation =
    latitude !== null &&
    longitude !== null;

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
          comunidad, habilidades, foto y
          ubicación aproximada.
        </Text>

        <Image
          source={{
            uri: previewAvatar,
          }}
          style={{
            width:
              120,

            height:
              120,

            borderRadius:
              60,

            alignSelf:
              "center",

            marginTop:
              18,

            marginBottom:
              16,

            backgroundColor:
              "#222222",
          }}
        />

        <TouchableOpacity
          onPress={
            handlePickImage
          }
          disabled={
            isSaving
          }
          style={{
            alignSelf:
              "center",

            backgroundColor:
              "#ffffff",

            paddingVertical:
              12,

            paddingHorizontal:
              26,

            borderRadius:
              8,

            marginBottom:
              12,

            opacity:
              isSaving
                ? 0.6
                : 1,
          }}
        >
          <Text
            style={{
              color:
                "#000000",

              fontSize:
                15,

              fontWeight:
                "700",
            }}
          >
            Seleccionar foto
          </Text>
        </TouchableOpacity>

        {selectedImageUri ? (
          <>
            <Text
              style={{
                color:
                  "#7ee787",

                textAlign:
                  "center",

                marginBottom:
                  10,
              }}
            >
              Nueva foto seleccionada
            </Text>

            <TouchableOpacity
              onPress={
                handleRemoveSelectedImage
              }
              disabled={
                isSaving
              }
              style={{
                alignSelf:
                  "center",

                borderWidth:
                  1,

                borderColor:
                  "#ffffff",

                paddingVertical:
                  10,

                paddingHorizontal:
                  20,

                borderRadius:
                  8,

                marginBottom:
                  22,

                opacity:
                  isSaving
                    ? 0.6
                    : 1,
              }}
            >
              <Text
                style={{
                  color:
                    "#ffffff",

                  fontSize:
                    14,

                  fontWeight:
                    "600",
                }}
              >
                Cancelar nueva foto
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <View
            style={{
              marginBottom:
                22,
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

        <View
          style={[
            styles.profileCard,
            {
              marginTop: 20,
            },
          ]}
        >
          <Text
            style={styles.cardTitle}
          >
            Ubicación aproximada
          </Text>

          <Text
            style={
              styles.screenSubtitle
            }
          >
            La ubicación permite ordenar
            servicios por distancia. La
            aplicación no mostrará tu
            dirección exacta.
          </Text>

          {hasLocation ? (
            <View
              style={{
                marginTop:
                  14,
              }}
            >
              <Text
                style={
                  styles.profileLine
                }
              >
                Estado: ubicación guardada
              </Text>

              <Text
                style={
                  styles.profileLine
                }
              >
                Latitud:{" "}
                {formatCoordinate(
                  latitude
                )}
              </Text>

              <Text
                style={
                  styles.profileLine
                }
              >
                Longitud:{" "}
                {formatCoordinate(
                  longitude
                )}
              </Text>
            </View>
          ) : (
            <Text
              style={[
                styles.profileLine,
                {
                  marginTop:
                    14,

                  color:
                    "#999999",
                },
              ]}
            >
              Todavía no has guardado una ubicación.
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.primaryButton,
              (
                isLoadingLocation ||
                isSaving
              ) && {
                opacity:
                  0.6,
              },
            ]}
            onPress={
              handleUseCurrentLocation
            }
            disabled={
              isLoadingLocation ||
              isSaving
            }
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              {isLoadingLocation
                ? "Obteniendo ubicación..."
                : hasLocation
                  ? "Actualizar ubicación actual"
                  : "Usar mi ubicación actual"}
            </Text>
          </TouchableOpacity>

          {hasLocation ? (
            <TouchableOpacity
              style={
                styles.dangerButton
              }
              onPress={
                handleRemoveLocation
              }
              disabled={
                isSaving
              }
            >
              <Text
                style={
                  styles.primaryButtonText
                }
              >
                Eliminar ubicación
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <Text
          style={[
            styles.cardTitle,
            {
              marginTop:
                20,
            },
          ]}
        >
          Privacidad de ubicación
        </Text>

        {locationVisibilityOptions.map(
          (option) => {
            const selected =
              locationVisibility ===
              option.value;

            return (
              <TouchableOpacity
                key={
                  option.value
                }
                style={[
                  styles.profileCard,

                  {
                    opacity:
                      selected
                        ? 1
                        : 0.65,

                    borderWidth:
                      selected
                        ? 2
                        : 1,

                    borderColor:
                      selected
                        ? "#FFFFFF"
                        : "#333333",
                  },
                ]}
                onPress={() =>
                  setLocationVisibility(
                    option.value
                  )
                }
                disabled={
                  isSaving
                }
              >
                <Text
                  style={
                    styles.cardTitle
                  }
                >
                  {selected
                    ? "✓ "
                    : ""}
                  {option.title}
                </Text>

                <Text
                  style={
                    styles.profileLine
                  }
                >
                  {option.description}
                </Text>
              </TouchableOpacity>
            );
          }
        )}

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
              minHeight:
                130,

              textAlignVertical:
                "top",

              paddingTop:
                14,
            },
          ]}
          editable={!isSaving}
          multiline
          numberOfLines={6}
          maxLength={600}
        />

        <Text
          style={{
            color:
              "#999999",

            textAlign:
              "right",

            marginTop:
              5,

            marginBottom:
              18,
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
          onChangeText={
            setSkillsText
          }
          style={[
            styles.input,
            {
              minHeight:
                90,

              textAlignVertical:
                "top",

              paddingTop:
                14,
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
              marginBottom:
                10,
            },
          ]}
        >
          Separa cada habilidad con una coma.
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
          disabled={
            isSaving
          }
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
            router.replace(
              "/profile"
            )
          }
          disabled={
            isSaving
          }
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