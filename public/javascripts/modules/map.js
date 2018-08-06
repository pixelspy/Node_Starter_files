import axios from 'axios';
import { $ } from './bling';

const mapOptions = {
  center: { lat:43.2, lng: -79.8 },
  zoom: 10
};


function loadPlaces(map, lat = 43.2, lng = -79.8) {
  axios.get(`/api/v1/stores/near?lat=${lat}&lng=${lng}`)
    .then(res => {
      const places = res.data;
      if (!places.length) {
        alert('no places found');
        return;
      }

      // create a bounds
      const bounds = new google.maps.LatLngBounds();
      // create info window :
      const infoWindow = new google.maps.InfoWindow();

      const markers = places.map(place => {
        const [placeLng, placeLat] = place.location.coordinates;
        // console.log(placeLng, placeLat);
        const position = { lat: placeLat, lng: placeLng};
        bounds.extend(position);
        const marker = new google.maps.Marker({ map, position });
        marker.place = place;
        return marker;
      });
      console.log(markers)
      // when user clicks on a marker , show th details of the place

      markers.forEach( marker => marker.addListener('click', function() {
        // console.log(this.place);
        // infoWindow.setContent(this.place.name);

        const html = `
          <div class="popup">
          <a href="/store/${this.place.slug}">
            <img src="/uploads/${this.place.photo || 'store.png'}" alt="${this.place.name}" />
          <p>${this.place.name} - ${this.place.location.address}</p>
        </div>
        `
        infoWindow.setContent(html);
        infoWindow.open(map, this);
      }))
      // then zoom the map to fit all the markers
      map.setCenter(bounds.getCenter());
      map.fitBounds(bounds);
    });
};

// DAY 21 JS30 Tutorial :
//navigator.geolocation.getCurrentPosition


function makeMap(mapDiv) {
  // console.log(mapDiv);
  if(!mapDiv) return;  // if there is no mapDiv on a page then stop running this function !
  // make our map
  const map = new google.maps.Map(mapDiv, mapOptions);
  loadPlaces(map);

  const input = $('[name="geolocate"]');
  const autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    // console.log(place)
    loadPlaces(map, place.geometry.location.lat(), place.geometry.location.lng())
  })
};

export default makeMap;
