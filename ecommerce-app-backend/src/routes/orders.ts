import { Router, Request, Response } from 'express';
import { OrderModel, CreateOrderData, UpdateOrderData } from '../models/Order';
import { CartModel } from '../models/Cart';
import { validateRequest, orderSchema } from '../middleware/validation';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();
const orderModel = new OrderModel();
const cartModel = new CartModel();

// Get user's orders
router.get('/my-orders', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const result = await orderModel.getOrdersByUserId(user.id, page, limit);
    
    res.json({
      orders: result.orders,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit)
      }
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get order by ID
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    const order = await orderModel.getOrderById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const user = (req as any).user;
    // Users can only view their own orders unless they're admin
    if (!user.isAdmin && order.userId !== user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new order from cart
router.post('/create', authenticateToken, validateRequest(orderSchema), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const orderData: CreateOrderData = {
      userId: user.id,
      items: req.body.items,
      shippingAddress: req.body.shippingAddress,
      billingAddress: req.body.billingAddress,
      paymentMethod: req.body.paymentMethod
    };

    const order = await orderModel.createOrder(orderData);
    
    // Clear the user's cart after successful order creation
    await cartModel.clearCart(user.id);

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create order from cart items
router.post('/create-from-cart', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // Get cart items
    const cartItems = await cartModel.getCartItems(user.id);
    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Validate required fields
    const { shippingAddress, billingAddress, paymentMethod } = req.body;
    if (!shippingAddress || !billingAddress || !paymentMethod) {
      return res.status(400).json({ 
        error: 'Shipping address, billing address, and payment method are required' 
      });
    }

    // Convert cart items to order items
    const orderItems = cartItems.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.productPrice
    }));

    const orderData: CreateOrderData = {
      userId: user.id,
      items: orderItems,
      shippingAddress,
      billingAddress,
      paymentMethod
    };

    const order = await orderModel.createOrder(orderData);
    
    // Clear the user's cart after successful order creation
    await cartModel.clearCart(user.id);

    res.status(201).json({
      message: 'Order created successfully from cart',
      order
    });
  } catch (error) {
    console.error('Create order from cart error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update order status (Admin only)
router.put('/:id/status', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    const updateData: UpdateOrderData = req.body;
    const order = await orderModel.updateOrder(id, updateData);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all orders (Admin only)
router.get('/', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const result = await orderModel.getAllOrders(page, limit);
    
    res.json({
      orders: result.orders,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit)
      }
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel order (User can cancel their own pending orders)
router.put('/:id/cancel', authenticateToken, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    const order = await orderModel.getOrderById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const user = (req as any).user;
    // Users can only cancel their own orders
    if (order.userId !== user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only allow cancellation of pending orders
    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending orders can be cancelled' });
    }

    const updateData: UpdateOrderData = { status: 'cancelled' };
    const updatedOrder = await orderModel.updateOrder(id, updateData);
    
    res.json({
      message: 'Order cancelled successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
