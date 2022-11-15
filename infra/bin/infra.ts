#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { InfraStack } from '../lib/infra-stack';
import { App, Repository } from '../lib/interfaces/config';

const app = new cdk.App();
new InfraStack(app, `${App.ns}InfraStack`, {
  repositoryName: Repository.Name,
  repositoryBranch: Repository.Branch,
  repositoryRegion: Repository.Region,
});
