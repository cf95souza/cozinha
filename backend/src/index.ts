import express from 'express';
import cors from 'cors';
import { prisma } from './lib/prisma';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import companyRoutes from './routes/companyRoutes';
import branchRoutes from './routes/branchRoutes';
import categoryRoutes from './routes/categoryRoutes';
import locationRoutes from './routes/locationRoutes';
import supplierRoutes from './routes/supplierRoutes';
import productRoutes from './routes/productRoutes';
import stockRoutes from './routes/stockRoutes';
import receivingRoutes from './routes/receivingRoutes';
import lotRoutes from './routes/lotRoutes';
import lossRoutes from './routes/lossRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import labelRoutes from './routes/labelRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import reportRoutes from './routes/reportRoutes';
import auditRoutes from './routes/auditRoutes';
import searchRoutes from './routes/searchRoutes';
import recipeRoutes from './routes/recipeRoutes';
import productionRoutes from './routes/productionRoutes';
import suggestionRoutes from './routes/suggestionRoutes';
import saleRoutes from './routes/saleRoutes';
import financeRoutes from './routes/financeRoutes';
import deliveryRoutes from './routes/deliveryRoutes';
import purchasingRoutes from './routes/purchasingRoutes';
import quotationRoutes from './routes/quotationRoutes';

import tableRoutes from './routes/tableRoutes';
import kdsRoutes from './routes/kdsRoutes';
import { auditMiddleware } from './middlewares/auditMiddleware';
import { setupCronJobs } from './cron/snapshotCron';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(auditMiddleware);

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/receivings', receivingRoutes);
app.use('/api/lots', lotRoutes);
app.use('/api/losses', lossRoutes);
app.use('/api/inventories', inventoryRoutes);
app.use('/api/labels', labelRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/productions', productionRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/purchasing', purchasingRoutes);
app.use('/api/quotations', quotationRoutes);

app.use('/api/tables', tableRoutes);
app.use('/api/kds', kdsRoutes);

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Iniciar Cron Jobs
  setupCronJobs();
});
