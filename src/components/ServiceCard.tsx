import { useEffect, useState } from "react";
import { Alert, Image, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";

import { styles } from "../theme/styles";
import { Service, useAppContext } from "../context/AppContext";
import { useAuthContext } from "../context/AuthContext";

import {
  addFavoriteInSupabase,
  isFavoriteInSupabase,
  removeFavoriteInSupabase,
} from "../lib/favoriteApi";

import { createNotificationInSupabase } from "../lib/notificationApi";

type ServiceCardProps = {
  item: Service;
};

export default function ServiceCard({ item }: ServiceCardProps) {
  const { user } = useAppContext();
  const { session } = useAuthContext();

  const [isFavorite, setIsFavorite] = useState(false);
  const [isSavingFavorite, setIsSavingFavorite] = useState(false);

  const isLoggedIn = !!session;

  useEffect(() => {
    if (isLoggedIn) {
      checkFavorite();
    }
  }, [item.supabaseId, user.name, isLoggedIn]);

  const checkFavorite = async () => {
    if (!item.supabaseId) return;

    try {
      const result = await isFavoriteInSupabase(item.supabaseId, user.name);
      setIsFavorite(result);
    } catch (error) {
      console.log("Error revisando favorito:", error);
    }
  };

  const handleToggleFavorite = async () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    if (!item.supabaseId) {
      Alert.alert("Error", "Este servicio no tiene ID de Supabase.");
      return;
    }

    try {
      setIsSavingFavorite(true);

      if (isFavorite) {
        await removeFavoriteInSupabase(item.supabaseId, user.name);
        setIsFavorite(false);
      } else {
        await addFavoriteInSupabase({
          service_id: item.supabaseId,
          user_name: user.name,
        });

        await createNotificationInSupabase({
          title: "Favorito guardado",
          message: `Guardaste ${item.service} de ${item.person}.`,
          type: "service",
        });

        setIsFavorite(true);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo actualizar favorito.");
    } finally {
      setIsSavingFavorite(false);
    }
  };

  return (
    <View style={styles.serviceCard}>
      <View style={styles.serviceHeader}>
        <Image
          source={{
            uri: item.avatar || "https://i.pravatar.cc/300",
          }}
          style={styles.avatar}
        />

        <View style={{ flex: 1 }}>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/provider-profile/[name]",
                params: {
                  name: item.person,
                },
              })
            }
          >
            <Text style={styles.servicePerson}>{item.person}</Text>
          </TouchableOpacity>

          <Text style={styles.ratingText}>⭐ {item.rating || 4.8}</Text>
        </View>
      </View>

      <Text style={styles.serviceName}>{item.service}</Text>

      <Text style={styles.serviceDetail}>Categoría: {item.category}</Text>

      <Text style={styles.serviceDetail}>Modalidad: {item.mode}</Text>

      <Text style={styles.serviceCost}>{item.credits} crédito / hora</Text>

      <TouchableOpacity
        style={styles.contactButton}
        onPress={() =>
          router.push({
            pathname: "/service-detail/[id]",
            params: {
              id: item.supabaseId || item.id.toString(),
            },
          })
        }
      >
        <Text style={styles.primaryButtonText}>Ver detalle</Text>
      </TouchableOpacity>

      {isLoggedIn && (
        <>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() =>
              router.push({
                pathname: "/chat/[name]",
                params: {
                  name: item.person,
                },
              })
            }
          >
            <Text style={styles.primaryButtonText}>Contactar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={() =>
              router.push({
                pathname: "/confirm-service/[id]",
                params: {
                  id: item.supabaseId || item.id.toString(),
                },
              })
            }
          >
            <Text style={styles.primaryButtonText}>Solicitar servicio</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.outlineActionButton}
            onPress={handleToggleFavorite}
            disabled={isSavingFavorite}
          >
            <Text style={styles.outlineActionButtonText}>
              {isSavingFavorite
                ? "Guardando..."
                : isFavorite
                  ? "Quitar favorito"
                  : "Guardar favorito"}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}