import BaseJoi from 'joi';

const MESSAGES = {
  'any.required': '{{#label}} es un campo requerido',
  'any.only': '{{#label}} debe ser uno de los valores permitidos: {{#valids}}',
  'string.base': '{{#label}} debe ser de tipo texto',
  'string.empty': '{{#label}} no puede estar vacío',
  'string.min': '{{#label}} debe tener al menos {{#limit}} caracteres',
  'string.max': '{{#label}} no puede tener más de {{#limit}} caracteres',
  'string.email': '{{#label}} debe ser un email válido',
  'string.isoDate': '{{#label}} debe ser una fecha válida (formato ISO)',
  'number.base': '{{#label}} debe ser un número',
  'number.min': '{{#label}} debe ser mayor o igual a {{#limit}}',
  'number.max': '{{#label}} debe ser menor o igual a {{#limit}}',
  'number.integer': '{{#label}} debe ser un número entero',
  'boolean.base': '{{#label}} debe ser verdadero o falso',
  'object.min': 'Debés enviar al menos un campo para actualizar',
};

const Joi = BaseJoi.defaults((schema) => schema.messages(MESSAGES));

export default Joi;
