/** @format */
/**
 * Root layout: providers, font loading, direction setup, and navigation stack.
 */
import { useState, useEffect, useRef } from "react";
import {
  Stack,
  ThemeProvider as NavThemeProvider,
  DarkTheme,
  DefaultTheme,
  type ErrorBoundaryProps,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { DevSettings, I18nManager, LogBox, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { useTranslation } from "react-i18next";
import { Text } from "@components/Text/Text";
import { PressableScale } from "@presentation/components/PressableScale/PressableScale";
import { ThemeProvider } from "@presentation/theme/ThemeProvider";
import { installDefaultTextFonts } from "@presentation/theme/textDefaults";
import { useTheme } from "@hooks/useTheme";
import { useSettingsStore } from "@stores/useSettingsStore";
import { useNotificationDeepLink } from "@hooks/useNotificationDeepLink";
import { reconcileNotificationPermission } from "@hooks/rootOrchestration";
import {
  applyStoredLanguage,
  applyStoredLanguageAsync,
  onAppLanguageChanged,
  startWidgetSync,
  installDayRolloverWatcher,
} from "../src/appBootstrap";
import TajawalRegular from "../assets/fonts/tajawal/Tajawal-Regular.ttf";
import TajawalMedium from "../assets/fonts/tajawal/Tajawal-Medium.ttf";
import TajawalBold from "../assets/fonts/tajawal/Tajawal-Bold.ttf";

I18nManager.allowRTL(true);

LogBox.ignoreLogs([
  // expo-notifications checks remote push registration on startup via Keychain.
  // In local/offline-first apps and simulators without code-signing entitlements,
  // this is a benign expected failure that does not impact local notifications.
  "[expo-notifications] Error reading persisted server registration info",
]);

installDefaultTextFonts();

void SplashScreen.preventAutoHideAsync();

function RootContent() {
  const { isDark, colors } = useTheme();

  const baseTheme = isDark ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      background: colors.surfaceDim,
      card: colors.card,
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <View style={{ flex: 1, backgroundColor: colors.surfaceDim }}>
          <StatusBar style={isDark ? "light" : "dark"} />
          <NavThemeProvider value={navTheme}>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.surfaceDim },
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="wizard" />
              <Stack.Screen name="(tabs)" />
            </Stack>
          </NavThemeProvider>
        </View>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const { t } = useTranslation();
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: 24,
        backgroundColor: "#101418",
      }}
    >
      <Ionicons name="alert-circle-outline" size={80} color="#9AA0A6" />
      <Text style={{ color: "#F2F2F2", textAlign: "center" }} variant="lg" weight="bold">
        {t("errors.unexpectedTitle")}
      </Text>
      <Text style={{ color: "#9AA0A6", textAlign: "center" }} variant="base">
        {error.message}
      </Text>
      <PressableScale
        onPress={() => {
          void retry();
        }}
        accessibilityRole="button"
        accessibilityLabel={t("errors.retry")}
        style={{
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 12,
          backgroundColor: "#2A2F36",
        }}
      >
        <Text style={{ color: "#F2F2F2" }} variant="base" weight="bold">
          {t("errors.retry")}
        </Text>
      </PressableScale>
    </View>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    "Tajawal-Regular": TajawalRegular,
    "Tajawal-Medium": TajawalMedium,
    "Tajawal-Bold": TajawalBold,
  });
  const [langReady, setLangReady] = useState(false);
  const [rtlKey, setRtlKey] = useState(0);
  const [isRtl, setIsRtl] = useState(false);
  const keyRef = useRef(0);

  useNotificationDeepLink(loaded && langReady);

  useEffect(() => {
    const handler = (lang: string) => {
      const isArabic = lang === "ar";
      if (I18nManager.isRTL !== isArabic) {
        I18nManager.forceRTL(isArabic);
        I18nManager.allowRTL(isArabic);
        if (__DEV__) {
          DevSettings.reload();
          return;
        }
      }
      setIsRtl(isArabic);
      keyRef.current += 1;
      setRtlKey(keyRef.current);
    };
    return onAppLanguageChanged(handler);
  }, []);

  // Hold the boot (splash stays visible) until the settings store has
  // rehydrated AND i18n matches the persisted language. The first painted
  // frame is therefore always in the language chosen on first launch — never
  // a device-locale flash followed by a remount.
  useEffect(() => {
    let cancelled = false;
    const boot = () => {
      void applyStoredLanguageAsync((rtl) => I18nManager.forceRTL(rtl)).then((sync) => {
        if (cancelled) return;
        setIsRtl(sync.isRtl);
        setLangReady(true);
      });
    };
    if (useSettingsStore.persist.hasHydrated()) {
      boot();
      return () => {
        cancelled = true;
      };
    }
    const unsub = useSettingsStore.persist.onFinishHydration(boot);
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  useEffect(() => {
    if (!loaded || !langReady) return;
    // Language was already synced by the boot gate — re-applying is a cheap
    // no-op safety net. Then reconcile the OS notification permission.
    applyStoredLanguage((rtl) => I18nManager.forceRTL(rtl));
    import("expo-notifications")
      .then(({ getPermissionsAsync }) => {
        void reconcileNotificationPermission(
          getPermissionsAsync,
          useSettingsStore.getState().notificationPermission,
          (p) => useSettingsStore.getState().setNotificationPermission(p)
        );
      })
      .catch(() => {});
    void SplashScreen.hideAsync().catch(() => {});
  }, [loaded, langReady]);

  useEffect(() => {
    if (!loaded || !langReady) return;
    const unsubWidget = startWidgetSync();
    const unsubRollover = installDayRolloverWatcher();
    return () => {
      unsubWidget();
      unsubRollover();
    };
  }, [loaded, langReady]);

  if (!loaded || !langReady) return null;

  return (
    <ThemeProvider key={rtlKey} direction={isRtl ? "rtl" : "ltr"}>
      <RootContent />
    </ThemeProvider>
  );
}
