import jwt from "jsonwebtoken";

function protect(req, res, next) {
  const token = req.cookies.token;
  if (!token)
    return res.status(401).json({ message: "Unauthorised — No token" });
  try {
    const decrypted = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { 
        id: decrypted.id,
        role: decrypted.role
    };
    next();
  } catch (err) {
    res.status(401).json({ message: "Token invalid or expired" });
  }
}

export default protect;
