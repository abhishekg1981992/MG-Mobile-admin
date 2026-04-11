import React, { useEffect, useState } from 'react';
import { View, FlatList, RefreshControl } from 'react-native';
import { Card, Text, Button, ActivityIndicator, SegmentedButtons } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiGet, extractArray, formatDisplayDate, parseDate } from '../services/api';

function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

function isThisWeek(date) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return date >= start && date < end;
}

function isThisMonth(date) {
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

export default function RenewalsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [policies, setPolicies] = useState([]);
  const [filter, setFilter] = useState('month');

  const fetchRenewals = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/api/renewals/due');
      setPolicies(extractArray(res));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRenewals();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRenewals();
    setRefreshing(false);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filtered = policies.filter(p => {
    if (!p.end_date) return false;
    const endDate = parseDate(p.end_date);
    if (!endDate) return false;
    endDate.setHours(0, 0, 0, 0);
    if (filter === 'today') return isSameDay(endDate, today);
    if (filter === 'week') return isThisWeek(endDate);
    if (filter === 'month') return isThisMonth(endDate);
    return false;
  });

  const renderItem = ({ item }) => (
    <Card style={{ marginVertical: 6 }} onPress={() => navigation.navigate('PolicyDetails', { id: item.id })}>
      <Card.Content>
        <Text variant="titleMedium">{item.client_name || 'Unknown Client'}</Text>
        <Text variant="bodyMedium">{item.provider} • {item.policy_number}</Text>
        <Text variant="bodySmall" style={{ color: '#d32f2f', marginTop: 4 }}>
          Due: {formatDisplayDate(item.end_date)}
        </Text>
      </Card.Content>
    </Card>
  );

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <SegmentedButtons
        value={filter}
        onValueChange={setFilter}
        buttons={[
          { value: 'today', label: 'Today' },
          { value: 'week', label: 'This Week' },
          { value: 'month', label: 'This Month' },
        ]}
        style={{ marginBottom: 12 }}
      />
      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} animating />
      ) : filtered.length === 0 ? (
        <Text variant="bodyMedium" style={{ textAlign: 'center', marginTop: 24, color: '#888' }}>
          No renewals due {filter === 'today' ? 'today' : filter === 'week' ? 'this week' : 'this month'}
        </Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => String(i.id)}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: 16 + insets.bottom }}
        />
      )}
    </View>
  );
}
