// Sanitizer

'use strict';

module.exports = function sanitizer_plugin(md, options) {

  var urlRegex = require('url-regex')({ exact: true })
                 // take the regexp from url-regex
                 .toString()
                 // remove surrounding /(?:^ and $)/i
                 .slice(5, -4),
      escapeHtml = md.utils.escapeHtml;

  options = options ? options : {};
  var removeUnknown = (typeof options.removeUnknown !== 'undefined') ? options.removeUnknown : false;
  var removeUnbalanced = (typeof options.removeUnbalanced !== 'undefined') ? options.removeUnbalanced : false;

  function stripTags(state) {
    // <a href="url" title="(optional)"></a>
    var patternLinkOpen = '<a\\shref="(' + urlRegex + ')"(?:\\stitle="([^"<>]*)")?>';
    var regexpLinkOpen = RegExp(patternLinkOpen, 'i');
    // <img src="url" alt=""(optional) title=""(optional)>
    var patternImage = '<img\\ssrc="(' + urlRegex + ')"(?:\\salt="([^"<>]*)")?(?:\\stitle="([^"<>]*)")?\\s?\\/?>';
    var regexpImage = RegExp(patternImage, 'i');

    /*
     * it starts with '<' and maybe ends with '>',
     * maybe has a '<' on the right
     * it doesnt have '<' or '>' in between
     * -> it's a tag!
     */
    state.src = state.src.replace(/<[^<>]*>?/gi, function (tag) {
      var match, url, alt, title;

      // '<->', '<- ' and '<3 ' look nice, they are harmless
      if (/(^<->|^<-\s|^<3\s)/.test(tag)) { return tag; }

      // images
      match = tag.match(regexpImage);
      if (match) {
        url   = match[1];
        alt   = (typeof match[2] !== 'undefined') ? match[2] : '';
        title = (typeof match[3] !== 'undefined') ? match[3] : '';
        // only http and https are allowed for images
        if (/^https?:\/\//i.test(url)) {
          return '<img src="' + url + '" alt="' + alt + '" title="' + title + '">';
        }
      }

      // links
      match = tag.match(regexpLinkOpen);
      if (match) {
        url   = match[1];
        title = (typeof match[2] !== 'undefined') ? match[2] : '';
        // only http, https, ftp, mailto and xmpp are allowed for links
        if (/^(?:https?:\/\/|ftp:\/\/|mailto:|xmpp:)/i.test(url)) {
          return '<a href="' + url + '" title="' + title + '" target="_blank" sanitize>';
        }
      }
      match = tag.match(/<\/a>/i);
      if (match) {
        return '</a sanitize>';
      }

      // standalone tags
      match = tag.match(/<(br|hr)\s?\/?>/i);
      if (match) {
        return '<' + match[1].toLowerCase() + '>';
      }

      // whitelisted tags
      match = tag.match(/<(\/?)(b|blockquote|code|em|h[1-6]|li|ol(?: start="\d+")?|p|pre|s|sub|sup|strong|ul)>/i);
      if (match && !/<\/ol start="\d+"/i.test(tag)) {
        return '<' + match[1] + match[2].toLowerCase() + ' sanitize>';
      }

      // other tags we don't recognize
      if (removeUnknown === true) {
        return '';
      }
      return escapeHtml(tag);
    });
  }


  function balance(state) {

    // <a href="url" title="(optional)" target="_blank" sanitize>
    var regexpLinkOpen = RegExp('<a href="' + urlRegex + '" title="[^"<>]*" target="_blank" sanitize>', 'g');
    var regexpTag = /<(b|blockquote|code|em|h[1-6]|li|ol(?: start="\d+")?|p|pre|s|sub|sup|strong|ul) sanitize>/;

    var match,
        regexp,
        startpos,
        endpos,
        closingpos,
        tagname,
        src = state.src;

    // ' sanitize>'.length = 10
    function removeSanitize(tag) { return tag.slice(0, -10) + '>'; }

    // for two matching tags this removes the ' sanitize'
    function desanitizeMatchingTags(string, tagname, startpos, endpos, closingpos) {
      return removeSanitize(string.slice(0, endpos))         // the opening tag without ' sanitize'
           + string.slice(endpos, closingpos)                // everything between opening and closing tag
           + '</' + tagname + '>'                            // the closing tag
           + string.slice(closingpos + tagname.length + 12); // everything behind the closing tag
                                                             // ('</' + ' sanitize>').length = 12
    }

    function replaceUnbalancedTag(string, tag) {
      if (removeUnbalanced === true) {
        string = string.replace(tag, '');
      } else {
        string = string.replace(tag, function(m) { return escapeHtml(removeSanitize(m)); });
      }
      return string;
    }

    // pair links
    for (match = src.match(regexpLinkOpen); match !== null; match = src.match(regexpLinkOpen)) {
      tagname = 'a';
      startpos = src.indexOf(match[0]);
      endpos   = startpos + match[0].length;
      closingpos = src.indexOf('</a sanitize>', endpos);

      if (closingpos >= 0) { // we found a closing tag
        src = desanitizeMatchingTags(src, tagname, startpos, endpos, closingpos);
      } else { // no closing tag -> replace
        src = replaceUnbalancedTag(src, match[0]);
      }
    }

    // remaining </a sanitize>
    regexp = /<\/a sanitize>/g;
    while (regexp.test(src) === true) {
      src = replaceUnbalancedTag(src, regexp);
    }

    // pair other tags
    for (match = src.match(regexpTag); match !== null; match = src.match(regexpTag)) {
      // ol start="5" -> ol
      tagname = match[1].split(' ')[0];
      startpos = src.indexOf(match[0]);
      endpos   = startpos + match[0].length;
      closingpos = src.indexOf('</' + tagname + ' sanitize>', endpos);

      if (closingpos >= 0) { // we found a closing tag
        src = desanitizeMatchingTags(src, tagname, startpos, endpos, closingpos);
      } else { // no closing tag -> replace
        src = replaceUnbalancedTag(src, match[0]);
      }
    }

    // remaining </tagName sanitize>
    regexp = /<\/\w+ sanitize>/g;
    while (regexp.test(src) === true) {
      src = replaceUnbalancedTag(src, regexp);
    }

    state.src = src;
  }

  md.core.ruler.after('normalize', 'sanitize_strip', stripTags);
  md.core.ruler.after('sanitize_strip', 'sanitize_balance', balance);
};
