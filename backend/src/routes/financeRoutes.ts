import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { getCostCenters, createCostCenter, getInvoiceTypes, createInvoiceType, getInvoiceOrigins, createInvoiceOrigin } from '../controllers/financeParamController';
import { getInvoices, createInvoice } from '../controllers/invoiceController';
import { branchGuard } from '../middlewares/branchGuard';

const router = Router();
router.use(authenticate);

// Params
router.get('/cost-centers', getCostCenters);
router.post('/cost-centers', createCostCenter);

router.get('/invoice-types', getInvoiceTypes);
router.post('/invoice-types', createInvoiceType);

router.get('/invoice-origins', getInvoiceOrigins);
router.post('/invoice-origins', createInvoiceOrigin);

// Invoices
router.get('/invoices', getInvoices);
router.post('/invoices', branchGuard, createInvoice);

export default router;
