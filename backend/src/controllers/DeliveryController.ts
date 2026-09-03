import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export class DeliveryController {
  /**
   * Webhook genérico para receber pedidos de Delivery (Ex: iFood).
   * No MVP, ele simula a entrada inserindo uma venda no status ABERTO com type DELIVERY.
   */
  async receiveOrder(req: Request, res: Response) {
    try {
      const { branchId, customerName, items, totalAmount } = req.body;

      if (!branchId || !items || !items.length) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Procura um usuário genérico da filial para vincular a venda
      // (Na prática, o sistema teria um usuário 'SISTEMA_IFOOD' ou 'DELIVERY_API')
      let user = await prisma.user.findFirst({ where: { branchId } });
      if (!user) {
         // Se não achar, pega qualquer usuário master da filial
         user = await prisma.user.findFirst(); 
      }

      if (!user) {
        return res.status(500).json({ error: 'No user available to bind the sale' });
      }

      // Cria a venda
      const sale = await prisma.sale.create({
        data: {
          branchId,
          userId: user.id,
          type: 'DELIVERY',
          status: 'ABERTO',
          customerName: customerName || 'Cliente Delivery',
          totalAmount: Number(totalAmount || 0),
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: Number(item.quantity),
              unitPrice: Number(item.unitPrice),
              total: Number(item.quantity) * Number(item.unitPrice),
              status: 'PEDIDO'
            }))
          }
        },
        include: { items: { include: { product: true } } }
      });

      // No mundo real, avisamos o socket.io aqui para o KDS piscar em tempo real
      // io.to(branchId).emit('new_order', sale);

      return res.status(201).json({ message: 'Order received successfully', sale });
    } catch (error) {
      console.error('Error receiving delivery order:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
