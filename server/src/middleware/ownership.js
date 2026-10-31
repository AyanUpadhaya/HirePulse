import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ROLES } from '../models/User.js';

export const isOwnerOrAdmin = (user, ownerId) =>
  user.role === ROLES.ADMIN || String(ownerId?._id ?? ownerId) === String(user._id);

/**
 * Loads :id from Model, then allows the request only for the owner or an admin.
 * The loaded document is exposed as req.resource.
 *   router.patch('/:id', protect, ownerOrAdmin(Job, 'createdBy'), updateJob)
 */
export const ownerOrAdmin = (Model, ownerField = 'owner') =>
  asyncHandler(async (req, _res, next) => {
    const doc = await Model.findById(req.params.id);
    if (!doc) throw new ApiError(404, `${Model.modelName} not found`);
    if (!isOwnerOrAdmin(req.user, doc[ownerField])) {
      throw new ApiError(403, 'Only the owner or an admin can modify this resource');
    }
    req.resource = doc;
    next();
  });
