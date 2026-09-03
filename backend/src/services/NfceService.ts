import { prisma } from '../lib/prisma';
import crypto from 'crypto';

interface NfcePayload {
  saleId: string;
  branchId: string;
  totalAmount: number;
  items: any[];
}

export class NfceService {
  /**
   * Simula a emissão de uma NFC-e via API de terceiros (ex: Focus NFe, Webmania)
   * Na vida real, isso usaria o nfceCscId e nfceCertBase64 da filial para assinar.
   */
  async emitNfce(payload: NfcePayload) {
    try {
      const branch = await prisma.branch.findUnique({ where: { id: payload.branchId } });
      
      if (!branch) {
        throw new Error('Filial não encontrada');
      }

      // Validação de negócio (ex: precisamos de ambiente e token configurado)
      if (!branch.nfceEnvironment) {
        throw new Error('Ambiente NFC-e não configurado para esta filial.');
      }

      // Simulando delay de comunicação com a SEFAZ
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Em um cenário real, aqui seria feita uma requisição HTTP POST para a API escolhida
      // enviando payload.items, CFOP, NCM, impostos.
      
      // Simulando sucesso 90% das vezes
      const isSuccess = Math.random() > 0.1;

      if (isSuccess) {
        // Gera chave de acesso fake (44 digitos)
        const fakeKey = Array.from({ length: 44 }, () => Math.floor(Math.random() * 10)).join('');
        const protocol = `1${Math.floor(Math.random() * 99999999999999)}`;
        const pdfUrl = `https://homologacao.sefaz.gov.br/nfce/consulta?chave=${fakeKey}`;

        await prisma.sale.update({
          where: { id: payload.saleId },
          data: {
            nfceStatus: 'AUTORIZADO',
            nfceKey: fakeKey,
            nfceProtocol: protocol,
            nfceUrl: pdfUrl,
            nfceMessage: 'Autorizado o uso da NFC-e'
          }
        });

        return {
          success: true,
          key: fakeKey,
          protocol,
          url: pdfUrl
        };
      } else {
        // Simulando falha de schema ou SEFAZ indisponível
        const errorMessage = 'Rejeição: Erro na Chave de Acesso - Dígito Verificador incorreto (Simulado)';
        
        await prisma.sale.update({
          where: { id: payload.saleId },
          data: {
            nfceStatus: 'REJEITADO',
            nfceMessage: errorMessage
          }
        });

        return {
          success: false,
          error: errorMessage
        };
      }

    } catch (error: any) {
      console.error('Erro no NfceService:', error);
      
      await prisma.sale.update({
        where: { id: payload.saleId },
        data: {
          nfceStatus: 'REJEITADO',
          nfceMessage: error.message || 'Falha interna ao comunicar com o serviço de emissão.'
        }
      });

      return {
        success: false,
        error: error.message
      };
    }
  }
}
