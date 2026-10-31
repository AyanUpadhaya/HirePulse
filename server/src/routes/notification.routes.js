import { Router } from "express";
import {
  listNotifications,
  markAllNotificationsRead,
  updateNotification,
} from "../controllers/communication.controller.js";
import { protect } from "../middleware/auth.js";
import { validate, validateId } from "../middleware/validate.js";
import { notificationReadSchema } from "../validators/index.js";

const router = Router();
router.param("id", validateId);
router.use(protect);

router.get("/", listNotifications);
router.patch("/read-all", markAllNotificationsRead);
router.patch("/:id", validate(notificationReadSchema), updateNotification);

export default router;
