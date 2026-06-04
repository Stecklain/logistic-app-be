import { randomUUID } from 'crypto';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { Ruta } from './Ruta';

@Entity('users')
export class User {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ unique: true, length: 255 })
  email!: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @OneToMany(() => Ruta, (ruta) => ruta.createdBy)
  rutas!: Ruta[];

  @BeforeInsert()
  ensureId() {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
