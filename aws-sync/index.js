'use strict';

const spawnSync = require('child_process').spawnSync;

class AwsSync {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.commands = {
      sync: {
        usage: 'Deploys the `app` directory to your bucket',
        lifecycleEvents: [
          'sync',
        ],
      },
      domains: {
        usage: 'Fetches and prints out the deployed CloudFront domain names',
        lifecycleEvents: [
          'domainInfo',
        ],
      },
    };

    this.hooks = {
      'sync:sync': this.syncDirectory.bind(this),
      'domains:domainInfo': this.domainInfo.bind(this),
    };
  }

  // syncs the `app` directory to the provided bucket
  syncDirectory() {
    const s3Bucket = this.serverless.variables.service.custom.s3Bucket;
    const result = spawnSync('aws', ['s3', 'sync', 'build/', `s3://${s3Bucket}/`]);

    const stdout = result.stdout.toString();
    const sterr = result.stderr.toString();

    if (stdout) {
      this.serverless.cli.log(stdout);
    }

    if (sterr) {
      this.serverless.cli.log(sterr);
    }

    if (!sterr) {
      this.serverless.cli.log('Successfully synced to the S3 bucket.');
    }
  }

  domainInfo() {
    const provider = this.serverless.getProvider('aws');
    const stackName = provider.naming.getStackName(this.options.stage);
    return provider.request(
      'CloudFormation',
      'describeStacks',
      {StackName: stackName},
      this.options.stage,
      this.options.region
    ).then((result) => {
      const outputs = result.Stacks[0].Outputs;
      const output = outputs.find(entry => entry.OutputKey === 'WebAppCloudFrontDistributionOutput');
      this.serverless.cli.log(`Web App Domain: ${output.OutputValue ? output.OutputValue : 'Not Found'}`);
    });
  }
}

module.exports = AwsSync;
