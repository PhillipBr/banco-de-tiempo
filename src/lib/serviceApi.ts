import { supabase } from "./supabase";

export type ServiceType =
  | "offer"
  | "request";

export type SupabaseService = {
  id: string;

  provider_name: string;
  provider_user_id: string | null;

  title: string;
  category: string;
  mode: string;

  credits: number;

  avatar: string | null;
  rating: number | null;

  service_type: ServiceType;

  description: string | null;

  created_at: string;
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

  avatar: string;
  rating: number;

  serviceType: ServiceType;

  description: string;

  createdAt: string;
};

export type CreateServiceInput = {
  provider_name: string;
  provider_user_id: string;

  title: string;
  category: string;
  mode: string;

  credits: number;

  avatar?: string | null;
  rating?: number | null;

  service_type: ServiceType;

  description?: string | null;
};

export type UpdateServiceInput = {
  provider_name?: string;
  provider_user_id?: string;

  title?: string;
  category?: string;
  mode?: string;

  credits?: number;

  avatar?: string | null;
  rating?: number | null;

  service_type?: ServiceType;

  description?: string | null;
};

function normalizeRequiredText(
  value: string,
  fieldName: string
): string {
  const normalizedValue =
    String(value || "").trim();

  if (!normalizedValue) {
    throw new Error(
      `${fieldName} es obligatorio.`
    );
  }

  return normalizedValue;
}

function normalizeNullableText(
  value?: string | null
): string | null {
  const normalizedValue =
    String(value || "").trim();

  return normalizedValue || null;
}

function validateUuid(
  value: string,
  fieldName: string
): void {
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (
    !value ||
    !uuidPattern.test(value)
  ) {
    throw new Error(
      `${fieldName} no contiene un UUID válido.`
    );
  }
}

function normalizeCredits(
  value: number
): number {
  const credits =
    Number(value);

  if (
    !Number.isFinite(credits) ||
    credits <= 0
  ) {
    throw new Error(
      "Los créditos deben ser mayores que cero."
    );
  }

  return Math.round(credits);
}

function normalizeRating(
  value?: number | null
): number {
  const rating =
    Number(value);

  if (
    !Number.isFinite(rating) ||
    rating < 0 ||
    rating > 5
  ) {
    return 4.8;
  }

  return rating;
}

function createNumericAppId(
  uuid: string
): number {
  const numericCharacters =
    uuid.replace(/\D/g, "");

  const shortenedValue =
    numericCharacters.slice(0, 10);

  const parsedValue =
    Number(shortenedValue);

  if (
    Number.isFinite(parsedValue) &&
    parsedValue > 0
  ) {
    return parsedValue;
  }

  return Date.now();
}

/**
 * Obtener todas las publicaciones.
 *
 * Se ordenan desde la publicación
 * más reciente hasta la más antigua.
 */
export async function getServices(): Promise<
  SupabaseService[]
> {
  const {
    data,
    error,
  } = await supabase
    .from("services")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return (
    data ?? []
  ) as SupabaseService[];
}

/**
 * Obtener una publicación mediante UUID.
 */
export async function getServiceById(
  serviceId: string
): Promise<SupabaseService | null> {
  if (!serviceId) {
    return null;
  }

  validateUuid(
    serviceId,
    "serviceId"
  );

  const {
    data,
    error,
  } = await supabase
    .from("services")
    .select("*")
    .eq("id", serviceId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (
    data as SupabaseService | null
  ) ?? null;
}

/**
 * Obtener publicaciones creadas
 * por un usuario específico.
 */
export async function getServicesByProviderUserId(
  providerUserId: string
): Promise<SupabaseService[]> {
  validateUuid(
    providerUserId,
    "providerUserId"
  );

  const {
    data,
    error,
  } = await supabase
    .from("services")
    .select("*")
    .eq(
      "provider_user_id",
      providerUserId
    )
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return (
    data ?? []
  ) as SupabaseService[];
}

/**
 * Crear una publicación.
 *
 * Es fundamental guardar
 * provider_user_id para que:
 *
 * - el chat reconozca al proveedor;
 * - se detecten publicaciones propias;
 * - el perfil muestre sus publicaciones;
 * - las solicitudes usen UUID reales.
 */
export async function createServiceInSupabase(
  input: CreateServiceInput
): Promise<SupabaseService> {
  const providerName =
    normalizeRequiredText(
      input.provider_name,
      "El nombre del proveedor"
    );

  validateUuid(
    input.provider_user_id,
    "provider_user_id"
  );

  const title =
    normalizeRequiredText(
      input.title,
      "El título"
    );

  const category =
    normalizeRequiredText(
      input.category,
      "La categoría"
    );

  const mode =
    normalizeRequiredText(
      input.mode,
      "La modalidad"
    );

  const credits =
    normalizeCredits(
      input.credits
    );

  const payload = {
    provider_name:
      providerName,

    provider_user_id:
      input.provider_user_id,

    title,

    category,

    mode,

    credits,

    avatar:
      normalizeNullableText(
        input.avatar
      ),

    rating:
      normalizeRating(
        input.rating
      ),

    service_type:
      input.service_type,

    description:
      normalizeNullableText(
        input.description
      ),
  };

  const {
    data,
    error,
  } = await supabase
    .from("services")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as SupabaseService;
}

/**
 * Alias para código antiguo que pueda
 * importar createService().
 */
export async function createService(
  input: CreateServiceInput
): Promise<SupabaseService> {
  return createServiceInSupabase(
    input
  );
}

/**
 * Actualizar una publicación.
 */
export async function updateServiceInSupabase(
  serviceId: string,
  input: UpdateServiceInput
): Promise<SupabaseService> {
  validateUuid(
    serviceId,
    "serviceId"
  );

  const payload: Record<
    string,
    string | number | null
  > = {};

  if (
    input.provider_name !==
    undefined
  ) {
    payload.provider_name =
      normalizeRequiredText(
        input.provider_name,
        "El nombre del proveedor"
      );
  }

  if (
    input.provider_user_id !==
    undefined
  ) {
    validateUuid(
      input.provider_user_id,
      "provider_user_id"
    );

    payload.provider_user_id =
      input.provider_user_id;
  }

  if (
    input.title !==
    undefined
  ) {
    payload.title =
      normalizeRequiredText(
        input.title,
        "El título"
      );
  }

  if (
    input.category !==
    undefined
  ) {
    payload.category =
      normalizeRequiredText(
        input.category,
        "La categoría"
      );
  }

  if (
    input.mode !==
    undefined
  ) {
    payload.mode =
      normalizeRequiredText(
        input.mode,
        "La modalidad"
      );
  }

  if (
    input.credits !==
    undefined
  ) {
    payload.credits =
      normalizeCredits(
        input.credits
      );
  }

  if (
    input.avatar !==
    undefined
  ) {
    payload.avatar =
      normalizeNullableText(
        input.avatar
      );
  }

  if (
    input.rating !==
    undefined
  ) {
    payload.rating =
      normalizeRating(
        input.rating
      );
  }

  if (
    input.service_type !==
    undefined
  ) {
    payload.service_type =
      input.service_type;
  }

  if (
    input.description !==
    undefined
  ) {
    payload.description =
      normalizeNullableText(
        input.description
      );
  }

  if (
    Object.keys(payload).length === 0
  ) {
    const existingService =
      await getServiceById(
        serviceId
      );

    if (!existingService) {
      throw new Error(
        "La publicación no existe."
      );
    }

    return existingService;
  }

  const {
    data,
    error,
  } = await supabase
    .from("services")
    .update(payload)
    .eq("id", serviceId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as SupabaseService;
}

/**
 * Alias para código que importe
 * updateService().
 */
export async function updateService(
  serviceId: string,
  input: UpdateServiceInput
): Promise<SupabaseService> {
  return updateServiceInSupabase(
    serviceId,
    input
  );
}

/**
 * Eliminar una publicación.
 */
export async function deleteServiceInSupabase(
  serviceId: string
): Promise<boolean> {
  validateUuid(
    serviceId,
    "serviceId"
  );

  const {
    error,
  } = await supabase
    .from("services")
    .delete()
    .eq("id", serviceId);

  if (error) {
    throw error;
  }

  return true;
}

/**
 * Alias para código que importe
 * deleteService().
 */
export async function deleteService(
  serviceId: string
): Promise<boolean> {
  return deleteServiceInSupabase(
    serviceId
  );
}

/**
 * Convertir una fila de Supabase
 * al formato utilizado por la app.
 */
export function mapSupabaseServiceToAppService(
  item: SupabaseService
): AppService {
  return {
    id:
      createNumericAppId(
        item.id
      ),

    supabaseId:
      item.id,

    providerUserId:
      item.provider_user_id || "",

    person:
      item.provider_name ||
      "Proveedor",

    service:
      item.title ||
      "Publicación",

    category:
      item.category ||
      "Otra",

    mode:
      item.mode ||
      "No especificada",

    credits:
      Number(
        item.credits
      ) || 0,

    avatar:
      item.avatar ||
      "https://i.pravatar.cc/300?img=12",

    rating:
      Number(
        item.rating
      ) || 4.8,

    serviceType:
      item.service_type ===
      "request"
        ? "request"
        : "offer",

    description:
      item.description || "",

    createdAt:
      item.created_at,
  };
}