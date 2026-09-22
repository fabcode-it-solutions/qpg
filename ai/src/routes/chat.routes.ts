import { Router } from "express";
import multer from "multer";
import { ChatController } from "../controllers/chat.controller";

const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only images are allowed."));
    }
  },
});

// Simple auth middleware
const authMiddleware = (req: any, res: any, next: any) => {
  const userId = req.headers["x-user-id"];
  const userName = req.headers["x-user-name"];
  const membershipLevel = req.headers["x-membership-level"] || "basic";

  if (!userId || !userName) {
    return res.status(401).json({ error: "Authentication required" });
  }

  req.user = {
    id: userId,
    name: userName,
    email: `${userId}@example.com`,
    membershipLevel,
    createdAt: new Date(),
    lastActive: new Date(),
  };

  next();
};

export function createChatRoutes(chatController: ChatController): Router {
  const router = Router();

  router.use(authMiddleware);

  router.get("/session", chatController.getUserSession.bind(chatController));
  router.post(
    "/message",
    upload.array("images", 5),
    chatController.sendMessage.bind(chatController)
  );
  router.get("/history", chatController.getUserHistory.bind(chatController));
  router.delete(
    "/history",
    chatController.clearUserHistory.bind(chatController)
  );

  return router;
}
