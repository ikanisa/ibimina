#!/bin/bash
# Script to generate all remaining client mobile app files
# Run from: apps/client-mobile

set -e

echo "🚀 Generating Ibimina Client Mobile App files..."

# Create LoginScreen
cat > src/screens/auth/LoginScreen.tsx << 'EOF'
import React, {useState} from 'react';
import {View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Button} from '../../components/ui/Button';
import {TextInput} from '../../components/ui/TextInput';
import {authService} from '../../services/supabase';
import {useAppStore} from '../../store';
import {colors, spacing, typography} from '../../theme';

export function LoginScreen({navigation}: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const {setUser, setSession} = useAppStore();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const {user, session} = await authService.signIn(email, password);
      setUser(user);
      setSession(session);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome to Ibimina</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
          </View>

          <View style={styles.form}>
            <TextInput
              label="Email"
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              fullWidth
              style={{marginTop: spacing.lg}}
            />

            <Button
              title="Forgot Password?"
              onPress={() => navigation.navigate('ForgotPassword')}
              variant="ghost"
              fullWidth
              style={{marginTop: spacing.md}}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Button
              title="Sign Up"
              onPress={() => navigation.navigate('Register')}
              variant="ghost"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.white},
  keyboardView: {flex: 1},
  scrollContent: {flexGrow: 1, padding: spacing.xl},
  header: {marginTop: spacing.xxl, marginBottom: spacing.xl},
  title: {fontSize: typography.h1, fontWeight: '700', color: colors.gray900, marginBottom: spacing.sm},
  subtitle: {fontSize: typography.body, color: colors.gray500},
  form: {flex: 1},
  error: {color: colors.error, fontSize: typography.bodySmall, marginBottom: spacing.md},
  footer: {flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.xl},
  footerText: {fontSize: typography.body, color: colors.gray600},
});
EOF

# Create RegisterScreen
cat > src/screens/auth/RegisterScreen.tsx << 'EOF'
import React, {useState} from 'react';
import {View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Button} from '../../components/ui/Button';
import {TextInput} from '../../components/ui/TextInput';
import {authService} from '../../services/supabase';
import {colors, spacing, typography} from '../../theme';

export function RegisterScreen({navigation}: any) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!fullName || !email || !phone || !password || !confirmPassword) {
      setError('Please fill all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authService.signUp(email, password, {full_name: fullName, phone});
      alert('Registration successful! Please check your email to verify your account.');
      navigation.navigate('Login');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Ibimina SACCO today</Text>
          </View>

          <View style={styles.form}>
            <TextInput label="Full Name" placeholder="John Doe" value={fullName} onChangeText={setFullName} />
            <TextInput label="Email" placeholder="your@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <TextInput label="Phone Number" placeholder="+250 7XX XXX XXX" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <TextInput label="Password" placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry />
            <TextInput label="Confirm Password" placeholder="••••••••" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button title="Create Account" onPress={handleRegister} loading={loading} fullWidth style={{marginTop: spacing.lg}} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Button title="Sign In" onPress={() => navigation.navigate('Login')} variant="ghost" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.white},
  keyboardView: {flex: 1},
  scrollContent: {flexGrow: 1, padding: spacing.xl},
  header: {marginTop: spacing.xl, marginBottom: spacing.lg},
  title: {fontSize: typography.h1, fontWeight: '700', color: colors.gray900, marginBottom: spacing.sm},
  subtitle: {fontSize: typography.body, color: colors.gray500},
  form: {flex: 1},
  error: {color: colors.error, fontSize: typography.bodySmall, marginBottom: spacing.md},
  footer: {flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.xl},
  footerText: {fontSize: typography.body, color: colors.gray600},
});
EOF

# Create ForgotPasswordScreen
cat > src/screens/auth/ForgotPasswordScreen.tsx << 'EOF'
import React, {useState} from 'react';
import {View, Text, StyleSheet, KeyboardAvoidingView, Platform} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Button} from '../../components/ui/Button';
import {TextInput} from '../../components/ui/TextInput';
import {authService} from '../../services/supabase';
import {colors, spacing, typography} from '../../theme';

export function ForgotPasswordScreen({navigation}: any) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authService.resetPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Check Your Email</Text>
          <Text style={styles.message}>We've sent password reset instructions to {email}</Text>
          <Button title="Back to Login" onPress={() => navigation.navigate('Login')} fullWidth style={{marginTop: spacing.xl}} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <View style={styles.content}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Enter your email to receive reset instructions</Text>

          <TextInput label="Email" placeholder="your@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" style={{marginTop: spacing.xl}} />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button title="Send Reset Link" onPress={handleReset} loading={loading} fullWidth style={{marginTop: spacing.lg}} />
          <Button title="Back to Login" onPress={() => navigation.navigate('Login')} variant="ghost" fullWidth style={{marginTop: spacing.md}} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.white},
  keyboardView: {flex: 1},
  content: {flex: 1, padding: spacing.xl, justifyContent: 'center'},
  title: {fontSize: typography.h1, fontWeight: '700', color: colors.gray900, marginBottom: spacing.sm},
  subtitle: {fontSize: typography.body, color: colors.gray500, marginBottom: spacing.lg},
  message: {fontSize: typography.body, color: colors.gray600, textAlign: 'center', marginTop: spacing.md},
  error: {color: colors.error, fontSize: typography.bodySmall, marginTop: spacing.md},
});
EOF

echo "✅ Auth screens created"
echo "📱 Client Mobile App generation complete!"
echo ""
echo "Remaining steps:"
echo "  1. Create main tab screens (Home, Accounts, Groups, Loans, Profile)"
echo "  2. Create detail screens for transactions, deposits, etc."
echo "  3. Test on Android/iOS devices"
