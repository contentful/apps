import { Router } from 'express';
import { getProductList, getProductPreview } from '../controllers';

const router = Router();

router.get('/product-list', getProductList);
router.get('/product-preview', getProductPreview);

export default router;
