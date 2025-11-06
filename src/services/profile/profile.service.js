const { User } = require('../../models/user.model');

const { ErrorHandler } = require('../../utils/error-handler');

/**
 * Get user profile by ID
 */
const getProfile = async (userId) => {
  try {
    const user = await User.findById(userId).select('-password -verificationToken -verificationTokenExpires');
    
    if (!user) {
      throw new ErrorHandler(404, 'User not found');
    }

    if (!user.isActive) {
      throw new ErrorHandler(403, 'Account is deactivated');
    }

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      avatar: user.avatar || '',
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Update user profile
 */
const updateProfile = async (userId, updateData) => {
  try {
    // Fields that can be updated
    const allowedUpdates = ['name', 'email', 'phoneNumber', 'avatar'];
    const updates = {};

    // Filter only allowed fields
    Object.keys(updateData).forEach(key => {
      if (allowedUpdates.includes(key) && updateData[key] !== undefined) {
        updates[key] = updateData[key];
      }
    });

    // Check if email is being changed
    if (updates.email) {
      const normalizedEmail = updates.email.toLowerCase().trim();
      
      // Check if email already exists (excluding current user)
      const existingUser = await User.findOne({ 
        email: normalizedEmail,
        _id: { $ne: userId } 
      });
      
      if (existingUser) {
        throw new ErrorHandler(409, 'Email is already in use');
      }

      updates.email = normalizedEmail;
      
      // If email changed, mark as unverified
      updates.isEmailVerified = false;
    }

    // Validate name if provided
    if (updates.name !== undefined) {
      if (!updates.name.trim()) {
        throw new ErrorHandler(422, 'Name cannot be empty');
      }
      updates.name = updates.name.trim();
    }

    // Validate phone number if provided
    if (updates.phoneNumber !== undefined) {
      updates.phoneNumber = updates.phoneNumber.trim();
    }

    // Perform the update
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { 
        new: true, 
        runValidators: true,
        select: '-password -verificationToken -verificationTokenExpires'
      }
    );

    if (!user) {
      throw new ErrorHandler(404, 'User not found');
    }

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      avatar: user.avatar || '',
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors)
        .map((val) => val.message)
        .join(', ');
      throw new ErrorHandler(422, messages);
    }
    throw error;
  }
};

/**
 * Change user password
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  try {
    // Get user with password field (it's excluded by default)
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      throw new ErrorHandler(404, 'User not found');
    }

    if (!user.isActive) {
      throw new ErrorHandler(403, 'Account is deactivated');
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isPasswordValid) {
      throw new ErrorHandler(401, 'Current password is incorrect');
    }

    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      throw new ErrorHandler(422, 'New password must be at least 6 characters');
    }

    // Check if new password is same as current
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      throw new ErrorHandler(422, 'New password must be different from current password');
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    return true;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
};