import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from "expo-router/ui";

import {
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";

import {
  MaxContentWidth,
  Spacing,
} from "@/constants/theme";

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot
        style={{
          height: "100%",
        }}
      />

      <TabList asChild>
        <CustomTabList>
          <TabTrigger
            name="home"
            href="/"
            asChild
          >
            <TabButton>
              Inicio
            </TabButton>
          </TabTrigger>

          <TabTrigger
            name="services"
            href="/services"
            asChild
          >
            <TabButton>
              Servicios
            </TabButton>
          </TabTrigger>

          <TabTrigger
            name="profile"
            href="/profile"
            asChild
          >
            <TabButton>
              Perfil
            </TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({
  children,
  isFocused,
  ...props
}: TabTriggerSlotProps) {
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        styles.tabPressable,
        pressed && styles.pressed,
      ]}
    >
      <ThemedView
        type={
          isFocused
            ? "backgroundSelected"
            : "backgroundElement"
        }
        style={
          styles.tabButtonView
        }
      >
        <ThemedText
          type="small"
          themeColor={
            isFocused
              ? "text"
              : "textSecondary"
          }
        >
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function CustomTabList({
  children,
  ...props
}: TabListProps) {
  return (
    <View
      {...props}
      style={
        styles.tabListContainer
      }
    >
      <ThemedView
        type="backgroundElement"
        style={
          styles.innerContainer
        }
      >
        <ThemedText
          type="smallBold"
          style={
            styles.brandText
          }
        >
          Banco de Tiempo
        </ThemedText>

        <View
          style={
            styles.tabsContainer
          }
        >
          {children}
        </View>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: "absolute",
    width: "100%",
    padding: Spacing.three,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },

  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.five,
    flexDirection: "row",
    alignItems: "center",
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
  },

  brandText: {
    marginRight: "auto",
  },

  tabsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },

  tabPressable: {
    borderRadius: Spacing.three,
  },

  pressed: {
    opacity: 0.7,
  },

  tabButtonView: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
});