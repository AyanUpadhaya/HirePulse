import { Router } from 'express';
import { deleteUser, listUsers, updateUser } from '../controllers/user.controller.js';
import { authorize, protect } from '../middleware/auth.js';
import { ownerOrAdmin } from '../middleware/ownership.js';
import { validate, validateId } from '../middleware/validate.js';
import User, { ROLES } from '../models/User.js';
import { userUpdateSchema } from '../validators/index.js';

const router = Router();
router.param('id', validateId);
router.use(protect);

router.get('/', authorize(ROLES.ADMIN), listUsers);
router.patch('/:id', ownerOrAdmin(User, '_id'), validate(userUpdateSchema), updateUser);
router.delete('/:id', ownerOrAdmin(User, '_id'), deleteUser);

export default router;
