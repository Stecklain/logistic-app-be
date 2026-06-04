import Joi from 'joi';

export const generateRutaSchema = Joi.object({
  fecha: Joi.string().isoDate().required(),
  origenTexto: Joi.string().min(5).max(255).required(),
  origenLat: Joi.number().min(-90).max(90).optional(),
  origenLng: Joi.number().min(-180).max(180).optional(),
});

export const listRutasSchema = Joi.object({
  fecha: Joi.string().isoDate().optional(),
});
