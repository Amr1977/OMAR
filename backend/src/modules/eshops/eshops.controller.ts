import { Response } from 'express';
import { prisma } from '../../config/database';
import { AuthRequest } from '../../middleware/auth';
import { notifyNewOrder, notifyOrderStatusChanged } from '../../services/notification.service';

const p = (req: AuthRequest) => req.params as { id: string; storeId: string };

// ─── Product Categories ───────────────────────────────────────────────
export const listProductCategories = async (_req: AuthRequest, res: Response) => {
  try {
    const categories = await prisma.productCategory.findMany({ orderBy: { nameAr: 'asc' } });
    return res.json(categories);
  } catch (error) {
    console.error('List product categories error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to list categories' });
  }
};

// ─── Stores ───────────────────────────────────────────────────────────
export const createStore = async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.store.findUnique({ where: { ownerId: req.userId! } });
    if (existing) {
      return res.status(400).json({ error: 'CONFLICT', messageAr: 'لديك متجر بالفعل', messageEn: 'You already have a store' });
    }
    const { name, description, slug, logo, banner, latitude, longitude, address, city, governorate, phone } = req.body;
    if (!name || !description || !slug) {
      return res.status(400).json({ error: 'VALIDATION', message: 'name, description, and slug are required' });
    }
    const store = await prisma.store.create({
      data: { ownerId: req.userId!, name, description, slug, logo, banner, latitude: latitude ? parseFloat(latitude) : null, longitude: longitude ? parseFloat(longitude) : null, address, city, governorate, phone },
    });
    return res.status(201).json(store);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'CONFLICT', messageAr: 'الرابط مستخدم بالفعل', messageEn: 'Slug already taken' });
    }
    console.error('Create store error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to create store' });
  }
};

export const getMyStore = async (req: AuthRequest, res: Response) => {
  try {
    const store = await prisma.store.findUnique({
      where: { ownerId: req.userId! },
      include: { products: { include: { category: true }, orderBy: { createdAt: 'desc' } }, _count: { select: { products: true, orders: true } } },
    });
    if (!store) return res.status(404).json({ error: 'NOT_FOUND', message: 'No store found' });
    return res.json(store);
  } catch (error) {
    console.error('Get my store error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to get store' });
  }
};

export const listStores = async (req: AuthRequest, res: Response) => {
  try {
    const { search, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, parseInt(limit as string));
    const where: any = { status: 'ACTIVE' };
    if (search) where.name = { contains: search as string, mode: 'insensitive' };
    const [stores, total] = await Promise.all([
      prisma.store.findMany({
        where, skip: (pageNum - 1) * limitNum, take: limitNum, orderBy: { createdAt: 'desc' },
        include: { _count: { select: { products: true } } },
      }),
      prisma.store.count({ where }),
    ]);
    return res.json({ stores, total, page: pageNum, limit: limitNum });
  } catch (error) {
    console.error('List stores error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to list stores' });
  }
};

export const getStore = async (req: AuthRequest, res: Response) => {
  try {
    const store = await prisma.store.findUnique({
      where: { id: p(req).id },
      include: { products: { where: { status: 'ACTIVE' }, include: { category: true }, orderBy: { createdAt: 'desc' } }, _count: { select: { products: true } } },
    });
    if (!store || (store.status !== 'ACTIVE' && store.ownerId !== req.userId)) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Store not found' });
    }
    return res.json(store);
  } catch (error) {
    console.error('Get store error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to get store' });
  }
};

export const getStoreBySlug = async (req: AuthRequest, res: Response) => {
  try {
    const store = await prisma.store.findUnique({
      where: { slug: p(req).id },
      include: { products: { where: { status: 'ACTIVE' }, include: { category: true }, orderBy: { createdAt: 'desc' } }, _count: { select: { products: true } } },
    });
    if (!store || store.status !== 'ACTIVE') {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Store not found' });
    }
    return res.json(store);
  } catch (error) {
    console.error('Get store by slug error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to get store' });
  }
};

export const updateStore = async (req: AuthRequest, res: Response) => {
  try {
    const store = await prisma.store.findUnique({ where: { id: p(req).id } });
    if (!store || store.ownerId !== req.userId) return res.status(403).json({ error: 'FORBIDDEN', message: 'Not your store' });
    const { name, description, slug, logo, banner, latitude, longitude, address, city, governorate, phone, status } = req.body;
    const updated = await prisma.store.update({
      where: { id: p(req).id },
      data: { ...(name !== undefined && { name }), ...(description !== undefined && { description }), ...(slug !== undefined && { slug }), ...(logo !== undefined && { logo }), ...(banner !== undefined && { banner }), ...(latitude !== undefined && { latitude: latitude ? parseFloat(latitude) : null }), ...(longitude !== undefined && { longitude: longitude ? parseFloat(longitude) : null }), ...(address !== undefined && { address }), ...(city !== undefined && { city }), ...(governorate !== undefined && { governorate }), ...(phone !== undefined && { phone }), ...(status !== undefined && { status }) },
    });
    return res.json(updated);
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'CONFLICT', messageAr: 'الرابط مستخدم بالفعل', messageEn: 'Slug already taken' });
    console.error('Update store error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to update store' });
  }
};

export const uploadStoreImage = async (req: AuthRequest, res: Response) => {
  try {
    const store = await prisma.store.findUnique({ where: { id: p(req).id } });
    if (!store || store.ownerId !== req.userId) return res.status(403).json({ error: 'FORBIDDEN', message: 'Not your store' });
    if (!req.file) return res.status(400).json({ error: 'VALIDATION', message: 'No file provided' });
    if (store.images.length >= 10) return res.status(400).json({ error: 'LIMIT', messageAr: 'الحد الأقصى 10 صور', messageEn: 'Maximum 10 images' });
    const dataUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const updated = await prisma.store.update({ where: { id: p(req).id }, data: { images: { push: dataUrl } } });
    return res.json({ images: updated.images, added: dataUrl });
  } catch (error) {
    console.error('Upload store image error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to upload image' });
  }
};

export const deleteStoreImage = async (req: AuthRequest, res: Response) => {
  try {
    const store = await prisma.store.findUnique({ where: { id: p(req).id } });
    if (!store || store.ownerId !== req.userId) return res.status(403).json({ error: 'FORBIDDEN', message: 'Not your store' });
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'VALIDATION', message: 'URL is required' });
    const filtered = store.images.filter((img) => img !== url);
    if (filtered.length === store.images.length) return res.status(404).json({ error: 'NOT_FOUND', message: 'Image not found' });
    const updated = await prisma.store.update({ where: { id: p(req).id }, data: { images: filtered } });
    return res.json({ images: updated.images });
  } catch (error) {
    console.error('Delete store image error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to delete image' });
  }
};

// ─── Products ─────────────────────────────────────────────────────────
export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const store = await prisma.store.findUnique({ where: { id: p(req).storeId } });
    if (!store || store.ownerId !== req.userId) return res.status(403).json({ error: 'FORBIDDEN', message: 'Not your store' });
    const { categoryId, name, description, price, currency, images, stock } = req.body;
    if (!categoryId || !name || !description || price === undefined) {
      return res.status(400).json({ error: 'VALIDATION', message: 'categoryId, name, description, and price are required' });
    }
    const product = await prisma.product.create({
      data: { storeId: p(req).storeId, categoryId, name, description, price: parseFloat(price), currency: currency || 'EGP', images: images || [], stock: stock ? parseInt(stock) : 0 },
    });
    return res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to create product' });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: p(req).id }, include: { store: true } });
    if (!product || product.store.ownerId !== req.userId) return res.status(403).json({ error: 'FORBIDDEN', message: 'Not your product' });
    const { categoryId, name, description, price, currency, images, stock, status } = req.body;
    const updated = await prisma.product.update({
      where: { id: p(req).id },
      data: { ...(categoryId !== undefined && { categoryId }), ...(name !== undefined && { name }), ...(description !== undefined && { description }), ...(price !== undefined && { price: parseFloat(price) }), ...(currency !== undefined && { currency }), ...(images !== undefined && { images }), ...(stock !== undefined && { stock: parseInt(stock) }), ...(status !== undefined && { status }) },
    });
    return res.json(updated);
  } catch (error) {
    console.error('Update product error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to update product' });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: p(req).id }, include: { store: true } });
    if (!product || product.store.ownerId !== req.userId) return res.status(403).json({ error: 'FORBIDDEN', message: 'Not your product' });
    await prisma.product.delete({ where: { id: p(req).id } });
    return res.json({ message: 'Product deleted' });
  } catch (error) {
    console.error('Delete product error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to delete product' });
  }
};

export const listProducts = async (req: AuthRequest, res: Response) => {
  try {
    const { storeId, categoryId, search, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, parseInt(limit as string));
    const where: any = { status: 'ACTIVE' };
    if (storeId) where.storeId = storeId as string;
    if (categoryId) where.categoryId = categoryId as string;
    if (search) where.name = { contains: search as string, mode: 'insensitive' };
    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, skip: (pageNum - 1) * limitNum, take: limitNum, orderBy: { createdAt: 'desc' }, include: { category: true, store: { select: { id: true, name: true, slug: true } } } }),
      prisma.product.count({ where }),
    ]);
    return res.json({ products, total, page: pageNum, limit: limitNum });
  } catch (error) {
    console.error('List products error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to list products' });
  }
};

export const getProduct = async (req: AuthRequest, res: Response) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: p(req).id },
      include: { category: true, store: { select: { id: true, name: true, slug: true, phone: true, ownerId: true } } },
    });
    if (!product || (product.status !== 'ACTIVE' && product.store.ownerId !== req.userId)) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Product not found' });
    }
    return res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to get product' });
  }
};

export const uploadProductImage = async (req: AuthRequest, res: Response) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: p(req).id }, include: { store: true } });
    if (!product || product.store.ownerId !== req.userId) return res.status(403).json({ error: 'FORBIDDEN', message: 'Not your product' });
    if (!req.file) return res.status(400).json({ error: 'VALIDATION', message: 'No file provided' });
    if (product.images.length >= 10) return res.status(400).json({ error: 'LIMIT', messageAr: 'الحد الأقصى 10 صور', messageEn: 'Maximum 10 images' });
    const dataUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const updated = await prisma.product.update({ where: { id: p(req).id }, data: { images: { push: dataUrl } } });
    return res.json({ images: updated.images, added: dataUrl });
  } catch (error) {
    console.error('Upload product image error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to upload image' });
  }
};

export const deleteProductImage = async (req: AuthRequest, res: Response) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: p(req).id }, include: { store: true } });
    if (!product || product.store.ownerId !== req.userId) return res.status(403).json({ error: 'FORBIDDEN', message: 'Not your product' });
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'VALIDATION', message: 'URL is required' });
    const filtered = product.images.filter((img) => img !== url);
    if (filtered.length === product.images.length) return res.status(404).json({ error: 'NOT_FOUND', message: 'Image not found' });
    const updated = await prisma.product.update({ where: { id: p(req).id }, data: { images: filtered } });
    return res.json({ images: updated.images });
  } catch (error) {
    console.error('Delete product image error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to delete image' });
  }
};

// ─── Cart ─────────────────────────────────────────────────────────────
export const getCart = async (req: AuthRequest, res: Response) => {
  try {
    let cart = await prisma.cart.findUnique({
      where: { userId: req.userId! },
      include: { items: { include: { product: { include: { store: { select: { id: true, name: true, slug: true } } } } } } },
    });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId: req.userId! }, include: { items: { include: { product: { include: { store: { select: { id: true, name: true, slug: true } } } } } } } });
    }
    return res.json(cart);
  } catch (error) {
    console.error('Get cart error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to get cart' });
  }
};

export const addToCart = async (req: AuthRequest, res: Response) => {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId) return res.status(400).json({ error: 'VALIDATION', message: 'productId is required' });
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.status !== 'ACTIVE') return res.status(404).json({ error: 'NOT_FOUND', message: 'Product not available' });
    if (product.stock < 1) return res.status(400).json({ error: 'OUT_OF_STOCK', messageAr: 'المنتج غير متوفر', messageEn: 'Product out of stock' });
    let cart = await prisma.cart.findUnique({ where: { userId: req.userId! } });
    if (!cart) cart = await prisma.cart.create({ data: { userId: req.userId! } });
    const existing = await prisma.cartItem.findUnique({ where: { cartId_productId: { cartId: cart.id, productId } } });
    if (existing) {
      await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: existing.quantity + (quantity as number) } });
    } else {
      await prisma.cartItem.create({ data: { cartId: cart.id, productId, quantity: quantity as number } });
    }
    const updated = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: { include: { product: { include: { store: { select: { id: true, name: true, slug: true } } } } } } },
    });
    return res.json(updated);
  } catch (error) {
    console.error('Add to cart error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to add to cart' });
  }
};

export const updateCartItem = async (req: AuthRequest, res: Response) => {
  try {
    const item = await prisma.cartItem.findUnique({ where: { id: p(req).id }, include: { cart: true } });
    if (!item || item.cart.userId !== req.userId) return res.status(403).json({ error: 'FORBIDDEN', message: 'Not your cart item' });
    const { quantity } = req.body;
    if (quantity < 1) {
      await prisma.cartItem.delete({ where: { id: p(req).id } });
    } else {
      await prisma.cartItem.update({ where: { id: p(req).id }, data: { quantity } });
    }
    const cart = await prisma.cart.findUnique({
      where: { id: item.cartId },
      include: { items: { include: { product: { include: { store: { select: { id: true, name: true, slug: true } } } } } } },
    });
    return res.json(cart);
  } catch (error) {
    console.error('Update cart item error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to update cart' });
  }
};

export const removeFromCart = async (req: AuthRequest, res: Response) => {
  try {
    const item = await prisma.cartItem.findUnique({ where: { id: p(req).id }, include: { cart: true } });
    if (!item || item.cart.userId !== req.userId) return res.status(403).json({ error: 'FORBIDDEN', message: 'Not your cart item' });
    await prisma.cartItem.delete({ where: { id: p(req).id } });
    const cart = await prisma.cart.findUnique({
      where: { id: item.cartId },
      include: { items: { include: { product: { include: { store: { select: { id: true, name: true, slug: true } } } } } } },
    });
    return res.json(cart);
  } catch (error) {
    console.error('Remove from cart error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to remove from cart' });
  }
};

// ─── Orders ───────────────────────────────────────────────────────────
export const checkout = async (req: AuthRequest, res: Response) => {
  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: req.userId! },
      include: { items: { include: { product: true } } },
    });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'EMPTY', messageAr: 'السلة فارغة', messageEn: 'Cart is empty' });
    }
    const storeIds = [...new Set(cart.items.map((i) => i.product.storeId))];
    if (storeIds.length > 1) {
      return res.status(400).json({ error: 'MULTI_STORE', messageAr: 'لا يمكن الشراء من عدة متاجر في طلب واحد', messageEn: 'Cannot checkout from multiple stores' });
    }
    const storeId = storeIds[0];
    const total = cart.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
    const { shippingAddress, shippingCity, shippingGovernorate, notes } = req.body;
    const order = await prisma.order.create({
      data: {
        buyerId: req.userId!,
        storeId,
        total,
        currency: cart.items[0].product.currency,
        shippingAddress: shippingAddress || null,
        shippingCity: shippingCity || null,
        shippingGovernorate: shippingGovernorate || null,
        notes: notes || null,
        items: {
          create: cart.items.map((i) => ({
            productId: i.product.id,
            productName: i.product.name,
            price: i.product.price,
            quantity: i.quantity,
          })),
        },
      },
      include: { items: true },
    });
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    // Notify store owner
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (store && store.ownerId !== req.userId) {
      const buyer = await prisma.user.findUnique({ where: { id: req.userId } });
      notifyNewOrder(store.ownerId, buyer?.email || 'مشتري', order.id, total).catch(() => {});
    }

    return res.status(201).json(order);
  } catch (error) {
    console.error('Checkout error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to checkout' });
  }
};

export const getMyOrders = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: { buyerId: req.userId! },
      orderBy: { createdAt: 'desc' },
      include: { items: true, store: { select: { id: true, name: true, slug: true } } },
    });
    return res.json(orders);
  } catch (error) {
    console.error('Get my orders error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to get orders' });
  }
};

export const getStoreOrders = async (req: AuthRequest, res: Response) => {
  try {
    const store = await prisma.store.findUnique({ where: { ownerId: req.userId! } });
    if (!store) return res.status(404).json({ error: 'NOT_FOUND', message: 'No store found' });
    const orders = await prisma.order.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: 'desc' },
      include: { items: true, buyer: { select: { id: true, email: true } } },
    });
    return res.json(orders);
  } catch (error) {
    console.error('Get store orders error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to get orders' });
  }
};

export const getOrder = async (req: AuthRequest, res: Response) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: p(req).id },
      include: { items: true, store: { select: { id: true, name: true, slug: true, ownerId: true } }, buyer: { select: { id: true, email: true } } },
    });
    if (!order) return res.status(404).json({ error: 'NOT_FOUND', message: 'Order not found' });
    if (order.buyerId !== req.userId && order.store.ownerId !== req.userId) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Not your order' });
    }
    return res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to get order' });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = p(req);
    const { status: newStatus } = req.body;
    if (!['CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].includes(newStatus)) {
      return res.status(400).json({ error: 'VALIDATION', message: 'Invalid status' });
    }
    const order = await prisma.order.findUnique({ where: { id }, include: { store: true } });
    if (!order) return res.status(404).json({ error: 'NOT_FOUND', message: 'Order not found' });
    if (order.store.ownerId !== req.userId) return res.status(403).json({ error: 'FORBIDDEN', message: 'Not your store order' });
    const updated = await prisma.order.update({ where: { id }, data: { status: newStatus } });

    // Notify buyer
    if (order.buyerId !== req.userId) {
      notifyOrderStatusChanged(order.buyerId, order.store.name, order.id, newStatus).catch(() => {});
    }

    return res.json(updated);
  } catch (error) {
    console.error('Update order status error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to update order' });
  }
};
