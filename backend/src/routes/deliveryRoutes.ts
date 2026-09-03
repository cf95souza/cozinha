import { Router } from 'express';
import { DeliveryController } from '../controllers/DeliveryController';

const router = Router();
const controller = new DeliveryController();

// Endpoint público para receber webhooks (não usa autenticação de usuário normal)
router.post('/webhook/order', controller.receiveOrder.bind(controller));

export default router;
