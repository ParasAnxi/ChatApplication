const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');

mongoose.connect("mongodb://127.0.0.1:27017/ChatApplication");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: String, // will be handled by passport-local-mongoose
  PhoneNumber: {
    type: String,
    required: true
  },
  profilePicture: {
    type: String,
    default: '/images/default.jpg' // default image path
  },
  FullName: {
    type: String,
    required: true
  }
});

userSchema.plugin(plm);

const User = mongoose.model('User', userSchema);
module.exports = User;
