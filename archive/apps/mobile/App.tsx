import { ExpoRoot } from "expo-router";
import { registerRootComponent } from "expo";

export function App() {
  const context = require.context("./app");
  return <ExpoRoot context={context} />;
}

registerRootComponent(App);

export default App;
