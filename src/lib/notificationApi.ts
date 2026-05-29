import { supabase } from "./supabase";

export type SupabaseNotification = {
  id: string;
  title: string;
  message: string;
  type: "service" | "request" | "credit" | "review" | "chat";
  read: boolean;
  created_at: string;
};

export type CreateNotificationInput = {
  title: string;
  message: string;
  type: "service" | "request" | "credit" | "review" | "chat";
};

export async function getNotifications() {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data as SupabaseNotification[];
}

export async function createNotificationInSupabase(
  input: CreateNotificationInput
) {
  const { data, error } = await supabase
    .from("notifications")
    .insert([
      {
        title: input.title,
        message: input.message,
        type: input.type,
        read: false,
      },
    ])
    .select()
    .single();

  if (error) throw error;

  return data as SupabaseNotification;
}

export async function markAllNotificationsAsReadInSupabase() {
  const { data, error } = await supabase
    .from("notifications")
    .update({
      read: true,
    })
    .eq("read", false)
    .select();

  if (error) throw error;

  return data as SupabaseNotification[];
}

export async function clearNotificationsInSupabase() {
  const { error } = await supabase.from("notifications").delete().neq("id", "");

  if (error) throw error;

  return true;
}

export function mapSupabaseNotificationToAppNotification(
  item: SupabaseNotification
) {
  return {
    id: Number(item.id.replace(/\D/g, "").slice(0, 10)) || Date.now(),
    supabaseId: item.id,
    title: item.title,
    message: item.message,
    type: item.type,
    read: item.read,
    date: item.created_at.slice(0, 10),
  };
}