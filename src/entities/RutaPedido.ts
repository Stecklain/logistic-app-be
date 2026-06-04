import { randomUUID } from 'crypto';
import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Pedido } from './Pedido';
import { Ruta } from './Ruta';

@Entity('ruta_pedidos')
export class RutaPedido {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ name: 'ruta_id', type: 'varchar', length: 36 })
  rutaId!: string;

  @Column({ name: 'pedido_id', type: 'varchar', length: 36 })
  pedidoId!: string;

  @ManyToOne(() => Ruta, (ruta) => ruta.rutaPedidos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ruta_id' })
  ruta!: Ruta;

  @ManyToOne(() => Pedido, (pedido) => pedido.rutaPedidos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pedido_id' })
  pedido!: Pedido;

  @Column({ name: 'orden_visita', type: 'integer' })
  ordenVisita!: number;

  @Column({ name: 'distancia_metros', type: 'integer', default: 0 })
  distanciaMetros!: number;

  @Column({ name: 'duracion_segundos', type: 'integer', default: 0 })
  duracionSegundos!: number;

  @BeforeInsert()
  ensureId() {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
