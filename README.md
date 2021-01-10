# Next.js S3 Deploy Example

This repository is for hosting Nextjs project using private S3(no public-read) via Cloudfront

# Prerequisites

- Nodejs 10.x
- AWS Account and Locally configured AWS credential

# Installation

Install project dependencies

```bash
$ npm i -g cdk@1.83.0
$ npm i
$ cdk bootstrap
```

# Usage

## Setup config

edit `Repository` varialbe at [**lib/interfaces/config.ts**](lib/interfaces/config.ts)

```bash
$ vim lib/interfaces/config.ts
```

the repository should be Codecommit git repository

## Deploy CDK Stacks on AWS

```bash
$ cdk deploy "*" --require-approval never
```

# Cleanup

destroy provisioned cloud resources

```bash
$ cdk destroy "*"
```