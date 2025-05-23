import bcrypt from 'bcrypt';

/**
 * Generates a hash for the given password
 */
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compares a password with a hash
 */
export const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};
