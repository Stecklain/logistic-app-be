import Joi from '../utils/joi';
import { USER_ROLES } from '../constants/user';

export const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string()
    .valid(...USER_ROLES)
    .required(),
});

export const listUsersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(50).default(20),
  email: Joi.string().optional(),
  role: Joi.string()
    .valid(...USER_ROLES)
    .optional(),
  active: Joi.boolean().optional(),
});

export const updateUserEmailSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const updateUserRoleActiveSchema = Joi.object({
  role: Joi.string()
    .valid(...USER_ROLES)
    .optional(),
  active: Joi.boolean().optional(),
}).min(1);

export const adminSetPasswordSchema = Joi.object({
  password: Joi.string().min(6).required(),
});

export const changeOwnPasswordSchema = Joi.object({
  currentPassword: Joi.string().min(6).required(),
  newPassword: Joi.string().min(6).required(),
});
