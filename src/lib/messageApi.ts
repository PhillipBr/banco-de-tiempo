import { supabase } from "./supabase";

export type SupabaseConversation = {
  id: string;
  participant_one_id: string;
  participant_two_id: string;
  service_id: string | null;
  request_id: string | null;
  service_name: string | null;
  hidden_by: string[] | null;
  created_at: string;
  updated_at: string;
};

export type ConversationSummary = {
  conversation_id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string | null;
  service_id: string | null;
  request_id: string | null;
  service_name: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
};

export type SupabaseMessage = {
  id: string;
  conversation_id: string;
  sender_user_id: string;
  receiver_user_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
};

export type AppMessage = {
  id: string;
  supabaseId: string;
  conversationId: string;
  senderUserId: string;
  receiverUserId: string;
  sender: string;
  text: string;
  isRead: boolean;
  isMine: boolean;
  date: string;
  createdAt: string;
};

export type CreateConversationInput = {
  otherUserId: string;
  serviceId?: string | null;
  requestId?: string | null;
  serviceName?: string | null;
};

export type CreateMessageInput = {
  conversationId: string;
  senderUserId: string;
  receiverUserId: string;
  content: string;
};

export function isValidUuid(value?: string | null): boolean {
  if (!value) {
    return false;
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function requireUuid(value: string, fieldName: string): void {
  if (!isValidUuid(value)) {
    throw new Error(`${fieldName} no contiene un UUID válido.`);
  }
}

export async function getOrCreateConversation(
  input: CreateConversationInput
): Promise<SupabaseConversation> {
  requireUuid(
    input.otherUserId,
    "otherUserId"
  );

  if (input.serviceId) {
    requireUuid(
      input.serviceId,
      "serviceId"
    );
  }

  if (input.requestId) {
    requireUuid(
      input.requestId,
      "requestId"
    );
  }

  const { data, error } =
    await supabase.rpc(
      "get_or_create_conversation",
      {
        p_other_user_id:
          input.otherUserId,

        p_service_id:
          input.serviceId || null,

        p_request_id:
          input.requestId || null,

        p_service_name:
          input.serviceName?.trim() ||
          null,
      }
    );

  if (error) {
    console.error(
      "RPC get_or_create_conversation:",
      error
    );

    throw error;
  }

  console.log(
    "RESPUESTA RPC CONVERSACIÓN:",
    data
  );

  /*
   * Supabase puede devolver:
   *
   * { id: "..." }
   *
   * o:
   *
   * [{ id: "..." }]
   */
  const conversation =
    Array.isArray(data)
      ? data[0]
      : data;

  if (!conversation) {
    throw new Error(
      "Supabase no devolvió una conversación."
    );
  }

  if (
    !conversation.id ||
    !isValidUuid(
      String(conversation.id)
    )
  ) {
    console.error(
      "Conversación inválida recibida:",
      conversation
    );

    throw new Error(
      "Supabase no devolvió un UUID válido para la conversación."
    );
  }

  return conversation as SupabaseConversation;
}


export async function getUserConversations(): Promise<
  ConversationSummary[]
> {
  const { data, error } = await supabase.rpc(
    "get_user_conversations"
  );

  if (error) {
    throw error;
  }

  return (data ?? []).map((item: ConversationSummary) => ({
    ...item,
    unread_count: Number(item.unread_count) || 0,
  }));
}

export async function getConversationById(
  conversationId: string
): Promise<SupabaseConversation | null> {
  requireUuid(conversationId, "conversationId");

  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as SupabaseConversation | null) ?? null;
}

export async function getMessagesByConversationId(
  conversationId: string
): Promise<SupabaseMessage[]> {
  requireUuid(conversationId, "conversationId");

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return (data ?? []) as SupabaseMessage[];
}

export async function createMessageInSupabase(
  input: CreateMessageInput
): Promise<SupabaseMessage> {
  requireUuid(input.conversationId, "conversationId");
  requireUuid(input.senderUserId, "senderUserId");
  requireUuid(input.receiverUserId, "receiverUserId");

  const content = input.content.trim();

  if (!content) {
    throw new Error("El mensaje no puede estar vacío.");
  }

  if (content.length > 2000) {
    throw new Error(
      "El mensaje no puede superar los 2000 caracteres."
    );
  }

  if (input.senderUserId === input.receiverUserId) {
    throw new Error(
      "No puedes enviarte mensajes a ti mismo."
    );
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: input.conversationId,
      sender_user_id: input.senderUserId,
      receiver_user_id: input.receiverUserId,
      content,
      is_read: false,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as SupabaseMessage;
}

export async function markConversationAsRead(
  conversationId: string
): Promise<number> {
  requireUuid(conversationId, "conversationId");

  const { data, error } = await supabase.rpc(
    "mark_conversation_as_read",
    {
      p_conversation_id: conversationId,
    }
  );

  if (error) {
    throw error;
  }

  return Number(data) || 0;
}

export async function deleteConversationInSupabase(
  conversationId: string
): Promise<boolean> {
  requireUuid(conversationId, "conversationId");

  const { data, error } = await supabase.rpc(
    "hide_conversation",
    {
      p_conversation_id: conversationId,
    }
  );

  if (error) {
    throw error;
  }

  return Boolean(data);
}

export function mapSupabaseMessageToAppMessage(
  item: SupabaseMessage,
  currentUserId: string,
  otherUserName = "Usuario"
): AppMessage {
  const isMine = item.sender_user_id === currentUserId;

  return {
    id: item.id,
    supabaseId: item.id,
    conversationId: item.conversation_id,
    senderUserId: item.sender_user_id,
    receiverUserId: item.receiver_user_id,
    sender: isMine ? "Tú" : otherUserName,
    text: item.content,
    isRead: item.is_read,
    isMine,
    date: item.created_at.slice(0, 10),
    createdAt: item.created_at,
  };
}

export function subscribeToConversationMessages(
  conversationId: string,
  onMessage: (message: SupabaseMessage) => void
): () => void {
  requireUuid(conversationId, "conversationId");

  const channel = supabase
    .channel(`conversation-${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        onMessage(payload.new as SupabaseMessage);
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}