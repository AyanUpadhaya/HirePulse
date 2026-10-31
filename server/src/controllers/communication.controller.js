import Application from "../models/Application.js";
import Conversation from "../models/Conversation.js";
import Job from "../models/Job.js";
import Message from "../models/Message.js";
import Notification from "../models/Notification.js";
import User, { ROLES } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const isParticipant = (conversation, userId) =>
  conversation.participants.some((participant) => String(participant) === String(userId));

export const listConversations = asyncHandler(async (req, res) => {
  const items = await Conversation.find({ participants: req.user._id })
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .populate("participants", "name avatar role")
    .populate("job", "title")
    .populate("lastMessage");
  res.json({ success: true, data: items });
});

export const createConversation = asyncHandler(async (req, res) => {
  if (![ROLES.APPLICANT, ROLES.RECRUITER].includes(req.user.role)) {
    throw new ApiError(403, "Only applicants and recruiters can start conversations");
  }
  if (String(req.body.recipient) === String(req.user._id)) throw new ApiError(400, "You cannot message yourself");
  const recipient = await User.findById(req.body.recipient);
  if (!recipient || recipient.status !== "active") throw new ApiError(404, "Recipient not found");
  if (recipient.role === req.user.role || recipient.role === ROLES.ADMIN) {
    throw new ApiError(400, "Conversations must be between an applicant and a recruiter");
  }

  let job = null;
  let application = null;
  if (req.body.application) {
    application = await Application.findById(req.body.application).populate("job", "createdBy company title");
    if (!application) throw new ApiError(404, "Application not found");
    const applicantIsSender = String(application.applicant) === String(req.user._id);
    const recruiterIsSender = String(application.job.createdBy) === String(req.user._id);
    const recipientMatches = applicantIsSender
      ? String(application.job.createdBy) === String(recipient._id)
      : String(application.applicant) === String(recipient._id);
    if ((!applicantIsSender && !recruiterIsSender) || !recipientMatches) {
      throw new ApiError(403, "Only the applicant and job recruiter can message about this application");
    }
    job = application.job;
  } else if (req.body.job) {
    job = await Job.findById(req.body.job);
    if (!job) throw new ApiError(404, "Job not found");
    const senderIsRecruiter = String(job.createdBy) === String(req.user._id);
    const recipientIsRecruiter = String(job.createdBy) === String(recipient._id);
    if (!senderIsRecruiter && !recipientIsRecruiter) {
      throw new ApiError(403, "Job-related conversations must include the job recruiter");
    }
  }

  const participants = [req.user._id, recipient._id];
  let conversation = await Conversation.findOne({
    participants: { $all: participants, $size: 2 },
    job: job?._id ?? null,
    application: application?._id ?? null,
  });
  if (!conversation) {
    conversation = await Conversation.create({
      participants,
      type: job || application ? "job_related" : "direct",
      job: job?._id ?? null,
      application: application?._id ?? null,
    });
  }
  res.status(201).json({ success: true, data: conversation });
});

export const listMessages = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) throw new ApiError(404, "Conversation not found");
  if (!isParticipant(conversation, req.user._id)) throw new ApiError(403, "You are not a conversation participant");
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 30, 1), 100);
  const items = await Message.find({ conversation: conversation._id })
    .sort("-createdAt")
    .limit(limit)
    .populate("sender", "name avatar");
  await Message.updateMany(
    { conversation: conversation._id, sender: { $ne: req.user._id }, readBy: { $ne: req.user._id } },
    { $addToSet: { readBy: req.user._id } },
  );
  res.json({ success: true, data: items.reverse() });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) throw new ApiError(404, "Conversation not found");
  if (!isParticipant(conversation, req.user._id)) throw new ApiError(403, "You are not a conversation participant");
  const message = await Message.create({
    conversation: conversation._id,
    sender: req.user._id,
    text: req.body.text,
    readBy: [req.user._id],
  });
  conversation.lastMessage = message._id;
  conversation.lastMessageAt = message.createdAt;
  await conversation.save();
  const recipient = conversation.participants.find((participant) => String(participant) !== String(req.user._id));
  await Notification.create({
    recipient,
    type: "new_message",
    title: "New message",
    message: `${req.user.name} sent you a message.`,
    resourceType: "conversation",
    resourceId: conversation._id,
    deduplicationKey: `message:${message._id}`,
  });
  res.status(201).json({ success: true, data: message });
});

export const listNotifications = asyncHandler(async (req, res) => {
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);
  const filter = { recipient: req.user._id };
  if (req.query.unread === "true") filter.isRead = false;
  const [items, total, unread] = await Promise.all([
    Notification.find(filter).sort("-createdAt").skip((page - 1) * limit).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: req.user._id, isRead: false }),
  ]);
  res.json({ success: true, data: { items, total, unread, page, pages: Math.ceil(total / limit) || 1 } });
});

export const updateNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, recipient: req.user._id });
  if (!notification) throw new ApiError(404, "Notification not found");
  notification.isRead = req.body.isRead;
  notification.readAt = req.body.isRead ? new Date() : null;
  await notification.save();
  res.json({ success: true, data: notification });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { $set: { isRead: true, readAt: new Date() } },
  );
  res.json({ success: true, data: null });
});
