import merge from 'lodash/merge';
import mapboxgl from 'mapbox-gl';
import GeoJSON from 'ol/format/GeoJSON';
import WKT from 'ol/format/WKT';
import forEach from 'lodash/forEach';

const Wkt = new WKT();

const { LngLat } = mapboxgl;
const GeoJSONFormater = new GeoJSON();

/**
 * 循环存取坐标
 * @param geojson
 * @returns {*}
 */
const getCoordinatesLoop = (geojson) => {
  let coords;
  if (geojson.type === 'Point') {
    coords = [geojson.coordinates];
  } else if (geojson.type === 'LineString' || geojson.type === 'MultiPoint') {
    coords = geojson.coordinates;
  } else if (geojson.type === 'Polygon' || geojson.type === 'MultiLineString') {
    coords = geojson.coordinates.reduce((dump, part) => dump.concat(part), []);
  } else if (geojson.type === 'MultiPolygon') {
    coords = geojson.coordinates.reduce((dump, poly) => dump.concat(poly.reduce((points, part) => points.concat(part), [])), []);
  } else if (geojson.type === 'Feature') {
    coords = getCoordinatesLoop(geojson.geometry);
  } else if (geojson.type === 'GeometryCollection') {
    coords = geojson.geometries.reduce((dump, g) => dump.concat(getCoordinatesLoop(g)), []);
  } else if (geojson.type === 'FeatureCollection') {
    coords = geojson.features.reduce((dump, f) => dump.concat(getCoordinatesLoop(f)), []);
  }
  return coords;
};

/**
 * 获取GeoJSON的数据范围
 * @param geojson
 * @returns {*}
 */
const getExtent = function (geojson) {
  let coords = null;
  const extent = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY,
  ];
  if (!geojson.hasOwnProperty('type')) return;
  coords = getCoordinatesLoop(geojson);
  return coords.reduce((prev, coord) => [
    Math.min(coord[0], prev[0]),
    Math.min(coord[1], prev[1]),
    Math.max(coord[0], prev[2]),
    Math.max(coord[1], prev[3]),
  ], extent);
};

/**
 * 通过经纬度二维数组获取到extend, 用于将地图缩放到可视范围
 * @param  {经纬度二维数组} coors
 */
const getExtentByCoors = function (coors) {
  const bounds = coors.reduce((bounds, coord) => bounds.extend(coord), new mapboxgl.LngLatBounds(coors[0], coors[0]));
  return bounds;
};

/**
 * 数据投影转换
 * @param data
 * @param options
 * @returns {GeoJSONFeatureCollection}
 */
const transformData = (data, options = {}) => {
  const temp = GeoJSONFormater.readFeatures(data, merge({
    dataProjection: 'EPSG:3857',
    featureProjection: 'EPSG:4326',
  }, options));
  return GeoJSONFormater.writeFeaturesObject(temp);
};
/**
 * @param  {wkt数据} wkt
 * @param  {要转换的类型,0:只是转换格式, 不做处理,1:3857转4326,2:4326转3857} type=0
 */
const transformDataTo4326 = (wkt, type = 0) => {
  let options = {
    featureProjection: 'EPSG:4326',
    dataProjection: 'EPSG:3857',
  };
  if (type === 0) { // 不做处理
    options = {};
  } else if (type === 2) {
    options.featureProjection = 'EPSG:3857';
    options.dataProjection = 'EPSG:4326';
  }
  const wktTo4326 = Wkt.readGeometry(wkt, options);
  const geojson = GeoJSONFormater.writeGeometryObject(wktTo4326);
  return geojson;
};

/**
 * 动态处理坐标
 * @param lngLat
 * @param priorPos
 * @param transform
 * @returns {LngLat|LngLat|mu}
 */
const smartWrap = (lngLat, priorPos, transform) => {
  lngLat = new LngLat(lngLat.lng, lngLat.lat);
  if (priorPos) {
    const left = new LngLat(lngLat.lng - 360, lngLat.lat);
    const right = new LngLat(lngLat.lng + 360, lngLat.lat);
    const delta = transform.locationPoint(lngLat).distSqr(priorPos);
    if (transform.locationPoint(left).distSqr(priorPos) < delta) {
      lngLat = left;
    } else if (transform.locationPoint(right).distSqr(priorPos) < delta) {
      lngLat = right;
    }
  }

  while (Math.abs(lngLat.lng - transform.center.lng) > 180) {
    const pos = transform.locationPoint(lngLat);
    if (pos.x >= 0 && pos.y >= 0 && pos.x <= transform.width && pos.y <= transform.height) {
      break;
    }
    if (lngLat.lng > transform.center.lng) {
      lngLat.lng -= 360;
    } else {
      lngLat.lng += 360;
    }
  }
  return lngLat;
};

/**
 * 经纬度转Mercator
 * @param lontitude
 * @param latitude
 * @returns {[*,*]}
 */
const lonLatToMercator = (lontitude, latitude) => {
  const x = lontitude * 20037508.34 / 180;
  let y = Math.log(Math.tan((90 + latitude) * Math.PI / 360)) / (Math.PI / 180);
  y = y * 20037508.34 / 180;
  return [x, y];
};
/**
 * Mercator转经纬度
 * @param x
 * @param y
 * @returns {[*,*]}
 * @constructor
 */
const MercatorTolonLat = (x, y) => {
  const longtitude = x / 20037508.34 * 180;
  let latitude = y / 20037508.34 * 180;
  latitude = 180 / Math.PI * (2 * Math.atan(Math.exp(latitude * Math.PI / 180)) - Math.PI / 2);
  return [longtitude, latitude];
};

/**
 * 平移地图
 * @param map
 * @param datas
 */
const panByData = (map, datas) => {
  const polygons = [];
  forEach(datas, (item, index) => {
    if (item.geom) {
      const wktTo4326 = Wkt.readGeometry(item.geom, {
        featureProjection: 'EPSG:4326',
        dataProjection: 'EPSG:3857',
      });
      const geojson = GeoJSONFormater.writeGeometryObject(wktTo4326);
      polygons.push({
        type: 'Feature',
        geometry: geojson,
        properties: {
          geomId: item.geomId, // FIXME: 字段
        },
        id: index + 1,
      });
    }
  });
  if (polygons && polygons.length > 0) {
    map.panByData({
      type: 'FeatureCollection',
      features: polygons,
    });
  }
};

export {
  smartWrap,
  getExtent,
  panByData,
  transformData,
  lonLatToMercator,
  MercatorTolonLat,
  transformDataTo4326,
  getExtentByCoors,
};
