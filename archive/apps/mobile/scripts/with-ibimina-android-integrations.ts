import { promises as fs } from "fs";
import path from "path";
import {
  AndroidConfig,
  ConfigPlugin,
  withAndroidManifest,
  withDangerousMod,
} from "expo/config-plugins";

const SERVICE_CLASS = "rw.ibimina.mobile.notifications.IbiminaNotificationListener";
const RECEIVER_CLASS = "rw.ibimina.mobile.sms.SmsConsentReceiver";

const ensureNoReadSmsPermission = (manifest: AndroidConfig.Manifest.AndroidManifest) => {
  const usesPermissions = manifest.manifest["uses-permission"];
  if (!usesPermissions) {
    return;
  }
  const permissionsArray = Array.isArray(usesPermissions) ? usesPermissions : [usesPermissions];
  const filtered = permissionsArray.filter(
    (permission) => permission.$["android:name"] !== "android.permission.READ_SMS"
  );
  if (filtered.length === 0) {
    delete manifest.manifest["uses-permission"];
  } else {
    manifest.manifest["uses-permission"] = filtered;
  }
};

const ensureNotificationService = (application: AndroidConfig.Manifest.ManifestApplication) => {
  const services = application.service ?? [];
  if (services.some((service) => service.$["android:name"] === SERVICE_CLASS)) {
    return;
  }
  services.push({
    $: {
      "android:name": SERVICE_CLASS,
      "android:exported": "false",
      "android:permission": "android.permission.BIND_NOTIFICATION_LISTENER_SERVICE",
    },
    "intent-filter": [
      {
        action: [
          {
            $: {
              "android:name": "android.service.notification.NotificationListenerService",
            },
          },
        ],
      },
    ],
  });
  application.service = services;
};

const ensureSmsConsentReceiver = (application: AndroidConfig.Manifest.ManifestApplication) => {
  const receivers = application.receiver ?? [];
  if (receivers.some((receiver) => receiver.$["android:name"] === RECEIVER_CLASS)) {
    return;
  }
  receivers.push({
    $: {
      "android:name": RECEIVER_CLASS,
      "android:exported": "true",
    },
    "intent-filter": [
      {
        action: [
          {
            $: {
              "android:name": "com.google.android.gms.auth.api.phone.SMS_RETRIEVED",
            },
          },
        ],
      },
    ],
  });
  application.receiver = receivers;
};

const copyNativeSources = async (projectRoot: string, platformProjectRoot: string) => {
  const templateRoot = path.join(projectRoot, "android", "native-modules", "app", "src", "main", "java");
  const targetRoot = path.join(platformProjectRoot, "app", "src", "main", "java");

  const copyRecursive = async (from: string, to: string) => {
    const entries = await fs.readdir(from, { withFileTypes: true });
    await fs.mkdir(to, { recursive: true });
    for (const entry of entries) {
      const sourcePath = path.join(from, entry.name);
      const targetPath = path.join(to, entry.name);
      if (entry.isDirectory()) {
        await copyRecursive(sourcePath, targetPath);
      } else {
        await fs.mkdir(path.dirname(targetPath), { recursive: true });
        await fs.copyFile(sourcePath, targetPath);
      }
    }
  };

  await copyRecursive(templateRoot, targetRoot);
};

const withIbiminaAndroidIntegrations: ConfigPlugin = (config) => {
  config = withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    ensureNoReadSmsPermission(manifest);
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
    ensureNotificationService(mainApplication);
    ensureSmsConsentReceiver(mainApplication);
    return config;
  });

  config = withDangerousMod(config, ["android", async (config) => {
    await copyNativeSources(config.modRequest.projectRoot, config.modRequest.platformProjectRoot);
    return config;
  }]);

  return config;
};

export default withIbiminaAndroidIntegrations;
