'use strict';

const AWS = require('aws-sdk');
const sw = require('stopword');
const crypto = require('crypto')
const JSDOM = require("jsdom").JSDOM;
const Parser = require('rss-parser');
const path = require('path');
const url = require('url');

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
credentials.accessKeyId = process.env.AWS_KEY;
credentials.secretAccessKey = process.env.AWS_SECRET;

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
  const hashes = [];
  const bulkToInsert = [];

  Promise
    .all(rssFeeds.map(rssFeed => new Promise(resolve => parser.parseURL(rssFeed, (err, feed) => resolve(feed)))))
    .then(feeds => {

      feeds.forEach(feed => feed.items.forEach(entry => {
        const doc = new JSDOM(entry.content).window.document;

        [].slice.call(doc.querySelectorAll('a')).filter(el => el.textContent === '[link]').forEach(el => {
          if (!entry.title.match(shouldNotMatch)) {
            const checksum = crypto.createHash('sha1');
            const link = el.getAttribute('href');
            checksum.update(link);
            const key = checksum.digest('hex');

            const sanitizedTitle = entry.title.toLowerCase().replace(/[^a-z]+/g, ' ');
            const tags = sw.removeStopwords(sanitizedTitle.split(' ')).filter(w => w.length > 2);

            if (!~hashes.indexOf(key)) {
              bulkToInsert.push({
                _id: key,
                title: entry.title,
                date: new Date(),
                author: entry.author,
                url: link,
                provider: url.parse(link).hostname.split('.').filter(s => s.length > 2)[0],
                tags: [entry.category.$.term].concat(tags),
              });
              hashes.push(key);
            }
          }
        });
      }));

      console.log(bulkToInsert);

      // indexDocumentToES({title: 'test2'}, context);

      const response = {
        statusCode: 200,
        body: JSON.stringify({
          size: bulkToInsert.length,
        }),
      };

      callback(null, response);
    });
};
