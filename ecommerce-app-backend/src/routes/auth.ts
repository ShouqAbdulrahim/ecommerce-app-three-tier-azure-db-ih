import { Router, Request, Response } from 'express';
import { UserModel, CreateUserData, LoginData } from '../models/User';
import { validateRequest, userRegistrationSchema, userLoginSchema } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const userModel = new UserModel();

// Register new user
router.post('/register', validateRequest(userRegistrationSchema), async (req: Request, res: Response) => {
  try {
    const userData: CreateUserData = req.body;

    // Check if user already exists
    const existingUser = await userModel.getUserByEmail(userData.email);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const user = await userModel.createUser(userData);
    const token = userModel.generateToken(user);

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    res.status(201).json({
      message: 'User registered successfully',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login user
router.post('/login', validateRequest(userLoginSchema), async (req: Request, res: Response) => {
  try {
    const loginData: LoginData = req.body;

    const user = await userModel.getUserByEmail(loginData.email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValidPassword = await userModel.validatePassword(loginData.password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = userModel.generateToken(user);

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { password, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const updateData = req.body;

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updateData.password;
    delete updateData.isAdmin;
    delete updateData.id;
    delete updateData.createdAt;

    const updatedUser = await userModel.updateUser(user.id, updateData);
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password, ...userWithoutPassword } = updatedUser;
    res.json({
      message: 'Profile updated successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
