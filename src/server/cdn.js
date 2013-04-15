/* Copyright (c) 2013, Marcel Duran & Guilherme Neumann */

'use strict';

var express = require('express'),
    path = require('path');

var cdn = express();
cdn.use(express.compress());
cdn.use(express.logger());
cdn.use(express.static(path.resolve(__dirname, './public/')));
cdn.listen(9000);
console.log('cdn listening on port 9000');
