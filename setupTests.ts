/** @format */
/**
 * Test setup with mocks for expo/react-native modules
 */
import type React from "react";

process.env["EXPO_OS"] = "ios";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
    i18n: {
      language: "ar",
      changeLanguage: jest.fn(() => Promise.resolve()),
      on: jest.fn(),
      off: jest.fn(),
    },
  }),
  initReactI18next: {
    type: "3rdParty",
    init: jest.fn(),
  },
}));

jest.mock("@react-native-async-storage/async-storage", () => {
  const mockStorage = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((key: string) => Promise.resolve(mockStorage.get(key) ?? null)),
      setItem: jest.fn((key: string, value: string) => {
        mockStorage.set(key, value);
        return Promise.resolve();
      }),
      removeItem: jest.fn((key: string) => {
        mockStorage.delete(key);
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        mockStorage.clear();
        return Promise.resolve();
      }),
      getAllKeys: jest.fn(() => Promise.resolve(Array.from(mockStorage.keys()))),
    },
  };
});

jest.mock("expo-font", () => ({
  loadAsync: jest.fn(),
  isLoaded: jest.fn().mockReturnValue(true),
  processFontFamily: jest.fn((name) => name),
}));

jest.mock("expo-constants", () => ({
  default: {
    expoConfig: {
      extra: {},
    },
    manifest: {},
  },
}));

jest.mock("expo-router", () => {
  const router = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  };
  return {
    router,
    useRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    }),
    useSegments: () => [],
    useFocusEffect: (cb?: () => unknown) => {
      const { useEffect } = require("react");
      function useFocusEffectMock() {
        useEffect(() => {
          const cleanup = typeof cb === "function" ? cb() : undefined;
          return () => {
            if (typeof cleanup === "function") cleanup();
          };
        }, [cb]);
      }
      useFocusEffectMock();
    },
    Link: "Link",
    Stack: ({ children }: { children: React.ReactNode }) => children,
  };
});

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
  MaterialIcons: "MaterialIcons",
  MaterialCommunityIcons: "MaterialCommunityIcons",
  FontAwesome: "FontAwesome",
  Feather: "Feather",
  AntDesign: "AntDesign",
  Entypo: "Entypo",
  EvilIcons: "EvilIcons",
  FontAwesome5: "FontAwesome5",
  Fontisto: "Fontisto",
  Foundation: "Foundation",
  Octicons: "Octicons",
  SimpleLineIcons: "SimpleLineIcons",
  Zocial: "Zocial",
}));

jest.mock("react-native-reanimated", () => {
  const NOOP = () => undefined;
  const ID = <T>(t: T) => t;

  const hook = {
    useSharedValue: <T>(init: T) => {
      const shared: { value: T } = { value: init };
      shared.get = () => shared.value;
      shared.set = (next: T) => {
        shared.value = next;
      };
      return shared;
    },
    useReducedMotion: jest.fn(() => false),
    useAnimatedStyle: ID,
    useDerivedValue: <T>(processor: () => T) => ({ value: processor() }),
    useAnimatedRef: () => ({ current: null }),
    useAnimatedScrollHandler: NOOP,
    useAnimatedProps: ID,
    useEvent: () => NOOP,
    useAnimatedReaction: NOOP,
  };

  const animation = {
    cancelAnimation: NOOP,
    ReduceMotion: { System: "system", Always: "always", Never: "never" },
    withDecay: (_userConfig: unknown, callback?: (finished: boolean) => void) => {
      callback?.(true);
      return 0;
    },
    withDelay: <T>(_delayMs: number, nextAnimation: T) => nextAnimation,
    withRepeat: ID,
    withSequence: () => 0,
    withSpring: (toValue: number) => toValue,
    withTiming: (toValue: number, _config?: unknown, callback?: (finished: boolean) => void) => {
      callback?.(true);
      return toValue;
    },
  };

  const interpolation = {
    Extrapolation: { CLAMP: "clamp", EXTEND: "extend", IDENTITY: "identity" },
    interpolate: NOOP,
    clamp: NOOP,
  };

  const Animated = {
    View: "Animated.View",
    Text: "Animated.Text",
    Image: "Animated.Image",
    ScrollView: "Animated.ScrollView",
    FlatList: "Animated.FlatList",
    Extrapolate: interpolation.Extrapolation,
    interpolate: NOOP,
    interpolateColor: NOOP,
    clamp: NOOP,
    createAnimatedComponent: ID,
    addWhitelistedUIProps: NOOP,
    addWhitelistedNativeProps: NOOP,
  };

  return {
    __esModule: true,
    default: Animated,
    ...hook,
    ...animation,
    ...interpolation,
    Easing: {
      linear: ID,
      ease: ID,
      quad: ID,
      cubic: ID,
      poly: ID,
      sin: ID,
      circle: ID,
      exp: ID,
      elastic: ID,
      back: ID,
      bounce: ID,
      bezier: () => ({ factory: ID }),
      bezierFn: ID,
      steps: ID,
      in: ID,
      out: ID,
      inOut: ID,
    },
    runOnJS: ID,
    runOnUI: ID,
    enableLayoutAnimations: NOOP,
    isReanimated3: () => true,
    layout: {
      FadeIn: {},
      FadeOut: {},
      SlideInRight: {},
      SlideOutLeft: {},
    },
  };
});

jest.mock("react-native-gesture-handler", () => ({
  Gesture: {
    Tap: () => ({}),
    Pan: () => ({}),
    Pinch: () => ({}),
    Rotation: () => ({}),
    Native: () => ({}),
  },
  GestureHandlerRootView: ({ children }: { children: React.ReactNode }) => children,
  Swipeable: ({ children }: { children: React.ReactNode }) => children,
  TouchableOpacity: "TouchableOpacity",
  TouchableHighlight: "TouchableHighlight",
  State: {},
}));

jest.mock("expo-notifications", () => ({
  requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  getPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: "mock-token" }),
  addNotificationResponseReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  getLastNotificationResponseAsync: jest.fn().mockResolvedValue(null),
  getLastNotificationResponse: jest.fn().mockReturnValue(null),
}));

jest.mock("expo-clipboard", () => ({
  setStringAsync: jest.fn(),
  getStringAsync: jest.fn().mockResolvedValue(""),
}));

jest.mock("expo-file-system", () => ({
  documentDirectory: "/mock/document/dir/",
  cacheDirectory: "/mock/cache/dir/",
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
  getInfoAsync: jest.fn(),
}));

jest.mock("expo-sharing", () => ({
  shareAsync: jest.fn(),
  isAvailableAsync: jest.fn().mockResolvedValue(true),
}));

jest.mock("react-native-keyboard-controller", () => {
  const React = require("react");
  const { ScrollView } = require("react-native");
  return {
    KeyboardAwareScrollView: ScrollView,
    KeyboardAvoidingView: ScrollView,
    KeyboardControllerView: ScrollView,
    KeyboardProvider: ({ children }: { children: React.ReactNode }) => children,
    KeyboardToolbar: ({ children }: { children: React.ReactNode }) => children,
    useKeyboardController: () => ({ enabled: false }),
    useReanimatedKeyboardAnimation: () => ({
      height: { value: 0 },
      progress: { value: 0 },
    }),
    KeyboardEvents: {
      addListener: jest.fn(() => ({ remove: jest.fn() })),
    },
  };
});

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
  NotificationFeedbackType: { Success: "success", Error: "error", Warning: "warning" },
}));

jest.mock("lottie-react-native", () => {
  const React = require("react");
  const { View } = require("react-native");
  const LottieView = ({ children, testID, ...props }: Record<string, unknown>) =>
    React.createElement(View, { ...props, testID: testID ?? "lottie-view" }, children);
  LottieView.displayName = "LottieView";
  return {
    __esModule: true,
    default: LottieView,
  };
});

jest.mock("qrcode", () => ({
  toDataURL: jest.fn().mockResolvedValue("data:image/png;base64,mock"),
  toString: jest.fn().mockResolvedValue("mock-qr-string"),
}));

jest.mock("i18next", () => ({
  changeLanguage: jest.fn(),
  t: jest.fn((key) => key),
  language: "ar",
  use: jest.fn().mockReturnThis(),
  init: jest.fn(),
}));

jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  const { View } = require("react-native");
  const PassThrough = ({ children }: { children?: React.ReactNode }) =>
    React.createElement(View, null, children);
  return {
    SafeAreaProvider: PassThrough,
    SafeAreaView: PassThrough,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  };
});

jest.mock("react-native-svg", () => {
  const mockComponent = (name: string) => {
    const Comp = ({
      children,
      ...props
    }: { children?: React.ReactNode } & Record<string, unknown>) => {
      const React = require("react");
      const { View, Text } = require("react-native");
      if (name === "Text" || name === "SvgText") {
        return React.createElement(Text, props, children);
      }
      return React.createElement(View, props, children);
    };
    Comp.displayName = name;
    return Comp;
  };
  return {
    __esModule: true,
    default: mockComponent("Svg"),
    Svg: mockComponent("Svg"),
    Circle: mockComponent("Circle"),
    Path: mockComponent("Path"),
    Rect: mockComponent("Rect"),
    Line: mockComponent("Line"),
    Polyline: mockComponent("Polyline"),
    Polygon: mockComponent("Polygon"),
    G: mockComponent("G"),
    Text: mockComponent("SvgText"),
    TSpan: mockComponent("TSpan"),
    TextPath: mockComponent("TextPath"),
    Use: mockComponent("Use"),
    Image: mockComponent("Image"),
    Symbol: mockComponent("Symbol"),
    Defs: mockComponent("Defs"),
    LinearGradient: mockComponent("LinearGradient"),
    RadialGradient: mockComponent("RadialGradient"),
    Stop: mockComponent("Stop"),
    ClipPath: mockComponent("ClipPath"),
    Pattern: mockComponent("Pattern"),
    Mask: mockComponent("Mask"),
  };
});
