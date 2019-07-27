import Point from '@mapbox/point-geometry';

/**
 * 生成随机字符串
 * @returns {*}
 */
const uuid = () => {
  function b(a) {
    return a ? (a ^ Math.random() * 16 >> a / 4).toString(16) : ([1e7] + -[1e3] + -4e3 + -8e3 + -1e11).replace(/[018]/g, b);
  }
  return b();
};
/**
 * 缓存一个标识
 * @param obj
 * @returns {*}
 */
const stamp = function (obj) {
  const key = '_event_id_';
  obj[key] = obj[key] || (uuid());
  return obj[key];
};

const docStyle = window.document ? window.document.documentElement.style : null;

const anchorTranslate = {
  center: 'translate(-50%,-50%)',
  top: 'translate(-50%,0)',
  'top-left': 'translate(0,0)',
  'top-right': 'translate(-100%,0)',
  bottom: 'translate(-50%,-100%)',
  'bottom-left': 'translate(0,-100%)',
  'bottom-right': 'translate(-100%,-100%)',
  left: 'translate(0,-50%)',
  right: 'translate(-100%,-50%)',
};

/**
 * style相关的回退操作
 * @param props
 * @returns {*}
 */
function testProp(props) {
  if (!docStyle) return null;
  for (let i = 0; i < props.length; i++) {
    if (props[i] in docStyle) {
      return props[i];
    }
  }
  return props[0];
}

/**
 * dom 创建
 * @param tagName
 * @param className
 * @param container
 * @returns {HTMLElement}
 */
const create = function (tagName, className, container) {
  const el = window.document.createElement(tagName);
  if (className) el.className = className;
  if (container) container.appendChild(el);
  return el;
};

/**
 * 移除当前节点
 * @param node
 */
const remove = function (node) {
  if (node.parentNode) {
    node.parentNode.removeChild(node);
  }
};

const transformProp = testProp(['transform', 'WebkitTransform']);

/**
 * 设置2d平移转换
 * @param el
 * @param value
 */
const setTransform = function (el, value) {
  el.style[transformProp] = value;
};

/**
 * 处理气泡信息窗的锚点className
 * @param element
 * @param anchor
 * @param prefix
 */
const applyAnchorClass = (element, anchor, prefix) => {
  const { classList } = element;
  for (const key in anchorTranslate) {
    classList.remove(`mapboxgl-${prefix}-anchor-${key}`);
  }
  classList.add(`mapboxgl-${prefix}-anchor-${anchor}`);
};

/**
 * 获取事件唯一标识
 * @param type
 * @param fn
 * @param context
 * @returns {string}
 */
const getDomEventKey = (type, fn, context) => `_dom_event_${type}_${stamp(fn)}${context ? `_${stamp(context)}` : ''}`;

/**
 * 对DOM对象添加事件监听
 * @param element
 * @param type
 * @param fn
 * @param context
 * @param isOnce
 * @returns {*}
 */
const addListener = function (element, type, fn, context, isOnce) {
  const eventKey = getDomEventKey(type, fn, context);
  let handler = element[eventKey];
  if (handler) {
    if (!isOnce) {
      handler.callOnce = false;
    }
    return this;
  }
  handler = function (e) {
    return fn.call(context || element, e);
  };
  if ('addEventListener' in element) {
    element.addEventListener(type, handler, false);
  } else if ('attachEvent' in element) {
    element.attachEvent(`on${type}`, handler);
  }
  element[eventKey] = handler;
  return this;
};

const on = addListener;

/**
 * 移除DOM对象监听事件
 * @param element
 * @param type
 * @param fn
 * @param context
 * @returns {removeListener}
 */
const removeListener = function (element, type, fn, context) {
  const eventKey = getDomEventKey(type, fn, context);
  const handler = element[eventKey];
  if (!handler) {
    return this;
  }
  if ('removeEventListener' in element) {
    element.removeEventListener(type, handler, false);
  } else if ('detachEvent' in element) {
    element.detachEvent(`on${type}`, handler);
  }
  element[eventKey] = null;
  return this;
};

const off = removeListener;

/**
 * attach events once
 * @param element
 * @param type
 * @param fn
 * @param context
 * @returns {*}
 */
const once = function (element, type, fn, context) {
  return addListener(element, type, fn, context, true);
};

/**
 * Prevent default behavior of the browser.
 * @param event
 * @returns {preventDefault}
 */
const preventDefault = function (event) {
  if (event.preventDefault) {
    event.preventDefault();
  } else {
    event.returnValue = false;
  }
  return this;
};

/**
 * Stop browser event propagation
 * @param event
 * @returns {stopPropagation}
 */
const stopPropagation = function (event) {
  if (event.stopPropagation) {
    event.stopPropagation();
  } else {
    event.cancelBubble = true;
  }
  return this;
};

const mousePos = (el, e) => {
  const rect = el.getBoundingClientRect();
  e = e.touches ? e.touches[0] : e;
  return new Point(
    e.clientX - rect.left - el.clientLeft,
    e.clientY - rect.top - el.clientTop,
  );
};

export {
  on,
  off,
  once,
  create,
  remove,
  mousePos,
  // animate,
  setTransform,
  applyAnchorClass,
  anchorTranslate,
  addListener,
  removeListener,
  preventDefault,
  stopPropagation,
};
