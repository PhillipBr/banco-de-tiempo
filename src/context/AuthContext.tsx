import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";

import { supabase } from "../lib/supabase";

type AuthContextType = {
  session: Session | null;
  authUser: User | null;
  isAuthLoading: boolean;
  signUp: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ errorMessage?: string; successMessage?: string }>;
  signIn: (email: string, password: string) => Promise<{ errorMessage?: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setAuthUser(currentSession?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadSession = async () => {
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();

    setSession(currentSession);
    setAuthUser(currentSession?.user ?? null);
    setIsAuthLoading(false);
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) {
      return { errorMessage: error.message };
    }

    if (data.user) {
      return {
        successMessage: `Usuario creado: ${data.user.email}`,
      };
    }

    return {
      successMessage: "Solicitud enviada, pero Supabase no devolvió usuario.",
    };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { errorMessage: error.message };
    }

    return {};
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        authUser,
        isAuthLoading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext debe usarse dentro de AuthProvider");
  }

  return context;
}