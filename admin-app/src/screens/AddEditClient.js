// src/screens/AddEditClient.js
import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { TextInput, Button, ActivityIndicator, Title } from 'react-native-paper';
import { apiPost, apiPut } from '../services/api';

export default function AddEditClient({ navigation, route }) {
  const existing = route.params?.client || null;
  const [form, setForm] = useState({
    name: existing?.name || '',
    phone: existing?.phone || '',
    email: existing?.email || '',
    address: existing?.address || '',
    city: existing?.city || '',
    state: existing?.state || '',
    pincode: existing?.pincode || '',
    dob: existing?.dob || '',
    nominee: existing?.nominee || '',
    notes: existing?.notes || '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: existing ? 'Edit Client' : 'Add Client' });
  }, []);

  const handleSave = async () => {
    if (!form.name || !form.phone) {
      return Alert.alert('Validation', 'Name and phone are required');
    }
    setLoading(true);
    try {
      if (existing) {
        await apiPut(`/api/clients/${existing.id}`, form);
        Alert.alert('Success', 'Client updated');
      } else {
        await apiPost('/api/clients', form);
        Alert.alert('Success', 'Client created');
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 12 }}>
      <Title>{existing ? 'Edit Client' : 'Add Client'}</Title>
      <TextInput label="Name" value={form.name} onChangeText={v => setForm({ ...form, name: v })} style={{marginTop:12}} />
      <TextInput label="Phone" value={form.phone} onChangeText={v => setForm({ ...form, phone: v })} keyboardType="phone-pad" style={{marginTop:12}} />
      <TextInput label="Email" value={form.email} onChangeText={v => setForm({ ...form, email: v })} keyboardType="email-address" style={{marginTop:12}} />
      <TextInput label="Address" value={form.address} onChangeText={v => setForm({ ...form, address: v })} multiline style={{marginTop:12}} />
      <TextInput label="City" value={form.city} onChangeText={v => setForm({ ...form, city: v })} style={{marginTop:12}} />
      <TextInput label="State" value={form.state} onChangeText={v => setForm({ ...form, state: v })} style={{marginTop:12}} />
      <TextInput label="Pincode" value={form.pincode} onChangeText={v => setForm({ ...form, pincode: v })} keyboardType="number-pad" style={{marginTop:12}} />
      <TextInput label="DOB (YYYY-MM-DD)" value={form.dob} onChangeText={v => setForm({ ...form, dob: v })} style={{marginTop:12}} />
      <TextInput label="Nominee" value={form.nominee} onChangeText={v => setForm({ ...form, nominee: v })} style={{marginTop:12}} />
      <TextInput label="Notes" value={form.notes} onChangeText={v => setForm({ ...form, notes: v })} multiline style={{marginTop:12}} />
      <Button mode="contained" onPress={handleSave} loading={loading} style={{marginTop:16}}>
        {existing ? 'Save Changes' : 'Create Client'}
      </Button>
    </ScrollView>
  );
}
