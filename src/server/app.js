/* Copyright (c) 2013, Marcel Duran & Guilherme Neumann */

'use strict';

var express = require('express'),
    Mustache = require('mustache'),
    Polyglot = require('node-polyglot'),
    locale = require('locale'),
    fs = require('fs'),
    path = require('path'),
    config = require('./config/config.json');

// load main page template
var filename = path.join(__dirname, config.templates.main);
var pages = {
  main: fs.readFileSync(filename, 'utf8'),
  landing: {},
  watch: {}
};

// load i18n
var dir = path.join(__dirname, config.paths.i18n);
var files = fs.readdirSync(dir);
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

// initialize web app
var app = express();
app.use(express.compress());
app.use(express.logger());
app.use(locale(i18n.supported));

// render
function render(locale, title) {
  var compiled = pages.watch[locale];

  if (!compiled) {
    compiled = pages.watch[locale] = Mustache.compile(
      Mustache.compile(pages.main, ['{{_', '_}}'])(i18n[locale].t(locale))
    );
  }

  return compiled({
    title: title || 'YouEd.it',
    mode: 'watch',
    cdn: config.cdn
  });
}

// landing page
app.get('/', function(req, res) {
  var landing,
      locale = req.locale;

  if (req.query.v) {
    landing = render(locale);
  } else {
    landing = pages.landing[locale];
    if (!landing) {
      pages.landing[locale] = Mustache.compile(pages.main,
        ['{{_', '_}}'])(i18n[locale].t(locale));
      landing = pages.landing[locale] =
        Mustache.to_html(pages.landing[locale], {
          mode: 'landing',
          title: 'YouEd.it',
          cdn: config.cdn,
          lang: locale.replace('_', '-')
        });
    }
  }

  res.send(landing);
});

// watch page
app.get('/:title', function(req, res) {
  res.send(render(req.locale, req.params.title));
});

app.listen(config.port);
console.log('app listening on port ' + config.port);
