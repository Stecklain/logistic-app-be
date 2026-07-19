import { randomUUID } from 'crypto';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { RutaEstado } from '../constants/ruta';
import { RutaPedido } from './RutaPedido';
import { User } from './User';

@Entity('rutas')
export class Ruta {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ type: 'date' })
  fecha!: string;

  @Column({ length: 20 })
  estado!: RutaEstado;

  @Column({ type: 'varchar', length: 120, nullable: true })
  zona!: string | null;

  @Column({ name: 'origen_texto', length: 255 })
  origenTexto!: string;

  @Column('double precision', { name: 'origen_lat' })
  origenLat!: number;

  @Column('double precision', { name: 'origen_lng' })
  origenLng!: number;

  @Column({ name: 'route_geometry_json', type: 'text', nullable: true })
  routeGeometryJson!: string | null;

  @Column({ name: 'created_by_id', type: 'varchar', length: 36, nullable: true })
  createdById!: string | null;

  @ManyToOne(() => User, (user) => user.rutas, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by_id' })
  createdBy!: User | null;

  @OneToMany(() => RutaPedido, (rutaPedido) => rutaPedido.ruta, {
    cascade: true,
  })
  rutaPedidos!: RutaPedido[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @BeforeInsert()
  ensureId() {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
