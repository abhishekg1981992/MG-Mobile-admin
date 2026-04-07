import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { ApiError, checkSystemAvailability, login, setToken } from '../services/api';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');

  const getFriendlyMessage = (error) => {
    if (error instanceof ApiError) {
      if (error.code === 'SERVICE_UNAVAILABLE') {
        return 'System under maintenance. Please check after some time.';
      }
      if (error.code === 'TIMEOUT') {
        return 'System under maintenance. Please check after some time.';
      }
      if (error.code === 'NETWORK') {
        return 'System under maintenance. Please check after some time.';
      }
      if (error.status === 401 || error.status === 404) {
        return 'Invalid username or password.';
      }
      return error.message || 'Login failed. Please try again.';
    }

    return error?.message || 'Login failed due to an unexpected error.';
  };

  const doLogin = async () => {
    const trimmedUsername = username.trim();

    if (!trimmedUsername || !password) {
      setErrorText('Please enter both username and password.');
      return;
    }

    setErrorText('');
    setLoading(true);
    try {
      await checkSystemAvailability();
      const res = await login(trimmedUsername, password);
      if (res.token) {
        await setToken(res.token);
        navigation.replace('Dashboard');
      } else {
        setErrorText(res.error || 'Invalid credentials');
      }
    } catch (e) {
      setErrorText(getFriendlyMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Admin Login</Text>
        <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="Username" placeholderTextColor="#999" autoCapitalize="none" autoCorrect={false} />
        <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry placeholderTextColor="#999" color="#000" autoCapitalize="none" />
        {!!errorText && <Text style={styles.errorText}>{errorText}</Text>}
        <Button title={loading ? 'Logging in...' : 'Login'} onPress={doLogin} />
        {loading && <Text style={styles.statusText}>Loading...</Text>}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 22, marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 6, color: '#000' },
  errorText: { color: '#b42318', marginBottom: 12, textAlign: 'center' },
  statusText: { color: '#667085', marginTop: 10, textAlign: 'center' },
});
