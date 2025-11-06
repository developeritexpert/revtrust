const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;
const CONSTANT_ENUM = require('../helper/constant-enums');

const userSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true 
    },
    password: { 
      type: String, 
      required: true, 
      minlength: 6, 
      select: false 
    },
    role: {
      type: String,
      enum: Object.values(CONSTANT_ENUM.USER_ROLE),
      default: CONSTANT_ENUM.USER_ROLE.USER,
    },
    isEmailVerified: { 
      type: Boolean, 
      default: false 
    },
    isActive: { 
      type: Boolean, 
      default: true 
    },
    avatar: { 
      type: String, 
      default: '' 
    },
    phoneNumber: { 
      type: String, 
      trim: true, 
      default: '' 
    },
    verificationToken: { 
      type: String, 
      select: false, 
      default: null 
    },
    verificationTokenExpires: { 
      type: Date, 
      default: null 
    },
  },
  { 
    timestamps: true,
    toJSON: { 
      virtuals: true,
      transform: function(doc, ret) {
        delete ret.password;
        delete ret.verificationToken;
        delete ret.verificationTokenExpires;
        return ret;
      }
    },
    toObject: { 
      virtuals: true,
      transform: function(doc, ret) {
        delete ret.password;
        delete ret.verificationToken;
        delete ret.verificationTokenExpires;
        return ret;
      }
    }
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Hash password on findOneAndUpdate (if password is being updated)
userSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate();
  
  // Handle different update structures ($set, direct update, etc.)
  let passwordField = update.password || (update.$set && update.$set.password);
  
  if (passwordField) {
    try {
      const salt = await bcrypt.genSalt(SALT_ROUNDS);
      const hashedPassword = await bcrypt.hash(passwordField, salt);
      
      if (update.$set) {
        update.$set.password = hashedPassword;
      } else {
        update.password = hashedPassword;
      }
      
      this.setUpdate(update);
    } catch (error) {
      return next(error);
    }
  }
  
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Return safe user object (without sensitive fields)
userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    isEmailVerified: this.isEmailVerified,
    isActive: this.isActive,
    avatar: this.avatar,
    phoneNumber: this.phoneNumber,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const User = mongoose.model('User', userSchema);
module.exports = { User };