import Joi from 'joi';
import { ORIGENES_ALTA, PEDIDO_ESTADOS } from '../constants/pedido';

const basePedidoSchema = {
  direccionDestino: Joi.string().min(5).max(255).required(),
  localidad: Joi.string().min(2).max(120).required(),
  fechaEntrega: Joi.string().isoDate().required(),
  origenAlta: Joi.string()
    .valid(...ORIGENES_ALTA)
    .default('manual'),
  lat: Joi.number().min(-90).max(90).allow(null).optional(),
  lng: Joi.number().min(-180).max(180).allow(null).optional(),
};

export const createPedidoSchema = Joi.object(basePedidoSchema);

export const updatePedidoSchema = Joi.object({
  direccionDestino: Joi.string().min(5).max(255).optional(),
  localidad: Joi.string().min(2).max(120).optional(),
  fechaEntrega: Joi.string().isoDate().optional(),
  estado: Joi.string()
    .valid(...PEDIDO_ESTADOS)
    .optional(),
  origenAlta: Joi.string()
    .valid(...ORIGENES_ALTA)
    .optional(),
  lat: Joi.number().min(-90).max(90).allow(null).optional(),
  lng: Joi.number().min(-180).max(180).allow(null).optional(),
}).min(1);

export const updatePedidoEstadoSchema = Joi.object({
  estado: Joi.string()
    .valid(...PEDIDO_ESTADOS)
    .required(),
});

export const listPedidosSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(50).default(10),
  estado: Joi.string()
    .valid(...PEDIDO_ESTADOS)
    .optional(),
  localidad: Joi.string().optional(),
  codigoTracking: Joi.string().optional(),
});
