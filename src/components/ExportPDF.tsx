'use client';

import { PDFDownloadLink } from '@react-pdf/renderer';
import SumulaPDF from './../app/(protect)/dashboard/sumula/SumulaPDF';

type ExportPDFProps = {
  partida: any;
  equipes: any;
  placar: any;
  cartoes: any;
  observacoes: any;
  selectedPartida: any;
};

const ExportPDF = ({ partida, equipes, placar, cartoes, observacoes, selectedPartida }: ExportPDFProps) => {
  return (
    <PDFDownloadLink 
      document={<SumulaPDF 
        partida={partida}
        equipes={equipes}
        placar={placar}
        cartoes={cartoes}
        observacoes={observacoes}
      />} 
      fileName="sumula.pdf"
    >
      {({ loading }) => (
        <button 
          className="bg-green-500 text-white px-4 py-2 rounded"
          disabled={loading || !selectedPartida}
        >
          {loading ? 'Gerando PDF...' : 'Exportar PDF'}
        </button>
      )}
    </PDFDownloadLink>
  );
};

export default ExportPDF;