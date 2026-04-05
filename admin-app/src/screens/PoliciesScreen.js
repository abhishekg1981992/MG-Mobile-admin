import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, RefreshControl } from 'react-native';
import { Searchbar, Card, Text, FAB, Button, ActivityIndicator } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiGet } from '../services/api';

export default function PoliciesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/api/policies/all-with-details');
      const data = res?.policies || res || [];
      setPolicies(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPolicies();
    setRefreshing(false);
  };

  const filtered = policies.filter(p => {
    const search = q.toLowerCase();
    return (
      (p.client_name || '').toLowerCase().includes(search) ||
      (p.provider || '').toLowerCase().includes(search) ||
      (p.policy_number || '').toLowerCase().includes(search)
    );
  });

  const renderItem = ({ item }) => (
    <Card style={{ marginVertical: 6 }} onPress={() => navigation.navigate('PolicyDetails', { id: item.id })}>
      <Card.Content>
        <Text variant="titleMedium">{item.client_name || 'Unknown Client'}</Text>
        <Text variant="bodyMedium">{item.provider} • {item.policy_number}</Text>
        <Text variant="bodyMedium">{item.policy_type} • ₹{item.premium_amount}</Text>
      </Card.Content>
      <Card.Actions>
        <Button onPress={() => navigation.navigate('PolicyDetails', { id: item.id })}>View</Button>
        <Button onPress={() => navigation.navigate('AddEditPolicy', { policy: item })}>Edit</Button>
      </Card.Actions>
    </Card>
  );

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <Searchbar placeholder="Search by client, provider, policy #" value={q} onChangeText={setQ} />
      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} animating />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => String(i.id)}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}
      <FAB
        icon="plus"
        label="Add Policy"
        style={{ position: 'absolute', right: 16, bottom: 16 + insets.bottom }}
        onPress={() => navigation.navigate('AddEditPolicy')}
      />
    </View>
  );
}
