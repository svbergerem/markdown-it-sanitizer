# markdown-it-sanitizer

[![Build Status](https://img.shields.io/travis/svbergerem/markdown-it-sanitizer/master.svg?style=flat)](https://travis-ci.org/svbergerem/markdown-it-sanitizer)
[![Coverage Status](https://img.shields.io/coveralls/svbergerem/markdown-it-sanitizer/master.svg?style=flat)](https://coveralls.io/r/svbergerem/markdown-it-sanitizer?branch=master)
[![npm version](https://img.shields.io/npm/v/markdown-it-sanitizer.svg?style=flat)](https://npmjs.com/package/markdown-it-sanitizer)

> sanitizer plugin for [markdown-it](https://github.com/markdown-it/markdown-it) markdown parser.

## Install

node.js, bower:

```bash
npm install markdown-it-sanitizer --save
bower install markdown-it-sanitizer --save
```

## Use

#### Basic

```js
var md = require('markdown-it')({ html: true })
            .use(require('markdown-it-sanitizer'));

md.render('<b>test<p></b>'); // => '<p><b>test</b></p>'
```

_Differences in browser._ If you load the script directly into the page, without
package system, module will add itself globally as `window.markdownitSanitizer`.

## License

[MIT](https://github.com/svbergerem/markdown-it-sanitizer/blob/master/LICENSE)
