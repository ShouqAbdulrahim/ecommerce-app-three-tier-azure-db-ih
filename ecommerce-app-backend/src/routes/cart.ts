import { Router, Request, Response } from 'express';
import { CartModel, CreateCartItemData } from '../models/Cart';
import { validateRequest, cartItemSchema } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const cartModel = new CartModel();

// Get cart items
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const cartItems = await cartModel.getCartItems(user.id);
    const total = await cartModel.getCartTotal(user.id);
    const itemCount = await cartModel.getCartItemCount(user.id);

    res.json({
      items: cartItems,
      total,
      itemCount
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add item to cart
router.post('/add', authenticateToken, validateRequest(cartItemSchema), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const cartData: CreateCartItemData = {
      userId: user.id,
      productId: req.body.productId,
      quantity: req.body.quantity
    };

    const cartItem = await cartModel.addToCart(cartData);
    
    res.status(201).json({
      message: 'Item added to cart successfully',
      cartItem
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    if (error instanceof Error && error.message === 'Product not found or inactive') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update cart item quantity
router.put('/update/:productId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const productId = parseInt(req.params.productId);
    const quantity = parseInt(req.body.quantity);

    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    if (isNaN(quantity) || quantity < 0) {
      return res.status(400).json({ error: 'Invalid quantity' });
    }

    const cartItem = await cartModel.updateCartItemQuantity(user.id, productId, quantity);
    
    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    res.json({
      message: 'Cart item updated successfully',
      cartItem
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove item from cart
router.delete('/remove/:productId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const productId = parseInt(req.params.productId);

    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    const success = await cartModel.removeFromCart(user.id, productId);
    
    if (!success) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    res.json({ message: 'Item removed from cart successfully' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Clear entire cart
router.delete('/clear', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const success = await cartModel.clearCart(user.id);
    
    res.json({ 
      message: 'Cart cleared successfully',
      success
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
