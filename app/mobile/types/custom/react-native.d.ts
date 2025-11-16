import type * as React from "react";

declare module "react-native" {
  export const Platform: {
    OS: "ios" | "android" | "web" | string;
    select: <T>(options: { ios?: T; android?: T; web?: T; default?: T }) => T | undefined;
  };
  export const Linking: {
    canOpenURL(url: string): Promise<boolean>;
    openURL(url: string): Promise<void>;
  };
  export const Alert: {
    alert(title: string, message?: string): void;
  };
  export interface ViewStyle {
    [key: string]: unknown;
  }
  export interface TextStyle {
    [key: string]: unknown;
  }
  export interface ViewProps {
    style?: ViewStyle | ViewStyle[];
    children?: React.ReactNode;
    accessibilityLabel?: string;
    accessibilityRole?: string;
    accessibilityElementsHidden?: boolean;
    className?: string;
  }
  export interface TextProps {
    style?: TextStyle | TextStyle[];
    children?: React.ReactNode;
    numberOfLines?: number;
    accessibilityLabel?: string;
    className?: string;
  }
  export interface TouchableOpacityProps extends ViewProps {
    onPress?: () => void;
    disabled?: boolean;
    accessibilityHint?: string;
  }
  export interface ScrollViewProps extends ViewProps {
    contentContainerStyle?: ViewStyle;
    contentContainerClassName?: string;
    showsVerticalScrollIndicator?: boolean;
    keyboardShouldPersistTaps?: "always" | "never" | "handled";
  }
  export const SafeAreaView: React.ComponentType<ViewProps>;
  export const View: React.ComponentType<ViewProps>;
  export const Text: React.ComponentType<TextProps>;
  export const ScrollView: React.ComponentType<ScrollViewProps>;
  export const TouchableOpacity: React.ComponentType<TouchableOpacityProps>;
  export const StyleSheet: {
    create<T extends Record<string, ViewStyle | TextStyle>>(styles: T): T;
  };
}
