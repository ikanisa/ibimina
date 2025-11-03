module.exports = function (api) {
  const isTest = api.env("test");
  api.cache(true);
  const plugins = [];

  if (!isTest) {
    plugins.push("nativewind/babel");
  }

  plugins.push("react-native-reanimated/plugin");

  return {
    presets: ["babel-preset-expo"],
    plugins,
  };
};
