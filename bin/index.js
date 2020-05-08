#!/usr/bin/env node

const Yargs = require('yargs'),
	inquirer = require('inquirer'),
	latestVersion = require('latest-version'),
	path = require('path'),
	fs = require('fs'),
	rmfr = require('rmfr'),
	mkdirp = require('mkdirp');

const L = require('./log');

Yargs
	.scriptName('create-codeday-app')
	.version(false)
	.command('topo <dir>', 'Create a Topo application', yargs => {
		yargs.option('name', {
			describe: 'App name (defaults to directory name)',
			type: 'string'
		});
	}, async argv => {
		let dir = path.resolve(argv.dir);
		if (!await isEmptyDirectory(dir)) {
			let shouldOverwrite = await inquirer.prompt([{
				type: 'confirm',
				message: 'Destination is not empty. Overwrite?',
				name: 'overwrite',
				default: false
			}]);
			if (shouldOverwrite.overwrite) {
				L.warn('delete', dir);
				await rmfr(dir)
			} else {
				process.exit(0);
			}
		}

		// Create directory
		L.cyan('create', dir);
		await mkdirp(dir);

		// Determine app name
		let name;
		if (argv.name) name = argv.name;
		else name = path.basename(dir);

		// Get latest dependency versions
		const deps = ["@codeday/topo", "@codeday/topocons", "next", "next-seo", "prop-types", "react", "react-dom"];
		const dependencies = {};
		for (let dep of deps) {
			dependencies[dep] = '^' + await latestVersion(dep);
		}

		const package = {
			name,
			version: "0.0.1",
			private: true,
			scripts: {
				dev: "next dev",
				build: "next build",
				start: "next start"
			},
			dependencies
		};

	})
	.help()
	.demandCommand(1, '')
	.argv;

/**
 * Check if the given directory `dir` is empty.
 *
 * @param {String} dir
 */
async function isEmptyDirectory(dir) {
	return new Promise((resolve, reject) => {
		fs.readdir(dir, function (err, files) {
			if (err && err.code !== 'ENOENT') reject(err);
			else resolve(!files || !files.length);
		});
	});
}
