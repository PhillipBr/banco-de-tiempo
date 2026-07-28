import { supabase } from "./supabase";

type UploadAvatarInput = {
  userId: string;
  uri: string;
  mimeType?: string | null;
};

function getFileExtension(
  uri: string,
  mimeType?: string | null
): string {
  const mimeExtension = mimeType?.split("/")[1];

  if (mimeExtension) {
    if (mimeExtension === "jpeg") {
      return "jpg";
    }

    return mimeExtension;
  }

  const cleanUri = uri.split("?")[0];
  const uriExtension = cleanUri.split(".").pop();

  if (
    uriExtension &&
    uriExtension.length <= 5
  ) {
    return uriExtension.toLowerCase();
  }

  return "jpg";
}

function getContentType(extension: string): string {
  if (extension === "png") {
    return "image/png";
  }

  if (extension === "webp") {
    return "image/webp";
  }

  if (extension === "gif") {
    return "image/gif";
  }

  return "image/jpeg";
}

export async function uploadProfileAvatar({
  userId,
  uri,
  mimeType,
}: UploadAvatarInput): Promise<string> {
  if (!userId) {
    throw new Error(
      "No se encontró el ID del usuario."
    );
  }

  if (!uri) {
    throw new Error(
      "No se seleccionó ninguna imagen."
    );
  }

  const response = await fetch(uri);

  if (!response.ok) {
    throw new Error(
      "No se pudo leer la imagen seleccionada."
    );
  }

  const arrayBuffer =
    await response.arrayBuffer();

  const extension = getFileExtension(
    uri,
    mimeType
  );

  const filePath = `${userId}/profile-${Date.now()}.${extension}`;

  const { error: uploadError } =
    await supabase.storage
      .from("avatars")
      .upload(filePath, arrayBuffer, {
        contentType:
          mimeType ||
          getContentType(extension),
        upsert: true,
      });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage
    .from("avatars")
    .getPublicUrl(filePath);

  if (!data.publicUrl) {
    throw new Error(
      "No se pudo obtener la URL pública de la imagen."
    );
  }

  return data.publicUrl;
}