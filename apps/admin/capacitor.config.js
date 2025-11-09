/** @type {import('@capacitor/cli').CapacitorConfig} */
const config = {
  appId: "rw.ibimina.staff",
  appName: "Ibimina Admin",
  webDir: ".next",
  server: {
    // For Android emulator to reach your Mac's localhost:3100
    url: "http://10.0.2.2:3100",
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

module.exports = config;
