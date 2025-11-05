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
