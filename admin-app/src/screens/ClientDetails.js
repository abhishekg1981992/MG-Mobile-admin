// src/screens/ClientDetails.js
import React, { useEffect, useState } from 'react';
import { ScrollView, View, Alert } from 'react-native';
import { Text, Card, Button, List, ActivityIndicator } from 'react-native-paper';
import { apiGet, uploadClientDocument } from '../services/api';

export default function ClientDetails({ route, navigation }) {
  const id = route.params?.id;
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchClient = async () => {
    setLoading(true);
    try {
      const res = await apiGet(`/api/clients/${id}`);
      setClient(res);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not fetch client');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClient();
  }, [id]);

  const doUpload = async () => {
    setUploading(true);
    try {
      const res = await uploadClientDocument(id);
      if (res && res.success) {
        Alert.alert('Uploaded', 'File uploaded successfully');
        fetchClient();
      } else if (res && res.error) {
        Alert.alert('Error', res.error);
      } else if (res.cancelled) {
        // nothing
      } else {
        // fallback message
        Alert.alert('Upload result', JSON.stringify(res));
      }
    } catch (e) {
      Alert.alert('Upload failed', e.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <ActivityIndicator style={{flex:1}} />;

  if (!client) return <Text variant="bodyMedium">No client found</Text>;

  return (
    <ScrollView style={{ padding: 12 }}>
      <Card style={{ marginBottom: 12 }}>
        <Card.Content>
          <Text variant="titleLarge">{client.name}</Text>
          {(client.phone || client.email) ? (
            <Text variant="bodyMedium">{[client.phone, client.email].filter(Boolean).join(' • ')}</Text>
          ) : null}
          {client.address ? <Text variant="bodyMedium" style={{ marginTop: 8 }}>{client.address}</Text> : null}
        </Card.Content>
        <Card.Actions>
          <Button onPress={() => navigation.navigate('AddEditClient', { client })}>Edit</Button>
          <Button onPress={doUpload} loading={uploading}>Upload Document</Button>
        </Card.Actions>
      </Card>

      <Text variant="titleLarge">Policies</Text>
      {client.policies?.length ? client.policies.map(p => {
        const desc = [p.policy_type, p.premium_amount != null ? `₹${p.premium_amount}` : null].filter(Boolean).join(' • ');
        return (
          <List.Item
            key={String(p.id)}
            title={[p.policy_number, p.provider].filter(Boolean).join(' — ')}
            description={desc || undefined}
          />
        );
      }) : <Text variant="bodyMedium">No policies</Text>}

      <Text variant="titleLarge" style={{ marginTop: 12 }}>Documents</Text>
      {client.documents?.length ? client.documents.map(doc => (
        <List.Item key={String(doc.id)} title={doc.filename} description={doc.path} left={props => <List.Icon {...props} icon="file" />} />
      )) : <Text variant="bodyMedium">No documents</Text>}
    </ScrollView>
  );
}
