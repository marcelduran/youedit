/* Copyright (c) 2013, YouEdit */

'use strict';

var express = require('express'),
    Mustache = require('mustache'),
    Polyglot = require('node-polyglot'),
    locale = require('locale'),
    fs = require('fs'),
    path = require('path'),
    http = require('http'),
    https = require('https'),
    config = require('./config/config.json');

var reDoubleUnderscores = /\_\_/g,
    reSingleUnderscore = /\_/g,
    reLineBreak = /\n/g;

// load page template
var filename = path.join(__dirname, config.templates.page);
var pages = {
  main: fs.readFileSync(filename, 'utf8'),
  landing: {},
  watch: {},
  edit: {}
};

// load partials
var dir = path.join(__dirname, config.paths.partials);
var files = fs.readdirSync(dir);
var partials = {
  base: {}
};
files.forEach(function eachFile(file) {
  if (path.extname(file) === '.mustache') {
    var name = path.basename(file, '.mustache');
    partials.base[name] = fs.readFileSync(path.join(dir, file), 'utf8');
  }
});

// load i18n
dir = path.join(__dirname, config.paths.i18n);
files = fs.readdirSync(dir);
var i18n = {
  supported: []
};
files.forEach(function eachFile(file) {
  if (path.extname(file) === '.json') {
    var locale = path.basename(file, '.json');
    i18n.supported.push(locale);
    i18n[locale] = new Polyglot({
      locale: locale,
      phrases: JSON.parse(
        fs.readFileSync(path.join(dir, file), 'utf8')
      )
    });
  }
});

function preCompile(template, locale, view) {
  var compiled, content;

  // i18n
  compiled = Mustache.compile(template, ['{{_', '_}}']);
  content = compiled(i18n[locale].t(locale));

  // static
  // dummy _ to bust mustache cache, removed afterwards
  compiled = Mustache.compile('_' + content, ['{{=', '=}}']);
  content = compiled(view).slice(1);

  return content;
}

function compileTemplate(locale, mode) {
  var view = {
    lang: locale.slice(0, 2),
    mode: mode,
    cdn: config.cdn,
    script: {}
  };
  view.script[mode.split(' ')[0]] = true;

  // precompile partials
  partials[locale] = {};
  Object.keys(partials.base).forEach(function(name) {
    partials[locale][name] = preCompile(partials.base[name], locale, view);
  });

  return Mustache.compile(preCompile(pages.main, locale, view));
}

function buildWatchPage(locale, title) {
  var compiled = pages.watch[locale];

  if (!compiled) {
    compiled = pages.watch[locale] = compileTemplate(locale, 'watch');
  }

  return compiled({
    title: title,
    mixTitle: title
  }, partials[locale]);
}

function parseTitle(encodedTitle) {
  return decodeURIComponent(encodedTitle)
    .replace(reDoubleUnderscores, '\n')
    .replace(reSingleUnderscore, ' ')
    .replace(reLineBreak, '_');
}

// page to render
function renderPage(req, res) {
  var page,
      locale = req.locale;

  if (req.query.v || req.query.a) {
    // watch page
    page = buildWatchPage(locale, parseTitle(req.params.title || ''));
  } else {
    if (req.params.title) {
      // edit page
      page = pages.edit[locale];
      if (!page) {
        page = pages.edit[locale] = compileTemplate(locale, 'edit empty')({
          title: parseTitle(req.params.title)
        }, partials[locale]);
      }
    } else {
      // landing page
      page = pages.landing[locale];
      if (!page) {
        page = pages.landing[locale] = compileTemplate(locale, 'landing')({
          title: 'YouEd.it'
        }, partials[locale]);
      }
    }
  }

  res.send(page);
}

// initialize express app
var app = express();
app
  .use(express.compress())
  .use(express.logger())
  .use(locale(i18n.supported))
  .use(express.static(path.resolve(__dirname, './public/')))
  .get('/', renderPage)
  .get('/:title', renderPage);

http.createServer(app).listen(config.port.http);
console.log('app listening on port %s', config.port.http);

// dev only
if (config.env === 'dev') {
  var options = {
    key: fs.readFileSync(path.join(__dirname, 'server-key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'server-cert.pem'))
  };
  https.createServer(options, app).listen(config.port.https);
  console.log('app listening on port %s', config.port.https);
}
