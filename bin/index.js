#!/usr/bin/env node

const Yargs = require('yargs'),
	inquirer = require('inquirer'),
	latestVersion = require('latest-version'),
	path = require('path'),
	fs = require('fs-extra');

const L = require('./log');

Yargs
	.scriptName('create-codeday-app')
	.version(false)
	.command('topo <dir>', 'Create a Topo application', yargs => {
		yargs
			.option('name', {
				describe: 'App name (defaults to directory name)',
				type: 'string'
			})
			.option('verbose', {
				alias: ['v'],
				describe: 'Enable verbose logging',
				type: 'boolean',
				default: false
			})
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
				await fs.emptyDir(dir)
			} else {
				process.exit(0);
			}
		}


		// Determine app name
		let name;
		if (argv.name) name = argv.name;
		else name = path.basename(dir);

		if (argv.verbose)
			L.log('fetch', 'Getting latest dependencies');
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

		// Create directory
		L.cyan('create', dir);
		await fs.ensureDir(dir);

		await write(dir, 'package.json', JSON.stringify(package, null, 2));
	})
	.help()
	.demandCommand(1, '')
	.argv;

/**
 * Check if the given directory `dir` is empty.
 *
 * @param {String} dir
 * @param {String} file
 * @param {String} contents
 */
async function write(dir, file, contents) {
	L.cyan('create', file);
	await fs.writeFile(path.join(dir, file), contents);
}

/**
 * Check if the given directory `dir` is empty.
 *
 * @param {String} dir
 */
async function isEmptyDirectory(dir) {
	try {
		let files = await fs.readdir(dir);
		return (!files || !files.length);
	} catch (e) {
		if (e.code === 'ENOENT')
			return true;
		else throw e;
	}
}
