import * as cdk from '@aws-cdk/core'
import * as s3 from '@aws-cdk/aws-s3'
import * as iam from '@aws-cdk/aws-iam'
import * as codebuild from '@aws-cdk/aws-codebuild'
import * as codecommit from '@aws-cdk/aws-codecommit'
import * as codepipeline from '@aws-cdk/aws-codepipeline'
import * as cpactions from '@aws-cdk/aws-codepipeline-actions'
import { App } from '../interfaces/config'

interface Props extends cdk.StackProps {
  repositoryRegion: string
  repositoryBranch: string
  repositoryName: string
  distributionId: string
  bucket: s3.IBucket
}

export class Pipeline extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id)

    const pipeline = new codepipeline.Pipeline(this, `Pipeline`, {
      pipelineName: `${App.ns}Pipeline`,
      crossAccountKeys: false,
    })

    // SourceStage - clone source
    const codeRepo = codecommit.Repository.fromRepositoryName(this, `CodeRepo`, props.repositoryName);
    const sourceStage = pipeline.addStage({ stageName: 'Source' });
    const sourceOutput = new codepipeline.Artifact('source');
    sourceStage.addAction(new cpactions.CodeCommitSourceAction({
      actionName: 'CodeCommitSource',
      output: sourceOutput,
      branch: props.repositoryBranch,
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
      bucket: props.bucket,
      accessControl: s3.BucketAccessControl.PRIVATE,
    }))

    // CfStage - invalid cloudfront
    const cfStage = pipeline.addStage({ stageName: 'Cloudfront' });
    const cfProject = new codebuild.Project(this, `${App.ns}CloudfrontProject`, {
      projectName: `${App.ns}CloudfrontProject`,
      buildSpec: this.createCfBuildspec(props.distributionId),
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