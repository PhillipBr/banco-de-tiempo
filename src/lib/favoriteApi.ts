import { supabase } from "./supabase";

export type SupabaseFavorite = {
  id: string;
  service_id: string;
  user_name: string;
  created_at: string;
};

export type CreateFavoriteInput = {
  service_id: string;
  user_name: string;
};

export async function getFavoritesByUser(userName: string) {
  const { data, error } = await supabase
    .from("favorite_services")
    .select("*")
    .eq("user_name", userName)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data as SupabaseFavorite[];
}

export async function addFavoriteInSupabase(input: CreateFavoriteInput) {
  const { data, error } = await supabase
    .from("favorite_services")
    .insert([
      {
        service_id: input.service_id,
        user_name: input.user_name,
      },
    ])
    .select()
    .single();

  if (error) throw error;

  return data as SupabaseFavorite;
}

export async function removeFavoriteInSupabase(
  serviceId: string,
  userName: string
) {
  const { error } = await supabase
    .from("favorite_services")
    .delete()
    .eq("service_id", serviceId)
    .eq("user_name", userName);

  if (error) throw error;

  return true;
}

export async function isFavoriteInSupabase(
  serviceId: string,
  userName: string
) {
  const { data, error } = await supabase
    .from("favorite_services")
    .select("*")
    .eq("service_id", serviceId)
    .eq("user_name", userName);

  if (error) throw error;

  return data.length > 0;
}