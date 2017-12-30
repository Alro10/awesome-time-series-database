'use strict';

// check the constraints and generate README.md
const fs = require('fs');
const _ = require('lodash');
const hb = require('handlebars');
const winston = require('winston');
const log = new winston.Logger({
  transports: [
    new winston.transports.Console({
      level: 'debug',
      colorize: true
    })
  ]
});

const meta = require('./data/meta').default;
const tags = meta.tags;
const languages = meta.languages;
const backends = require('./data/backend').default;
const databases = require('./data/database').default;
const readings = require('./data/reading').default;
const benchmarks = require('./data/benchmark').default;

// console.log(meta);
// console.log(backends);
// console.log(databases);
// console.log(readings);
// console.log(benchmarks);

// lint
_.forIn(databases, function (db, dbName) {
  // language
  if (!_.includes(languages, db.language)) {
    log.warn('Language ' + db.language + ' is not registered for ' + dbName);
  }
  // backends
  // TODO: check duplicate
  _.forEach(db.backends, function (backend) {
    // check if the backend exists
    if (!_.has(backends, backend)) {
      log.warn('Backend ' + backend + ' is not registered for ' + dbName);
      return;
    }
    // check if this database is added to the backend
    if (!_.includes(backends[backend].databases, dbName)) {
      log.warn('Database ' + dbName + ' is not registered for backend ' + backend);
    }
  });
  // tag
  // TODO: check duplicate
  _.forEach(db.tags, function (tag) {
    if (!_.includes(tags, tag)) {
      log.warn('Tag ' + tag + ' is not registered for ' + dbName);
    }
  });
});
log.info('All check passed! \\w/');

// add language, backends to filter tags, which will be used by the web ui
_.forIn(databases, function (db) {
  let filterTags = [];
  if (typeof db.tags !== 'undefined') {
    filterTags = _.clone(db.tags);
  }
  // language
  if (!_.includes(filterTags, db.language)) {
    filterTags.push(db.language);
  }
  // backends
  _.forEach(db.backends, function (backend) {
    if (!_.includes(filterTags, backend)) {
      filterTags.push(backend);
    }
  });
  db.filterTags = filterTags;
});

const data = {
  backends: backends,
  databases: databases,
  readings: readings,
  benchmarks: benchmarks
};

// Handlerbars helpers
let toRef = (name) => {
  // http://stackoverflow.com/questions/1983648/replace-space-with-dash-and-make-all-letters-lower-case-using-javascript
  return '#' + name.replace(/\s+/g, '-').toLowerCase();
};
hb.registerHelper('toRef', toRef);

// Render and writ to file
let tmpl = hb.compile(fs.readFileSync('README.handlebars', 'utf-8'));
// FIXME: the template generates extra line breaks
// http://stackoverflow.com/questions/10965433/regex-replace-multi-line-breaks-with-single-in-javascript
let out = tmpl(data).replace(/\n\s*\n\s*\n/g, '\n\n');
fs.writeFileSync('README.md', out);
// console.log(out);
log.info('README.md updated! /w\\');
