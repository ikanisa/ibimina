import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

/**
 * SMS Forwarder Service
 *
 * Monitors the Gammu SMS inbox directory and forwards messages to Supabase Edge Function.
 * Uses HMAC-SHA256 for request authentication.
 */

interface Config {
  inboxPath: string;
  processedPath: string;
  supabaseFunctionUrl: string;
  hmacSecret: string;
  pollInterval: number;
  logLevel: string;
}

interface SmsMessage {
  text: string;
  receivedAt: string;
  vendorMeta: {
    filename: string;
    modemPort?: string;
  };
}

class Logger {
  private level: string;
  private levels = ["debug", "info", "warn", "error"];

  constructor(level: string = "info") {
    this.level = level;
  }

  private shouldLog(level: string): boolean {
    const currentLevelIndex = this.levels.indexOf(this.level);
    const messageLevelIndex = this.levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  debug(message: string, meta?: any) {
    if (this.shouldLog("debug")) {
      console.log(
        JSON.stringify({ level: "debug", message, meta, timestamp: new Date().toISOString() })
      );
    }
  }

  info(message: string, meta?: any) {
    if (this.shouldLog("info")) {
      console.log(
        JSON.stringify({ level: "info", message, meta, timestamp: new Date().toISOString() })
      );
    }
  }

  warn(message: string, meta?: any) {
    if (this.shouldLog("warn")) {
      console.warn(
        JSON.stringify({ level: "warn", message, meta, timestamp: new Date().toISOString() })
      );
    }
  }

  error(message: string, error?: any) {
    if (this.shouldLog("error")) {
      console.error(
        JSON.stringify({
          level: "error",
          message,
          error: error?.message || error,
          stack: error?.stack,
          timestamp: new Date().toISOString(),
        })
      );
    }
  }
}

class SmsForwarder {
  private config: Config;
  private logger: Logger;
  private processing: Set<string> = new Set();

  constructor(config: Config) {
    this.config = config;
    this.logger = new Logger(config.logLevel);
  }

  /**
   * Generate HMAC signature for request authentication
   */
  private generateHmacSignature(timestamp: string, context: string, body: string): string {
    const message = `${timestamp}${context}${body}`;
    return crypto.createHmac("sha256", this.config.hmacSecret).update(message).digest("hex");
  }

  /**
   * Parse SMS file from Gammu inbox
   */
  private async parseSmsFile(filePath: string): Promise<SmsMessage | null> {
    try {
      const content = await fs.promises.readFile(filePath, "utf-8");
      const lines = content.split("\n");

      let text = "";
      let receivedAt = new Date().toISOString();
      let isTextSection = false;

      for (const line of lines) {
        if (line.startsWith("SMSCDateTime = ")) {
          const dateStr = line.substring(15).trim();
          // Parse Gammu date format: YY/MM/DD,HH:MM:SS
          const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{2}),(\d{2}):(\d{2}):(\d{2})/);
          if (match) {
            const [, yy, mm, dd, hh, min, ss] = match;
            const year = parseInt(yy) + 2000;
            receivedAt = new Date(
              year,
              parseInt(mm) - 1,
              parseInt(dd),
              parseInt(hh),
              parseInt(min),
              parseInt(ss)
            ).toISOString();
          }
        } else if (line === "") {
          // Empty line after headers indicates start of text
          isTextSection = true;
        } else if (isTextSection) {
          text += line + "\n";
        }
      }

      if (!text.trim()) {
        this.logger.warn("Empty SMS text", { filePath });
        return null;
      }

      return {
        text: text.trim(),
        receivedAt,
        vendorMeta: {
          filename: path.basename(filePath),
          modemPort: process.env.MODEM_PORT,
        },
      };
    } catch (error) {
      this.logger.error("Failed to parse SMS file", { filePath, error });
      return null;
    }
  }

  /**
   * Forward SMS to Supabase Edge Function
   */
  private async forwardSms(sms: SmsMessage): Promise<boolean> {
    try {
      const timestamp = new Date().toISOString();
      const context = `POST:/functions/v1/sms-inbox`;
      const body = JSON.stringify({
        text: sms.text,
        receivedAt: sms.receivedAt,
        vendorMeta: sms.vendorMeta,
      });

      const signature = this.generateHmacSignature(timestamp, context, body);

      const response = await fetch(this.config.supabaseFunctionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-signature": signature,
          "x-timestamp": timestamp,
        },
        body,
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error("Edge function returned error", {
          status: response.status,
          error: errorText,
          sms: sms.vendorMeta,
        });
        return false;
      }

      const result = (await response.json()) as { id: string; status: string };
      this.logger.info("SMS forwarded successfully", {
        smsId: result.id,
        status: result.status,
        filename: sms.vendorMeta.filename,
      });

      return true;
    } catch (error) {
      this.logger.error("Failed to forward SMS", { error, sms: sms.vendorMeta });
      return false;
    }
  }

  /**
   * Process a single SMS file
   */
  private async processSmsFile(filePath: string): Promise<void> {
    const filename = path.basename(filePath);

    if (this.processing.has(filename)) {
      return;
    }

    this.processing.add(filename);

    try {
      this.logger.debug("Processing SMS file", { filename });

      const sms = await this.parseSmsFile(filePath);
      if (!sms) {
        this.logger.warn("Skipping invalid SMS file", { filename });
        // Move to processed even if invalid to avoid reprocessing
        await this.moveToProcessed(filePath);
        return;
      }

      const forwarded = await this.forwardSms(sms);
      if (forwarded) {
        await this.moveToProcessed(filePath);
      } else {
        // Keep in inbox for retry on next poll
        this.logger.warn("SMS forwarding failed, will retry", { filename });
      }
    } catch (error) {
      this.logger.error("Error processing SMS file", { filename, error });
    } finally {
      this.processing.delete(filename);
    }
  }

  /**
   * Move processed file to processed directory
   */
  private async moveToProcessed(filePath: string): Promise<void> {
    try {
      const filename = path.basename(filePath);
      const destPath = path.join(this.config.processedPath, filename);
      await fs.promises.rename(filePath, destPath);
      this.logger.debug("Moved file to processed", { filename });
    } catch (error) {
      this.logger.error("Failed to move file to processed", { filePath, error });
    }
  }

  /**
   * Poll inbox directory for new SMS files
   */
  private async pollInbox(): Promise<void> {
    try {
      const files = await fs.promises.readdir(this.config.inboxPath);
      const smsFiles = files.filter((f) => f.startsWith("IN") && f.endsWith(".txt"));

      if (smsFiles.length > 0) {
        this.logger.debug("Found SMS files", { count: smsFiles.length });

        for (const file of smsFiles) {
          const filePath = path.join(this.config.inboxPath, file);
          await this.processSmsFile(filePath);
        }
      }
    } catch (error) {
      this.logger.error("Error polling inbox", error);
    }
  }

  /**
   * Start the forwarder service
   */
  async start(): Promise<void> {
    this.logger.info("SMS Forwarder starting", {
      inboxPath: this.config.inboxPath,
      pollInterval: this.config.pollInterval,
    });

    // Ensure processed directory exists
    try {
      await fs.promises.mkdir(this.config.processedPath, { recursive: true });
    } catch (error) {
      this.logger.error("Failed to create processed directory", error);
      process.exit(1);
    }

    // Initial poll
    await this.pollInbox();

    // Set up polling interval
    setInterval(() => {
      this.pollInbox();
    }, this.config.pollInterval * 1000);

    this.logger.info("SMS Forwarder started successfully");
  }
}

// Main execution
const config: Config = {
  inboxPath: process.env.INBOX_PATH || "/var/spool/gammu/inbox",
  processedPath: process.env.PROCESSED_PATH || "/var/spool/gammu/processed",
  supabaseFunctionUrl: process.env.SUPABASE_FUNCTION_URL || "",
  hmacSecret: process.env.HMAC_SHARED_SECRET || "",
  pollInterval: parseInt(process.env.POLL_INTERVAL || "5", 10),
  logLevel: process.env.LOG_LEVEL || "info",
};

// Validate configuration
if (!config.supabaseFunctionUrl) {
  console.error("SUPABASE_FUNCTION_URL environment variable is required");
  process.exit(1);
}

if (!config.hmacSecret) {
  console.error("HMAC_SHARED_SECRET environment variable is required");
  process.exit(1);
}

// Start forwarder
const forwarder = new SmsForwarder(config);
forwarder.start().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("Received SIGINT, shutting down gracefully");
  process.exit(0);
});
