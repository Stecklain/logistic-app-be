import { randomUUID } from 'crypto';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { PedidoEstado, OrigenAlta } from '../constants/pedido';
import { RutaPedido } from './RutaPedido';

@Entity('pedidos')
export class Pedido {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ name: 'codigo_tracking', unique: true, length: 32 })
  codigoTracking!: string;

  @Column({ name: 'direccion_destino', length: 255 })
  direccionDestino!: string;

  @Column({ length: 120 })
  localidad!: string;

  @Column('double precision', { nullable: true })
  lat!: number | null;

  @Column('double precision', { nullable: true })
  lng!: number | null;

  @Column({ length: 20 })
  estado!: PedidoEstado;

  @Column({ name: 'fecha_entrega', type: 'date' })
  fechaEntrega!: string;

  @Column({ name: 'origen_alta', length: 20 })
  origenAlta!: OrigenAlta;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @OneToMany(() => RutaPedido, (rutaPedido) => rutaPedido.pedido)
  rutaPedidos!: RutaPedido[];

  @BeforeInsert()
  ensureId() {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
