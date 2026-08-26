const jwt = require("jsonwebtoken");

function protect(req, res, next) {
  const token = req.cookies.token;
  if (!token)
    return res.status(401).json({ message: "Unauthorised — No token" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { 
        id: decoded.id,
        role: decoded.role
    };
    next();
  } catch (err) {
    res.status(401).json({ message: "Token invalid or expired" });
  }
}

module.exports = protect;
