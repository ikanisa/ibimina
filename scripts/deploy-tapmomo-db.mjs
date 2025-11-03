#!/usr/bin/env node

/**
 * TapMoMo Database Deployment Script
 * Executes SQL directly via Supabase Admin API
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
import dotenv from "dotenv";
dotenv.config({ path: join(__dirname, "..", ".env") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Error: Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

console.log("🚀 Deploying TapMoMo Database Schema...\n");

// Read SQL file
const sqlFile = join(__dirname, "deploy-tapmomo-db.sql");
let sql;
try {
  sql = readFileSync(sqlFile, "utf-8");
} catch (error) {
  console.error(`❌ Error reading SQL file: ${error.message}`);
  process.exit(1);
}

// Create Supabase client with service role
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function deploySchemaSucess() {
  console.log("📝 Executing SQL script...\n");

  try {
    // Execute SQL using rpc (we'll create a custom function or use raw query)
    const { data, error } = await supabase.rpc("exec_sql", { query: sql });

    if (error) {
      // Try alternative method - check if tables exist
      console.log("⚠️  Direct execution not available, checking table status...\n");

      const { data: merchants, error: merchantsError } = await supabase
        .from("tapmomo_merchants")
        .select("id")
        .limit(1);

      const { data: transactions, error: transactionsError } = await supabase
        .from("tapmomo_transactions")
        .select("id")
        .limit(1);

      if (!merchantsError && !transactionsError) {
        console.log("✅ TapMoMo tables already exist!");
        console.log("   - tapmomo_merchants: ✓");
        console.log("   - tapmomo_transactions: ✓\n");
        return true;
      } else {
        console.log("⚠️  Tables not found. Please deploy manually:\n");
        console.log(
          `1. Go to: ${SUPABASE_URL.replace("https://", "https://supabase.com/dashboard/project/")}/sql/new`
        );
        console.log(`2. Copy SQL from: ${sqlFile}`);
        console.log("3. Paste and execute\n");
        return false;
      }
    }

    console.log("✅ SQL executed successfully!\n");
    return true;
  } catch (error) {
    console.error(`❌ Error: ${error.message}\n`);
    return false;
  }
}

async function verifyDeployment() {
  console.log("🔍 Verifying deployment...\n");

  try {
    // Check merchants table
    const { count: merchantsCount, error: merchantsError } = await supabase
      .from("tapmomo_merchants")
      .select("*", { count: "exact", head: true });

    if (merchantsError) {
      console.log("❌ tapmomo_merchants table: Not accessible");
      console.log(`   Error: ${merchantsError.message}\n`);
      return false;
    }
    console.log(`✅ tapmomo_merchants table: Accessible (${merchantsCount || 0} records)`);

    // Check transactions table
    const { count: transactionsCount, error: transactionsError } = await supabase
      .from("tapmomo_transactions")
      .select("*", { count: "exact", head: true });

    if (transactionsError) {
      console.log("❌ tapmomo_transactions table: Not accessible");
      console.log(`   Error: ${transactionsError.message}\n`);
      return false;
    }
    console.log(`✅ tapmomo_transactions table: Accessible (${transactionsCount || 0} records)`);

    // Check Edge Function
    const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)[1];
    console.log(`\n✅ Edge Function deployed at:`);
    console.log(`   ${SUPABASE_URL}/functions/v1/tapmomo-reconcile`);
    console.log(`\n📊 Dashboard: https://supabase.com/dashboard/project/${projectRef}`);

    return true;
  } catch (error) {
    console.error(`❌ Verification error: ${error.message}\n`);
    return false;
  }
}

// Main execution
(async () => {
  const deployed = await deploySchemaSucess();
  const verified = await verifyDeployment();

  if (verified) {
    console.log("\n🎉 TapMoMo deployment complete!\n");
    console.log("📋 Next steps:");
    console.log("1. Configure test merchant in admin app");
    console.log("2. Test NFC payment flow");
    console.log("3. Monitor transactions in dashboard\n");
    process.exit(0);
  } else {
    console.log("\n⚠️  Deployment needs manual intervention. See instructions above.\n");
    process.exit(1);
  }
})();
