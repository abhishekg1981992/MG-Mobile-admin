import React, { useEffect, useState } from 'react';
import { ScrollView, Alert } from 'react-native';
import { Text, Card, Button, List, ActivityIndicator } from 'react-native-paper';
import { apiGet, apiDelete, formatDisplayDate, uploadPolicyDocument } from '../services/api';

export default function PolicyDetails({ route, navigation }) {
  const id = route.params?.id;
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

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

  const doUpload = async () => {
    setUploading(true);
    try {
      const res = await uploadPolicyDocument(id);
      if (res && res.id) {
        Alert.alert('Uploaded', 'File uploaded successfully');
        fetchPolicy();
      } else if (res && res.error) {
        Alert.alert('Error', res.error);
      } else if (res && res.cancelled) {
        // nothing
      } else {
        Alert.alert('Upload result', JSON.stringify(res));
      }
    } catch (e) {
      Alert.alert('Upload failed', e.message);
    } finally {
      setUploading(false);
    }
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
          <Text variant="bodyMedium" style={{ marginTop: 8 }}>Start: {formatDisplayDate(policy.start_date)}</Text>
          <Text variant="bodyMedium">End: {formatDisplayDate(policy.end_date)}</Text>
        </Card.Content>
        <Card.Actions>
          <Button onPress={() => navigation.navigate('AddEditPolicy', { policy })}>Edit</Button>
          <Button mode="contained" buttonColor="#d32f2f" textColor="#fff" onPress={handleDelete}>Delete</Button>
        </Card.Actions>
      </Card>

      <Text variant="titleLarge" style={{ marginTop: 4 }}>Documents</Text>
      <Button mode="outlined" onPress={doUpload} loading={uploading} style={{ marginVertical: 8, alignSelf: 'flex-start' }}>
        Upload Document
      </Button>
      {policy.documents?.length ? policy.documents.map(doc => (
        <List.Item key={String(doc.id)} title={doc.filename} description={doc.path} left={props => <List.Icon {...props} icon="file-document" />} />
      )) : <Text variant="bodyMedium" style={{ color: '#888' }}>No documents</Text>}
    </ScrollView>
  );
}
