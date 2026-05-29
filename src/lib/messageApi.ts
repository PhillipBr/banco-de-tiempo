import { supabase } from "./supabase";

export type SupabaseMessage = {
  id: string;
  conversation_with: string;
  sender: string;
  text: string;
  created_at: string;
};

export type CreateMessageInput = {
  conversation_with: string;
  sender: string;
  text: string;
};

export async function getMessages() {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;

  return data as SupabaseMessage[];
}

export async function createMessageInSupabase(input: CreateMessageInput) {
  const { data, error } = await supabase
    .from("messages")
    .insert([
      {
        conversation_with: input.conversation_with,
        sender: input.sender,
        text: input.text,
      },
    ])
    .select()
    .single();

  if (error) throw error;

  return data as SupabaseMessage;
}

export async function deleteConversationInSupabase(conversationWith: string) {
  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("conversation_with", conversationWith);

  if (error) throw error;

  return true;
}

export function mapSupabaseMessageToAppMessage(item: SupabaseMessage) {
  return {
    id: Number(item.id.replace(/\D/g, "").slice(0, 10)) || Date.now(),
    supabaseId: item.id,
    conversationWith: item.conversation_with,
    sender: item.sender,
    text: item.text,
    date: item.created_at.slice(0, 10),
  };
}