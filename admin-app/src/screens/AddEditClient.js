// src/screens/AddEditClient.js
import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { apiPost, apiPut } from '../services/api';

// Convert any date value (ISO timestamp, YYYY-MM-DD, or DD-MM-YYYY) to DD-MM-YYYY
function toDisplayDate(val) {
  if (!val) return '';
  const s = String(val);
  // Already DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(s)) return s;
  // ISO timestamp or YYYY-MM-DD
  const d = new Date(s);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export default function AddEditClient({ navigation, route }) {
  const existing = route.params?.client || null;
  const scrollRef = useRef(null);
  const [form, setForm] = useState({
    name: existing?.name || '',
    phone: existing?.phone || '',
    email: existing?.email || '',
    address: existing?.address || '',
    city: existing?.city || '',
    state: existing?.state || '',
    pincode: existing?.pincode || '',
    dob: toDisplayDate(existing?.dob),
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
    if (parts.length === 3 && parts[0].length === 2) {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    // Fallback: try native parse (ISO / YYYY-MM-DD)
    const d = new Date(form.dob);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const formatDobForBackend = (dobDisplay) => {
    // Convert DD-MM-YYYY to YYYY-MM-DD for backend
    if (!dobDisplay) return null;
    const parts = dobDisplay.split('-');
    if (parts.length === 3 && parts[0].length === 2) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    // Might already be YYYY-MM-DD or ISO
    const d = new Date(dobDisplay);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView 
        ref={scrollRef}
        contentContainerStyle={{ padding: 12, paddingBottom: 150 }} 
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
            onFocus={() => scrollRef.current?.scrollTo({ y: 450, animated: true })}
            right={<TextInput.Icon icon="calendar" onPress={() => setShowDatePicker(true)} />}
          />
        </View>
        
        <TextInput label="Nominee" value={form.nominee} onChangeText={v => setForm({ ...form, nominee: v })} style={{marginTop:12}} onFocus={() => scrollRef.current?.scrollTo({ y: 520, animated: true })} />
        <TextInput label="Notes" value={form.notes} onChangeText={v => setForm({ ...form, notes: v })} multiline numberOfLines={3} style={{marginTop:12}} onFocus={() => scrollRef.current?.scrollTo({ y: 580, animated: true })} />
        
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
