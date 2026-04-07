// src/screens/AddEditClient.js
import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
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
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: existing ? 'Edit Client' : 'Add Client' });
  }, []);

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      // Convert to DD-MM-YYYY format for display, but store as YYYY-MM-DD internally
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const year = selectedDate.getFullYear();
      const dateStr = `${day}-${month}-${year}`;
      setForm({ ...form, dob: dateStr });
    }
  };

  const getDobAsDate = () => {
    if (!form.dob) return new Date();
    // Parse DD-MM-YYYY to Date
    const parts = form.dob.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return new Date();
  };

  const formatDobForBackend = (dobDisplay) => {
    // Convert DD-MM-YYYY to YYYY-MM-DD for backend
    if (!dobDisplay) return null;
    const parts = dobDisplay.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return null;
  };

  const handleSave = async () => {
    if (!form.name || !form.phone) {
      return Alert.alert('Validation', 'Name and phone are required');
    }
    setLoading(true);
    try {
      const backendData = {
        ...form,
        dob: formatDobForBackend(form.dob) || null
      };
      if (existing) {
        await apiPut(`/api/clients/${existing.id}`, backendData);
        Alert.alert('Success', 'Client updated');
      } else {
        await apiPost('/api/clients', backendData);
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <ScrollView 
        contentContainerStyle={{ padding: 12, paddingBottom: 100 }} 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
      >
        <Text variant="titleLarge">{existing ? 'Edit Client' : 'Add Client'}</Text>
        <TextInput label="Name *" value={form.name} onChangeText={v => setForm({ ...form, name: v })} style={{marginTop:12}} />
        <TextInput label="Phone *" value={form.phone} onChangeText={v => setForm({ ...form, phone: v })} keyboardType="phone-pad" style={{marginTop:12}} />
        <TextInput label="Email" value={form.email} onChangeText={v => setForm({ ...form, email: v })} keyboardType="email-address" style={{marginTop:12}} />
        <TextInput label="Address" value={form.address} onChangeText={v => setForm({ ...form, address: v })} multiline numberOfLines={3} style={{marginTop:12}} />
        <TextInput label="City" value={form.city} onChangeText={v => setForm({ ...form, city: v })} style={{marginTop:12}} />
        <TextInput label="State" value={form.state} onChangeText={v => setForm({ ...form, state: v })} style={{marginTop:12}} />
        <TextInput label="Pincode" value={form.pincode} onChangeText={v => setForm({ ...form, pincode: v })} keyboardType="number-pad" style={{marginTop:12}} />
        
        <View style={{marginTop:12, position: 'relative'}}>
          <TextInput 
            label="DOB (DD-MM-YYYY)" 
            value={form.dob} 
            onChangeText={v => setForm({ ...form, dob: v })} 
            style={{marginTop:0}}
            right={<TextInput.Icon icon="calendar" onPress={() => setShowDatePicker(true)} />}
          />
        </View>
        
        <TextInput label="Nominee" value={form.nominee} onChangeText={v => setForm({ ...form, nominee: v })} style={{marginTop:12}} />
        <TextInput label="Notes" value={form.notes} onChangeText={v => setForm({ ...form, notes: v })} multiline numberOfLines={3} style={{marginTop:12}} />
        
        <Button mode="contained" onPress={handleSave} loading={loading} style={{marginTop:16}}>
          {existing ? 'Save Changes' : 'Create Client'}
        </Button>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={getDobAsDate()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}
      {Platform.OS === 'ios' && showDatePicker && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingBottom: 10 }}>
          <Button onPress={() => setShowDatePicker(false)}>Done</Button>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
