import { Image, Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { router } from "expo-router";

import { useAuthContext } from "../context/AuthContext";

const logo = require("../../assets/logo.png");

export default function Header() {
  const { session, signOut } = useAuthContext();

  const handleLogout = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <View style={headerStyles.header}>
      <TouchableOpacity
        style={headerStyles.logoContainer}
        onPress={() => router.push("/")}
      >
        <Image source={logo} style={headerStyles.logoImage} resizeMode="contain" />
      </TouchableOpacity>

      <View style={headerStyles.nav}>
        <TouchableOpacity onPress={() => router.push("/")}>
          <Text style={headerStyles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/services")}>
          <Text style={headerStyles.navText}>Services</Text>
        </TouchableOpacity>

        {session ? (
          <>
            <TouchableOpacity onPress={() => router.push("/conversations")}>
              <Text style={headerStyles.navText}>Messages</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/profile")}>
              <Text style={headerStyles.navText}>Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleLogout}>
              <Text style={headerStyles.navText}>Logout</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity onPress={() => router.push("/login")}>
            <Text style={headerStyles.navText}>Login</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  header: {
    minHeight: 110,
    backgroundColor: "#000000",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#111",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },

  logoContainer: {
    width: 260,
    height: 80,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  logoImage: {
    width: 260,
    height: 80,
  },

  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 22,
    flexWrap: "wrap",
  },

  navText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
  },
});