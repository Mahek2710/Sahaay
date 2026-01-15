import { ROLE_PERMISSIONS } from "./permissions.js";

export function requirePermission(permission) {
  return (req, res, next) => {
    const role = req.headers["x-user-role"];

    if (!role) {
      return res.status(401).json({ error: "Role not provided" });
    }

    const allowed = ROLE_PERMISSIONS[role];

    if (!allowed || !allowed.includes(permission)) {
      return res.status(403).json({ error: "Permission denied" });
    }

    next();
  };
}
