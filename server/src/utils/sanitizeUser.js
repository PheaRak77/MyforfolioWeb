const sanitizeUser = (user) => {
  if (!user) return null;

  const { password_hash, ...safeUser } = user;
  return safeUser;
};

module.exports = sanitizeUser;
