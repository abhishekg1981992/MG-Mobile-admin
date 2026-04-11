import React, { useState, useEffect } from 'react';
import { ScrollView, Alert, View, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Menu } from 'react-native-paper';
import { apiPost, apiPut, apiGet, extractArray } from '../services/api';

const POLICY_TYPES = ['Life', 'Health', 'Motor', 'Home', 'Travel', 'Business', 'Other'];
const FREQUENCIES = ['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly', 'One-Time'];
const STATUSES = ['active', 'lapsed', 'cancelled', 'matured'];

export default function AddEditPolicy({ navigation, route }) {
  const existing = route.params?.policy || null;

  const convertDateToDDMMYYYY = (dateStr) => {
    if (!dateStr) return '';
    // If already in DD-MM-YYYY format, return as-is
    if (dateStr.includes('-') && dateStr.split('-')[0].length === 2) return dateStr;
    // If in YYYY-MM-DD format, convert to DD-MM-YYYY
    if (dateStr.includes('-') && dateStr.split('-')[0].length === 4) {
      const parts = dateStr.split('-');
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  const convertDateToYYYYMMDD = (dateStr) => {
    if (!dateStr) return '';
    // If in DD-MM-YYYY format, convert to YYYY-MM-DD
    if (dateStr.includes('-') && dateStr.split('-')[0].length === 2) {
      const parts = dateStr.split('-');
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  const [clients, setClients] = useState([]);
  const [clientQuery, setClientQuery] = useState(existing?.client_name || '');
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [typeMenuVisible, setTypeMenuVisible] = useState(false);
  const [freqMenuVisible, setFreqMenuVisible] = useState(false);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);

  const [form, setForm] = useState({
    client_id: existing?.client_id || '',
    provider: existing?.provider || '',
    policy_number: existing?.policy_number || '',
    policy_type: existing?.policy_type || '',
    premium_amount: existing?.premium_amount?.toString() || '',
    sum_assured: existing?.sum_assured?.toString() || '',
    start_date: existing?.start_date ? convertDateToDDMMYYYY(existing.start_date.substring(0, 10)) : '',
    end_date: existing?.end_date ? convertDateToDDMMYYYY(existing.end_date.substring(0, 10)) : '',
    frequency: existing?.frequency || '',
    status: existing?.status || 'active',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: existing ? 'Edit Policy' : 'Add Policy' });
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await apiGet('/api/clients');
      const list = extractArray(res);
      setClients(list);
      if (existing?.client_id && !clientQuery) {
        const c = list.find(c => c.id === existing.client_id);
        if (c) setClientQuery(c.name);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredClients = clients.filter(c =>
    clientQuery.length > 0 && (c.name || '').toLowerCase().includes(clientQuery.toLowerCase())
  );

  const handleClientSelect = (c) => {
    setForm({ ...form, client_id: c.id });
    setClientQuery(c.name);
    setShowClientSuggestions(false);
  };

  const handleClientChange = (text) => {
    setClientQuery(text);
    setShowClientSuggestions(true);
    if (!text) setForm({ ...form, client_id: '' });
  };

  const handleSave = async () => {
    if (!form.client_id || !form.policy_number || !form.provider) {
      return Alert.alert('Validation', 'Client, provider, and policy number are required');
    }
    const payload = {
      ...form,
      start_date: convertDateToYYYYMMDD(form.start_date),
      end_date: convertDateToYYYYMMDD(form.end_date),
      premium_amount: parseFloat(form.premium_amount) || 0,
      sum_assured: parseFloat(form.sum_assured) || 0,
    };
    setLoading(true);
    try {
      if (existing) {
        await apiPut(`/api/policies/${existing.id}`, payload);
        Alert.alert('Success', 'Policy updated');
      } else {
        await apiPost('/api/policies', payload);
        Alert.alert('Success', 'Policy created');
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
      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
        <Text variant="titleLarge">{existing ? 'Edit Policy' : 'Add Policy'}</Text>

      <View style={{ marginTop: 12, zIndex: 10 }}>
        <TextInput
          label="Client *"
          value={clientQuery}
          onChangeText={handleClientChange}
          onFocus={() => setShowClientSuggestions(true)}
          right={form.client_id ? <TextInput.Icon icon="close" onPress={() => { setClientQuery(''); setForm({ ...form, client_id: '' }); }} /> : null}
        />
        {showClientSuggestions && filteredClients.length > 0 && (
          <View style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 4, maxHeight: 180 }}>
            <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
              {filteredClients.slice(0, 20).map(c => (
                <TouchableOpacity key={String(c.id)} onPress={() => handleClientSelect(c)} style={{ padding: 12, borderBottomWidth: 0.5, borderColor: '#eee' }}>
                  <Text>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      <TextInput label="Provider *" value={form.provider} onChangeText={v => setForm({ ...form, provider: v })} style={{ marginTop: 12 }} />
      <TextInput label="Policy Number *" value={form.policy_number} onChangeText={v => setForm({ ...form, policy_number: v })} style={{ marginTop: 12 }} />

      <Menu
        visible={typeMenuVisible}
        onDismiss={() => setTypeMenuVisible(false)}
        anchor={
          <TextInput
            label="Policy Type"
            value={form.policy_type}
            style={{ marginTop: 12 }}
            editable={false}
            right={<TextInput.Icon icon="chevron-down" onPress={() => setTypeMenuVisible(true)} />}
            onPressIn={() => setTypeMenuVisible(true)}
          />
        }
      >
        {POLICY_TYPES.map(t => (
          <Menu.Item key={t} title={t} onPress={() => { setForm({ ...form, policy_type: t }); setTypeMenuVisible(false); }} />
        ))}
      </Menu>

      <TextInput label="Premium Amount" value={form.premium_amount} onChangeText={v => setForm({ ...form, premium_amount: v })} keyboardType="numeric" style={{ marginTop: 12 }} />
      <TextInput label="Sum Assured" value={form.sum_assured} onChangeText={v => setForm({ ...form, sum_assured: v })} keyboardType="numeric" style={{ marginTop: 12 }} />
      <TextInput label="Start Date (DD-MM-YYYY)" value={form.start_date} onChangeText={v => setForm({ ...form, start_date: v })} style={{ marginTop: 12 }} />
      <TextInput label="End Date (DD-MM-YYYY)" value={form.end_date} onChangeText={v => setForm({ ...form, end_date: v })} style={{ marginTop: 12 }} />

      <Menu
        visible={freqMenuVisible}
        onDismiss={() => setFreqMenuVisible(false)}
        anchor={
          <TextInput
            label="Frequency"
            value={form.frequency}
            style={{ marginTop: 12 }}
            editable={false}
            right={<TextInput.Icon icon="chevron-down" onPress={() => setFreqMenuVisible(true)} />}
            onPressIn={() => setFreqMenuVisible(true)}
          />
        }
      >
        {FREQUENCIES.map(f => (
          <Menu.Item key={f} title={f} onPress={() => { setForm({ ...form, frequency: f }); setFreqMenuVisible(false); }} />
        ))}
      </Menu>

      <Menu
        visible={statusMenuVisible}
        onDismiss={() => setStatusMenuVisible(false)}
        anchor={
          <TextInput
            label="Status"
            value={form.status}
            style={{ marginTop: 12 }}
            editable={false}
            right={<TextInput.Icon icon="chevron-down" onPress={() => setStatusMenuVisible(true)} />}
            onPressIn={() => setStatusMenuVisible(true)}
          />
        }
      >
        {STATUSES.map(s => (
          <Menu.Item key={s} title={s} onPress={() => { setForm({ ...form, status: s }); setStatusMenuVisible(false); }} />
        ))}
      </Menu>

      <Button mode="contained" onPress={handleSave} loading={loading} style={{ marginTop: 20 }}>
        {existing ? 'Save Changes' : 'Create Policy'}
      </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
