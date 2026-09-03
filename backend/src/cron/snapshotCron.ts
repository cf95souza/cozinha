import cron from 'node-cron';
import { prisma } from '../lib/prisma';

export function setupCronJobs() {
  // Executa todos os dias à meia-noite (00:00)
  cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Iniciando snapshot diário de CMV...');
    try {
      const branches = await prisma.branch.findMany({
        where: { status: 'ATIVO' }
      });

      for (const branch of branches) {
        // Obter todo o estoque da filial atual
        const balances = await prisma.stockBalance.findMany({
          where: { branchId: branch.id },
          include: { product: true }
        });

        // Calcular valor total
        const totalValue = balances.reduce((sum, bal) => {
          const cost = bal.product.costPrice || 0;
          return sum + (bal.quantity * cost);
        }, 0);

        // Salvar snapshot
        await prisma.stockSnapshot.create({
          data: {
            companyId: branch.companyId,
            branchId: branch.id,
            totalValue: totalValue,
            date: new Date()
          }
        });
      }

      console.log('[CRON] Snapshot diário concluído com sucesso.');
    } catch (error) {
      console.error('[CRON] Erro ao executar snapshot diário:', error);
    }
  });
}
