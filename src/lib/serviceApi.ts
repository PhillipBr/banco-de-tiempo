import { supabase } from "./supabase";

export type ServiceType = "offer" | "request";

export type SupabaseService = {
  id: string;
  provider_name: string;
  title: string;
  description: string | null;
  category: string;
  mode: string;
  credits: number;
  avatar: string | null;
  rating: number | null;
  service_type?: ServiceType | null;
  created_at?: string | null;
};

export type CreateServiceInput = {
  provider_name: string;
  title: string;
  description?: string;
  category: string;
  mode: string;
  credits: number;
  avatar?: string;
  rating?: number;
  service_type: ServiceType;
};

export type UpdateServiceInput = {
  title: string;
  description?: string;
  category: string;
  mode: string;
  credits?: number;
  service_type?: ServiceType;
};

export type AppService = {
  id: number;
  supabaseId: string;

  providerUserId: string;

  person: string;
  service: string;

  category: string;
  mode: string;

  credits: number;

  description: string;

  serviceType:
    | "offer"
    | "request";
};

export async function getServices(): Promise<SupabaseService[]> {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as SupabaseService[];
}

export async function getServiceById(
  id: string
): Promise<SupabaseService | null> {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as SupabaseService | null;
}

export async function createService(
  input: CreateServiceInput
): Promise<SupabaseService> {
  const providerName = input.provider_name.trim();
  const title = input.title.trim();
  const description = input.description?.trim() ?? "";

  if (!providerName) {
    throw new Error("El nombre del usuario es obligatorio.");
  }

  if (!title) {
    throw new Error("El título de la publicación es obligatorio.");
  }

  if (!description) {
    throw new Error("La descripción de la publicación es obligatoria.");
  }

  const { data, error } = await supabase
    .from("services")
    .insert([
      {
        provider_name: providerName,
        title,
        description,
        category: input.category,
        mode: input.mode,
        credits: input.credits,
        avatar: input.avatar ?? null,
        rating: input.rating ?? 4.8,
        service_type: input.service_type,
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
): Promise<SupabaseService> {
  const title = input.title.trim();
  const description = input.description?.trim() ?? "";

  if (!title) {
    throw new Error("El título de la publicación es obligatorio.");
  }

  if (!description) {
    throw new Error("La descripción de la publicación es obligatoria.");
  }

  const updateData: {
    title: string;
    description: string;
    category: string;
    mode: string;
    credits: number;
    service_type?: ServiceType;
  } = {
    title,
    description,
    category: input.category,
    mode: input.mode,
    credits: input.credits ?? 1,
  };

  if (input.service_type) {
    updateData.service_type = input.service_type;
  }

  const { data, error } = await supabase
    .from("services")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as SupabaseService;
}

export async function deleteServiceById(
  id: string
): Promise<boolean> {
  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }

  return true;
}

export function mapSupabaseServiceToAppService(
  item: SupabaseService
): AppService {
  const numericId =
    Number(
      String(item.id)
        .replace(/\D/g, "")
        .slice(0, 10)
    ) || Date.now();

  const normalizedServiceType: ServiceType =
    item.service_type === "request"
      ? "request"
      : "offer";

  return {
    id: numericId,
    supabaseId: item.id,
    person: item.provider_name,
    service: item.title,
    description: item.description ?? undefined,
    category: item.category,
    mode: item.mode,
    credits: item.credits,
    avatar: item.avatar ?? undefined,
    rating: item.rating ?? 4.8,
    serviceType: normalizedServiceType,
    createdAt: item.created_at ?? undefined,
  };
}