const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
require('dotenv').config()
const User = require("./models/User");
const wrapAsync = require('./utility/wrapAsync');

mongoose.connect(`mongodb+srv://${process.env.db_USER}:${process.env.db_PASS}@${process.env.db_HOST}/exercise-tracker?retryWrites=true&w=majority`);
mongoose.connection.on('connection', data => {
	console.log("connection" + data);
});
mongoose.connection.on('error', err => {
	console.log(err);
});

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/views/index.html')
});

app.post("/api/users", wrapAsync(async (req, res, next) => {
	let user = { username: req.body.username };
	if (!user.username) return res.send("Missing username");
	let { username, _id } = await User.create(user);
	return res.json({ username, _id });
}));

app.get("/api/users", wrapAsync(async (req, res, next) => {
	let users = await User.find({}).select("-exercises").exec();
	return res.json(users);
}));

app.post("/api/users/:id/exercises", wrapAsync(async (req, res, next) => {
	let id = req.params.id;
	if (!isValidDate(new Date(req.body.date))) {
		req.body.date = undefined
	}

	let exercise = {
		description: req.body.description,
		duration: req.body.duration,
		date: req.body.date
	}
	if (!(id && exercise.description && exercise.duration))
		return res.send("Missing arguments")

	let user = await User.findById(id);
	user.exercises.push(exercise);
	user = await user.save();
	let { date, duration, description } = user.exercises[user.exercises.length - 1];
	let data = {
		_id: user._id,
		username: user.username,
		date: date.toDateString(), duration, description
	}
	res.json(data);
}));

app.get("/api/users/:id/logs", wrapAsync(async (req, res, next) => {
	let id = req.params.id;
	let { limit, to, from } = req.query;
	if (to) to = new Date(to);
	if (from) from = new Date(from);
	let user = (await User.findById(id)).toObject();
	let { _id, username, exercises: log } = user;
	log.forEach(e => e.date = new Date(e.date).toDateString());

	if (to || from) {
		log = log.filter(e => {
			let dTime = new Date(e.date).getTime();
			let withinTo = true, withinFrom = true;
			if (isValidDate(to)) withinTo = (to.getTime() - dTime) >= 0;
			if (isValidDate(from)) withinFrom = (dTime - from.getTime()) >= 0;
			let difFrom = dTime - from.getTime();
			let difTo = to.getTime() - dTime;
			return withinTo && withinFrom;
		});
	}

	if (limit && limit < log.length) {
		log.length = limit;
	}

	let data = { _id, username, count: log.length, log }
	res.send(data);
}));

app.use((req, res) => {
	res.status(404).send("404")
});

app.use((err, req, res, next) => {
	res.status(err.status).send(err.message)
});

function isValidDate(d) {
	return d instanceof Date && !isNaN(d);
}

const listener = app.listen(process.env.PORT || 3000, () => {
	console.log('Your app is listening on port ' + listener.address().port)
})
