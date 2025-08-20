const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');

mongoose.connect("mongodb://127.0.0.1:27017/ChatApplication");

const userSchema = new mongoose.Schema({
  username: String,
  FullName: String,
  requests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // incoming requests
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]   // accepted friends
});

userSchema.plugin(plm);

const User = mongoose.model('User', userSchema);
module.exports = User;
