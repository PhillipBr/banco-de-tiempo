import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import { router } from "expo-router";
import { useEffect, useState } from "react";

import { useAuthContext } from "../context/AuthContext";

const logo = require("../../assets/logo.png");

type AppRoute =
  | "/"
  | "/services"
  | "/conversations"
  | "/profile"
  | "/login";

export default function Header() {
  const { session, signOut } =
    useAuthContext();

  const { width: reactNativeWidth } =
    useWindowDimensions();

  const [browserWidth, setBrowserWidth] =
    useState(reactNativeWidth);

  const [isMenuOpen, setIsMenuOpen] =
    useState(false);

  useEffect(() => {
    if (
      Platform.OS !== "web" ||
      typeof window === "undefined"
    ) {
      setBrowserWidth(reactNativeWidth);
      return;
    }

    const updateBrowserWidth = () => {
      setBrowserWidth(
        window.innerWidth ||
          document.documentElement.clientWidth ||
          reactNativeWidth
      );
    };

    updateBrowserWidth();

    window.addEventListener(
      "resize",
      updateBrowserWidth
    );

    window.addEventListener(
      "orientationchange",
      updateBrowserWidth
    );

    return () => {
      window.removeEventListener(
        "resize",
        updateBrowserWidth
      );

      window.removeEventListener(
        "orientationchange",
        updateBrowserWidth
      );
    };
  }, [reactNativeWidth]);

  const currentWidth =
    Platform.OS === "web"
      ? browserWidth
      : reactNativeWidth;

  /*
   * Usamos 900 px para asegurar que teléfonos
   * y tablets pequeñas no muestren el menú horizontal.
   */
  const isMobile =
    currentWidth < 900;

  const navigateTo = (
    pathname: AppRoute
  ) => {
    setIsMenuOpen(false);
    router.push(pathname);
  };

  const handleLogout = async () => {
    setIsMenuOpen(false);

    await signOut();

    router.replace("/login");
  };

  return (
    <View style={headerStyles.wrapper}>
      <View
        style={[
          headerStyles.header,
          isMobile &&
            headerStyles.headerMobile,
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            headerStyles.logoContainer,
            isMobile &&
              headerStyles.logoContainerMobile,
          ]}
          onPress={() => navigateTo("/")}
        >
          <Image
            source={logo}
            resizeMode="contain"
            style={[
              headerStyles.logoImage,
              isMobile &&
                headerStyles.logoImageMobile,
            ]}
          />
        </TouchableOpacity>

        {isMobile ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              isMenuOpen
                ? "Cerrar menú"
                : "Abrir menú"
            }
            style={({ pressed }) => [
              headerStyles.menuButton,
              pressed
                ? headerStyles.buttonPressed
                : null,
            ]}
            onPress={() =>
              setIsMenuOpen(
                (currentValue) =>
                  !currentValue
              )
            }
          >
            <Text
              style={
                headerStyles.menuButtonText
              }
            >
              {isMenuOpen ? "✕" : "☰"}
            </Text>
          </Pressable>
        ) : (
          <View
            style={
              headerStyles.desktopNav
            }
          >
            <TouchableOpacity
              onPress={() =>
                navigateTo("/")
              }
            >
              <Text
                style={
                  headerStyles.navText
                }
              >
                Home
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                navigateTo("/services")
              }
            >
              <Text
                style={
                  headerStyles.navText
                }
              >
                Services
              </Text>
            </TouchableOpacity>

            {session ? (
              <>
                <TouchableOpacity
                  onPress={() =>
                    navigateTo(
                      "/conversations"
                    )
                  }
                >
                  <Text
                    style={
                      headerStyles.navText
                    }
                  >
                    Messages
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() =>
                    navigateTo("/profile")
                  }
                >
                  <Text
                    style={
                      headerStyles.navText
                    }
                  >
                    Profile
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleLogout}
                >
                  <Text
                    style={[
                      headerStyles.navText,
                      headerStyles.logoutText,
                    ]}
                  >
                    Logout
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={
                  headerStyles.desktopLoginButton
                }
                onPress={() =>
                  navigateTo("/login")
                }
              >
                <Text
                  style={
                    headerStyles.desktopLoginText
                  }
                >
                  Login
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {isMobile && isMenuOpen ? (
        <View
          style={
            headerStyles.mobileMenu
          }
        >
          <TouchableOpacity
            style={
              headerStyles.mobileMenuItem
            }
            onPress={() =>
              navigateTo("/")
            }
          >
            <Text
              style={
                headerStyles.mobileMenuText
              }
            >
              Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={
              headerStyles.mobileMenuItem
            }
            onPress={() =>
              navigateTo("/services")
            }
          >
            <Text
              style={
                headerStyles.mobileMenuText
              }
            >
              Services
            </Text>
          </TouchableOpacity>

          {session ? (
            <>
              <TouchableOpacity
                style={
                  headerStyles.mobileMenuItem
                }
                onPress={() =>
                  navigateTo(
                    "/conversations"
                  )
                }
              >
                <Text
                  style={
                    headerStyles.mobileMenuText
                  }
                >
                  Messages
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  headerStyles.mobileMenuItem
                }
                onPress={() =>
                  navigateTo("/profile")
                }
              >
                <Text
                  style={
                    headerStyles.mobileMenuText
                  }
                >
                  Profile
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  headerStyles.mobileActionButton,
                  headerStyles.mobileLogoutButton,
                ]}
                onPress={handleLogout}
              >
                <Text
                  style={
                    headerStyles.mobileLogoutText
                  }
                >
                  Logout
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[
                headerStyles.mobileActionButton,
                headerStyles.mobileLoginButton,
              ]}
              onPress={() =>
                navigateTo("/login")
              }
            >
              <Text
                style={
                  headerStyles.mobileLoginText
                }
              >
                Login
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}
    </View>
  );
}

const headerStyles =
  StyleSheet.create({
    wrapper: {
      width: "100%",
      maxWidth: "100%",
      backgroundColor: "#000000",
      borderBottomWidth: 1,
      borderBottomColor: "#171717",
      overflow: "hidden",
      zIndex: 1000,
    },

    header: {
      width: "100%",
      minHeight: 88,
      paddingHorizontal: 28,
      paddingVertical: 10,
      backgroundColor: "#000000",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    headerMobile: {
      minHeight: 72,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },

    logoContainer: {
      width: 200,
      height: 64,
      alignItems: "flex-start",
      justifyContent: "center",
      flexShrink: 1,
    },

    logoContainerMobile: {
      width: 135,
      height: 50,
      flexShrink: 1,
    },

    logoImage: {
      width: 200,
      height: 64,
    },

    logoImageMobile: {
      width: 135,
      height: 50,
    },

    desktopNav: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: 20,
      flexShrink: 0,
    },

    navText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "600",
    },

    logoutText: {
      color: "#FF8B8B",
    },

    desktopLoginButton: {
      backgroundColor: "#C1121F",
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 24,
    },

    desktopLoginText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "700",
    },

    menuButton: {
      width: 44,
      height: 44,
      flexShrink: 0,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#101010",
      borderWidth: 1,
      borderColor: "#363636",
      borderRadius: 11,
    },

    menuButtonText: {
      color: "#FFFFFF",
      fontSize: 25,
      lineHeight: 29,
      fontWeight: "700",
    },

    buttonPressed: {
      opacity: 0.65,
    },

    mobileMenu: {
      width: "100%",
      paddingHorizontal: 16,
      paddingTop: 4,
      paddingBottom: 16,
      backgroundColor: "#080808",
      borderTopWidth: 1,
      borderTopColor: "#202020",
    },

    mobileMenuItem: {
      width: "100%",
      minHeight: 50,
      paddingHorizontal: 10,
      justifyContent: "center",
      borderBottomWidth: 1,
      borderBottomColor: "#202020",
    },

    mobileMenuText: {
      color: "#FFFFFF",
      fontSize: 17,
      fontWeight: "600",
    },

    mobileActionButton: {
      width: "100%",
      minHeight: 50,
      marginTop: 12,
      paddingHorizontal: 16,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 12,
    },

    mobileLoginButton: {
      backgroundColor: "#C1121F",
    },

    mobileLogoutButton: {
      backgroundColor: "#210C0E",
      borderWidth: 1,
      borderColor: "#6A1B21",
    },

    mobileLoginText: {
      color: "#FFFFFF",
      fontSize: 17,
      fontWeight: "700",
    },

    mobileLogoutText: {
      color: "#FF9A9A",
      fontSize: 17,
      fontWeight: "700",
    },
  });