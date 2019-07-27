import get from 'lodash/get';
import set from 'lodash/set';
import mapboxgl from 'mapbox-gl';
import extend from 'lodash/extend';
import Point from '@mapbox/point-geometry';
import { bindAll } from './utils';
import { smartWrap } from './geometry';
import {
  remove, create,
  setTransform, applyAnchorClass,
  anchorTranslate,
} from './dom';

const { LngLat } = mapboxgl;

const defaultOptions = {
  closeButton: false,
  closeOnClick: false,
  showAngle: false,
  className: '',
};

class Label extends mapboxgl.Popup {
  constructor(options = {}) {
    const _options = extend(Object.create(defaultOptions), options);
    super(_options);
    if (_options.id) {
      this._id = _options.id;
    }
    bindAll(['_update', '_onClickClose'], this);
  }

  addTo(map) {
    this._map = map;
    this._map.on('move', this._update);
    if (this.options.closeOnClick) {
      this._map.on('click', this._onClickClose);
    }
    this._update();
    this.fire(new Event('open'));
    return this;
  }

  isOpen() {
    return !!this._map;
  }

  remove() {
    if (this._content) {
      remove(this._content);
    }
    if (this._container) {
      remove(this._container);
      delete this._container;
    }
    if (this._map) {
      this._map.off('move', this._update);
      this._map.off('click', this._onClickClose);
      delete this._map;
    }
    this.fire(new Event('close'));
    return this;
  }

  getLngLat() {
    return this._lngLat;
  }

  setLngLat(lnglat) {
    this._lngLat = LngLat.convert(lnglat);
    this._pos = null;
    this._update();
    return this;
  }

  setText(text) {
    return this.setDOMContent(window.document.createTextNode(text));
  }

  setHTML(html) {
    const frag = window.document.createDocumentFragment();
    const temp = window.document.createElement('body');
    let child;
    temp.innerHTML = html;
    while (true) { // eslint-disable-line
      child = temp.firstChild;
      if (!child) break;
      frag.appendChild(child);
    }
    return this.setDOMContent(frag);
  }

  setDOMContent(htmlNode) {
    this._htmlNode = htmlNode;
    this._createContent();
    this._content.appendChild(htmlNode);
    this._update();
    return this;
  }

  /**
   * 设获取容器
   * @returns {*}
   */
  getDOMContent() {
    return this._htmlNode;
  }

  _createContent() {
    if (this._content) {
      remove(this._content);
    }
    const { className } = this.options;
    this._content = create('div', `${className}-content`, this._container);

    if (this.options.closeButton) {
      this._closeButton = create('button', 'mapboxgl-label-close-button', this._content);
      this._closeButton.type = 'button';
      this._closeButton.setAttribute('aria-label', 'Close popup');
      this._closeButton.innerHTML = '&#215;';
      this._closeButton.addEventListener('click', this._onClickClose);
    }
  }

  /**
   * 设置一个属性字段
   * @param key
   * @param value
   */
  setProp(key, value) {
    set(this.options, key, value);
  }

  /**
   * 获取属性字段
   * @param key
   * @returns {*}
   */
  getProp(key) {
    return get(this.options, key);
  }

  /**
   * set id
   * @param id
   * @returns {Label}
   */
  setId(id) {
    if (!id) return this;
    set(this.options, 'id', id);
    this._id = id;
    return this;
  }

  /**
   * get id
   * @returns {*}
   */
  getId() {
    return this._id;
  }

  _update() {
    if (!this._map || !this._lngLat || !this._content) { return; }

    if (!this._container) {
      this._container = create('div', 'mapboxgl-label', this._map.getContainer());
      if (this.options.showAngle) {
        this._tip = create('div', 'mapboxgl-label-tip', this._container);
      }
      this._container.appendChild(this._content);

      if (this.options.className) {
        this.options.className.split(' ').forEach(name => this._container.classList.add(name));
      }
    }

    if (this._map.transform.renderWorldCopies) {
      this._lngLat = smartWrap(this._lngLat, this._pos, this._map.transform);
    }

    const pos = this._pos = this._map.project(this._lngLat);

    let { anchor } = this.options;
    const offset = normalizeOffset(this.options.offset);

    if (!anchor) {
      const width = this._container.offsetWidth;
      const height = this._container.offsetHeight;
      let anchorComponents;

      if (pos.y + offset.bottom.y < height) {
        anchorComponents = ['top'];
      } else if (pos.y > this._map.transform.height - height) {
        anchorComponents = ['bottom'];
      } else {
        anchorComponents = [];
      }

      if (pos.x < width / 2) {
        anchorComponents.push('left');
      } else if (pos.x > this._map.transform.width - width / 2) {
        anchorComponents.push('right');
      }

      if (anchorComponents.length === 0) {
        anchor = 'bottom';
      } else {
        anchor = (anchorComponents.join('-'));
      }
    }
    const offsetedPos = pos.add(offset[anchor]).round();
    setTransform(this._container, `${anchorTranslate[anchor]} translate(${offsetedPos.x}px,${offsetedPos.y}px)`);
    applyAnchorClass(this._container, anchor, 'popup');
  }

  _onClickClose() {
    this.remove();
  }
}

function normalizeOffset(offset) {
  if (!offset) {
    return normalizeOffset(new Point(0, 0));
  } if (typeof offset === 'number') {
    const cornerOffset = Math.round(Math.sqrt(0.5 * Math.pow(offset, 2)));
    return {
      center: new Point(0, 0),
      top: new Point(0, offset),
      'top-left': new Point(cornerOffset, cornerOffset),
      'top-right': new Point(-cornerOffset, cornerOffset),
      bottom: new Point(0, -offset),
      'bottom-left': new Point(cornerOffset, -cornerOffset),
      'bottom-right': new Point(-cornerOffset, -cornerOffset),
      left: new Point(offset, 0),
      right: new Point(-offset, 0),
    };
  } if (offset instanceof Point || Array.isArray(offset)) {
    const convertedOffset = Point.convert(offset);
    return {
      center: convertedOffset,
      top: convertedOffset,
      'top-left': convertedOffset,
      'top-right': convertedOffset,
      bottom: convertedOffset,
      'bottom-left': convertedOffset,
      'bottom-right': convertedOffset,
      left: convertedOffset,
      right: convertedOffset,
    };
  }
  return {
    center: Point.convert(offset.center || [0, 0]),
    top: Point.convert(offset.top || [0, 0]),
    'top-left': Point.convert(offset['top-left'] || [0, 0]),
    'top-right': Point.convert(offset['top-right'] || [0, 0]),
    bottom: Point.convert(offset.bottom || [0, 0]),
    'bottom-left': Point.convert(offset['bottom-left'] || [0, 0]),
    'bottom-right': Point.convert(offset['bottom-right'] || [0, 0]),
    left: Point.convert(offset.left || [0, 0]),
    right: Point.convert(offset.right || [0, 0]),
  };
}

export default Label;
