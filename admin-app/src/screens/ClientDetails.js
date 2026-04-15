// src/screens/ClientDetails.js
import React, { useState, useCallback } from 'react';
import { ScrollView, View, Alert } from 'react-native';
import { Text, Card, Button, List, ActivityIndicator, Divider } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { apiGet, apiDelete, uploadClientDocument, formatDisplayDate } from '../services/api';

export default function ClientDetails({ route, navigation }) {
  const id = route.params?.id;
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState(null);

  const fetchClient = useCallback(async () => {
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
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      fetchClient();
    }, [fetchClient])
  );

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
        Alert.alert('Upload result', JSON.stringify(res));
      }
    } catch (e) {
      Alert.alert('Upload failed', e.message);
    } finally {
      setUploading(false);
    }
  };

  const doDeleteDoc = async (docId) => {
    Alert.alert('Delete Document', 'Are you sure you want to delete this document?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeletingDocId(docId);
          try {
            await apiDelete(`/api/clients/doc/${docId}`);
            Alert.alert('Success', 'Document deleted successfully');
            fetchClient();
          } catch (e) {
            Alert.alert('Error', e.message || 'Failed to delete document');
          } finally {
            setDeletingDocId(null);
          }
        },
      },
    ]);
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
          {client.dob ? <Text variant="bodyMedium" style={{ marginTop: 4 }}>DOB: {formatDisplayDate(client.dob)}</Text> : null}
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
            onPress={() => navigation.navigate('PolicyDetails', { id: p.id })}
          />
        );
      }) : <Text variant="bodyMedium">No policies</Text>}

      <Text variant="titleLarge" style={{ marginTop: 12 }}>Client Documents</Text>
      {client.documents?.length ? client.documents.map(doc => (
        <List.Item
          key={String(doc.id)}
          title={doc.original_name || doc.filename}
          left={props => <List.Icon {...props} icon="file" />}
          right={props => (
            <List.Icon {...props} icon={deletingDocId === doc.id ? "loading" : "delete"}
              color={deletingDocId === doc.id ? '#999' : '#d32f2f'}
            />
          )}
          onPress={() => doDeleteDoc(doc.id)}
          disabled={deletingDocId === doc.id}
        />
      )) : <Text variant="bodyMedium">No client documents</Text>}

      <Text variant="titleLarge" style={{ marginTop: 12 }}>Policy Documents</Text>
      {client.policies?.length ? client.policies.map(p => (
        <View key={`policy-docs-${p.id}`} style={{ marginBottom: 8 }}>
          <Text variant="titleSmall" style={{ marginTop: 4, color: '#555' }}>
            {p.policy_number} — {p.provider}
          </Text>
          {p.documents?.length ? p.documents.map(doc => (
            <List.Item key={String(doc.id)} title={doc.original_name || doc.filename} left={props => <List.Icon {...props} icon="file-document" />} />
          )) : <Text variant="bodySmall" style={{ marginLeft: 16, color: '#999' }}>No documents</Text>}
        </View>
      )) : <Text variant="bodyMedium">No policies</Text>}
    </ScrollView>
  );
}
