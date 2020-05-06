# `hello-world-react` example
Start building an app for Contentful with this hello-world-react boilerplate. It comes with React, the [App SDK](https://ctfl.io/app-sdk), our design system [Forma 36](https://ctfl.io/f36), and all the code you need to run a basic app. It will render a simple "Hello World!" in the [app configuration screen](https://www.contentful.com/developers/docs/extensibility/app-framework/locations/#app-configuration):

![Screenshot](https://images.ctfassets.net/tz3n7fnw4ujc/2xWhCSYIJmGCJVVRHXw2Yb/0aa067e4f3d993e886031059cd5aabb6/hello-world-app.png)

> Keep in mind that using React is not required to build a Contentful app.

## How to use

Install it and run:

```bash
npm install
npm start
# or
yarn
yarn start
```

To test, you can create an app definition in your Contentful organization settings pointing to `http://localhost:1234` and registering the `app-config` location:

![App definition](https://images.ctfassets.net/tz3n7fnw4ujc/6jjsBToDLY7OP9Yy4KXWGx/14813081b1ab56cf11aee903e474054e/Screenshot_2020-05-06_at_11.35.40.png?w=1800)

> Keep in mind that when you serve an app locally over `http`, you will get a warning about insecure content. You can ignore this during development.

## What's included?

```bash
.
├── README.md
├── package.json
├── src
│   ├── config.tsx
│   ├── index.css
│   ├── index.html
│   └── index.tsx
└── tsconfig.json
```

- `/src/index.tsx` – The entry point of our app. It renders a component into the specified locations the Contentful web app.
- `/src/config.tsx` – The [app configuration page](https://www.contentful.com/developers/docs/extensibility/app-framework/locations/#app-configuration) of our app. It takes the [App SDK](https://ctfl.io/app-sdk) as a prop, handles the loading state, and renders 'Hello World!'.
- `/src/index.html` – A simple HTML file loading in our React app.
- `/src/index.css` – A CSS reset file.

> [Read the docs](https://www.contentful.com/developers/docs/extensibility/app-framework/) for more information.