const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const exerciseSchema = new Schema({
	description: String,
	duration: Number,
	date: {
		type: Date,
		default: Date.now
	},
	_id: false
});

module.exports = exerciseSchema;