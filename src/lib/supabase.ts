import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  "https://dcoinywbfxvhjhdjguur.supabase.co";

const supabaseAnonKey =
  "sb_publishable__1Nh8wmAd9xoUvXAowDvGA_t3_WcOfa";

const ExpoWebSafeStorage = {
  getItem: async (key: string) => {
    if (typeof window === "undefined") {
      return null;
    }

    return AsyncStorage.getItem(key);
  },

  setItem: async (key: string, value: string) => {
    if (typeof window === "undefined") {
      return;
    }

    await AsyncStorage.setItem(key, value);
  },

  removeItem: async (key: string) => {
    if (typeof window === "undefined") {
      return;
    }

    await AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoWebSafeStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});