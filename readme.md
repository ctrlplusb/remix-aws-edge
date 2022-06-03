# remix-aws-edge

An adapter to run Remix on AWS CloudFront Lambda@Edge.

&nbsp;

---

&nbsp;

- [Introduction](#introduction)
- [Installation](#installation)
- [Configuring your Remix project](#configuring-your-remix-project)
- [Appreciation](#appreciation)

&nbsp;

---

## Introduction

This project exports a utility allowing you to initialise a server side request handler for Remix with the intention of being utilised against an AWS CloudFront Lambda@Edge.

&nbsp;

---

## Installation

Firstly, ensure you have the required peer dependencies installed;

```bash
npm install @remix-run/node
```

Then install this package;

```bash
npm install remix-aws-edge
```

&nbsp;

---

## Configuring your Remix project

Create a `server/index.js` file in the root of your Remix project with the following contents;

```javascript
import { createRequestHandler } from "remix-aws-edge";

exports.handler = createRequestHandler({
  build: require("./build"),
});
```

&nbsp;

---

## Appreciation

This code was adapted from work performed by [@ajhaining](https://github.com/ajhaining), within his [remix-cloudfront-cdk-example](https://github.com/ajhaining/remix-cloudfront-cdk-example) project.
