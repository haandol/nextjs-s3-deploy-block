import * as cdk from '@aws-cdk/core'
import * as s3 from '@aws-cdk/aws-s3'
import * as iam from '@aws-cdk/aws-iam'
import * as codebuild from '@aws-cdk/aws-codebuild'
import * as codecommit from '@aws-cdk/aws-codecommit'
import * as codepipeline from '@aws-cdk/aws-codepipeline'
import * as cpactions from '@aws-cdk/aws-codepipeline-actions'
import * as cloudfront from '@aws-cdk/aws-cloudfront'
import * as origins from '@aws-cdk/aws-cloudfront-origins'
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
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, `${App.ns}OAI`)
    bucket.grantRead(originAccessIdentity)
    const origin = new origins.S3Origin(bucket, {
      originAccessIdentity,
    })
    const cfDist = new cloudfront.Distribution(this, `${App.ns}Dist`, {
      defaultBehavior: {
        origin,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        compress: false,
      },
      defaultRootObject: 'index.html',
    })

    const pipeline = new codepipeline.Pipeline(this, `${App.ns}Pipeline`, {
      pipelineName: `${App.ns}Pipeline`
    })

    // SourceStage - clone source
    const codeRepo = codecommit.Repository.fromRepositoryName(this, `${App.ns}CodeRepo`, props.repositoryName);
    const sourceStage = pipeline.addStage({ stageName: 'Source' });
    const sourceOutput = new codepipeline.Artifact('source');
    sourceStage.addAction(new cpactions.CodeCommitSourceAction({
      actionName: 'CodeCommitSource',
      output: sourceOutput,
      branch: 'main',
      repository: codeRepo,
    }))

    // RectStage - build
    const reactOutput = new codepipeline.Artifact('react');
    const reactStage = pipeline.addStage({ stageName: 'React' });
    const reactProject = new codebuild.Project(this, `${App.ns}ReactProject`, {
      projectName: `${App.ns}ReactProject`,
      buildSpec: this.createReactBuildspec(props, sourceOutput.artifactName!),
      environment: {
        buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_3,
        privileged: false,
      },
    })
    reactProject.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'codecommit:*',
        's3:*',
      ],
      effect: iam.Effect.ALLOW,
      resources: ['*'],
    }))
    reactStage.addAction(new cpactions.CodeBuildAction({
      runOrder: 10,
      actionName: 'ReactAction',
      input: sourceOutput,
      project: reactProject,
      outputs: [reactOutput],
    }))
    reactStage.addAction(new cpactions.S3DeployAction({
      runOrder: 20,
      actionName: 'DeployAction',
      input: reactOutput,
      bucket,
      accessControl: s3.BucketAccessControl.PRIVATE,
    }))

    // CfStage - invalid cloudfront
    const cfStage = pipeline.addStage({ stageName: 'Cloudfront' });
    const cfProject = new codebuild.Project(this, `${App.ns}CloudfrontProject`, {
      projectName: `${App.ns}CloudfrontProject`,
      buildSpec: this.createCfBuildspec(cfDist.distributionId),
      environment: {
        buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_3,
        privileged: false,
      },
    })
    cfProject.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'cloudfront:*',
      ],
      effect: iam.Effect.ALLOW,
      resources: ['*'],
    }))
    cfStage.addAction(new cpactions.CodeBuildAction({
      runOrder: 10,
      input: sourceOutput,
      actionName: 'CfAction',
      project: cfProject,
    }))
  }

  createReactBuildspec(props: Props, artifactName: string): codebuild.BuildSpec {
    const buildCommands: string[] = [
      `npm i`,
      `npm run build`,
    ]

    return codebuild.BuildSpec.fromObject({
      version: '0.2',
      phases: {
        build: {
          commands: buildCommands
        }
      },
      artifacts: {
        name: 'react',
        files: [
          '**/*'
        ],
        'base-directory': 'out',
      }
    })
  }

  createCfBuildspec(distId: string): codebuild.BuildSpec {
    const buildCommands: string[] = [
      `aws cloudfront create-invalidation --distribution-id ${distId} --paths "/*"`,
    ]

    return codebuild.BuildSpec.fromObject({
      version: '0.2',
      phases: {
        build: {
          commands: buildCommands
        }
      },
    })
  }

}
