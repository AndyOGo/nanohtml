var document = require('global/document')
var hyperx = require('hyperx')
var morphdom = require('morphdom')
var css = require('dom-css')

var KEY = 'bel'
var SET_ATTR_PROPS = {
  class: 1,
  value: 1
}
var BOOL_PROPS = {
  autofocus: 1,
  checked: 1,
  defaultChecked: 1,
  disabled: 1,
  formNoValidate: 1,
  indeterminate: 1,
  readOnly: 1,
  required: 1,
  willValidate: 1
}

var hx = hyperx(function createElement (tag, props, children) {
  var el = document.createElement(tag)
  for (var p in props) {
    if (props.hasOwnProperty(p)) {
      var val = props[p]
      // If a pseudo inline style, apply the styles
      if (p === 'style' && typeof val !== 'string') {
        css(el, val)
        continue
      }
      // If a property is boolean, set itself to the key
      if (BOOL_PROPS[p]) {
        if (val === 'true') val = p
        else if (val === 'false') continue
      }
      // If a property prefers setAttribute instead
      if (SET_ATTR_PROPS[p] || BOOL_PROPS[p]) {
        el.setAttribute(p, val)
      } else {
        el[p] = val
      }
    }
  }
  function appendChild (childs) {
    if (!Array.isArray(childs)) return
    for (var i = 0; i < childs.length; i++) {
      var node = childs[i]
      if (Array.isArray(node)) {
        appendChild(node)
        continue
      }

      // TODO: Escaping?

      if (typeof node === 'number' ||
        typeof node === 'boolean' ||
        node instanceof Date ||
        node instanceof RegExp) {
        node = node.toString()
      }

      if (typeof node === 'string') {
        node = document.createTextNode(node)
      }

      if (node && node.nodeName && node.nodeType) {
        el.appendChild(node)
      }
    }
  }
  appendChild(children)

  // TODO: Validation checks
  // TODO: Check for a11y things

  return el
})

// TODO: SVG Support

var id = 0

module.exports = function bel () {
  var el = hx.apply(this, arguments)
  if (!belid(el)) {
    belid(el, id)
    id += 1
  }
  el.update = function (newel) {
    if (typeof newel === 'function') {
      newel = newel()
    }
    belid(newel, belid(el))
    if (el && !el.parentNode) {
      // Lost element, find it
      el = document.querySelector('[data-bel="' + el.dataset.bel + '"]')
    }
    return morphdom(el, newel, {
      getNodeKey: function (el) {
        var id = belid(el)
        return (id) ? id : el.id
      }
    })
  }
  return el
}

if (typeof document !== 'undefined' && document.head && document.head.dataset) {
  function belid (el, val) {
    if (el && el.dataset) {
      if (arguments.length > 1) {
        return el.dataset[KEY] = val
      } else {
        return el.dataset[KEY]
      }
    }
  }
} else {
  function belid (el, val) {
    if (el && typeof el.getAttribute === 'function') {
      if (arguments.length > 1) {
        return el.setAttribute('data-' + KEY, val)
      } else {
        return el.getAttribute('data-' + KEY)
      }
    }
  }
}
