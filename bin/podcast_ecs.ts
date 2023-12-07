#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { PodcastEcsStack } from '../lib/podcast_ecs-stack';

const app = new cdk.App();
new PodcastEcsStack(app, 'PodcastEcsStack');
