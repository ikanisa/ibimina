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
