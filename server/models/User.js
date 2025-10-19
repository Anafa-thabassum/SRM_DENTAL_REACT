// server/models/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  password: String,
  role: String,
  Identity: { type: String, unique: true }
});

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
