import bcrypt from 'bcrypt';
import { Raw } from 'typeorm';
import { User } from '../entities/User';
import { getDataSource } from '../repositories/data-source';
import { UserRole } from '../constants/user';
import { registerUser } from './auth.service';

const SALT_ROUNDS = 10;

interface ListUserFilters {
  page: number;
  pageSize: number;
  email?: string;
  role?: UserRole;
  active?: boolean;
}

function toSafeUser(user: User) {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

export async function listUsers(filters: ListUserFilters) {
  const repo = getDataSource().getRepository(User);
  const where: Record<string, unknown> = {};

  if (filters.email) {
    where.email = Raw((alias) => `unaccent(${alias}) ILIKE unaccent(:email)`, {
      email: `%${filters.email}%`,
    });
  }
  if (filters.role) {
    where.role = filters.role;
  }
  if (filters.active !== undefined) {
    where.active = filters.active;
  }

  const [items, total] = await repo.findAndCount({
    where,
    order: { createdAt: 'DESC' },
    skip: (filters.page - 1) * filters.pageSize,
    take: filters.pageSize,
  });

  return {
    items: items.map(toSafeUser),
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.ceil(total / filters.pageSize) || 1,
  };
}

export async function createUserByAdmin(
  email: string,
  password: string,
  role: UserRole
) {
  const user = await registerUser(email, password, role);
  return user;
}

export async function updateUserEmail(id: string, email: string) {
  const repo = getDataSource().getRepository(User);
  const user = await repo.findOneBy({ id });
  if (!user) {
    return null;
  }

  const existing = await repo.findOneBy({ email });
  if (existing && existing.id !== id) {
    throw new Error('El email ya está registrado');
  }

  user.email = email;
  return toSafeUser(await repo.save(user));
}

export async function updateUserRoleActive(
  id: string,
  payload: { role?: UserRole; active?: boolean }
) {
  const repo = getDataSource().getRepository(User);
  const user = await repo.findOneBy({ id });
  if (!user) {
    return null;
  }

  if (payload.role) {
    user.role = payload.role;
  }
  if (payload.active !== undefined) {
    user.active = payload.active;
  }

  return toSafeUser(await repo.save(user));
}

export async function adminSetPassword(id: string, password: string) {
  const repo = getDataSource().getRepository(User);
  const user = await repo.findOneBy({ id });
  if (!user) {
    return null;
  }

  user.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  return toSafeUser(await repo.save(user));
}

export async function changeOwnPassword(
  id: string,
  currentPassword: string,
  newPassword: string
) {
  const repo = getDataSource().getRepository(User);
  const user = await repo.findOneBy({ id });
  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    throw new Error('Contraseña actual incorrecta');
  }

  user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  return toSafeUser(await repo.save(user));
}
