const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const exerciseSchema = require("./exercise");

const userSchema = new Schema({
	username: String,
	exercises: [exerciseSchema]
});

module.exports = mongoose.model("User", userSchema);