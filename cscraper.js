'use strict';

const AWS = require('aws-sdk');
const sw = require('stopword');
const crypto = require('crypto')
const JSDOM = require("jsdom").JSDOM;
const Parser = require('rss-parser');
const url = require('url');

const parser = new Parser({
  customFields: {
    item: ['category']
  }
});

const {ES_ENDPOINT, ES_ENDPOINT_DEV, AWS_REGION} = process.env;

const endpoint = new AWS.Endpoint(ES_ENDPOINT_DEV ? ES_ENDPOINT_DEV : ES_ENDPOINT);
const credentials = new AWS.EnvironmentCredentials('AWS');
credentials.accessKeyId = process.env.AWS_KEY;
credentials.secretAccessKey = process.env.AWS_SECRET;

const rssFeeds = JSON.parse(process.env.APP_RSS_FEEDS);
const shouldNotMatch = process.env.APP_TITLE_REGEXP;

const indexDocumentToES = (bulkDocument, context) => new Promise((resolve, reject) => require('elasticsearch').Client({
  host: endpoint.host,
  connectionClass: require('http-aws-es'),
  amazonES: {
    region: AWS_REGION,
    credentials,
  }
}).bulk({body: bulkDocument}, (err, resp) => {
  if (err) {
    context.fail();
    reject(err);
  } else {
    context.succeed();
    resolve(resp);
  }
}));

module.exports.run = (event, context, callback) => {
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
                index: {
                  _index: 'cscraper',
                  _type: 'feeds',
                  _id: key,
                }
              });
              bulkToInsert.push({
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

      return indexDocumentToES(bulkToInsert, context);
    })
    .then(msg => callback(null, {
      statusCode: 200,
      body: JSON.stringify({
        msg,
        es: endpoint,
        size: bulkToInsert.length,
      }),
    }))
    .catch(err => callback(null, {
      statusCode: 500,
      body: JSON.stringify({
        err,
        es: endpoint,
        size: bulkToInsert.length,
      })
    }));
};
