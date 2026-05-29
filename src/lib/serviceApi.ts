import { supabase } from "./supabase";

export type SupabaseService = {
  id: string;
  provider_name: string;
  title: string;
  category: string;
  mode: string;
  credits: number;
  avatar: string | null;
  rating: number | null;
  created_at?: string;
};

export type CreateServiceInput = {
  provider_name: string;
  title: string;
  category: string;
  mode: string;
  credits: number;
  avatar?: string;
  rating?: number;
};

export type UpdateServiceInput = {
  title: string;
  category: string;
  mode: string;
  credits?: number;
};

export async function getServices() {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data as SupabaseService[];
}

export async function createService(input: CreateServiceInput) {
  const { data, error } = await supabase
    .from("services")
    .insert([
      {
        provider_name: input.provider_name,
        title: input.title,
        category: input.category,
        mode: input.mode,
        credits: input.credits,
        avatar: input.avatar || null,
        rating: input.rating || 4.8,
      },
    ])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as SupabaseService;
}

export async function updateServiceById(
  id: string,
  input: UpdateServiceInput
) {
  const { data, error } = await supabase
    .from("services")
    .update({
      title: input.title,
      category: input.category,
      mode: input.mode,
      credits: input.credits || 1,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as SupabaseService;
}

export async function deleteServiceById(id: string) {
  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }

  return true;
}

export function mapSupabaseServiceToAppService(item: SupabaseService) {
  return {
    id: Number(item.id.replace(/\D/g, "").slice(0, 10)) || Date.now(),
    supabaseId: item.id,
    person: item.provider_name,
    service: item.title,
    category: item.category,
    mode: item.mode,
    credits: item.credits,
    avatar: item.avatar || undefined,
    rating: item.rating || 4.8,
  };
}