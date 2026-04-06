import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { apiGet } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DashboardScreen({ navigation }) {
  const logout = async () => {
    await AsyncStorage.removeItem('token');
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>Manthan Guru</Text>
      <Text style={styles.title}>Admin Dashboard</Text>
      <View style={styles.row}>
        <Button title="Clients" onPress={() => navigation.navigate('Clients')} />
        <Button title="Policies" onPress={() => navigation.navigate('Policies')} />
      </View>
      <View style={styles.row}>
        <Button title="Renewals" onPress={() => navigation.navigate('Renewals')} />
        <Button title="Claims" onPress={() => navigation.navigate('Claims')} />
      </View>
      <View style={{marginTop:20}}>
        <Button title="Logout" onPress={logout} color="#c00" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  brand: { fontSize: 30, fontWeight: '700', color: '#0b6b3a', textAlign: 'center', marginTop: 10, marginBottom: 6 },
  title: { fontSize: 22, marginBottom: 20, textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 6 }
});
