import { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";

import Header from "../components/Header";
import NotificationCard from "../components/NotificationCard";

import { styles } from "../theme/styles";
import {
  clearNotificationsInSupabase,
  getNotifications,
  mapSupabaseNotificationToAppNotification,
  markAllNotificationsAsReadInSupabase,
} from "../lib/notificationApi";

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);

      const data = await getNotifications();
      const mappedNotifications = data.map(mapSupabaseNotificationToAppNotification);

      setNotifications(mappedNotifications);
    } catch (error) {
      console.log("Error cargando notificaciones:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async () => {
    await markAllNotificationsAsReadInSupabase();
    await loadNotifications();
  };

  const handleClearNotifications = async () => {
    await clearNotificationsInSupabase();
    await loadNotifications();
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  return (
    <ScrollView style={styles.page}>
      <Header />

      <View style={styles.formSection}>
        <Text style={styles.screenTitle}>Notifications</Text>

        <Text style={styles.screenSubtitle}>
          Tienes {unreadCount} notificaciones nuevas.
        </Text>

        <TouchableOpacity style={styles.primaryButton} onPress={handleMarkAsRead}>
          <Text style={styles.primaryButtonText}>Marcar todas como leídas</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dangerButton} onPress={handleClearNotifications}>
          <Text style={styles.primaryButtonText}>Limpiar notificaciones</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />

        {isLoading ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>Cargando notificaciones...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>Sin notificaciones</Text>

            <Text style={styles.emptyStateText}>
              Las actividades importantes aparecerán aquí.
            </Text>
          </View>
        ) : (
          notifications.map((item) => (
            <NotificationCard key={item.supabaseId || item.id} item={item} />
          ))
        )}

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