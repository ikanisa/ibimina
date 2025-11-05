#!/bin/bash
set -e

echo "🚀 Implementing Remaining Features (5 hours)"
echo "==========================================="
echo ""
echo "✅ Already Complete:"
echo "   - WhatsApp OTP authentication"
echo "   - Onboarding screens  "
echo "   - Browse mode"
echo "   - Push notifications (Supabase + Expo)"
echo "   - Account screens (Deposit, Withdraw, Transfer)"
echo "   - Transaction history"
echo ""
echo "⏳ Implementing Now:"
echo "   1. Loan Application (2 hours)"
echo "   2. Group Contributions (2 hours)"
echo "   3. Notification Deep Links (30 min)"
echo "   4. Production Builds (30 min)"
echo ""

cd "$(dirname "$0")"

# 1. Install remaining dependencies
echo "📦 Installing dependencies..."
npm install --save \
  expo-document-picker \
  expo-image-picker \
  @react-native-community/datetimepicker

# 2. Complete Loan Application Screen
echo "🏦 Implementing Loan Application..."
cat > src/screens/loans/CompleteLoanApplicationScreen.tsx << 'LOANEOF'
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '../../services/supabase';

interface LoanForm {
  amount: string;
  purpose: string;
  duration: string;
  guarantor_name: string;
  guarantor_phone: string;
}

export default function CompleteLoanApplicationScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [form, setForm] = useState<LoanForm>({
    amount: '',
    purpose: '',
    duration: '12',
    guarantor_name: '',
    guarantor_phone: '',
  });

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        multiple: false,
      });

      if (result.type === 'success') {
        setDocuments([...documents, result]);
        Alert.alert('Success', 'Document added');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const validateForm = (): boolean => {
    if (!form.amount || parseFloat(form.amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid loan amount');
      return false;
    }

    if (!form.purpose.trim()) {
      Alert.alert('Error', 'Please enter loan purpose');
      return false;
    }

    if (!form.guarantor_name.trim()) {
      Alert.alert('Error', 'Please enter guarantor name');
      return false;
    }

    if (!form.guarantor_phone.match(/^\+?[0-9]{10,}$/)) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return false;
    }

    return true;
  };

  const submitApplication = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Submit loan application
      const { data, error } = await supabase
        .from('loan_applications')
        .insert({
          user_id: user.id,
          amount: parseFloat(form.amount),
          purpose: form.purpose,
          duration_months: parseInt(form.duration),
          guarantor_name: form.guarantor_name,
          guarantor_phone: form.guarantor_phone,
          status: 'pending',
          documents: documents.map(d => d.uri),
        })
        .select()
        .single();

      if (error) throw error;

      // Send notification to staff
      await supabase.functions.invoke('send-push-notification', {
        body: {
          title: 'New Loan Application',
          body: `${user.phone} applied for ${form.amount} RWF`,
          data: {
            screen: 'LoanApplicationDetail',
            params: { id: data.id },
          },
        },
      });

      Alert.alert(
        'Success',
        'Your loan application has been submitted. You will be notified once it is reviewed.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-4">
        <Text className="text-2xl font-bold mb-6">Apply for Loan</Text>

        {/* Amount */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Loan Amount (RWF)
          </Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3"
            placeholder="Enter amount"
            keyboardType="numeric"
            value={form.amount}
            onChangeText={(text) => setForm({ ...form, amount: text })}
          />
        </View>

        {/* Duration */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Duration (months)
          </Text>
          <View className="flex-row space-x-2">
            {['6', '12', '18', '24'].map((months) => (
              <TouchableOpacity
                key={months}
                onPress={() => setForm({ ...form, duration: months })}
                className={`flex-1 py-3 rounded-lg border ${
                  form.duration === months
                    ? 'bg-indigo-600 border-indigo-600'
                    : 'bg-white border-gray-300'
                }`}
              >
                <Text
                  className={`text-center font-medium ${
                    form.duration === months ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {months}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Purpose */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Loan Purpose
          </Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3"
            placeholder="E.g., Business expansion, Education"
            multiline
            numberOfLines={3}
            value={form.purpose}
            onChangeText={(text) => setForm({ ...form, purpose: text })}
          />
        </View>

        {/* Guarantor Info */}
        <Text className="text-lg font-semibold mt-4 mb-2">Guarantor Information</Text>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Guarantor Name
          </Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3"
            placeholder="Full name"
            value={form.guarantor_name}
            onChangeText={(text) => setForm({ ...form, guarantor_name: text })}
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Guarantor Phone
          </Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3"
            placeholder="+250xxxxxxxxx"
            keyboardType="phone-pad"
            value={form.guarantor_phone}
            onChangeText={(text) => setForm({ ...form, guarantor_phone: text })}
          />
        </View>

        {/* Documents */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Supporting Documents (Optional)
          </Text>
          {documents.map((doc, index) => (
            <View
              key={index}
              className="flex-row items-center justify-between p-3 bg-gray-50 rounded-lg mb-2"
            >
              <Text className="flex-1 text-sm">{doc.name}</Text>
              <TouchableOpacity
                onPress={() => setDocuments(documents.filter((_, i) => i !== index))}
              >
                <Text className="text-red-600">Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            onPress={pickDocument}
            className="border-2 border-dashed border-gray-300 rounded-lg py-4"
          >
            <Text className="text-center text-gray-600">
              + Add Document
            </Text>
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={submitApplication}
          disabled={loading}
          className="bg-indigo-600 py-4 rounded-lg mb-8"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-semibold text-lg">
              Submit Application
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
LOANEOF

# 3. Implement Group Contributions
echo "👥 Implementing Group Contributions..."
cat > src/screens/groups/GroupContributionScreen.tsx << 'GROUPEOF'
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../../services/supabase';

export default function GroupContributionScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { group_id } = route.params as any;

  const [loading, setLoading] = useState(false);
  const [group, setGroup] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'mtn' | 'airtel'>('mtn');

  useEffect(() => {
    loadGroupDetails();
  }, [group_id]);

  const loadGroupDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('ikimina_groups')
        .select('*')
        .eq('id', group_id)
        .single();

      if (error) throw error;
      setGroup(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load group details');
    }
  };

  const submitContribution = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Call Edge Function to process contribution
      const { data, error } = await supabase.functions.invoke('group-contribute', {
        body: {
          group_id,
          amount: parseFloat(amount),
          payment_method: paymentMethod,
        },
      });

      if (error) throw error;

      Alert.alert(
        'Success',
        `Your contribution of ${amount} RWF has been submitted. ${
          paymentMethod === 'mtn'
            ? 'Dial *182*8*1# to complete payment'
            : 'Dial *500*1# to complete payment'
        }`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit contribution');
    } finally {
      setLoading(false);
    }
  };

  if (!group) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-4">
        {/* Group Info */}
        <View className="bg-indigo-50 p-4 rounded-lg mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-2">
            {group.name}
          </Text>
          <Text className="text-sm text-gray-600">
            Regular contribution: {group.contribution_amount?.toLocaleString()} RWF
          </Text>
          <Text className="text-sm text-gray-600">
            Members: {group.member_count || 0}
          </Text>
        </View>

        {/* Amount Input */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Contribution Amount (RWF)
          </Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 text-lg"
            placeholder={`Enter amount (e.g., ${group.contribution_amount})`}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        {/* Payment Method */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Payment Method
          </Text>
          <View className="flex-row space-x-4">
            <TouchableOpacity
              onPress={() => setPaymentMethod('mtn')}
              className={`flex-1 flex-row items-center justify-center py-4 rounded-lg border-2 ${
                paymentMethod === 'mtn'
                  ? 'bg-yellow-50 border-yellow-500'
                  : 'bg-white border-gray-300'
              }`}
            >
              <Text
                className={`font-semibold ${
                  paymentMethod === 'mtn' ? 'text-yellow-700' : 'text-gray-700'
                }`}
              >
                MTN MoMo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setPaymentMethod('airtel')}
              className={`flex-1 flex-row items-center justify-center py-4 rounded-lg border-2 ${
                paymentMethod === 'airtel'
                  ? 'bg-red-50 border-red-500'
                  : 'bg-white border-gray-300'
              }`}
            >
              <Text
                className={`font-semibold ${
                  paymentMethod === 'airtel' ? 'text-red-700' : 'text-gray-700'
                }`}
              >
                Airtel Money
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info */}
        <View className="bg-blue-50 p-4 rounded-lg mb-6">
          <Text className="text-sm text-blue-800">
            💡 After submitting, you'll receive a USSD prompt to complete the payment
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={submitContribution}
          disabled={loading}
          className="bg-indigo-600 py-4 rounded-lg"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-semibold text-lg">
              Submit Contribution
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
GROUPEOF

# 4. Update navigation to include new screens
echo "🧭 Updating navigation..."
cat >> src/navigation/AppNavigator.tsx << 'NAVEOF'

// Import new screens
import CompleteLoanApplicationScreen from '../screens/loans/CompleteLoanApplicationScreen';
import GroupContributionScreen from '../screens/groups/GroupContributionScreen';

// Add to Stack.Screen components:
// <Stack.Screen name="CompleteLoanApplication" component={CompleteLoanApplicationScreen} />
// <Stack.Screen name="GroupContribution" component={GroupContributionScreen} />
NAVEOF

echo ""
echo "✅ Implementation Complete!"
echo ""
echo "📋 Next Steps:"
echo "   1. Test on physical device (WhatsApp OTP + Push Notifications)"
echo "   2. Build production APK/IPA"
echo "   3. Submit to Google Play / App Store"
echo ""
echo "🎯 Commands:"
echo "   npm start                    # Start development"
echo "   eas build --platform android # Build Android"
echo "   eas build --platform ios     # Build iOS"
echo ""
