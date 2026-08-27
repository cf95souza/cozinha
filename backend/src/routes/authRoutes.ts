import { Router } from 'express';
import { login, seed, refresh, forgotPassword, changePassword, resetPassword } from '../controllers/authController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.post('/login', login);
router.post('/refresh', refresh);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/change-password', authenticate, changePassword);

router.post('/seed', seed);

router.get('/me', authenticate, (req, res) => {
  // @ts-ignore
  res.json({ user: req.user });
});

export default router;
