import { Asset } from 'expo-asset';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Button, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import PdfRendererView from 'react-native-pdf-renderer';

const PDFS = {
  sample: require('./assets/sample.pdf'),
  passwordProtected: require('./assets/password-protected.pdf'),
};

type PdfKey = keyof typeof PDFS;

async function resolveLocalUri(key: PdfKey): Promise<string> {
  const asset = Asset.fromModule(PDFS[key]);
  await asset.downloadAsync();
  if (!asset.localUri) throw new Error(`No local URI for ${key}`);
  return asset.localUri;
}

export default function App() {
  const [source, setSource] = useState<string>();
  const [status, setStatus] = useState('Pick a PDF');

  const open = async (key: PdfKey) => {
    setStatus(`Loading ${key}...`);
    setSource(await resolveLocalUri(key));
    setStatus(`Rendering ${key}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.buttons}>
        <Button title="Open sample.pdf" onPress={() => open('sample')} />
        <Button
          title="Open password-protected.pdf"
          onPress={() => open('passwordProtected')}
        />
      </View>
      <Text style={styles.status}>{status}</Text>
      {source ? (
        <PdfRendererView
          key={source}
          source={source}
          style={styles.pdf}
          onError={() => setStatus('onError fired')}
        />
      ) : null}
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 48 },
  buttons: { gap: 12, paddingHorizontal: 16 },
  status: { padding: 16, textAlign: 'center' },
  pdf: { flex: 1, backgroundColor: '#eee' },
});
