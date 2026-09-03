import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { getCostCenters, createCostCenter, getInvoiceTypes, createInvoiceType, getInvoiceOrigins, createInvoiceOrigin } from '../controllers/financeParamController';
import { getInvoices, createInvoice } from '../controllers/invoiceController';
import { branchGuard } from '../middlewares/branchGuard';
import { FinanceCategoryController } from '../controllers/FinanceCategoryController';
import { PayableController } from '../controllers/PayableController';
import { ReceivableController } from '../controllers/ReceivableController';
import { CashController } from '../controllers/CashController';
import { StatementController } from '../controllers/StatementController';
import { DreController } from '../controllers/DreController';

const financeCat = new FinanceCategoryController();
const payable = new PayableController();
const receivable = new ReceivableController();
const cash = new CashController();
const statement = new StatementController();
const dre = new DreController();

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

// Financial Categories (Plano de Contas)
router.get('/categories', financeCat.list);
router.post('/categories', financeCat.create);
router.put('/categories/:id', financeCat.update);
router.delete('/categories/:id', financeCat.delete);

// Payables
router.get('/payables', payable.list);
router.post('/payables', payable.create);
router.post('/payables/:id/pay', payable.pay);
router.delete('/payables/:id', payable.delete);

// Receivables
router.get('/receivables', receivable.list);
router.post('/receivables', receivable.create);
router.post('/receivables/:id/receive', receivable.receive);
router.delete('/receivables/:id', receivable.delete);

// Cash Register & Shifts
router.get('/cash-registers', cash.listRegisters);
router.post('/cash-registers', cash.createRegister);
router.post('/cash-shifts/open', cash.openShift);
router.post('/cash-shifts/:id/close', cash.closeShift);
router.post('/cash-movements', cash.createMovement);

// Statement & DRE
router.get('/statement', statement.getStatement);
router.get('/dre', dre.getDre);

export default router;
