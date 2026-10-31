import { Router } from "express";
import {
  createConversation,
  listConversations,
  listMessages,
  sendMessage,
} from "../controllers/communication.controller.js";
import { protect } from "../middleware/auth.js";
import { validate, validateId } from "../middleware/validate.js";
import { conversationSchema, messageSchema } from "../validators/index.js";

const router = Router();
router.param("id", validateId);
router.use(protect);

router.get("/conversations", listConversations);
router.post("/conversations", validate(conversationSchema), createConversation);
router.get("/conversations/:id/messages", listMessages);
router.post("/conversations/:id/messages", validate(messageSchema), sendMessage);

export default router;
