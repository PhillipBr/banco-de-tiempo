import { Stack } from "expo-router";

import { AppProvider } from "../context/AppContext";
import { AuthProvider } from "../context/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </AppProvider>
    </AuthProvider>
  );
}