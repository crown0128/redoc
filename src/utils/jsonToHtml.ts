let level = 1;
const COLLAPSE_LEVEL = 2;

export function jsonToHTML(json) {
  level = 1;
  let output = '';
  output += '<div class="redoc-json">';
  output += valueToHTML(json);
  output += '</div>';
  return output;
}

function htmlEncode(t) {
  return t !== undefined
    ? t
        .toString()
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
    : '';
}

function decorateWithSpan(value, className) {
  return '<span class="' + className + '">' + htmlEncode(value) + '</span>';
}

function punctuation(val) {
  return '<span class="token punctuation">' + val + '</span>';
}

function valueToHTML(value) {
  const valueType = typeof value;
  let output = '';
  if (value === undefined || value === null) {
    output += decorateWithSpan('null', 'token keyword');
  } else if (value && value.constructor === Array) {
    level++;
    output += arrayToHTML(value);
    level--;
  } else if (value && value.constructor === Date) {
    output += decorateWithSpan('"' + value.toISOString() + '"', 'token string');
  } else if (valueType === 'object') {
    level++;
    output += objectToHTML(value);
    level--;
  } else if (valueType === 'number') {
    output += decorateWithSpan(value, 'token number');
  } else if (valueType === 'string') {
    if (/^(http|https):\/\/[^\s]+$/.test(value)) {
      output +=
        decorateWithSpan('"', 'token string') +
        '<a href="' +
        value +
        '">' +
        htmlEncode(value) +
        '</a>' +
        decorateWithSpan('"', 'token string');
    } else {
      output += decorateWithSpan('"' + value + '"', 'token string');
    }
  } else if (valueType === 'boolean') {
    output += decorateWithSpan(value, 'token boolean');
  }

  return output;
}

function arrayToHTML(json) {
  const collapsed = level > COLLAPSE_LEVEL ? 'collapsed' : '';
  let output = `<div class="collapser"></div>${punctuation(
    '[',
  )}<span class="ellipsis"></span><ul class="array collapsible">`;
  let hasContents = false;
  const length = json.length;
  for (let i = 0; i < length; i++) {
    hasContents = true;
    output += '<li><div class="hoverable ' + collapsed + '">';
    output += valueToHTML(json[i]);
    if (i < length - 1) {
      output += ',';
    }
    output += '</div></li>';
  }
  output += `</ul>${punctuation(']')}`;
  if (!hasContents) {
    output = punctuation('[ ]');
  }
  return output;
}

function objectToHTML(json) {
  const collapsed = level > COLLAPSE_LEVEL ? 'collapsed' : '';
  const keys = Object.keys(json);
  const length = keys.length;
  let output = `<div class="collapser"></div>${punctuation(
    '{',
  )}<span class="ellipsis"></span><ul class="obj collapsible">`;
  let hasContents = false;
  for (let i = 0; i < length; i++) {
    const key = keys[i];
    hasContents = true;
    output += '<li><div class="hoverable ' + collapsed + '">';
    output += '<span class="property token string">"' + htmlEncode(key) + '"</span>: ';
    output += valueToHTML(json[key]);
    if (i < length - 1) {
      output += punctuation(',');
    }
    output += '</div></li>';
  }
  output += `</ul>${punctuation('}')}`;
  if (!hasContents) {
    output = punctuation('{ }');
  }
  return output;
}
