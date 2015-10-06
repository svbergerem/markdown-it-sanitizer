'use strict';

var path = require('path');
var generate = require('markdown-it-testgen');
var video = require('markdown-it-video');

describe('markdown-it-video', function () {
  var md = require('markdown-it')({
    html: true,
    langPrefix: '',
    typographer: true,
    linkify: true
  });

  md.use(require('../')).use(video);
  generate(path.join(__dirname, 'fixtures/vendor/markdown-it-video'), md);
});
