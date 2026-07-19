import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../entities/User';
import { getDataSource } from '../repositories/data-source';
import { LOGIN_LOCKOUT_MINUTES, MAX_FAILED_LOGIN_ATTEMPTS, UserRole } from '../constants/user';

const SALT_ROUNDS = 10;

export const registerUser = async (
  email: string,
  password: string,
  role: UserRole = 'logistica'
) => {
  const repo = getDataSource().getRepository(User);

  const existing = await repo.findOneBy({ email });
  if (existing) {
    throw new Error('El email ya está registrado');
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user = repo.create({ email, passwordHash: hashed, role });
  await repo.save(user);

  return { id: user.id, email: user.email, role: user.role };
};

export const loginUser = async (email: string, password: string) => {
  const repo = getDataSource().getRepository(User);

  const user = await repo.findOneBy({ email });
  if (!user) {
    throw new Error('Credenciales inválidas');
  }

  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    throw new Error(
      'Cuenta bloqueada temporalmente por múltiples intentos fallidos. Probá de nuevo en unos minutos.'
    );
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
      user.lockedUntil = new Date(Date.now() + LOGIN_LOCKOUT_MINUTES * 60 * 1000);
      user.failedLoginAttempts = 0;
    }
    await repo.save(user);
    throw new Error('Credenciales inválidas');
  }

  if (user.failedLoginAttempts > 0 || user.lockedUntil) {
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    await repo.save(user);
  }

  if (!user.active) {
    throw new Error('Usuario deshabilitado');
  }

  const secret = process.env.JWT_SECRET!;
  const expiresIn = process.env.JWT_EXPIRES_IN || '8h';
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    secret,
    { expiresIn } as jwt.SignOptions
  );

  return { token, user: { id: user.id, email: user.email, role: user.role } };
};
