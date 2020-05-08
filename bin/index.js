#!/usr/bin/env node

const Yargs = require('yargs'),
	inquirer = require('inquirer'),
	latestVersion = require('latest-version'),
	path = require('path'),
	fs = require('fs-extra'),
	lsR = require('fs-readdir-recursive'),
	spawn = require('cross-spawn'),
	chalk = require('chalk');

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
			.option('chat', {
				alias: ['c'],
				describe: 'Enables Chatra (popup chat bubble) on the website',
				type: 'boolean',
				default: false
			})
			.option('analyticsId', {
				alias: ['a'],
				describe: 'Sets the analytics ID provided by Fathom',
				type: 'string',
				default: ''
			});
	}, async argv => {
		let dir = path.resolve(argv.dir);

		// Ensure empty directory
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

		// Determine props to pass to global <Theme> element
		let themeProps = [];
		if (argv.chat) themeProps.push('withChat');
		if (argv.analyticsId) themeProps.push(`analyticsId="${argv.analyticsId}"`);

		// Get latest dependency versions
		if (argv.verbose)
			L.magenta('verbose', 'Getting latest dependencies');
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

		// Copy template files
		const templateDir = path.join(__dirname, '..', 'templates/topo');
		const templateFiles = lsR(templateDir, () => true); // Filter to not ignore .files

		// Map of template replacement text
		const replacementMap = {
			APP_NAME: name,
			THEME_PROPS: themeProps.join(' ') + ' '
		};

		// Files to ignore when replacing text (binary files)
		const ignoreFiles = new Set(['public/favicon.ico']);

		for (let file of templateFiles) {
			let contents = await fs.readFile(path.join(templateDir, file));
			if (!ignoreFiles.has(file)) {
				contents = contents.toString('utf8').replace(/\$([A-Z_]+)\$/g, (_, replaceName) => {
					if (replacementMap[replaceName] !== undefined) {
						if (argv.verbose)
							L.magenta('verbose', `Replaced $${replaceName}$ in ${file} with ${chalk.yellow(replacementMap[replaceName])}`);
						return replacementMap[replaceName];
					} else {
						L.error('warn', `Invalid template text $${replaceName}$ in ${file}, replacing with empty string`);
						return '';
					}
				});
			}
			await write(dir, file, contents);
		}

		L.log('info', 'Installing dependencies')
		// Install dependencies
		const child = spawn('yarn', ['install'], { stdio: 'inherit', cwd: dir });

		child.on('close', (code) => {
			if (code === 0) {
				L.green('success', `Project initialized in ${chalk.green(dir)}`);
				console.log('           ', `Run ${chalk.yellow('cd ' + path.relative(process.cwd(), dir))} and ${chalk.yellow('yarn dev')} to begin development`);
			}
		});
		child.on('error', (err) => {
			if (err.code === 'ENOENT') {
				L.error('error', `Yarn is not installed. Please run ${chalk.yellow('npm i -g yarn')} and then ${chalk.yellow('yarn install')}\n         in ${chalk.green(dir)} to install dependencies.`);
			} else {
				L.error('error', `Yarn exited with code ${err.code}`);
			}
		});
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
	let target = path.join(dir, file);

	await fs.ensureDir(path.dirname(target));
	L.cyan('create', file);
	await fs.writeFile(target, contents);
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
