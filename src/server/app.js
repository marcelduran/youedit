/* Copyright (c) 2013, YouEdit */

'use strict';

var express = require('express'),
    Mustache = require('mustache'),
    Polyglot = require('node-polyglot'),
    locale = require('locale'),
    fs = require('fs'),
    path = require('path'),
    config = require('./config/config.json');

// load page template
var filename = path.join(__dirname, config.templates.page);
var pages = {
  main: fs.readFileSync(filename, 'utf8'),
  landing: {},
  watch: {}
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

// initialize express app
var app = express();
app.use(express.compress());
app.use(express.logger());
app.use(locale(i18n.supported));
app.use(express.static(path.resolve(__dirname, './public/')));

function preCompile(template, locale, view) {
  var compiled, content;

  //// i18n
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
    cdn: config.cdn
  };

  // precompile partials
  partials[locale] = {};
  Object.keys(partials.base).forEach(function(name) {
    partials[locale][name] = preCompile(partials.base[name], locale, view);
  });

  return Mustache.compile(preCompile(pages.main, locale, view));
}

// render watch page
function render(locale, title) {
  var compiled = pages.watch[locale];

  if (!compiled) {
    compiled = pages.watch[locale] = compileTemplate(locale, 'watch');
  }

  return compiled({
    title: title,
    mixTitle: title
  }, partials[locale]);
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
      landing = pages.landing[locale] = compileTemplate(locale, 'landing')({
        title: 'YouEd.it'
      }, partials[locale]);
    }
  }

  res.send(landing);
});

// watch page
app.get('/:title', function(req, res) {
  res.send(render(req.locale, req.params.title));
});

app.listen(config.port);
console.log('app listening on port %s', config.port);
