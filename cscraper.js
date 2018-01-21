'use strict';

const AWS = require('aws-sdk');
const path = require('path');

const esDomain = {
  endpoint: process.env.ES_ENDPOINT,
  region: process.env.AWS_REGION
};

const endpoint = new AWS.Endpoint(esDomain.endpoint);
const credentials = new AWS.EnvironmentCredentials('AWS');
credentials.accessKeyId = process.env.AWS_ACCESS_KEY_ID;
credentials.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const indexDocumentToES = function (document, context) {
  const request = new AWS.HttpRequest(endpoint);

  request.method = 'POST';
  request.path = path.join('/cscraper/feeds');
  request.region = esDomain.region;
  request.body = JSON.stringify(document);
  request.headers['Content-Type'] = 'application/json';
  request.headers['presigned-expires'] = false;
  request.headers['Host'] = endpoint.host;

  const signer = new AWS.Signers.V4(request, 'es');
  signer.addAuthorization(credentials, new Date());

  const send = new AWS.NodeHttpClient();
  send.handleRequest(request, null, function (httpResp) {
    let body = '';

    httpResp.on('data', function (chunk) {
      body += chunk;
      console.log('Result request : ', body);
    });

    httpResp.on('end', function (chunk) {
      console.log('Successfully sent to ES.');
      context.succeed();
    });
  }, function (err) {
    console.log('Error: ' + err);
    context.fail();
  });
};

module.exports.run = (event, context, callback) => {
  console.log('Received event: ', JSON.stringify(event, null, 2));

  const time = new Date();
  const msg = `Your cron function "${context.functionName}" ran at ${time}`;

  console.log(msg);

  indexDocumentToES({title: 'test2'}, context);

  const response = {
    statusCode: 200,
    body: JSON.stringify({
      msg,
    }),
  };

  callback(null, response);
};
