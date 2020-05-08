const c = require("chalk");
const util = require('util');

const timestamp = (action, color) => c[color](`  ${action}:`);

const log = (...args) => console.log(
	args.map(o =>
		typeof o === 'object' ?
			util.inspect(o) :
			o.toString())
		.join(' '));


module.exports = {
	log: (action, ...args) => log(timestamp(action, 'blue'), ...args),
	green: (action, ...args) => log(timestamp(action, 'green'), ...args),
	warn: (action, ...args) => log(timestamp(action, 'yellow'), ...args),
	error: (action, ...args) => log(timestamp(action, 'red'), ...args),
	magenta: (action, ...args) => log(timestamp(action, 'magenta'), ...args),
	cyan: (action, ...args) => log(timestamp(action, 'cyan'), ...args)
};