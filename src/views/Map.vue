<template>
  <div class="map">
    <div id="map_container" class="mapContainer"/>
  </div>
</template>
<script>
import mapboxgl from 'mapbox-gl';
// import

export default {
  data() {
    return {

    };
  },
  mounted() {
    this.initMap();
  },
  methods: {
    initMap() {
      const date = new Date();
      this.map = new mapboxgl.Map({
        container: 'map_container',
        zoom: 3.6,
        pitch: 0,
        style: `http://120.241.38.12:8080/conf/styles/sprite-kye/style.json?${date.getFullYear()}${date.getMonth()}${date.getDate()}`,
        center: [108.95, 37.27],
        attributionControl: false,
      });
      this.map.on('load', () => {
        this.addTwoPoint();
      });
    },
    addTwoPoint() {
      const point1 = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [108.95, 33.27],
        },
      };
      const point2 = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [108.95, 37.27],
        },
      };
      const source = {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [point1, point2],
        },
      };
      this.map.addSource('twoPoint_source', source);
      this.map.addLayer({
        id: 'twoPoint_layer',
        type: 'circle',
        source: 'twoPoint_source',
        paint: {
          'circle-radius': 10,
          'circle-color': '#3887be',
        },
      });
      this.map.flyTo({
        center: [108.95, 33.27],
        zoom: 9,
        speed: 0.2,
        curve: 1,
        easing(t) {
          return t;
        },
      });
    },
  },
};
</script>
<style lang="scss" scoped>
.mapContainer{
    position: absolute;
    top:100px;
    overflow: hidden;
    bottom:0;
    width:100%;
    font: 12px/20px 'Helvetica Neue', Arial, Helvetica, sans-serif;
    text-align: left;
}
</style>
