/* Copyright (c) 2013, Marcel Duran & Guilherme Neumann */

'use strict';

var express = require('express'),
    mustache = require('mustache'),
    fs = require('fs'),
    path = require('path'),
    config = require('./config/config.json');

var pages = {};

// load pages
fs.readFile(path.join(__dirname, config.templates.main), function(err, data) {
  pages.main = data.toString();
  pages.landing = mustache.to_html(pages.main, {
    title: 'YouEd.it',
    mode: 'landing',
    cdn: config.cdn
  });
});

// initialize web app
var app = express();
app.use(express.compress());
app.use(express.logger());

// render
function render(title) {
  return mustache.to_html(pages.main, {
    title: title || 'YouEd.it',
    mode: 'watch',
    cdn: config.cdn
  });
}

// landing page
app.get('/', function(req, res) {
  if (req.query.v) {
    res.send(render());
  } else {
    res.send(pages.landing);
  }
});

// watch page
app.get('/:title', function(req, res) {
  res.send(render(req.params.title));
});

app.listen(config.port);
console.log('app listening on port ' + config.port);
