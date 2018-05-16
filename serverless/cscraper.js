'use strict';

const AWS = require('aws-sdk');
const got = require('got');
const BPromise = require('bluebird');
const aws4 = require('aws4');
const sw = require('stopword');
const crypto = require('crypto');
const JSDOM = require("jsdom").JSDOM;
const Parser = require('rss-parser');
const url = require('url');


const {ES_ENDPOINT, ES_ENDPOINT_DEV, AWS_REGION} = process.env;

const awsConfig = new AWS.Config({region: AWS_REGION});
const endpoint = ES_ENDPOINT_DEV ? ES_ENDPOINT_DEV : ES_ENDPOINT;

const rssFeeds = JSON.parse(process.env.APP_RSS_FEEDS);
const shouldNotMatch = process.env.APP_TITLE_REGEXP;

const parser = new Parser({
  customFields: {
    item: ['category']
  }
});


console.log('ENDPOINT', endpoint);
console.log('AWS_REGION', AWS_REGION);
console.log('APP_RSS_FEEDS', rssFeeds);
console.log('APP_TITLE_REGEXP', shouldNotMatch);

function request(host, options) {
  let opts = Object.assign(url.parse(host), {
    region: awsConfig.region,
    protocol: 'https:',
    headers: {
      'Content-Type': 'application/json'
    }
  }, options);

  aws4.sign(opts, awsConfig.credentials);

  console.log('Performing request', opts);

  return BPromise.resolve(got(opts));
}


const reqIndexDocumentToES = bulkDocument => request('https://' + endpoint, {
  method: 'POST',
  path: '/_bulk',
  body: bulkDocument.map(doc => JSON.stringify(doc) + '\n').join('')
});


module.exports.run = (event, context, callback) => {
  const hashes = [];
  const bulkToInsert = [];

  console.log('Execute run');

  Promise
    .all(rssFeeds.map(rssFeed => new Promise(resolve => parser.parseURL(rssFeed, (err, feed) => resolve(feed)))))
    .then(feeds => {
      console.log('Work on feeds');

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
                provider: url.parse(link).hostname.split('.').filter(s => s.length > 2 && s !== 'www')[0],
                tags: [entry.category.$.term].concat(tags),
              });
              hashes.push(key);
            }
          }
        });
      }));

      console.log('Documents to insert : ', bulkToInsert.length / 2);

      return reqIndexDocumentToES(bulkToInsert, context);
    })
    .then(() => {
      context.succeed();

      callback(null, {
        statusCode: 200,
        body: JSON.stringify({
          size: bulkToInsert.length / 2,
        }),
      })
    })
    .catch(err => {
      console.log('Error', err);

      context.fail();

      callback(null, {
        statusCode: 500,
        body: JSON.stringify({
          err,
          es: endpoint,
          size: bulkToInsert.length / 2,
        })
      })
    });
};
