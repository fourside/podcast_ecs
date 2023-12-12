import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import * as appscaling from "aws-cdk-lib/aws-applicationautoscaling";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import * as iam from "aws-cdk-lib/aws-iam";
import * as logs from "aws-cdk-lib/aws-logs";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { Construct } from 'constructs';
import { env } from './env';
import { commandFromSchedule, cronExpression, jstToUtc, schedules } from './schedules';

const resourceName = "podcast";

export class PodcastEcsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const cluster = new ecs.Cluster(this, `${resourceName}_cluster`, {
      clusterName: `${resourceName}_cluster`,
    });

    const logGroup = new logs.LogGroup(this, "PodcastEcsLogGroup", {
      logGroupName: `/aws/ecs/${resourceName}`,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: logs.RetentionDays.THREE_MONTHS,
    });

    const ecrRepository = new ecr.Repository(this, "PodcastEcrRepo", {
      repositoryName: `${resourceName}-repository`,
    });

    const ecrRole = new iam.Role(this, "PodcastEcrRole", {
      roleName: `${resourceName}-repository-role`,
      assumedBy: new iam.FederatedPrincipal("arn:aws:iam::540093229923:oidc-provider/token.actions.githubusercontent.com", {
        "StringEquals": {
            "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
            "token.actions.githubusercontent.com:sub": "repo:fourside/podcast_container_image:ref:refs/heads/main"
        },
      }, "sts:AssumeRoleWithWebIdentity"),
    });
    ecrRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["ecr:GetAuthorizationToken"],
        effect: iam.Effect.ALLOW,
        resources: ["*"],
      }),
    );
    ecrRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          "ecr:UploadLayerPart",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:CompleteLayerUpload",
          "ecr:BatchCheckLayerAvailability"
        ],
        effect: iam.Effect.ALLOW,
        resources: [ecrRepository.repositoryArn],
      }),
    );
    ecrRepository.grant(ecrRole)

    const deadLetterQueue = new sqs.Queue(this, "podcastDeadLetterQueue", {
      queueName: "podcastDeadLetter.fifo",
      fifo: true,
      visibilityTimeout: Duration.minutes(240),
      retentionPeriod: Duration.days(8),
      contentBasedDeduplication: true,
    });

    const queue = new sqs.Queue(this, "podcastQueue", {
      queueName: "podcast.fifo",
      fifo: true,
      visibilityTimeout: Duration.minutes(240),
      retentionPeriod: Duration.days(1),
      contentBasedDeduplication: true,
      deadLetterQueue: {
        queue: deadLetterQueue,
        maxReceiveCount: 1,
      },
    });

    for (const schedule of schedules) {
      // 常にNAT Gatewayが作成され、コストが $0.062 per NAT Gateway Hour かかっている
      // https://docs.aws.amazon.com/ja_jp/AmazonECS/latest/bestpracticesguide/networking-outbound.html
      new ecs_patterns.ScheduledFargateTask(this, `ScheduledFargateTask_${schedule.name}`, {
        cluster,
        schedule: appscaling.Schedule.expression(cronExpression(jstToUtc(schedule.cronDate))),
        ruleName: schedule.name,
        scheduledFargateTaskImageOptions: {
          image: ecs.ContainerImage.fromEcrRepository(ecrRepository),
          memoryLimitMiB: 2048,
          environment: {
            ...env,
            SQS_URL: queue.queueUrl,
            DEAD_LETTER_SQS_URL: deadLetterQueue.queueUrl,
          },
          command: commandFromSchedule(schedule),
          logDriver: new ecs.AwsLogDriver({
            streamPrefix: `container`,
            logGroup: logGroup,
          }),
        },
      });
    }

    new ecs_patterns.ScheduledFargateTask(this, `ScheduledFargateTask_Timefree`, {
      cluster,
      schedule: appscaling.Schedule.expression("cron(0 * * * ? *)"),
      ruleName: "polling_timefree",
      scheduledFargateTaskImageOptions: {
        image: ecs.ContainerImage.fromEcrRepository(ecrRepository),
        memoryLimitMiB: 2048,
        environment: {
          ...env,
          SQS_URL: queue.queueUrl,
          DEAD_LETTER_SQS_URL: deadLetterQueue.queueUrl,
        },
        command: ["deno", "task", "queue"],
        logDriver: new ecs.AwsLogDriver({
          streamPrefix: `container`,
          logGroup: logGroup,
        }),
      },
    });
  }
}

