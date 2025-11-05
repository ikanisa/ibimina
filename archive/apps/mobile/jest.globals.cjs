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
