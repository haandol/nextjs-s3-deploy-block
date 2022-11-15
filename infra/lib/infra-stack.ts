import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Cloudfront } from './constructs/cloudfront';
import { Pipeline } from './constructs/pipeline';
import { App } from './interfaces/config';

interface Props extends cdk.StackProps {
  repositoryRegion: string;
  repositoryBranch: string;
  repositoryName: string;
}

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, `${App.ns}Bucket`, {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const cf = new Cloudfront(this, `Cloudfront`, { bucket });
    new Pipeline(this, `Pipeline`, {
      ...props,
      bucket,
      distributionId: cf.distributionId,
    });
  }
}
