'use strict';

const AWS = require('aws-sdk');
const crypto = require('crypto')
const JSDOM = require("jsdom").JSDOM;
const Parser = require('rss-parser');
const path = require('path');

const parser = new Parser({
  customFields: {
    item: ['category']
  }
});
const esDomain = {
  endpoint: process.env.ES_ENDPOINT,
  region: process.env.AWS_REGION
};

const endpoint = new AWS.Endpoint(esDomain.endpoint);
const credentials = new AWS.EnvironmentCredentials('AWS');
credentials.accessKeyId = process.env.AWS_ACCESS_KEY_ID;
credentials.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const rssFeeds = JSON.parse(process.env.APP_RSS_FEEDS);
const shouldNotMatch = process.env.APP_TITLE_REGEXP;

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
  const time = new Date();
  const msg = `Your cron function "${context.functionName}" ran at ${time}`;

  rssFeeds.forEach(rssFeed => parser.parseURL(rssFeed, (err, feed) => {
    const bulkToInsert = {};

    console.log(feed);

    feed.items.forEach(entry => {
      const doc = new JSDOM(entry.content).window.document;

      [].slice.call(doc.querySelectorAll('a')).filter(el => el.textContent === '[link]').forEach(el => {
        if (!entry.title.match(shouldNotMatch)) {
          const checksum = crypto.createHash('sha1');
          const link = el.getAttribute('href');
          checksum.update(link);
          const key = checksum.digest('hex');

          bulkToInsert[key] = {
            _id: key,
            title: entry.title,
            date: new Date(),
            author: entry.author,
            url: link,
            tags: [entry.category.$.term].concat([]),
          };
        }
      });
    });

    console.log(bulkToInsert);
  }));


  // indexDocumentToES({title: 'test2'}, context);

  const response = {
    statusCode: 200,
    body: JSON.stringify({
      msg,
    }),
  };

  callback(null, response);
};
