import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30 },
  header: { fontSize: 20, marginBottom: 20, textAlign: 'center' },
  section: { marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between' }
});

type Equipe = {
  nome: string;
};

type Partida = {
  local: string;
  data: string | Date;
};

type Placar = {
  equipeA: number;
  equipeB: number;
};

interface SumulaPDFProps {
  partida: Partida;
  equipes: Equipe[];
  placar: Placar;
}

const SumulaPDF: React.FC<SumulaPDFProps> = ({ partida, equipes, placar }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>SÚMULA OFICIAL</Text>
      
      <View style={styles.section}>
        <Text>Partida: {equipes[0]?.nome} vs {equipes[1]?.nome}</Text>
        <Text>Local: {partida?.local}</Text>
        <Text>Data: {new Date(partida?.data).toLocaleDateString()}</Text>
      </View>

      <View style={styles.section}>
        <Text>Placar Final: {placar.equipeA} x {placar.equipeB}</Text>
      </View>

    </Page>
  </Document>
);

export default SumulaPDF;