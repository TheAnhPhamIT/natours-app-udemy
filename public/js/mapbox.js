export const displayMap = (locations) => {
    mapboxgl.accessToken =
        'pk.eyJ1IjoiYW5ocGhhbTk3IiwiYSI6ImNrdXk1eTFlejF1dWEyb28wbjU2a2R1dWcifQ.T0fmE2ilrIj6INJYW9gdqg';

    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/anhpham97/ckuy74zi44q7x18uvdbepspse',
        scrollZoom: false,
    });

    const bounds = new mapboxgl.LngLatBounds();

    locations.forEach((loc) => {
        // Create marker
        const el = document.createElement('div');
        el.className = 'marker';

        // Add marker
        new mapboxgl.Marker({
            element: el,
            anchor: 'bottom',
        })
            .setLngLat(loc.coordinates)
            .addTo(map);

        // Add popup
        new mapboxgl.Popup({
            offset: 30,
        })
            .setLngLat(loc.coordinates)
            .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
            .addTo(map);

        bounds.extend(loc.coordinates);
    });

    map.fitBounds(bounds, {
        padding: {
            top: 200,
            bottom: 150,
            left: 100,
            right: 100,
        },
    });
};
