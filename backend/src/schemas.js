const { z } = require('zod');

// --- Auth schemas ---

const passwordValidation = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one digit');

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: passwordValidation,
  role: z.enum(['viewer', 'analyst', 'admin']).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// --- Record schemas ---

const createRecordSchema = z.object({
  amount: z.number({ coerce: true }).positive('Amount must be a positive number'),
  type: z.enum(['income', 'expense'], { message: 'Type must be income or expense' }),
  category: z.string().min(1, 'Category is required').max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  notes: z.string().max(500).optional().nullable(),
});

const updateRecordSchema = z
  .object({
    amount: z.number({ coerce: true }).positive('Amount must be a positive number').optional(),
    type: z.enum(['income', 'expense']).optional(),
    category: z.string().min(1).max(100).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
    notes: z.string().max(500).optional().nullable(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'At least one field must be provided for update',
  });

// --- User management schemas ---

const updateRoleSchema = z.object({
  role: z.enum(['viewer', 'analyst', 'admin'], {
    message: 'Invalid role. Must be one of: viewer, analyst, admin.',
  }),
});

const updateStatusSchema = z.object({
  status: z.enum(['active', 'inactive'], {
    message: 'Invalid status. Must be one of: active, inactive.',
  }),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address.'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required.'),
  password: passwordValidation,
});

const setBudgetSchema = z.object({
  category: z.string().min(1, 'Category is required.'),
  amount: z.number().positive('Amount must be positive.'),
  month: z.number().min(1).max(12),
  year: z.number().int().min(2000),
});

const createRecurringSchema = z.object({
  amount: z.number().positive('Amount must be positive.'),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'Category is required.'),
  notes: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  next_run_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD.'),
});

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long.').max(100),
  currency: z.enum(['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD']).optional()
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: passwordValidation,
});

module.exports = {
  registerSchema,
  loginSchema,
  createRecordSchema,
  updateRecordSchema,
  updateRoleSchema,
  updateStatusSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  setBudgetSchema,
  createRecurringSchema,
  updateProfileSchema,
  updatePasswordSchema,
};
