import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { login, setToken } from '../services/api';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const doLogin = async () => {
    setLoading(true);
    try {
      const res = await login(username, password);
      if (res.token) {
        await setToken(res.token);
        navigation.replace('Dashboard');
      } else {
        Alert.alert('Login failed', res.error || 'Invalid credentials');
      }
    } catch (e) {
      Alert.alert('Error', e.message);
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
        <Button title={loading ? 'Logging in...' : 'Login'} onPress={doLogin} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 22, marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 6, color: '#000' }
});
