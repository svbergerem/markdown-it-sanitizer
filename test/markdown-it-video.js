'use strict';

var path = require('path');
var generate = require('markdown-it-testgen');
var video = require('markdown-it-video');

describe('sanitzier + markdown-it-video', function () {
  var md = require('markdown-it')({
    html: true,
    langPrefix: '',
    typographer: true,
    linkify: true
  });

  md.use(video);

  it('works with default values (both false)', function () {
    md.use(require('../'));
    generate(path.join(__dirname, 'fixtures/vendor/markdown-it-video'), md);
  });

  it('works with removeUnknown as an option', function () {
    md.use(require('../'), { removeUnbalanced: false, removeUnknown: true });
    generate(path.join(__dirname, 'fixtures/vendor/markdown-it-video'), md);
  });

  it('works with removeUnbalanced as an option', function () {
    md.use(require('../'), { removeUnbalanced: true, removeUnknown: false });
    generate(path.join(__dirname, 'fixtures/vendor/markdown-it-video'), md);
  });

  it('works with removeUnknown and removeUnbalanced as options', function () {
    md.use(require('../'), { removeUnbalanced: true, removeUnknown: true });
    generate(path.join(__dirname, 'fixtures/vendor/markdown-it-video'), md);
  });
});
