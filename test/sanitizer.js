'use strict';

var path     = require('path');
var generate = require('markdown-it-testgen');
var markdownIt = require('markdown-it'),
    inline     = require('markdown-it-for-inline'),
    sub        = require('markdown-it-sub'),
    sup        = require('markdown-it-sup'),
    hashtag    = require('markdown-it-hashtag'),
    mention    = require('markdown-it-diaspora-mention');

describe('markdown-it-sanitizer', function () {
  var md;

  beforeEach(function () {
    md = markdownIt({
      html:        true,
      langPrefix:    '',
      typographer: true,
      linkify:     true
    });
    md.linkify.add('xmpp:', 'mailto:');
  });

  it('sanitizes the input with default values (both false)', function () {
    md.use(require('../'));
    generate(path.join(__dirname, 'fixtures/sanitizer/base.txt'), md);
    generate(path.join(__dirname, 'fixtures/sanitizer/imagesBase.txt'), md);
    generate(path.join(__dirname, 'fixtures/sanitizer/keepAll.txt'), md);
  });

  it('accepts removeUnknown as an option', function () {
    md.use(require('../'), { removeUnbalanced: false, removeUnknown: true });
    generate(path.join(__dirname, 'fixtures/sanitizer/base.txt'), md);
    generate(path.join(__dirname, 'fixtures/sanitizer/imagesBase.txt'), md);
    generate(path.join(__dirname, 'fixtures/sanitizer/removeUnknown.txt'), md);
  });

  it('accepts removeUnbalanced as an option', function () {
    md.use(require('../'), { removeUnbalanced: true, removeUnknown: false });
    generate(path.join(__dirname, 'fixtures/sanitizer/base.txt'), md);
    generate(path.join(__dirname, 'fixtures/sanitizer/imagesBase.txt'), md);
    generate(path.join(__dirname, 'fixtures/sanitizer/removeUnbalanced.txt'), md);
  });

  it('accepts removeUnknown and removeUnbalanced as options', function () {
    md.use(require('../'), { removeUnbalanced: true, removeUnknown: true });
    generate(path.join(__dirname, 'fixtures/sanitizer/base.txt'), md);
    generate(path.join(__dirname, 'fixtures/sanitizer/imagesBase.txt'), md);
    generate(path.join(__dirname, 'fixtures/sanitizer/removeBoth.txt'), md);
  });

  it('accepts imageClass as an option', function () {
    md.use(require('../'), { imageClass: 'img-responsive' });
    generate(path.join(__dirname, 'fixtures/sanitizer/base.txt'), md);
    generate(path.join(__dirname, 'fixtures/sanitizer/imagesClass.txt'), md);
    generate(path.join(__dirname, 'fixtures/sanitizer/keepAll.txt'), md);
  });

  it('only accepts a few protocolls for urls', function () {
    md.use(require('../'));
    generate(path.join(__dirname, 'fixtures/sanitizer/urls.txt'), md);
  });

  it('keeps other commonmark features', function () {
    md.use(require('../'));
    generate(path.join(__dirname, 'fixtures/sanitizer/notags.txt'), md);
  });

  it('works with other plugins on real world examples', function () {
    md.use(require('../'), { removeUnbalanced: false, removeUnknown: false })
      .set({ breaks: true })
      .use(inline, 'utf8_symbols', 'text', function (tokens, idx) {
        tokens[idx].content = tokens[idx].content.replace(/<->/g, '↔')
                                                 .replace(/<-/g,  '←')
                                                 .replace(/->/g,  '→')
                                                 .replace(/<3/g,  '♥');
      })
      .use(sub)
      .use(sup)
      .use(inline, 'link_new_window', 'link_open', function (tokens, idx) {
        tokens[idx].attrPush([ 'target', '_blank' ]);
      })
      .use(hashtag, {
        hashtagRegExp: '[\\u0080-\\uFFFF\\w\\-]+|<3',
        preceding: '^|\\s'
      })
      .use(mention, {
        mentions: [
          {
            diaspora_id: 'user@pod.tld',
            guid: 1337
          },
          {
            diaspora_id: 'evil@pod.tld',
            guid: 666
          },
          {
            handle: 'foo@bar.baz',
            url: '/my/awesome/url',
            guid: 42
          }
        ]
      });
    // Bootstrap table markup
    md.renderer.rules.table_open = function () { return '<table class="table table-striped">\n'; };
    generate(path.join(__dirname, 'fixtures/examples'), md);
  });
});
