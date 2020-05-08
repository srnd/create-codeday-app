# Create CodeDay App

Create CodeDay apps

## Creating an app

```sh
yarn create codeday-app topo my-app
```
This will create the directory `my-app` inside the current working directory, generate a template, and install dependencies.

Once the script is complete, you can run the following commands to begin development:

```sh
cd my-app
yarn dev
```

## Options

-   `--name`:     App name (defaults to directory name)
- 	`--verbose`:  Enable verbose logging
- 	`--chat`:     Enables Chatra on the created template. This is the same as adding the `withChat` prop to the `<Theme>` component in `src/pages/_app.js`.
-   `--analyticsId`: Enables Fathom analytics, similar to `--chat`.
