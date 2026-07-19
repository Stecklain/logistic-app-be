import { Request, Response } from 'express';
import {
  adminSetPasswordSchema,
  changeOwnPasswordSchema,
  createUserSchema,
  listUsersSchema,
  updateUserEmailSchema,
  updateUserRoleActiveSchema,
} from '../schemas/user.schema';
import {
  adminSetPassword,
  changeOwnPassword,
  createUserByAdmin,
  listUsers,
  updateUserEmail,
  updateUserRoleActive,
} from '../services/user.service';
import { getSingleRouteParam } from '../utils/http';
import { AuthRequest } from '../middleware/auth.middleware';

export async function listUsersHandler(req: Request, res: Response) {
  const { error, value } = listUsersSchema.validate(req.query, {
    convert: true,
  });
  if (error) {
    res.status(400).json({ message: error.details[0].message });
    return;
  }

  const result = await listUsers(value);
  res.json(result);
}

export async function createUserHandler(req: Request, res: Response) {
  const { error, value } = createUserSchema.validate(req.body);
  if (error) {
    res.status(400).json({ message: error.details[0].message });
    return;
  }

  try {
    const user = await createUserByAdmin(value.email, value.password, value.role);
    res.status(201).json(user);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno';
    res.status(409).json({ message });
  }
}

export async function updateUserEmailHandler(req: Request, res: Response) {
  const { error, value } = updateUserEmailSchema.validate(req.body);
  if (error) {
    res.status(400).json({ message: error.details[0].message });
    return;
  }

  try {
    const user = await updateUserEmail(getSingleRouteParam(req.params.id), value.email);
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    res.json(user);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno';
    res.status(409).json({ message });
  }
}

export async function updateUserRoleActiveHandler(req: Request, res: Response) {
  const { error, value } = updateUserRoleActiveSchema.validate(req.body);
  if (error) {
    res.status(400).json({ message: error.details[0].message });
    return;
  }

  const user = await updateUserRoleActive(getSingleRouteParam(req.params.id), value);
  if (!user) {
    res.status(404).json({ message: 'Usuario no encontrado' });
    return;
  }

  res.json(user);
}

export async function adminSetPasswordHandler(req: Request, res: Response) {
  const { error, value } = adminSetPasswordSchema.validate(req.body);
  if (error) {
    res.status(400).json({ message: error.details[0].message });
    return;
  }

  const user = await adminSetPassword(getSingleRouteParam(req.params.id), value.password);
  if (!user) {
    res.status(404).json({ message: 'Usuario no encontrado' });
    return;
  }

  res.json(user);
}

export async function changeOwnPasswordHandler(req: AuthRequest, res: Response) {
  const { error, value } = changeOwnPasswordSchema.validate(req.body);
  if (error) {
    res.status(400).json({ message: error.details[0].message });
    return;
  }

  try {
    const user = await changeOwnPassword(
      req.user!.id,
      value.currentPassword,
      value.newPassword
    );
    res.json(user);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno';
    res.status(400).json({ message });
  }
}
