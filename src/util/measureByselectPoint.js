// import Label from '../js/label';

/*
 * @Description: 通过选择点来进行测距
 * @Author: scf
 * @Date: 2019-07-27 14:21:19
 * @LastEditors: scf
 * @LastEditTime: 2019-07-27 18:24:17
 */
// const MeasureBySelectedPoint = {

// }

// MeasureBySelectedPoint.begin = {}

// 通过选择点去进行测距的处理

class MeasureBySelectedPoint {
  constructor(map) {
    this.map = map;
    this.layerId = 'MeasureBySelectedPoint_layer';
    this.sourceId = 'MeasureBySelectedPoint_source';
    this.layer = {};
    this.begin();
  }


  initLayer() {
    const LINE_FEATURES = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: CURRENT_NODE_COOR_COLLEC,
      },
    };
    const sourceGeoJson = {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [LINE_FEATURES],
      },
    };
    this.layer = this.map.addLayer({

    });
  }

  /**
   * @description: 初始化提示框
   */
  initHelperLabel() {
    this.helperLabel = new Label({
      offset: [25, 0],
      anchor: 'top-left',
      className: 'kyemap-measure-tip', // todo 修改成自动加载的类名
    });
  }

  /**
   * @description: 测距开始之前所有的初始化工作
   * @param {type}
   * @return: undefined
   */
  init() {
    this.initLayer();
    this.initLayer();
  }

  begin() {
    this.init();
  }
}

export default MeasureBySelectedPoint;
