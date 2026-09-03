import express from 'express';
import financeRoutes from './src/routes/financeRoutes';

console.log('Finance routes stack length:', (financeRoutes as any).stack?.length);
(financeRoutes as any).stack?.forEach((layer: any) => {
  if (layer.route) {
    console.log(Object.keys(layer.route.methods).join(',').toUpperCase() + ' ' + layer.route.path);
  }
});
process.exit(0);
