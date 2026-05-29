import { supabase } from "./supabase";

export type SupabaseProfile = {
  id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  avatar: string | null;
  credits: number;
  created_at?: string;
};

export type UpsertProfileInput = {
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  city?: string;
  avatar?: string;
  credits?: number;
};

export async function getProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data as SupabaseProfile[];
}

export async function getProfileByUserId(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  return data as SupabaseProfile | null;
}

export async function upsertProfileByUserId(input: UpsertProfileInput) {
  const payload = {
    user_id: input.user_id,
    name: input.name,
    email: input.email || null,
    phone: input.phone || null,
    city: input.city || null,
    avatar: input.avatar || "https://i.pravatar.cc/300?img=12",
    credits: input.credits ?? 2,
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(payload, {
      onConflict: "user_id",
    })
    .select()
    .single();

  if (error) throw error;

  return data as SupabaseProfile;
}

export async function getOrCreateProfileByUserId(
  userId: string,
  email?: string | null
) {
  const existingProfile = await getProfileByUserId(userId);

  if (existingProfile) {
    return existingProfile;
  }

  const fallbackName = email?.split("@")[0] || `Usuario-${userId.slice(0, 6)}`;

  const createdProfile = await upsertProfileByUserId({
    user_id: userId,
    name: fallbackName,
    email: email || "",
    phone: "",
    city: "",
    avatar: "https://i.pravatar.cc/300?img=12",
    credits: 2,
  });

  return createdProfile;
}

export async function updateProfileCreditsByName(
  name: string,
  newCredits: number
) {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      credits: newCredits,
    })
    .eq("name", name)
    .select()
    .single();

  if (error) throw error;

  return data as SupabaseProfile;
}

export function mapSupabaseProfileToAppUser(profile: SupabaseProfile) {
  return {
    name: profile.name,
    email: profile.email || "",
    phone: profile.phone || "",
    city: profile.city || "",
    avatar: profile.avatar || "https://i.pravatar.cc/300?img=12",
    credits: profile.credits,
    offeredServices: [],
    neededServices: [],
    history: [],
  };
}