const mongoose = require('mongoose');
// const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
const md5 = require('md5');
const validator = require ('validator');
const mongodbErrorHandler = require('mongoose-mongodb-errors');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    lowercase: true,  // saves always in lowercase in the DB
    trim: true,  // trims the spaces before and after the emails
    validate: [validator.isEmail, 'Invalid Email Address'],
    required: 'Please Supply an email Address'
  },
  name: {
    type: String,
    required: 'Please Supply a Name',
    trim: true
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  hearts: [
    { type: mongoose.Schema.ObjectId, ref: 'Store' }
  ]
});

// virtual field : if you have w field : weight , it can be generate in kg or pounds
userSchema.virtual('gravatar').get(function() {
  const hash = md5(this.email);
  return `https://gravatar.com/avatar/${hash}?s=200`;
});

userSchema.plugin(passportLocalMongoose, { usernameField: 'email' });
userSchema.plugin(mongodbErrorHandler);    // plugin with nicer errors === UI

module.exports = mongoose.model('User', userSchema);
