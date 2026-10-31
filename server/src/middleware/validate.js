import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';

// Parses req.body with a zod schema; unknown keys are stripped (prevents mass assignment)
export const validate = (schema) => (req, _res, next) => {
  req.body = schema.parse(req.body);
  next();
};

// router.param('id', validateId)
export const validateId = (_req, _res, next, id) =>
  mongoose.isValidObjectId(id) ? next() : next(new ApiError(400, 'Invalid id'));
