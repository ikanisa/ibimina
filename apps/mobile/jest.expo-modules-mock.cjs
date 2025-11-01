class MockEventEmitter {
  addListener() {
    return { remove() {} };
  }
  removeAllListeners() {}
}

class MockNativeModule {}
class MockSharedObject {}
class MockSharedRef {}

const NativeModulesProxy = {};

const ExpoModulesCore = {
  EventEmitter: MockEventEmitter,
  NativeModule: MockNativeModule,
  SharedObject: MockSharedObject,
  SharedRef: MockSharedRef,
  NativeModulesProxy,
  requireNativeModule: () => ({}),
  uuid: {
    v4: () => "00000000-0000-0000-0000-000000000000",
    v5: () => "00000000-0000-0000-0000-000000000000",
  },
};

if (!globalThis.expo) {
  globalThis.expo = {};
}

globalThis.expo.EventEmitter = MockEventEmitter;
globalThis.expo.NativeModule = MockNativeModule;
globalThis.expo.SharedObject = MockSharedObject;
globalThis.expo.SharedRef = MockSharedRef;

globalThis.expo.modules = globalThis.expo.modules || {};
globalThis.expo.uuidv4 = ExpoModulesCore.uuid.v4;
globalThis.expo.uuidv5 = ExpoModulesCore.uuid.v5;

module.exports = ExpoModulesCore;
