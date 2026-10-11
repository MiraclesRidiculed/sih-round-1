import { demoUsersList } from "../middleware/authMiddleware.js";

export const getRolesAndUsers = (req, res) => {
  res.json({
    activeUser: req.user,
    availableRoles: demoUsersList
  });
};

export const switchUserRole = (req, res) => {
  const { role } = req.body;
  const user = demoUsersList.find((u) => u.role === role);

  if (!user) {
    return res.status(400).json({ message: `Unknown role: ${role}` });
  }

  res.json({
    message: `Switched session to ${user.name} (${user.designation})`,
    user
  });
};

export const getCurrentUser = (req, res) => {
  res.json({
    user: req.user
  });
};
