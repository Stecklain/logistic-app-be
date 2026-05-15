import { Request, Response } from 'express';
import Joi from 'joi';
import { loginUser, registerUser } from '../services/auth.service';

const credentialsSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

export const register = async (req: Request, res: Response) => {
  const { error, value } = credentialsSchema.validate(req.body);
  if (error) {
    res.status(400).json({ message: error.details[0].message });
    return;
  }

  try {
    const user = await registerUser(value.email, value.password);
    res.status(201).json({ message: 'Usuario creado', user });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno';
    res.status(409).json({ message });
  }
};

export const login = async (req: Request, res: Response) => {
  const { error, value } = credentialsSchema.validate(req.body);
  if (error) {
    res.status(400).json({ message: error.details[0].message });
    return;
  }

  try {
    const result = await loginUser(value.email, value.password);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno';
    res.status(401).json({ message });
  }
};
