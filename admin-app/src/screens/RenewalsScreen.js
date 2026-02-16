import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { apiGet } from '../services/api';

export default function RenewalsScreen() {
  const [loading, setLoading] = useState(true);
  const [renewals, setRenewals] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiGet('/api/renewals');
        setRenewals(res || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <ActivityIndicator style={{flex:1}} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Renewals</Text>
      <FlatList data={renewals} keyExtractor={i => String(i.id)} renderItem={({item}) => (
        <View style={styles.card}>
          <Text style={styles.name}>{item.policy_number}</Text>
          <Text>{item.renewal_date} • {item.status}</Text>
        </View>
      )} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  title: { fontSize: 20, marginBottom: 12 },
  card: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#eee', marginBottom: 8 },
  name: { fontWeight: 'bold' }
});
