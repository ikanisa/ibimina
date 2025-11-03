import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../../theme';
import { whatsappAuthService } from '../../services/whatsappAuthService';

type WhatsAppAuthScreenNavigationProp = NativeStackNavigationProp<any>;

export const WhatsAppAuthScreen: React.FC = () => {
  const navigation = useNavigation<WhatsAppAuthScreenNavigationProp>();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatPhoneNumber = (text: string) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    
    // Remove leading 250 if present
    const withoutCountryCode = cleaned.startsWith('250') ? cleaned.slice(3) : cleaned;
    
    // Limit to 9 digits
    const limited = withoutCountryCode.slice(0, 9);
    
    // Format as XXX XXX XXX
    if (limited.length <= 3) return limited;
    if (limited.length <= 6) return `${limited.slice(0, 3)} ${limited.slice(3)}`;
    return `${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6)}`;
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const cleaned = phone.replace(/\s/g, '');
    // Rwanda phone numbers: 9 digits starting with 7
    return /^7\d{8}$/.test(cleaned);
  };

  const handleContinue = async () => {
    const cleaned = phoneNumber.replace(/\s/g, '');
    
    if (!validatePhoneNumber(cleaned)) {
      setError('Please enter a valid Rwanda phone number starting with 7');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const fullPhone = `+250${cleaned}`;
      const result = await whatsappAuthService.sendOTP(fullPhone);
      
      if (result.success) {
        navigation.navigate('OTPVerification', { phoneNumber: fullPhone });
      } else {
        setError(result.error || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (text: string) => {
    setError('');
    setPhoneNumber(formatPhoneNumber(text));
  };

  const handleBackToBrowse = () => {
    navigation.navigate('BrowseMode');
  };

  const cleanedPhone = phoneNumber.replace(/\s/g, '');
  const isValid = validatePhoneNumber(cleanedPhone);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackToBrowse} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.gray[900]} />
          </TouchableOpacity>
        </View>

        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="logo-whatsapp" size={48} color="#25D366" />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Sign in with WhatsApp</Text>
        <Text style={styles.subtitle}>
          Enter your WhatsApp number to receive a verification code
        </Text>

        {/* Phone Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <View style={styles.prefixContainer}>
              <Text style={styles.prefixText}>+250</Text>
            </View>
            <TextInput
              style={[styles.input, error ? styles.inputError : null]}
              value={phoneNumber}
              onChangeText={handleTextChange}
              placeholder="7XX XXX XXX"
              placeholderTextColor={theme.colors.gray[400]}
              keyboardType="phone-pad"
              maxLength={11} // 9 digits + 2 spaces
              autoFocus
              editable={!loading}
            />
          </View>
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color={theme.colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle-outline" size={20} color={theme.colors.gray[500]} />
          <Text style={styles.infoText}>
            You'll receive a 6-digit code on WhatsApp to verify your number
          </Text>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[styles.button, (!isValid || loading) && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!isValid || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.buttonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>

        {/* Terms */}
        <Text style={styles.terms}>
          By continuing, you agree to our{' '}
          <Text style={styles.link}>Terms of Service</Text> and{' '}
          <Text style={styles.link}>Privacy Policy</Text>
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
  },
  header: {
    paddingVertical: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#25D36620',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.gray[900],
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.gray[600],
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  inputWrapper: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: theme.colors.gray[300],
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  prefixContainer: {
    backgroundColor: theme.colors.gray[100],
    paddingHorizontal: theme.spacing.lg,
    justifyContent: 'center',
    borderRightWidth: 1.5,
    borderRightColor: theme.colors.gray[300],
  },
  prefixText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.gray[900],
  },
  input: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    fontSize: 18,
    color: theme.colors.gray[900],
    fontWeight: '500',
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.error,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.gray[50],
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.gray[600],
    lineHeight: 20,
  },
  button: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.gray[300],
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  terms: {
    fontSize: 13,
    color: theme.colors.gray[500],
    textAlign: 'center',
    lineHeight: 18,
  },
  link: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
});
