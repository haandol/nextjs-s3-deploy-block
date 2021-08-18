# Next.js S3 Deployment Block

This repository is for hosting Nextjs project Cloudfront with Origin Access Identity

Cloudfront with Origin Access Identity(OAI) allows you to hosting static web-site on S3 keep blocking direct access from public

<img src="img/architecture.png" />

# Prerequisites

- Nodejs 14.x
- AWS Account and Locally configured AWS credential

# Installation

Install project dependencies

```bash
$ npm i -g cdk@1.117
$ npm i
$ cdk bootstrap
```

# Usage

## Create nextjs repository to Codecommit

create codecommit repository

```bash
$ aws codecommit create-repository --repository-name nextjs-example
```

clone sample project, in this case we gonna use [this](https://github.com/haandol/nextjs-example) repo and push it to Codecommit repository

```bash
$ git clone https://github.com/haandol/nextjs-example
$ cd nextjs-example
$ git remote set-url origin codecommit::ap-northeast-2://nextjs-example
$ git push origin
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

After every commit on your NextJs web repository, CodePipeline will build and deploy your CSR app on CloudFront.

```bash
$ aws cloudformation describe-stacks --stack-name NextjsS3DeployDemoInfraStack --query "Stacks[0].Outputs[?ExportName=='NextjsS3DeployDemoDistDomainName'].OutputValue" --output text
xxx.cloudfront.net

$ open http://xxx.cloudfront.net
```

# Cleanup

destroy provisioned cloud resources

```bash
$ cdk destroy "*"
```
