// src/screens/ClientsScreen.js
import React, { useEffect, useState } from 'react';
import { View, FlatList, RefreshControl } from 'react-native';
import { Searchbar, Card, Text, FAB, Button, ActivityIndicator } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiGet, extractArray } from '../services/api';

export default function ClientsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/api/clients');
      setClients(extractArray(res));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchClients();
    setRefreshing(false);
  };

  const filtered = clients.filter(c =>
    (c.name || '').toLowerCase().includes(q.toLowerCase()) ||
    (c.phone || '').includes(q) ||
    (c.email || '').toLowerCase().includes(q.toLowerCase())
  );

  const renderItem = ({ item }) => {
    const details = [item.phone, item.email].filter(Boolean).join(' \u2022 ');
    return (
      <Card style={{ marginVertical: 6 }} onPress={() => navigation.navigate('ClientDetails', { id: item.id })}>
        <Card.Content>
          <Text variant="titleMedium">{item.name}</Text>
          {details ? <Text variant="bodyMedium">{details}</Text> : null}
        </Card.Content>
        <Card.Actions>
          <Button onPress={() => navigation.navigate('ClientDetails', { id: item.id })}>View</Button>
          <Button onPress={() => navigation.navigate('AddEditClient', { client: item })}>Edit</Button>
        </Card.Actions>
      </Card>
    );
  };

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <Searchbar placeholder="Search by name, phone, email" value={q} onChangeText={setQ} />
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
        label="Add Client"
        style={{ position: 'absolute', right: 16, bottom: 16 + insets.bottom }}
        onPress={() => navigation.navigate('AddEditClient')}
      />
    </View>
  );
}
