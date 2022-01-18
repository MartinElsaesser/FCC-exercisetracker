const AppError = require("./Error");

module.exports = function (fn) {
	return function (req, res, next) {
		fn(req, res, next)
			.catch(e => next(new AppError("Something went wrong", 500)));
	}
}