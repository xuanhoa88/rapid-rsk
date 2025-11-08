## Getting Started

### Requirements

- Mac OS X, Windows, or Linux
- [npm](https://www.npmjs.com/) package manager + [Node.js](https://nodejs.org/) v6.5 or
  newer
- Text editor or IDE pre-configured with React/JSX/ESlint
  ([learn more](./how-to-configure-text-editors.md))

### Directory Layout

Before you start, take a moment to see how the project structure looks like:

```
.
├── /build/                     # The folder for compiled output
├── /docs/                      # Documentation files for the project
├── /node_modules/              # 3rd-party libraries and utilities
├── /public/                    # Static files which are copied into the /build/public folder
├── /src/                       # The source code of the application
│   ├── /components/            # React components
│   ├── /routes/                # Page/screen components along with the routing information
│   ├── /client.js              # Client-side startup script
│   ├── /server.js              # Server-side startup script
│   └── ...                     # Other core framework modules
├── /test/                      # Unit and end-to-end tests
├── /tools/                     # Build automation scripts and utilities
│   ├── /lib/                   # Library for utility snippets
│   ├── /tasks/                 # Builds the project from source to output (build) folder
│   └── /webpack/               # Webpack configurations
│       ├── /base.js            # Shared configuration between client and server
│       ├── /client.js          # Browser-specific webpack configuration
│       ├── /server.js          # Node.js-specific webpack configuration
│       └── /index.js           # Main entry point exporting both configs
├── Dockerfile                  # Commands for building a Docker image for production
├── package.json                # The list of 3rd party libraries and utilities
```

**Note**: The current version of RSK does not contain a Flux implementation. It
can be easily integrated with any Flux library of your choice. The most commonly
used Flux libraries are [Flux](http://facebook.github.io/flux/),
[Redux](http://redux.js.org/) and [Relay](http://facebook.github.io/relay/).

### Quick Start

#### 1. Get the latest version

You can start by cloning the latest version of React Starter Kit (RSK) on your
local machine by running:

```shell
$ git clone -o react-starter-kit -b master --single-branch https://github.com/xuanhoa88/rapid-rsk.git MyApp
$ cd MyApp
```

Alternatively, you can start a new project based on RSK right from
[WebStorm IDE](https://www.jetbrains.com/help/webstorm/generating-a-project-from-a-framework-template.html#d88767e51),
or by using
[Yeoman generator](https://www.npmjs.com/package/generator-react-fullstack).

#### 2. Run `npm install`

This will install both run-time project dependencies and developer tools listed
in [package.json](../package.json) file.

#### 3. Run `npm start`

This command will build the app from the source files (`/src`) into the output
`/build` folder. As soon as the initial build completes, it will start the
Node.js server (`node build/server.js`) and
[Browsersync](https://browsersync.io/) with
[HMR](https://webpack.github.io/docs/hot-module-replacement) on top of it.

> [http://localhost:3000/](http://localhost:3000/) — Node.js server
> (`build/server.js`) with Browsersync and HMR enabled\
> and IDE\
> [http://localhost:3001/](http://localhost:3001/) — Browsersync control panel
> (UI)

Now you can open your web app in a browser, on mobile devices and start hacking.
Whenever you modify any of the source files inside the `/src` folder, the module
bundler ([Webpack](http://webpack.github.io/)) will recompile the app on the fly
and refresh all the connected browsers.

![browsersync](https://dl.dropboxusercontent.com/u/16006521/react-starter-kit/brwosersync.jpg)

Note that the `npm start` command launches the app in `development` mode, the
compiled output files are not optimized and minimized in this case. You can use
`npm run build` and `node build/server.js` command launches the app in `production` mode .

_NOTE: double dashes are required_

### How to Build and Test

If you need just to build the app (without running a dev server), simply run:

```shell
$ npm run build
```

or, for a production build:

```shell
$ npm run build
```

or, for a production docker build:

```shell
$ npm run build -- --docker
```

_NOTE: double dashes are required_

After running this command, the `/build` folder will contain the compiled
version of the app. For example, you can launch Node.js server normally by
running `node build/server.js`.

To check the source code for syntax errors and potential issues run:

```shell
$ npm run lint
```

To launch unit tests:

```shell
$ npm run test          # Run unit tests with Mocha
$ npm run test:watch    # Launch unit test runner and start watching for changes
```

By default, [Mocha](https://mochajs.org/) test runner is looking for test files
matching the `src/**/*.test.js` pattern. Take a look at
`src/components/Layout/Layout.test.js` as an example.

### How to Update

If you need to keep your project up to date with the recent changes made to RSK,
you can always fetch and merge them from
[this repo](https://github.com/xuanhoa88/rapid-rsk) back into your own
project by running:

```shell
$ git checkout master
$ git fetch react-starter-kit
$ git merge react-starter-kit/master
$ npm install
```
