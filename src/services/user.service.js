const { User } = require('../models/user.model');
const { ErrorHandler } = require('../utils/error-handler');

const getUserByEmail = (email, includePassword = false) => {
  const proj = includePassword ? {} : { password: 0 };
  return User.findOne({ email }, proj).exec();
};


const getUserByID = async (userId, includePassword = false) => {
  // console.log('userId',userId)
  const projection = includePassword ? {} : { password: 0 };
  const user = await User.findById(userId, projection).exec();
  // console.log(user);
  if (!user) throw new ErrorHandler(404, 'User not found');
  return user;
};


const listUsers = (filter = {}, opts = {}) => {
  const { limit = 20, skip = 0 } = opts;
  return User.find(filter).limit(limit).skip(skip).select('-password').exec();
};

const updateUser = (id, data) =>
  User.findByIdAndUpdate(id, data, { new: true }).select('-password').exec();
const deleteUser = (id) => User.findByIdAndDelete(id).exec();

module.exports = { getUserByEmail, getUserByID, listUsers, updateUser, deleteUser };
