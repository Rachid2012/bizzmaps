# BizMapper - Local Business Discovery Platform

A premium web application for discovering local businesses, identifying those without websites, and creating opportunities for web development and digital marketing services.

## Features

### 🎯 Core Functionality
- **Google Maps Integration** - Search businesses by location with interactive map display
- **Niche Filtering** - Target specific business categories (restaurants, retail, health, beauty, etc.)
- **Radius Search** - Adjustable search radius from 1-50 km
- **Website Detection** - Identify businesses without websites for outreach opportunities

### 💎 Premium Features
- **Dark Mode UI** - Beautiful dark theme with glassmorphism effects
- **Interactive Map** - Visual representation of all discovered businesses
- **Live Statistics** - Real-time stats on found businesses and opportunities
- **Search History** - Save and reload previous searches
- **CSV Export** - Download business data for external use
- **Proposal Generator** - Quick access to create business proposals

### 🎨 Design Highlights
- Modern gradient-based color scheme
- Smooth animations and micro-interactions
- Responsive design for all screen sizes
- Custom scrollbar and form elements
- Glassmorphism card effects

## Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Google Maps API key (for production use)

### Installation

1. **Get a Google Maps API Key**
   - Visit the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the following APIs:
     - Maps JavaScript API
     - Places API
     - Geocoding API
   - Create credentials (API Key)
   - Copy your API key

2. **Configure the Application**
   - Open `index.html`
   - Find line 11: `<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places" async defer></script>`
   - Replace `YOUR_API_KEY` with your actual Google Maps API key

3. **Run the Application**
   - Simply open `index.html` in your web browser
   - Or use a local server:
     ```bash
     python -m http.server 8000
     # or
     npx serve
     ```
   - Navigate to `http://localhost:8000`

## How to Use

### Basic Search
1. Enter a location (city, address, or zip code)
2. Select a business niche from the dropdown
3. Adjust the search radius using the slider
4. Check/uncheck "Only show businesses without websites"
5. Click "Start Discovery"

### View Results
- **Statistics Cards** - See total businesses found, those without websites, and opportunities
- **Interactive Map** - Click markers to view business details
- **Business Cards** - Scroll through detailed business listings
- **Filter Options** - Toggle website filter to refine results

### Export Data
- Click the "Export" button in the navigation
- Downloads a CSV file with all business information
- Use for CRM import, cold email campaigns, or record keeping

### Saved Searches
- All searches are automatically saved
- Click "Saved Searches" to view history
- Load previous search parameters with one click
- Last 10 searches are retained

### Create Proposals
- Click "Proposal" on any business card
- Generates a proposal template
- Perfect for businesses without websites

## File Structure

```
business-map/
├── index.html          # Main HTML structure
├── index.css           # Comprehensive styling
├── app.js              # Application logic
└── README.md           # This file
```

## Current Limitations & Next Steps

### Mock Data
Currently, the application uses **mock/dummy data** for demonstration purposes. The `searchBusinesses()` function generates fake businesses.

### To Integrate Real Google Maps Data:

Replace the `searchBusinesses()` function in `app.js` with:

```javascript
async function searchBusinesses(location, niche, radius) {
    return new Promise((resolve, reject) => {
        const geocoder = new google.maps.Geocoder();
        
        // Geocode the location
        geocoder.geocode({ address: location }, (results, status) => {
            if (status === 'OK') {
                const center = results[0].geometry.location;
                
                // Search for places
                const service = new google.maps.places.PlacesService(state.map);
                const request = {
                    location: center,
                    radius: radius * 1000, // Convert km to meters
                    type: [getNicheType(niche)]
                };
                
                service.nearbySearch(request, (results, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK) {
                        const businesses = results.map(place => ({
                            id: place.place_id,
                            name: place.name,
                            category: niche,
                            address: place.vicinity,
                            phone: place.phone || null,
                            email: null, // Google doesn't provide emails
                            website: place.website || null,
                            rating: place.rating || null,
                            reviews: place.user_ratings_total || 0,
                            lat: place.geometry.location.lat(),
                            lng: place.geometry.location.lng()
                        }));
                        resolve(businesses);
                    } else {
                        reject(new Error('Places search failed'));
                    }
                });
            } else {
                reject(new Error('Geocoding failed'));
            }
        });
    });
}

function getNicheType(niche) {
    const typeMap = {
        restaurant: 'restaurant',
        retail: 'store',
        health: 'health',
        beauty: 'beauty_salon',
        fitness: 'gym',
        automotive: 'car_repair',
        home_services: 'home_goods_store',
        professional: 'lawyer',
        entertainment: 'movie_theater',
        education: 'school'
    };
    return typeMap[niche] || 'establishment';
}
```

## Technologies Used

- **HTML5** - Semantic structure
- **CSS3** - Variables, Grid, Flexbox, Animations
- **Vanilla JavaScript** - ES6+ features
- **Google Maps API** - Places, Geocoding, Maps JavaScript API
- **LocalStorage** - Client-side data persistence

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Opera

## Performance

- Optimized animations using CSS transforms
- Lazy loading of map markers
- Efficient DOM manipulation
- Debounced search inputs (when implemented)

## Security Notes

- Never commit your API key to version control
- Restrict API key usage to specific domains in production
- Set up billing alerts in Google Cloud Console
- Use environment variables for sensitive data

## Future Enhancements

- [ ] Email finder integration
- [ ] Social media profile discovery
- [ ] Website quality analysis
- [ ] Automated proposal generation
- [ ] CRM integration
- [ ] Email campaign builder
- [ ] Competitor analysis
- [ ] Industry insights and trends
- [ ] Multi-location batch searches
- [ ] Advanced filtering options

## License

This project is provided as-is for educational and commercial use.

## Support

For issues or questions:
1. Check the browser console for errors
2. Verify your API key is correctly configured
3. Ensure all APIs are enabled in Google Cloud Console
4. Check your API usage hasn't exceeded quotas

---

**Built with ❤️ for finding business opportunities**
