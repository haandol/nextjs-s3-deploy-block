import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { App } from '../interfaces/config';

interface Props {
  bucket: s3.IBucket;
}

export class Cloudfront extends Construct {
  public readonly distributionId: string;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      `${App.ns}OAI`
    );
    props.bucket.grantRead(originAccessIdentity);

    const origin = new origins.S3Origin(props.bucket, { originAccessIdentity });
    const cfDist = new cloudfront.Distribution(this, `${App.ns}Dist`, {
      defaultBehavior: {
        origin,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        compress: false,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });
    this.distributionId = cfDist.distributionId;

    new cdk.CfnOutput(this, `DistId`, {
      exportName: `${App.ns}DistId`,
      value: cfDist.distributionId,
    });
    new cdk.CfnOutput(this, `DistDomainName`, {
      exportName: `${App.ns}DistDomainName`,
      value: cfDist.distributionDomainName,
    });
  }
}
