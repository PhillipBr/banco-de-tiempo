import { supabase } from "./supabase";

import {
  LocationVisibility,
  validateCoordinates,
} from "./locationApi";

export type SupabaseProfile = {
  id: string;
  user_id: string | null;

  name: string;
  email: string | null;
  phone: string | null;

  city: string | null;
  community: string | null;

  bio: string | null;
  skills: string[] | null;

  avatar: string | null;
  credits: number;

  latitude: number | null;
  longitude: number | null;

  location_updated_at:
    | string
    | null;

  location_visibility:
    | LocationVisibility
    | null;

  created_at?: string | null;
};

export type UpsertProfileInput = {
  user_id: string;

  name: string;
  email?: string;
  phone?: string;

  city?: string;
  community?: string;

  bio?: string;
  skills?: string[];

  avatar?: string;
  credits?: number;

  latitude?: number | null;
  longitude?: number | null;

  location_visibility?: LocationVisibility;
};

export type UpdateProfileInput = {
  name: string;

  email?: string;
  phone?: string;

  city?: string;
  community?: string;

  bio?: string;
  skills?: string[];

  avatar?: string;

  latitude?: number | null;
  longitude?: number | null;

  location_visibility?: LocationVisibility;
};

function normalizeLocationVisibility(
  value?: LocationVisibility | null
): LocationVisibility {
  if (
    value === "hidden" ||
    value === "public"
  ) {
    return value;
  }

  return "community";
}

function normalizeCoordinates(
  latitude?: number | null,
  longitude?: number | null
): {
  latitude: number | null;
  longitude: number | null;
} {
  const hasLatitude =
    latitude !== null &&
    latitude !== undefined;

  const hasLongitude =
    longitude !== null &&
    longitude !== undefined;

  if (
    !hasLatitude &&
    !hasLongitude
  ) {
    return {
      latitude: null,
      longitude: null,
    };
  }

  if (
    !hasLatitude ||
    !hasLongitude
  ) {
    throw new Error(
      "La latitud y la longitud deben guardarse juntas."
    );
  }

  const normalizedLatitude =
    Number(latitude);

  const normalizedLongitude =
    Number(longitude);

  validateCoordinates(
    normalizedLatitude,
    normalizedLongitude
  );

  return {
    latitude:
      normalizedLatitude,

    longitude:
      normalizedLongitude,
  };
}

function normalizeSkills(
  skills?: string[]
): string[] {
  return Array.from(
    new Set(
      (skills ?? [])
        .map((skill) =>
          skill.trim()
        )
        .filter(Boolean)
    )
  );
}

export async function getProfiles(): Promise<
  SupabaseProfile[]
> {
  const {
    data,
    error,
  } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return (
    data ?? []
  ) as SupabaseProfile[];
}

export async function getProfileByUserId(
  userId: string
): Promise<SupabaseProfile | null> {
  if (!userId) {
    return null;
  }

  const {
    data,
    error,
  } = await supabase
    .from("profiles")
    .select("*")
    .eq(
      "user_id",
      userId
    )
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (
    data as SupabaseProfile | null
  ) ?? null;
}

export async function upsertProfileByUserId(
  input: UpsertProfileInput
): Promise<SupabaseProfile> {
  const normalizedName =
    input.name.trim();

  if (!normalizedName) {
    throw new Error(
      "El nombre es obligatorio."
    );
  }

  const coordinates =
    normalizeCoordinates(
      input.latitude,
      input.longitude
    );

  const payload = {
    user_id:
      input.user_id,

    name:
      normalizedName,

    email:
      input.email?.trim() ||
      null,

    phone:
      input.phone?.trim() ||
      null,

    city:
      input.city?.trim() ||
      null,

    community:
      input.community?.trim() ||
      null,

    bio:
      input.bio?.trim() ||
      null,

    skills:
      normalizeSkills(
        input.skills
      ),

    avatar:
      input.avatar?.trim() ||
      "https://i.pravatar.cc/300?img=12",

    credits:
      input.credits ?? 2,

    latitude:
      coordinates.latitude,

    longitude:
      coordinates.longitude,

    location_visibility:
      normalizeLocationVisibility(
        input.location_visibility
      ),
  };

  const {
    data,
    error,
  } = await supabase
    .from("profiles")
    .upsert(payload, {
      onConflict:
        "user_id",
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as SupabaseProfile;
}

export async function updateProfileByUserId(
  userId: string,
  input: UpdateProfileInput
): Promise<SupabaseProfile> {
  const normalizedName =
    input.name.trim();

  if (!normalizedName) {
    throw new Error(
      "El nombre es obligatorio."
    );
  }

  const coordinates =
    normalizeCoordinates(
      input.latitude,
      input.longitude
    );

  const {
    data,
    error,
  } = await supabase
    .from("profiles")
    .update({
      name:
        normalizedName,

      email:
        input.email?.trim() ||
        null,

      phone:
        input.phone?.trim() ||
        null,

      city:
        input.city?.trim() ||
        null,

      community:
        input.community?.trim() ||
        null,

      bio:
        input.bio?.trim() ||
        null,

      skills:
        normalizeSkills(
          input.skills
        ),

      avatar:
        input.avatar?.trim() ||
        "https://i.pravatar.cc/300?img=12",

      latitude:
        coordinates.latitude,

      longitude:
        coordinates.longitude,

      location_visibility:
        normalizeLocationVisibility(
          input.location_visibility
        ),
    })
    .eq(
      "user_id",
      userId
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as SupabaseProfile;
}

export async function updateProfileLocationByUserId(
  userId: string,
  latitude: number,
  longitude: number,
  locationVisibility: LocationVisibility =
    "community"
): Promise<SupabaseProfile> {
  validateCoordinates(
    latitude,
    longitude
  );

  const {
    data,
    error,
  } = await supabase
    .from("profiles")
    .update({
      latitude,
      longitude,

      location_visibility:
        normalizeLocationVisibility(
          locationVisibility
        ),
    })
    .eq(
      "user_id",
      userId
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as SupabaseProfile;
}

export async function clearProfileLocationByUserId(
  userId: string
): Promise<SupabaseProfile> {
  const {
    data,
    error,
  } = await supabase
    .from("profiles")
    .update({
      latitude: null,
      longitude: null,

      location_visibility:
        "hidden",
    })
    .eq(
      "user_id",
      userId
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as SupabaseProfile;
}

export async function getOrCreateProfileByUserId(
  userId: string,
  email?: string | null
): Promise<SupabaseProfile> {
  const existingProfile =
    await getProfileByUserId(
      userId
    );

  if (existingProfile) {
    return existingProfile;
  }

  const fallbackName =
    email?.split("@")[0] ||
    `Usuario-${userId.slice(
      0,
      6
    )}`;

  return upsertProfileByUserId({
    user_id:
      userId,

    name:
      fallbackName,

    email:
      email || "",

    phone:
      "",

    city:
      "Toronto",

    community:
      "",

    bio:
      "",

    skills:
      [],

    avatar:
      "https://i.pravatar.cc/300?img=12",

    credits:
      2,

    latitude:
      null,

    longitude:
      null,

    location_visibility:
      "community",
  });
}

export async function updateProfileCreditsByName(
  name: string,
  newCredits: number
): Promise<SupabaseProfile> {
  const {
    data,
    error,
  } = await supabase
    .from("profiles")
    .update({
      credits:
        newCredits,
    })
    .eq(
      "name",
      name
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as SupabaseProfile;
}

export function mapSupabaseProfileToAppUser(
  profile: SupabaseProfile
) {
  return {
    name:
      profile.name,

    email:
      profile.email ?? "",

    phone:
      profile.phone ?? "",

    city:
      profile.city ?? "",

    community:
      profile.community ?? "",

    bio:
      profile.bio ?? "",

    skills:
      profile.skills ?? [],

    avatar:
      profile.avatar ||
      "https://i.pravatar.cc/300?img=12",

    credits:
      profile.credits,

    offeredServices:
      [],

    neededServices:
      [],

    history:
      [],
  };
}