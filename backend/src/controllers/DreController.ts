import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';

export class DreController {
  async getDre(req: AuthRequest, res: Response) {
    try {
      const branchId = req.query.branchId as string || req.user?.branchId;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Período obrigatório (startDate, endDate)' });
      }

      const whereClause: any = {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        },
        ...(branchId ? { branchId } : {}),
      };

      const transactions = await prisma.financialTransaction.findMany({
        where: whereClause,
        include: { category: true }
      });

      // Classificação básica do DRE
      let receitaBruta = 0;
      let despesasOperacionais = 0;
      let impostos = 0; // Exemplo
      
      const categoryMap = new Map<string, number>();

      transactions.forEach((t: any) => {
        const catType = t.category.type;
        const catName = t.category.name;
        
        categoryMap.set(catName, (categoryMap.get(catName) || 0) + t.amount);

        if (catType === 'RECEITA' && t.type === 'ENTRADA') {
          receitaBruta += t.amount;
        } else if (catType === 'DESPESA' && t.type === 'SAIDA') {
          despesasOperacionais += t.amount;
        } else if (catType === 'CUSTO' && t.type === 'SAIDA') {
          // CMV financeiro direto, ou impostos se a categoria for "Imposto"
          if (catName.toLowerCase().includes('imposto')) {
            impostos += t.amount;
          }
        }
      });

      // Obter CMV do Estoque via StockSnapshot se existir, senão usa as transações de CMV
      let cmv = 0;
      // CMV = Estoque Inicial + Compras - Estoque Final
      // Buscando o snapshot mais próximo da startDate e endDate
      const snapshots = await prisma.stockSnapshot.findMany({
        where: {
          ...(branchId ? { branchId } : {}),
          date: { gte: new Date(startDate), lte: new Date(endDate) }
        },
        orderBy: { date: 'asc' }
      });

      if (snapshots.length >= 2) {
        const estoqueInicial = snapshots[0].totalValue;
        const estoqueFinal = snapshots[snapshots.length - 1].totalValue;
        
        // Compras = Transações do tipo CUSTO ligadas a fornecedores
        let compras = 0;
        transactions.forEach((t: any) => {
           if (t.category.type === 'CUSTO' && t.type === 'SAIDA' && !t.category.name.toLowerCase().includes('imposto')) {
             compras += t.amount;
           }
        });

        cmv = estoqueInicial + compras - estoqueFinal;
      } else {
        // Fallback: usar direto as saídas de custo
        transactions.forEach((t: any) => {
          if (t.category.type === 'CUSTO' && t.type === 'SAIDA' && !t.category.name.toLowerCase().includes('imposto')) {
            cmv += t.amount;
          }
       });
      }

      const lucroBruto = receitaBruta - impostos - cmv;
      const lucroLiquido = lucroBruto - despesasOperacionais;
      const margemLiquida = receitaBruta > 0 ? (lucroLiquido / receitaBruta) * 100 : 0;

      res.json({
        receitaBruta,
        impostos,
        cmv,
        lucroBruto,
        despesasOperacionais,
        lucroLiquido,
        margemLiquida,
        detalhes: Array.from(categoryMap.entries()).map(([name, total]) => ({ name, total }))
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao gerar DRE' });
    }
  }
}
