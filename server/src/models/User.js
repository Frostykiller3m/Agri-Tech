import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 30,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['farmer', 'expert', 'admin'],
      default: 'farmer',
      required: true,
    },
    language: {
      type: String,
      enum: ['en', 'hi', 'mr'],
      default: 'en',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  { timestamps: true },
);

userSchema.set('toJSON', {
  transform: (_document, returnedUser) => {
    delete returnedUser.passwordHash;
    delete returnedUser.__v;
    return returnedUser;
  },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
