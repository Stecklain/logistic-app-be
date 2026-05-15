import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';

const SALT_ROUNDS = 10;

export const registerUser = async (email: string, password: string) => {
  const repo = AppDataSource.getRepository(User);

  const existing = await repo.findOneBy({ email });
  if (existing) {
    throw new Error('El email ya está registrado');
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user = repo.create({ email, password: hashed });
  await repo.save(user);

  return { id: user.id, email: user.email };
};

export const loginUser = async (email: string, password: string) => {
  const repo = AppDataSource.getRepository(User);

  const user = await repo.findOneBy({ email });
  if (!user) {
    throw new Error('Credenciales inválidas');
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new Error('Credenciales inválidas');
  }

  const secret = process.env.JWT_SECRET!;
  const expiresIn = process.env.JWT_EXPIRES_IN || '8h';
  const token = jwt.sign({ id: user.id, email: user.email }, secret, {
    expiresIn,
  } as jwt.SignOptions);

  return { token, user: { id: user.id, email: user.email } };
};
