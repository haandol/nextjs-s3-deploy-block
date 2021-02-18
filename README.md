# Next.js S3 Deployment Block

This repository is for hosting Nextjs project Cloudfront with Origin Access Identity

Cloudfront with Origin Access Identity(OAI) allows you to hosting static web-site on S3 keep blocking direct access from public

<img src="img/architecture.png" />

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

## Create nextjs repo

create repository to Codecommit

```bash
$ aws codecommit create-repository --repository-name nextjs-example
```

clone sample project, in this case we gonna use [this](https://github.com/haandol/nextjs-example) repo and push it to Codecommit repo

```bash
$ git clone https://github.com/haandol/nextjs-example
$ cd nextjs-example
$ git remote set-url origin codecommit::ap-northeast-2://nextjs-example
$ git push
```

## Setup config

if you want to use your own repository, edit `Repository` variable at [**infra/lib/interfaces/config.ts**](lib/interfaces/config.ts)

```bash
$ vim lib/interfaces/config.ts
```

the repository should be Codecommit git repository

## Deploy CDK Stacks on AWS

```bash
$ cdk deploy "*" --require-approval never
```

## Visit site

```bash
$ aws cloudformation describe-stacks --stack-name NextjsS3DeployDemoInfraStack --query "Stacks[0].Outputs[?ExportName=='NextjsS3DeployDemoDistDomainName'].OutputValue" --output text
d20rbxn7hfe3an.cloudfront.net

$ open http://d20rbxn7hfe3an.cloudfront.net
```

# Cleanup

destroy provisioned cloud resources

```bash
$ cdk destroy "*"
```
