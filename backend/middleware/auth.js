const isAuthenticated = function (req, res, next) {
  if (!req.username) {
    return res.status(401).json({ error: "Not Authenticated" });
  }
  next();
};
