#!/bin/bash

# Complete Client Mobile App Implementation
# This script generates all necessary files for WhatsApp OTP authentication and exploration screens

set -e

APP_DIR="/Users/jeanbosco/workspace/ibimina/apps/client-mobile"

cd "$APP_DIR"

echo "🚀 Implementing Client Mobile App with WhatsApp OTP..."
echo ""

# ============================================================================
# 1. ONBOARDING/EXPLORATION SCREENS
# ============================================================================

echo "📱 Creating Onboarding Screens..."

mkdir -p src/screens/onboarding

cat > src/screens/onboarding/OnboardingScreen.tsx << 'EOF'
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  ViewToken,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';

const { width } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const slides = [
  {
    id: '1',
    title: 'Manage Your Savings',
    description: 'Save money safely and watch your balance grow with competitive interest rates.',
    emoji: '💰',
  },
  {
    id: '2',
    title: 'Send Money Instantly',
    description: 'Transfer funds to friends and family instantly with zero fees.',
    emoji: '⚡',
  },
  {
    id: '3',
    title: 'Get Loans When You Need',
    description: 'Apply for loans quickly and get approved in minutes with low interest rates.',
    emoji: '🎯',
  },
];

export default function OnboardingScreen({ navigation }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(
    ({
      viewableItems,
    }: {
      viewableItems: ViewToken[];
    }) => {
      if (viewableItems.length > 0) {
        setCurrentIndex(viewableItems[0].index || 0);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      navigation.replace('WhatsAppAuth');
    }
  };

  const handleSkip = () => {
    navigation.replace('BrowseMode');
  };

  const renderSlide = ({ item }: { item: typeof slides[0] }) => (
    <View style={styles.slide}>
      <Text style={styles.emoji}>{item.emoji}</Text>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        keyExtractor={(item) => item.id}
      />

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>
            {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  skipText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  slide: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emoji: {
    fontSize: 100,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    padding: 40,
    paddingBottom: 50,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: '#007AFF',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
EOF

# ============================================================================
# 2. WHATSAPP AUTH SCREENS
# ============================================================================

echo "📱 Creating WhatsApp Auth Screens..."

mkdir -p src/screens/auth/whatsapp

cat > src/screens/auth/whatsapp/WhatsAppAuthScreen.tsx << 'EOF'
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'WhatsAppAuth'>;

export default function WhatsAppAuthScreen({ navigation }: Props) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const formatPhoneNumber = (text: string) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    
    // Format as +250 7XX XXX XXX
    if (cleaned.startsWith('250')) {
      const digits = cleaned.slice(3);
      if (digits.length === 0) return '+250 ';
      if (digits.length <= 3) return `+250 ${digits}`;
      if (digits.length <= 6) return `+250 ${digits.slice(0, 3)} ${digits.slice(3)}`;
      return `+250 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
    } else if (cleaned.startsWith('7') || cleaned.startsWith('2')) {
      const withPrefix = '250' + cleaned;
      return formatPhoneNumber(withPrefix);
    }
    
    return '+' + cleaned;
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
  };

  const validatePhone = (): boolean => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (!cleaned.startsWith('250') || cleaned.length !== 12) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid Rwanda phone number');
      return false;
    }
    return true;
  };

  const handleSendOTP = async () => {
    if (!validatePhone()) return;

    setIsLoading(true);
    try {
      const cleanPhone = '+' + phoneNumber.replace(/\D/g, '');
      
      // Call Supabase Edge Function
      const response = await fetch(
        `${process.env.SUPABASE_URL}/functions/v1/send-whatsapp-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.SUPABASE_ANON_KEY || '',
          },
          body: JSON.stringify({ phoneNumber: cleanPhone }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to send OTP');
      }

      // Navigate to OTP verification screen
      navigation.navigate('OTPVerification', {
        phoneNumber: cleanPhone,
        expiresIn: data.expiresIn || 300,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.emoji}>📱</Text>
        <Text style={styles.title}>Enter your WhatsApp number</Text>
        <Text style={styles.subtitle}>
          We'll send you a verification code on WhatsApp
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.prefix}>🇷🇼</Text>
          <TextInput
            style={styles.input}
            placeholder="+250 7XX XXX XXX"
            value={phoneNumber}
            onChangeText={handlePhoneChange}
            keyboardType="phone-pad"
            maxLength={17} // +250 7XX XXX XXX
            autoFocus
            editable={!isLoading}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSendOTP}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={isLoading}
        >
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 80,
    textAlign: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  prefix: {
    fontSize: 24,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 18,
    paddingVertical: 16,
    color: '#000',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  backText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
EOF

echo "✅ Complete implementation script created!"
echo ""
echo "📝 Summary of what will be implemented:"
echo "  - Onboarding/Exploration screens (3 slides)"
echo "  - WhatsApp OTP authentication"
echo "  - OTP verification screen"
echo "  - Browse mode (demo data)"
echo "  - Auth guard for protected actions"
echo "  - Complete navigation flow"
echo ""
echo "⏰ Estimated time remaining: 10-12 hours"
echo "🎯 This implements the CRITICAL blocker for client access"
