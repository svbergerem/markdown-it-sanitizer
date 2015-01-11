// Sanitizer

'use strict';

module.exports = function sanitizer_plugin(md) {

  var urlRegex = require('url-regex')({ exact: true })
                 // take the regexp from url-regex
                 .toString()
                 // remove surrounding /(?:^ and $)/i
                 .slice(5, -4);
  var escapeHtml = md.utils.escapeHtml;


  function stripTags(state) {
    // <a href="url" title="(optional)"></a>
    var patternLinkOpen = '<a\\shref="(' + urlRegex + ')"(?:\\stitle="([^"<>]*)")?>';
    var regexpLinkOpen = RegExp(patternLinkOpen, 'i');
    // <img src="url" alt=""(optional) title=""(optional)>
    var patternImage = '<img\\ssrc="(' + urlRegex + ')"(?:\\salt="([^"<>]*)")?(?:\\stitle="([^"<>]*)")?\\s?\\/?>';
    var regexpImage = RegExp(patternImage, 'i');

    state.src = state.src.replace(/<[^>]*>?/gi, function (tag) {
      var match, url, alt, title;

      if (/(^<->|^<-\w|^<3\w)/.test(tag)) { return tag; }

      match = tag.match(regexpImage);
      if (match) {
        url   = match[1];
        alt   = (typeof match[2] !== 'undefined') ? match[2] : '';
        title = (typeof match[3] !== 'undefined') ? match[3] : '';
        return '<img src="' + url + '" alt="' + alt + '" title="' + title + '">';
      }

      match = tag.match(regexpLinkOpen);
      if (match) {
        url   = match[1];
        title = (typeof match[2] !== 'undefined') ? match[2] : '';
        return '<a href="' + url + '" title="' + title + '" target="_blank" sanitize>';
      }

      match = tag.match(/<\/a>/i);
      if (match) {
        return '</a sanitize>';
      }

      match = tag.match(/<(br|hr)\s?\/?>/i);
      if (match) {
        return '<' + match[1].toLowerCase() + '>';
      }

      match = tag.match(/<(\/?)(b|blockquote|code|em|h[1-6]|li|ol(?: start="\d+")?|p|pre|sub|sup|strong|strike|ul)>/i);
      if (match && !/<\/ol start="\d+"/i.test(tag)) {
        return '<' + match[1] + match[2].toLowerCase() + ' sanitize>';
      }

      return escapeHtml(tag);
    });
  }


  function balance(state) {

    // <a href="url" title="(optional)" target="_blank" sanitize>
    var regexpLinkOpen = RegExp('<a href="' + urlRegex + '" title="[^"<>]*" target="_blank" sanitize>', 'g');
    var regexpTag = /<(b|blockquote|code|em|h[1-6]|li|ol(?: start="\d+")?|p|pre|sub|sup|strong|strike|ul) sanitize>/;

    var match,
        pairIndex,
        startpos,
        endpos,
        tagName,
        src = state.src,
        srcOld;

    // pair links
    for (match = src.match(regexpLinkOpen); match !== null; match = src.match(regexpLinkOpen)) {
      startpos = src.indexOf(match[0]);
      endpos   = startpos + match[0].length;
      pairIndex = src.indexOf('</a sanitize>', endpos);
      if (pairIndex >= 0) {
        srcOld = src;
        // ' sanitize>'.length = 10
        // '</a sanitize>'.length = 13
        src = srcOld.slice(0, endpos - 10) + '>' + srcOld.slice(endpos, pairIndex)
            + '</a>' + srcOld.slice(pairIndex + 13);
      } else {
        src = src.replace(match[0], '');
      }
    }
    // remove remaining </a sanitize>
    src = src.replace(/<\/a sanitize>/g, '');

    // pair other tags
    for (match = src.match(regexpTag); match !== null; match = src.match(regexpTag)) {
      // ol start="5" -> ol
      tagName = match[1].split(' ')[0];
      startpos = src.indexOf(match[0]);
      endpos   = startpos + match[0].length;
      pairIndex = src.indexOf('</' + tagName + ' sanitize>', endpos);
      if (pairIndex >= 0) {
        srcOld = src;
        // ' sanitize>'.length = 10
        // '</tagName sanitize>.length = tagName.length + 12
        src = srcOld.slice(0, endpos - 10) + '>' + srcOld.slice(endpos, pairIndex)
            + '</' + tagName + '>' + srcOld.slice(pairIndex + tagName.length + 12);
      } else {
        src = src.replace(match[0], '');
      }
    }
    // remove remaining </tagName sanitize>
    src = src.replace(/<\/\w+ sanitize>/g, '');

    state.src = src;
  }

  md.core.ruler.after('normalize', 'sanitize_strip', stripTags);
  md.core.ruler.after('sanitize_strip', 'sanitize_balance', balance);
};
