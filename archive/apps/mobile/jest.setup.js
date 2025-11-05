require("@testing-library/jest-native/extend-expect");

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  Redirect: () => null,
}));

jest.mock("expo-constants", () => ({
  expoConfig: {
    extra: {
      apiBaseUrl: "https://api.example.com",
    },
  },
}));

if (!globalThis.expo) {
  globalThis.expo = {
    EventEmitter: class {
      addListener() {
        return { remove() {} };
      }
      removeAllListeners() {}
    },
    NativeModule: {},
  };
}
