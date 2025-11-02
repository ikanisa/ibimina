const http = require("node:http");
const path = require("node:path");
const fs = require("node:fs");
const crypto = require("node:crypto");
const { execFile } = require("node:child_process");

require("ts-node/register");

const ingestSms = require("../ingest-sms/index.ts").default;
const ingestStatement = require("../ingest-statement/index.ts").default;
const referenceDecode = require("../reference-decode/index.ts").default;
const exportAllocation = require("../export-allocation/index.ts").default;
const {
  setServiceClientForTesting
} = require("../../shared/supabase.ts");

class MockSupabase {
  constructor() {
    this.allocations = [];
    this.exports = [];
  }

  from(table) {
    if (table !== "allocations") {
      throw new Error(`unexpected table ${table}`);
    }
    return {
      insert: async (values) => {
        const list = Array.isArray(values) ? values : [values];
        this.allocations.push(...list);
        return { data: list, error: null };
      }
    };
  }

  storage = {
    from: (bucket) => ({
      createSignedUrl: async (filePath, expiresIn) => {
        this.exports.push({ bucket, path: filePath, expiresIn });
        return {
          data: {
            signedUrl: `https://storage.local/${bucket}/${filePath}?token=test`
          },
          error: null
        };
      }
    })
  };

  reset() {
    this.allocations = [];
    this.exports = [];
  }
}

const routes = {
  "/ingest-sms": ingestSms,
  "/ingest-statement": ingestStatement,
  "/reference-decode": referenceDecode,
  "/export-allocation": exportAllocation
};

function computeSignature(secret, raw) {
  return crypto.createHmac("sha256", secret).update(raw).digest("hex");
}

function loadCollection() {
  const collectionPath = path.resolve(
    __dirname,
    "collections/edge-functions.postman_collection.json"
  );
  const raw = fs.readFileSync(collectionPath, "utf-8");
  return JSON.parse(raw);
}

describe("Edge functions Postman run", () => {
  const mock = new MockSupabase();
  let server;
  let baseUrl;

  beforeAll(async () => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
    process.env.HMAC_SMS_SECRET = "sms-secret";
    process.env.HMAC_STATEMENT_SECRET = "statement-secret";
    process.env.HMAC_REFERENCE_SECRET = "reference-secret";
    process.env.HMAC_EXPORT_SECRET = "export-secret";

    setServiceClientForTesting(mock);

    server = http.createServer(async (req, res) => {
      if (!req.url) {
        res.writeHead(404);
        res.end();
        return;
      }
      const url = new URL(req.url, "http://127.0.0.1");
      const handler = routes[url.pathname];
      if (!handler) {
        res.writeHead(404);
        res.end();
        return;
      }
      const chunks = [];
      req.on("data", (chunk) => chunks.push(chunk));
      await new Promise((resolve) => req.on("end", resolve));
      const bodyBuffer = Buffer.concat(chunks);
      const request = new Request(
        `http://127.0.0.1${url.pathname}`,
        {
          method: req.method,
          headers: req.headers,
          body: bodyBuffer.length ? bodyBuffer : undefined
        }
      );
      const response = await handler.fetch(request);
      const responseBody = new Uint8Array(await response.arrayBuffer());
      res.writeHead(
        response.status,
        Object.fromEntries(response.headers.entries())
      );
      res.end(Buffer.from(responseBody));
    });

    await new Promise((resolve) => {
      server.listen(0, "127.0.0.1", () => {
        const address = server.address();
        if (!address || typeof address === "string") {
          throw new Error("server address unavailable");
        }
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  afterEach(() => {
    mock.reset();
  });

  afterAll(async () => {
    setServiceClientForTesting(undefined);
    await new Promise((resolve) => server.close(resolve));
  });

  it("runs Postman collection via Newman CLI and asserts Supabase interactions", async () => {
    const collection = loadCollection();

    const smsBody = collection.item[0].request.body.raw;
    const statementBody = collection.item[1].request.body.raw;
    const referenceBody = collection.item[2].request.body.raw;
    const exportBody = collection.item[3].request.body.raw;

    const envVars = [
      `baseUrl=${baseUrl}`,
      `sms_signature=${computeSignature(process.env.HMAC_SMS_SECRET, smsBody)}`,
      `statement_signature=${computeSignature(process.env.HMAC_STATEMENT_SECRET, statementBody)}`,
      `reference_signature=${computeSignature(process.env.HMAC_REFERENCE_SECRET, referenceBody)}`,
      `export_signature=${computeSignature(process.env.HMAC_EXPORT_SECRET, exportBody)}`
    ];

    const collectionPath = path.resolve(
      __dirname,
      "collections/edge-functions.postman_collection.json"
    );

    await new Promise((resolve, reject) => {
      execFile(
        "npx",
        [
          "--yes",
          "newman",
          "run",
          collectionPath,
          ...envVars.flatMap((item) => ["--env-var", item])
        ],
        (error) => {
          if (error) return reject(error);
          resolve();
        }
      );
    });

    expect(mock.allocations.length).toBe(3);
    const smsInsert = mock.allocations.find((row) => row.notes === "sms-ingest");
    expect(smsInsert).toBeDefined();
    expect(smsInsert.payer_msisdn).toBe("+250781234567");

    const statementInserts = mock.allocations.filter((row) => row.notes === "statement-ingest");
    expect(statementInserts.length).toBe(2);

    expect(mock.exports.length).toBe(1);
    expect(mock.exports[0]).toMatchObject({ bucket: "exports", path: "allocations/latest.csv" });
  });
});
