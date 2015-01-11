'use strict';

var path     = require('path');
var generate = require('markdown-it-testgen');

/*eslint-env mocha*/

describe('markdown-it-sanitizer', function () {
  var md, inline, sub, sup, hashtag, mention;

  beforeEach(function () {
    md = require('markdown-it')({
      html: true,
      langPrefix: '',
      typographer: true,
      linkify: true
    });
  });

  it('sanitizes the input', function () {
    md.use(require('../'));
    generate(path.join(__dirname, 'fixtures/sanitizer/default.txt'), md);
  });

  it('works with common plugins on real world examples', function () {
    inline  = require('markdown-it-for-inline');
    sub     = require('markdown-it-sub');
    sup     = require('markdown-it-sup');
    hashtag = require('markdown-it-hashtag');
    mention = require('markdown-it-diaspora-mention');

    md.use(require('../'))
      .set({
        breaks:      true,
        linkify:     true,
        typographer: true
      })
      .use(inline, 'utf8_symbols', 'text', function (tokens, idx) {
        tokens[idx].content = tokens[idx].content.replace(/<->/g, '↔')
                                                 .replace(/<-/g,  '←')
                                                 .replace(/->/g,  '→')
                                                 .replace(/<3/g,  '♥');
      })
      .use(sub)
      .use(sup)
      .use(inline, 'link_new_window', 'link_open', function (tokens, idx) {
        tokens[idx].target = '_blank';
      })
      .use(hashtag)
      .use(mention, {
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
        });

    // Bootstrap table markup
    md.renderer.rules.table_open = function () { return '<table class="table table-striped">\n'; };

    generate(path.join(__dirname, 'fixtures/examples'), md);
  });
});
