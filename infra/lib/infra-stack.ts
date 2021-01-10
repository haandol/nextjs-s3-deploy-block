import * as cdk from '@aws-cdk/core'
import * as s3 from '@aws-cdk/aws-s3'
import { Cloudfront } from './constructs/cloudfront'
import { Pipeline } from './constructs/pipeline'
import { App } from './interfaces/config'

interface Props extends cdk.StackProps {
  repositoryRegion: string
  repositoryName: string
}

export class InfraStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id, props)

    const bucket = new s3.Bucket(this, `${App.ns}Bucket`, {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    const cf = new Cloudfront(this, `Cloudfront`, { bucket })
    const pipeline = new Pipeline(this, `Pipeline`, {
      ...props,
      bucket,
      distributionId: cf.distributionId,
    })
  }
}