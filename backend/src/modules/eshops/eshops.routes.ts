import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { upload } from '../../config/upload';
import {
  listProductCategories,
  createStore, getMyStore, listStores, getStore, updateStore,
  uploadStoreImage, deleteStoreImage,
  createProduct, updateProduct, deleteProduct, listProducts, getProduct,
  uploadProductImage, deleteProductImage,
  getCart, addToCart, updateCartItem, removeFromCart,
  checkout, getMyOrders, getStoreOrders, getOrder, updateOrderStatus,
} from './eshops.controller';

const router = Router();

// Product categories
router.get('/product-categories', listProductCategories);

// Stores
router.get('/stores', listStores);
router.post('/stores', authenticate, createStore);
router.get('/stores/my', authenticate, getMyStore);
router.get('/stores/:id', getStore);
router.put('/stores/:id', authenticate, updateStore);
router.post('/stores/:id/images', authenticate, upload.single('image'), uploadStoreImage);
router.delete('/stores/:id/images', authenticate, deleteStoreImage);

// Products
router.get('/products', listProducts);
router.get('/products/:id', getProduct);
router.post('/stores/:storeId/products', authenticate, createProduct);
router.put('/products/:id', authenticate, updateProduct);
router.delete('/products/:id', authenticate, deleteProduct);
router.post('/products/:id/images', authenticate, upload.single('image'), uploadProductImage);
router.delete('/products/:id/images', authenticate, deleteProductImage);

// Cart
router.get('/cart', authenticate, getCart);
router.post('/cart', authenticate, addToCart);
router.put('/cart/items/:id', authenticate, updateCartItem);
router.delete('/cart/items/:id', authenticate, removeFromCart);

// Orders
router.post('/orders', authenticate, checkout);
router.get('/orders', authenticate, getMyOrders);
router.get('/orders/store', authenticate, getStoreOrders);
router.get('/orders/:id', authenticate, getOrder);
router.put('/orders/:id/status', authenticate, updateOrderStatus);

export default router;
