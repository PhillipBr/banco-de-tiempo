import { useEffect, useState } from "react";

import {
  Alert,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { router } from "expo-router";

import { styles } from "../theme/styles";

import {
  Service,
  useAppContext,
} from "../context/AppContext";

import { useAuthContext } from "../context/AuthContext";

import {
  addFavoriteInSupabase,
  isFavoriteInSupabase,
  removeFavoriteInSupabase,
} from "../lib/favoriteApi";

import {
  createNotificationInSupabase,
} from "../lib/notificationApi";

import {
  getProfiles,
} from "../lib/profileApi";

import {
  getOrCreateConversation,
  isValidUuid,
} from "../lib/messageApi";

type ExtendedService = Service & {
  serviceType?: "offer" | "request";
  createdAt?: string;

  supabaseId?: string;

  providerUserId?: string;
};

type ServiceCardProps = {
  item: ExtendedService;
};

export default function ServiceCard({
  item,
}: ServiceCardProps) {
  const {
    user,
  } = useAppContext();

  const {
    session,
    authUser,
  } = useAuthContext();

  const [
    isFavorite,
    setIsFavorite,
  ] = useState(false);

  const [
    isSavingFavorite,
    setIsSavingFavorite,
  ] = useState(false);

  const [
    isOpeningChat,
    setIsOpeningChat,
  ] = useState(false);

  const isLoggedIn =
    Boolean(session);

  const isRequest =
    item.serviceType === "request";

  const isOwnPublication =
    Boolean(
      isLoggedIn &&
      (
        item.providerUserId ===
          authUser?.id ||
        user?.name
          ?.trim()
          .toLowerCase() ===
          item.person
            ?.trim()
            .toLowerCase()
      )
    );

  useEffect(() => {
    if (
      isLoggedIn &&
      item.supabaseId &&
      user?.name
    ) {
      void checkFavorite();
    } else {
      setIsFavorite(false);
    }
  }, [
    item.supabaseId,
    user?.name,
    isLoggedIn,
  ]);

  const checkFavorite =
    async () => {
      if (
        !item.supabaseId ||
        !user?.name
      ) {
        return;
      }

      try {
        const result =
          await isFavoriteInSupabase(
            item.supabaseId,
            user.name
          );

        setIsFavorite(result);
      } catch (error) {
        console.log(
          "Error revisando favorito:",
          error
        );
      }
    };

  const handleToggleFavorite =
    async () => {
      if (!isLoggedIn) {
        router.push("/login");
        return;
      }

      if (!item.supabaseId) {
        Alert.alert(
          "Error",
          "Esta publicación no tiene ID de Supabase."
        );

        return;
      }

      if (!user?.name) {
        Alert.alert(
          "Error",
          "No se encontró el nombre del usuario."
        );

        return;
      }

      try {
        setIsSavingFavorite(true);

        if (isFavorite) {
          await removeFavoriteInSupabase(
            item.supabaseId,
            user.name
          );

          setIsFavorite(false);
        } else {
          await addFavoriteInSupabase({
            service_id:
              item.supabaseId,

            user_name:
              user.name,
          });

          await createNotificationInSupabase({
            title:
              "Favorito guardado",

            message:
              `Guardaste ${item.service} de ${item.person}.`,

            type:
              "service",
          });

          setIsFavorite(true);
        }
      } catch (error: any) {
        Alert.alert(
          "Error",
          error?.message ||
            "No se pudo actualizar el favorito."
        );
      } finally {
        setIsSavingFavorite(false);
      }
    };

  const openLogin = () => {
    router.push("/login");
  };

  const openInteraction = () => {
    router.push({
      pathname:
        "/confirm-service/[id]",

      params: {
        id:
          item.supabaseId ||
          item.id.toString(),
      },
    });
  };

  const resolveProviderUserId =
    async (): Promise<string> => {
      /*
       * Primero usamos providerUserId
       * si el servicio ya lo contiene.
       */
      if (
        item.providerUserId &&
        isValidUuid(
          item.providerUserId
        )
      ) {
        return item.providerUserId;
      }

      /*
       * Como respaldo, buscamos el perfil
       * mediante nombre, correo o prefijo
       * del correo.
       */
      const profiles =
        await getProfiles();

      const normalizedProvider =
        String(
          item.person || ""
        )
          .trim()
          .toLowerCase();

      const foundProfile =
        profiles.find(
          (profile) => {
            const normalizedName =
              String(
                profile.name || ""
              )
                .trim()
                .toLowerCase();

            const normalizedEmail =
              String(
                profile.email || ""
              )
                .trim()
                .toLowerCase();

            const emailPrefix =
              normalizedEmail
                .split("@")[0];

            return (
              normalizedName ===
                normalizedProvider ||
              normalizedEmail ===
                normalizedProvider ||
              emailPrefix ===
                normalizedProvider
            );
          }
        );

      const resolvedUserId =
        foundProfile?.user_id || "";

      if (
        !resolvedUserId ||
        !isValidUuid(
          resolvedUserId
        )
      ) {
        throw new Error(
          "No se encontró un UUID válido para el proveedor."
        );
      }

      return resolvedUserId;
    };

  const handleOpenChat =
    async () => {
      if (
        !session ||
        !authUser?.id
      ) {
        router.push("/login");
        return;
      }

      if (isOwnPublication) {
        Alert.alert(
          "Tu publicación",
          "No puedes iniciar una conversación contigo mismo."
        );

        return;
      }

      if (isOpeningChat) {
        return;
      }

      try {
        setIsOpeningChat(true);

        const providerUserId =
          await resolveProviderUserId();

        if (
          providerUserId ===
          authUser.id
        ) {
          throw new Error(
            "No puedes iniciar una conversación contigo mismo."
          );
        }

        const conversation =
          await getOrCreateConversation({
            otherUserId:
              providerUserId,

            serviceId:
              item.supabaseId ||
              null,

            requestId:
              null,

            serviceName:
              item.service,
          });

        const conversationId =
          String(
            conversation.id || ""
          );

        if (
          !isValidUuid(
            conversationId
          )
        ) {
          throw new Error(
            "Supabase no devolvió un UUID válido para la conversación."
          );
        }

        router.push({
          pathname:
            "/chat/[id]",

          params: {
            id:
              conversationId,

            name:
              item.person,

            serviceName:
              item.service,
          },
        });
      } catch (error: any) {
        console.error(
          "Error abriendo chat desde ServiceCard:",
          error
        );

        Alert.alert(
          "No se pudo abrir el chat",
          error?.message ||
            "Ocurrió un error creando la conversación."
        );
      } finally {
        setIsOpeningChat(false);
      }
    };

  return (
    <View
      style={
        styles.serviceCard
      }
    >
      <View
        style={{
          alignSelf:
            "flex-start",

          paddingHorizontal:
            11,

          paddingVertical:
            5,

          borderRadius:
            999,

          marginBottom:
            12,

          backgroundColor:
            isRequest
              ? "#A30716"
              : "#0D2240",
        }}
      >
        <Text
          style={{
            color:
              "#FFFFFF",

            fontSize:
              12,

            fontWeight:
              "800",

            letterSpacing:
              0.5,
          }}
        >
          {isRequest
            ? "PEDIDO"
            : "OFERTA"}
        </Text>
      </View>

      <View
        style={
          styles.serviceHeader
        }
      >
        <Image
          source={{
            uri:
              item.avatar ||
              "https://i.pravatar.cc/300",
          }}
          style={
            styles.avatar
          }
        />

        <View
          style={{
            flex: 1,
          }}
        >
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname:
                  "/provider-profile/[name]",

                params: {
                  name:
                    item.person,
                },
              })
            }
          >
            <Text
              style={
                styles.servicePerson
              }
            >
              {item.person}
            </Text>
          </TouchableOpacity>

          <Text
            style={
              styles.ratingText
            }
          >
            ⭐ {item.rating ?? 4.8}
          </Text>
        </View>
      </View>

      <Text
        style={
          styles.serviceName
        }
      >
        {item.service}
      </Text>

      <Text
        style={
          styles.serviceDetail
        }
      >
        Categoría: {item.category}
      </Text>

      <Text
        style={
          styles.serviceDetail
        }
      >
        Modalidad: {item.mode}
      </Text>

      <Text
        style={
          styles.serviceCost
        }
      >
        {item.credits}{" "}
        {item.credits === 1
          ? "crédito / hora"
          : "créditos / hora"}
      </Text>

      <TouchableOpacity
        style={
          styles.contactButton
        }
        onPress={() =>
          router.push({
            pathname:
              "/service-detail/[id]",

            params: {
              id:
                item.supabaseId ||
                item.id.toString(),
            },
          })
        }
      >
        <Text
          style={
            styles.primaryButtonText
          }
        >
          Ver detalle
        </Text>
      </TouchableOpacity>

      {!isLoggedIn ? (
        <TouchableOpacity
          style={
            styles.confirmButton
          }
          onPress={
            openLogin
          }
        >
          <Text
            style={
              styles.primaryButtonText
            }
          >
            Inicia sesión para participar
          </Text>
        </TouchableOpacity>
      ) : null}

      {isLoggedIn &&
      !isOwnPublication ? (
        <>
          <TouchableOpacity
            style={[
              styles.contactButton,

              isOpeningChat
                ? {
                    opacity: 0.5,
                  }
                : null,
            ]}
            onPress={
              handleOpenChat
            }
            disabled={
              isOpeningChat
            }
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              {isOpeningChat
                ? "Abriendo chat..."
                : "Contactar"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={
              styles.confirmButton
            }
            onPress={
              openInteraction
            }
            disabled={
              isOpeningChat
            }
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              {isRequest
                ? "Ofrecer ayuda"
                : "Solicitar servicio"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={
              styles.outlineActionButton
            }
            onPress={
              handleToggleFavorite
            }
            disabled={
              isSavingFavorite ||
              isOpeningChat
            }
          >
            <Text
              style={
                styles.outlineActionButtonText
              }
            >
              {isSavingFavorite
                ? "Guardando..."
                : isFavorite
                  ? "Quitar favorito"
                  : "Guardar favorito"}
            </Text>
          </TouchableOpacity>
        </>
      ) : null}

      {isOwnPublication ? (
        <View
          style={
            styles.emptyStateCard
          }
        >
          <Text
            style={
              styles.emptyStateText
            }
          >
            Esta publicación fue creada por ti.
          </Text>
        </View>
      ) : null}
    </View>
  );
}