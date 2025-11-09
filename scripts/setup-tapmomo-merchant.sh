#!/usr/bin/env bash

# TapMoMo Merchant Setup Script
# Creates test merchants for development and production testing

set -euo pipefail

source .env 2>/dev/null || { echo "❌ .env file not found"; exit 1; }

echo "🏪 TapMoMo Merchant Setup"
echo "========================="
echo ""

# Get staff user email
read -p "Enter staff user email (default: test@staff.ibimina.rw): " STAFF_EMAIL
STAFF_EMAIL=${STAFF_EMAIL:-test@staff.ibimina.rw}

# Get merchant details
read -p "Enter merchant name (default: Test Merchant): " MERCHANT_NAME
MERCHANT_NAME=${MERCHANT_NAME:-Test Merchant}

read -p "Enter network [MTN/Airtel] (default: MTN): " NETWORK
NETWORK=${NETWORK:-MTN}

read -p "Enter merchant code (6 digits, default: random): " MERCHANT_CODE
if [ -z "$MERCHANT_CODE" ]; then
    MERCHANT_CODE=$(printf "%06d" $RANDOM)
fi

echo ""
echo "📝 Creating merchant..."
echo "   Name: $MERCHANT_NAME"
echo "   Network: $NETWORK"
echo "   Code: $MERCHANT_CODE"
echo "   Email: $STAFF_EMAIL"
echo ""

# Generate secret key
SECRET_KEY=$(openssl rand -base64 32)

# Create SQL
SQL=$(cat <<EOF
DO \$\$
DECLARE
    v_user_id UUID;
    v_merchant_id UUID;
BEGIN
    -- Get or create user
    SELECT id INTO v_user_id FROM auth.users WHERE email = '$STAFF_EMAIL' LIMIT 1;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found: $STAFF_EMAIL. Please create user first.';
    END IF;
    
    -- Create merchant
    INSERT INTO public.tapmomo_merchants (
        user_id,
        display_name,
        network,
        merchant_code,
        secret_key,
        active
    ) VALUES (
        v_user_id,
        '$MERCHANT_NAME',
        '$NETWORK',
        '$MERCHANT_CODE',
        '$SECRET_KEY',
        true
    ) RETURNING id INTO v_merchant_id;
    
    RAISE NOTICE 'Merchant created: %', v_merchant_id;
END \$\$;
EOF
)

# Execute via Node
node --input-type=module -e "
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('$NEXT_PUBLIC_SUPABASE_URL', '$SUPABASE_SERVICE_ROLE_KEY');

// Find user
const { data: user, error: userError } = await supabase.auth.admin.listUsers();
if (userError) {
    console.error('❌ Error listing users:', userError.message);
    process.exit(1);
}

const staffUser = user.users.find(u => u.email === '$STAFF_EMAIL');
if (!staffUser) {
    console.error('❌ User not found: $STAFF_EMAIL');
    console.log('   Create user first in Supabase dashboard');
    process.exit(1);
}

// Create merchant
const { data, error } = await supabase.from('tapmomo_merchants').insert({
    user_id: staffUser.id,
    display_name: '$MERCHANT_NAME',
    network: '$NETWORK',
    merchant_code: '$MERCHANT_CODE',
    secret_key: '$SECRET_KEY',
    active: true
}).select().single();

if (error) {
    console.error('❌ Error creating merchant:', error.message);
    process.exit(1);
}

console.log('✅ Merchant created successfully!');
console.log('');
console.log('📋 Merchant Details:');
console.log('   ID: ' + data.id);
console.log('   Name: ' + data.display_name);
console.log('   Code: ' + data.merchant_code);
console.log('   Network: ' + data.network);
console.log('   Secret: ' + data.secret_key.substring(0, 20) + '...');
console.log('');
console.log('🔐 Save this secret key securely!');
console.log('   It will be used for HMAC signature verification.');
console.log('');
console.log('🧪 Test USSD code:');
if (data.network === 'MTN' || data.network === 'Airtel') {
    console.log('   *182*8*1*' + data.merchant_code + '*1000#');
} else {
    console.log('   *182#');
}
console.log('');
"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Open admin app: http://localhost:3100/admin/tapmomo/merchants"
echo "2. Test 'Get Paid' flow with NFC"
echo "3. Monitor transactions at: http://localhost:3100/admin/tapmomo/transactions"
echo ""
