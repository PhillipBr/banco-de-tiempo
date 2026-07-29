import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import {
  router,
} from "expo-router";

import {
  useState,
} from "react";

import {
  useAuthContext,
} from "../context/AuthContext";

const logo =
  require("../../assets/logo.png");

export default function Header() {
  const {
    session,
    signOut,
  } = useAuthContext();

  const {
    width,
  } = useWindowDimensions();

  const [
    isMenuOpen,
    setIsMenuOpen,
  ] = useState(false);

  const isMobile =
    width < 760;

  const closeMenu =
    () => {
      setIsMenuOpen(false);
    };

  const navigateTo =
    (
      pathname:
        | "/"
        | "/services"
        | "/conversations"
        | "/profile"
        | "/login"
    ) => {
      closeMenu();

      router.push(
        pathname
      );
    };

  const handleLogout =
    async () => {
      closeMenu();

      await signOut();

      router.replace(
        "/login"
      );
    };

  return (
    <View
      style={
        headerStyles.wrapper
      }
    >
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
          onPress={() =>
            navigateTo("/")
          }
        >
          <Image
            source={
              logo
            }
            style={[
              headerStyles.logoImage,

              isMobile &&
                headerStyles.logoImageMobile,
            ]}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {!isMobile ? (
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
                navigateTo(
                  "/services"
                )
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
                    navigateTo(
                      "/profile"
                    )
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
                  onPress={
                    handleLogout
                  }
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
                onPress={() =>
                  navigateTo(
                    "/login"
                  )
                }
              >
                <Text
                  style={[
                    headerStyles.navText,
                    headerStyles.loginText,
                  ]}
                >
                  Login
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              isMenuOpen
                ? "Cerrar menú"
                : "Abrir menú"
            }
            style={({ pressed }) => [
              headerStyles.menuButton,

              pressed && {
                opacity: 0.7,
              },
            ]}
            onPress={() =>
              setIsMenuOpen(
                (current) =>
                  !current
              )
            }
          >
            <Text
              style={
                headerStyles.menuButtonText
              }
            >
              {isMenuOpen
                ? "✕"
                : "☰"}
            </Text>
          </Pressable>
        )}
      </View>

      {isMobile &&
      isMenuOpen ? (
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
              navigateTo(
                "/services"
              )
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
                  navigateTo(
                    "/profile"
                  )
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
                  headerStyles.mobileMenuItem,
                  headerStyles.mobileLogoutItem,
                ]}
                onPress={
                  handleLogout
                }
              >
                <Text
                  style={[
                    headerStyles.mobileMenuText,
                    headerStyles.logoutText,
                  ]}
                >
                  Logout
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[
                headerStyles.mobileMenuItem,
                headerStyles.mobileLoginItem,
              ]}
              onPress={() =>
                navigateTo(
                  "/login"
                )
              }
            >
              <Text
                style={[
                  headerStyles.mobileMenuText,
                  headerStyles.loginText,
                ]}
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
      backgroundColor:
        "#000000",
      borderBottomWidth:
        1,
      borderBottomColor:
        "#151515",
      zIndex:
        100,
    },

    header: {
      width: "100%",
      minHeight: 96,
      backgroundColor:
        "#000000",
      paddingHorizontal:
        32,
      paddingVertical:
        12,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },

    headerMobile: {
      minHeight:
        78,
      paddingHorizontal:
        18,
      paddingVertical:
        10,
    },

    logoContainer: {
      width:
        220,
      height:
        70,
      justifyContent:
        "center",
      alignItems:
        "flex-start",
      flexShrink:
        1,
    },

    logoContainerMobile: {
      width:
        180,
      height:
        58,
      flexShrink:
        1,
    },

    logoImage: {
      width:
        220,
      height:
        70,
    },

    logoImageMobile: {
      width:
        180,
      height:
        58,
    },

    desktopNav: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "flex-end",
      gap:
        22,
      flexShrink:
        0,
    },

    navText: {
      color:
        "#FFFFFF",
      fontSize:
        15,
      fontWeight:
        "600",
    },

    loginText: {
      color:
        "#FFFFFF",
    },

    logoutText: {
      color:
        "#FF8B8B",
    },

    menuButton: {
      width:
        48,
      height:
        48,
      borderWidth:
        1,
      borderColor:
        "#333333",
      borderRadius:
        12,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#0C0C0C",
      flexShrink:
        0,
    },

    menuButtonText: {
      color:
        "#FFFFFF",
      fontSize:
        27,
      lineHeight:
        30,
      fontWeight:
        "700",
    },

    mobileMenu: {
      width:
        "100%",
      backgroundColor:
        "#080808",
      borderTopWidth:
        1,
      borderTopColor:
        "#202020",
      paddingHorizontal:
        18,
      paddingTop:
        8,
      paddingBottom:
        16,
    },

    mobileMenuItem: {
      minHeight:
        52,
      justifyContent:
        "center",
      borderBottomWidth:
        1,
      borderBottomColor:
        "#1B1B1B",
      paddingHorizontal:
        8,
    },

    mobileMenuText: {
      color:
        "#FFFFFF",
      fontSize:
        17,
      fontWeight:
        "600",
    },

    mobileLoginItem: {
      marginTop:
        8,
      backgroundColor:
        "#C1121F",
      borderRadius:
        12,
      borderBottomWidth:
        0,
      paddingHorizontal:
        16,
    },

    mobileLogoutItem: {
      marginTop:
        8,
      backgroundColor:
        "#18090A",
      borderRadius:
        12,
      borderBottomWidth:
        0,
      paddingHorizontal:
        16,
    },
  })