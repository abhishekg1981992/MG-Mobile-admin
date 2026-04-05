import React, { useEffect, useState } from 'react';
import { ScrollView, Alert } from 'react-native';
import { Text, Card, Button, ActivityIndicator } from 'react-native-paper';
import { apiGet, apiDelete } from '../services/api';

export default function PolicyDetails({ route, navigation }) {
  const id = route.params?.id;
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPolicy = async () => {
    setLoading(true);
    try {
      const res = await apiGet(`/api/policies/${id}`);
      setPolicy(res);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not fetch policy');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicy();
  }, [id]);

  const handleDelete = () => {
    Alert.alert('Delete Policy', 'Are you sure you want to delete this policy?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiDelete(`/api/policies/${id}`);
            Alert.alert('Deleted', 'Policy deleted successfully');
            navigation.goBack();
          } catch (e) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} animating />;
  if (!policy) return <Text variant="bodyMedium" style={{ padding: 16 }}>Policy not found</Text>;

  return (
    <ScrollView style={{ padding: 12 }}>
      <Card style={{ marginBottom: 12 }}>
        <Card.Content>
          <Text variant="titleLarge">{policy.policy_number}</Text>
          <Text variant="bodyMedium" style={{ fontWeight: 'bold', marginTop: 4 }}>Provider: {policy.provider}</Text>
          <Text variant="bodyMedium">Type: {policy.policy_type}</Text>
          <Text variant="bodyMedium">Premium: ₹{policy.premium_amount}</Text>
          <Text variant="bodyMedium">Sum Assured: ₹{policy.sum_assured}</Text>
          <Text variant="bodyMedium">Frequency: {policy.frequency}</Text>
          <Text variant="bodyMedium">Status: {policy.status}</Text>
          <Text variant="bodyMedium" style={{ marginTop: 8 }}>Start: {policy.start_date ? new Date(policy.start_date).toLocaleDateString() : '—'}</Text>
          <Text variant="bodyMedium">End: {policy.end_date ? new Date(policy.end_date).toLocaleDateString() : '—'}</Text>
        </Card.Content>
        <Card.Actions>
          <Button onPress={() => navigation.navigate('AddEditPolicy', { policy })}>Edit</Button>
          <Button textColor="red" onPress={handleDelete}>Delete</Button>
        </Card.Actions>
      </Card>
    </ScrollView>
  );
}
