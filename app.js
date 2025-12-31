// ===================================
// STATE MANAGEMENT
// ===================================
const state = {
    businesses: [],
    filteredBusinesses: [],
    map: null,
    markers: [],
    radiusCircle: null,
    searchParams: {
        location: '',
        niche: '',
        radius: 5,
        noWebsiteOnly: true
    }
};

// ===================================
// DOM ELEMENTS
// ===================================
const elements = {
    locationInput: document.getElementById('location-input'),
    nicheSelect: document.getElementById('niche-select'),
    radiusInput: document.getElementById('radius-input'),
    radiusValue: document.getElementById('radius-value'),
    noWebsiteOnly: document.getElementById('no-website-only'),
    searchBtn: document.getElementById('search-btn'),
    savedBtn: document.getElementById('saved-btn'),
    exportBtn: document.getElementById('export-btn'),
    statsGrid: document.getElementById('stats-grid'),
    totalFound: document.getElementById('total-found'),
    noWebsite: document.getElementById('no-website'),
    opportunities: document.getElementById('opportunities'),
    mapContainer: document.getElementById('map-container'),
    businessList: document.getElementById('business-list'),
    emptyState: document.getElementById('empty-state'),
    loadingState: document.getElementById('loading-state'),
    modal: document.getElementById('business-modal'),
    modalBody: document.getElementById('modal-body'),
    modalClose: document.getElementById('modal-close')
};

// ===================================
// INITIALIZATION
// ===================================

// Expose initApp globally for the Google Maps callback
window.initApp = function () {
    console.log('🚀 initApp called - Google Maps is ready');
    setupEventListeners();
    loadSavedSearches();
    initAutocomplete();
    initMainMap();
};

function init() {
    // Check if Google Maps is already loaded
    if (typeof google !== 'undefined' && google.maps && google.maps.places) {
        console.log('Google Maps already loaded, initializing...');
        setupEventListeners();
        loadSavedSearches();
        initAutocomplete();
        initMainMap();
    } else {
        console.log('Waiting for Google Maps callback...');
        // The callback will trigger window.initApp
    }
}

function setupEventListeners() {
    if (!elements.radiusInput) return; // Guard against missing elements

    elements.radiusInput.addEventListener('input', (e) => {
        elements.radiusValue.textContent = e.target.value;
        state.searchParams.radius = parseInt(e.target.value);
        // Update radius circle if map exists
        if (state.map && state.radiusCircle) {
            updateRadiusCircle(state.map.getCenter(), state.searchParams.radius);
        }
    });

    elements.noWebsiteOnly.addEventListener('change', (e) => {
        state.searchParams.noWebsiteOnly = e.target.checked;
    });

    // Search button
    elements.searchBtn.addEventListener('click', performSearch);

    // Export button - check if element exists
    if (elements.exportBtn) {
        elements.exportBtn.addEventListener('click', exportResults);
    }

    // Saved searches button - check if element exists
    if (elements.savedBtn) {
        elements.savedBtn.addEventListener('click', showSavedSearches);
    }

    // Modal close
    if (elements.modalClose) {
        elements.modalClose.addEventListener('click', closeModal);
    }
    if (elements.modal) {
        const overlay = elements.modal.querySelector('.modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', closeModal);
        }
    }

    // Form inputs
    elements.locationInput.addEventListener('input', (e) => {
        state.searchParams.location = e.target.value;
        // Reset lat/lng when user types manually
        state.searchParams.lat = null;
        state.searchParams.lng = null;
    });

    elements.nicheSelect.addEventListener('change', (e) => {
        state.searchParams.niche = e.target.value;
    });

    console.log('✅ Event listeners set up');
}

function initAutocomplete() {
    // Check if Google Maps Places is available
    if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
        console.error('❌ Google Maps Places API not available');
        return;
    }

    if (!elements.locationInput) {
        console.error('❌ Location input element not found');
        return;
    }

    try {
        // Initialize autocomplete with broader options (not just cities)
        const autocomplete = new google.maps.places.Autocomplete(elements.locationInput, {
            types: ['geocode'], // Allow any geocodable address
            fields: ['formatted_address', 'geometry', 'name', 'address_components']
        });

        // Bind autocomplete to map bounds if map exists
        if (state.map) {
            autocomplete.bindTo('bounds', state.map);
        }

        // Listen for place selection
        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            console.log('Place selected:', place);

            if (place.geometry && place.geometry.location) {
                // Update state with selected location
                state.searchParams.location = place.formatted_address || place.name;
                state.searchParams.lat = place.geometry.location.lat();
                state.searchParams.lng = place.geometry.location.lng();
                elements.locationInput.value = place.formatted_address || place.name;

                // Update map to show selected location
                if (state.map) {
                    state.map.panTo(place.geometry.location);
                    state.map.setZoom(13);

                    // Update radius circle to new location
                    updateRadiusCircle(place.geometry.location, state.searchParams.radius);
                }

                showNotification(`Location set to: ${place.name || place.formatted_address}`, 'success');
            } else {
                console.log('No geometry for place, using text value');
                state.searchParams.location = elements.locationInput.value;
            }
        });

        console.log('✅ Autocomplete initialized successfully!');
    } catch (error) {
        console.error('Error initializing autocomplete:', error);
    }
}

// ===================================
// SEARCH FUNCTIONALITY
// ===================================
async function performSearch() {
    if (!state.searchParams.location || !state.searchParams.niche) {
        showNotification('Please enter both location and niche', 'error');
        return;
    }

    elements.loadingState.style.display = 'flex';
    elements.emptyState.style.display = 'none';
    elements.businessList.innerHTML = '';

    try {
        // Ensure we have coordinates
        if (!state.searchParams.lat) {
            console.log('Geocoding location...');
            await geocodeLocation(state.searchParams.location);
        }

        console.log(`Searching for ${state.searchParams.niche} near ${state.searchParams.lat}, ${state.searchParams.lng}`);

        const businesses = await fetchBusinessesFromGoogle(state.searchParams.niche, {
            lat: state.searchParams.lat,
            lng: state.searchParams.lng
        });

        state.businesses = businesses;
        filterBusinesses();

        // Update stats and display
        if (state.filteredBusinesses.length === 0) {
            showNotification('No businesses found matching your criteria.', 'info');
        } else {
            showNotification(`Found ${state.filteredBusinesses.length} businesses!`, 'success');
        }

        displayResults();
        saveSearch();

    } catch (error) {
        console.error('Search error:', error);
        showNotification('Error performing search. Please try again.', 'error');
        elements.businessList.innerHTML = `
            <div class="empty-state">
                <h3 class="empty-title">Search Failed</h3>
                <p class="empty-text">${error.message || 'An unexpected error occurred.'}</p>
            </div>
        `;
    } finally {
        elements.loadingState.style.display = 'none';
    }
}

function filterBusinesses() {
    state.filteredBusinesses = state.searchParams.noWebsiteOnly
        ? state.businesses.filter(b => !b.website)
        : state.businesses;
}

function geocodeLocation(address) {
    return new Promise((resolve, reject) => {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: address }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const location = results[0].geometry.location;
                state.searchParams.lat = location.lat();
                state.searchParams.lng = location.lng();

                // Update map if available
                if (state.map) {
                    state.map.panTo(location);
                    updateRadiusCircle(location, state.searchParams.radius);
                }
                resolve(location);
            } else {
                reject(new Error('Geocoding failed: ' + status));
            }
        });
    });
}

function fetchBusinessesFromGoogle(niche, location) {
    return new Promise((resolve, reject) => {
        if (!state.map) {
            reject(new Error("Map not initialized"));
            return;
        }

        const service = new google.maps.places.PlacesService(state.map);

        // Create a LatLng object for the location
        const latLng = new google.maps.LatLng(location.lat, location.lng);

        // For "all" businesses, use textSearch which is more flexible
        // For specific niches, use nearbySearch with keyword
        if (niche === 'all') {
            // Use textSearch with a generic query for all businesses
            const request = {
                location: latLng,
                radius: state.searchParams.radius * 1000,
                query: 'business'
            };

            console.log('textSearch request (all businesses):', request);

            service.textSearch(request, (results, status) => {
                handleSearchResults(results, status, niche, service, resolve, reject);
            });
        } else {
            // Use nearbySearch for specific niches
            const request = {
                location: latLng,
                radius: state.searchParams.radius * 1000,
                keyword: niche
            };

            console.log('nearbySearch request:', request);

            service.nearbySearch(request, (results, status) => {
                handleSearchResults(results, status, niche, service, resolve, reject);
            });
        }
    });
}

function handleSearchResults(results, status, niche, service, resolve, reject) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
        console.log(`Found ${results.length} results`);

        // Limit to 20 results for API quota
        const limitedResults = results.slice(0, 20);

        const detailPromises = limitedResults.map(place => {
            return new Promise(resolveDetail => {
                service.getDetails({
                    placeId: place.place_id,
                    fields: ['name', 'formatted_address', 'formatted_phone_number', 'website', 'rating', 'user_ratings_total', 'geometry', 'types', 'url']
                }, (placeDetails, detailStatus) => {
                    if (detailStatus === google.maps.places.PlacesServiceStatus.OK) {
                        resolveDetail({ ...place, ...placeDetails });
                    } else {
                        resolveDetail(place); // Fallback to basic info
                    }
                });
            });
        });

        Promise.all(detailPromises).then(detailedResults => {
            const mappedBusinesses = detailedResults.map((place, index) => ({
                id: place.place_id || `biz-${index}`,
                name: place.name,
                category: niche === 'all' ? (place.types ? place.types[0] : 'business') : niche,
                address: place.formatted_address || place.vicinity,
                phone: place.formatted_phone_number,
                email: null,
                website: place.website || null,
                rating: (place.rating || 0).toFixed(1),
                reviews: place.user_ratings_total || 0,
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
                googleUrl: place.url,
                types: place.types || []
            }));
            resolve(mappedBusinesses);
        }).catch(err => reject(err));

    } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        console.log('Zero results');
        resolve([]);
    } else {
        console.error('Places API Error:', status);
        reject(new Error(`Places API Error: ${status}`));
    }
}

function displayResults() {
    elements.emptyState.style.display = 'none';
    elements.businessList.innerHTML = '';

    if (state.filteredBusinesses.length === 0) {
        elements.businessList.innerHTML = `
            <div class="empty-state">
                <h3 class="empty-title">No Businesses Found</h3>
                <p class="empty-text">Try adjusting your search parameters or expanding your search radius.</p>
            </div>
        `;
        return;
    }

    renderBusinessCards();
    initMap();
    updateStats();
}

function updateStats() {
    const total = state.filteredBusinesses.length;
    const noWebsite = state.filteredBusinesses.filter(b => !b.website).length;
    const opportunities = Math.floor(noWebsite * 0.7);

    elements.statsGrid.style.display = 'grid';
    animateNumber(elements.totalFound, total);
    animateNumber(elements.noWebsite, noWebsite);
    animateNumber(elements.opportunities, opportunities);
}

function animateNumber(element, target) {
    const duration = 1000;
    const steps = 30;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, duration / steps);
}

// ===================================
// MAP FUNCTIONALITY
// ===================================
function initMainMap() {
    if (typeof google === 'undefined' || !google.maps) {
        setTimeout(initMainMap, 100);
        return;
    }

    elements.mapContainer.style.display = 'block';
    elements.emptyState.style.display = 'none';

    const defaultCenter = { lat: 40.7128, lng: -74.0060 };
    state.map = new google.maps.Map(document.getElementById('map'), {
        center: defaultCenter,
        zoom: 13,
        heading: 0,
        tilt: 45,
        mapId: "90f87356969d889c",
        styles: getDarkMapStyle(),
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        gestureHandling: 'greedy'
    });

    updateRadiusCircle(defaultCenter, state.searchParams.radius);
    console.log('✅ Main map initialized with 3D view and radius zone!');
}

function initMap() {
    elements.mapContainer.style.display = 'block';

    if (!state.map && typeof google !== 'undefined') {
        const mapCenter = state.filteredBusinesses.length > 0
            ? { lat: state.filteredBusinesses[0].lat, lng: state.filteredBusinesses[0].lng }
            : { lat: 40.7128, lng: -74.0060 };

        state.map = new google.maps.Map(document.getElementById('map'), {
            center: mapCenter,
            zoom: 13,
            styles: getDarkMapStyle()
        });
    }

    state.markers.forEach(marker => marker.setMap(null));
    state.markers = [];

    if (typeof google !== 'undefined') {
        state.filteredBusinesses.forEach(business => {
            const marker = new google.maps.Marker({
                position: { lat: business.lat, lng: business.lng },
                map: state.map,
                title: business.name,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: business.website ? '#43e97b' : '#f5576c',
                    fillOpacity: 1,
                    strokeColor: '#fff',
                    strokeWeight: 2
                }
            });

            marker.addListener('click', () => {
                showBusinessDetails(business.id);
            });

            state.markers.push(marker);
        });
    }
}

function getDarkMapStyle() {
    return [
        { elementType: "geometry", stylers: [{ color: "#1a1a27" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a27" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
        { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
        { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
        { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
        { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
        { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
        { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
        { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
        { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
        { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
        { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
        { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
        { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
        { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] }
    ];
}

function updateRadiusCircle(center, radiusKm) {
    if (!state.map) return;

    const radiusMeters = radiusKm * 1000;

    if (!state.radiusCircle) {
        state.radiusCircle = new google.maps.Circle({
            map: state.map,
            center: center,
            radius: radiusMeters,
            fillColor: '#667eea',
            fillOpacity: 0.15,
            strokeColor: '#667eea',
            strokeOpacity: 0.8,
            strokeWeight: 2
        });
    } else {
        state.radiusCircle.setCenter(center);
        state.radiusCircle.setRadius(radiusMeters);
    }
}

// ===================================
// BUSINESS CARDS
// ===================================
function renderBusinessCards() {
    elements.businessList.innerHTML = '';

    if (state.filteredBusinesses.length === 0) {
        elements.emptyState.style.display = 'block';
        return;
    }

    state.filteredBusinesses.forEach(business => {
        const card = createBusinessCard(business);
        elements.businessList.appendChild(card);
    });
}

function createBusinessCard(business) {
    const card = document.createElement('div');
    card.className = 'business-card';
    card.innerHTML = `
        <div class="business-header">
            <div>
                <h3 class="business-name">${business.name}</h3>
                <p class="business-category">${formatCategory(business.category)}</p>
            </div>
            <span class="website-badge ${business.website ? 'has-website' : 'no-website'}">
                ${business.website ? 'Website' : 'No Site'}
            </span>
        </div>
        
        <div class="business-info">
            <div class="info-item">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
                </svg>
                <span>${business.address}</span>
            </div>
            ${business.phone ? `
            <div class="info-item">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" fill="currentColor"/>
                </svg>
                <span>${business.phone}</span>
            </div>
            ` : ''}
            ${business.email ? `
            <div class="info-item">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" stroke-width="2"/>
                    <polyline points="22,6 12,13 2,6" stroke="currentColor" stroke-width="2"/>
                </svg>
                <span>${business.email}</span>
            </div>
            ` : ''}
        </div>
        
        <div class="business-footer">
            <button class="business-action" onclick="showBusinessDetails('${business.id}')">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                    <path d="M12 16v-4M12 8h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                Details
            </button>
            <button class="business-action primary" onclick="createProposal('${business.id}')">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2"/>
                    <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2"/>
                    <line x1="12" y1="18" x2="12" y2="12" stroke="currentColor" stroke-width="2"/>
                    <line x1="9" y1="15" x2="15" y2="15" stroke="currentColor" stroke-width="2"/>
                </svg>
                Proposal
            </button>
        </div>
    `;

    return card;
}

function formatCategory(category) {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// ===================================
// BUSINESS DETAILS & PROPOSAL
// ===================================
window.showBusinessDetails = function (businessId) {
    const business = state.filteredBusinesses.find(b => b.id === businessId);
    if (!business) return;

    elements.modalBody.innerHTML = `
        <h2 style="font-family: var(--font-display); font-size: 2rem; font-weight: 800; margin-bottom: 1.5rem;">
            ${business.name}
        </h2>
        
        <div style="display: grid; gap: 1.5rem;">
            <div>
                <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--accent-primary);">
                    Basic Information
                </h3>
                <div style="display: grid; gap: 0.75rem; color: var(--text-secondary);">
                    <p><strong>Category:</strong> ${formatCategory(business.category)}</p>
                    <p><strong>Address:</strong> ${business.address}</p>
                    ${business.phone ? `<p><strong>Phone:</strong> ${business.phone}</p>` : ''}
                    ${business.email ? `<p><strong>Email:</strong> ${business.email}</p>` : ''}
                    ${business.website ? `<p><strong>Website:</strong> <a href="${business.website}" target="_blank" style="color: var(--accent-primary);">${business.website}</a></p>` : '<p><strong>Website:</strong> <span style="color: #f5576c;">Not Available</span></p>'}
                </div>
            </div>
            
            <div>
                <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--accent-primary);">
                    Rating & Reviews
                </h3>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="font-size: 2.5rem; font-weight: 800; font-family: var(--font-display);">
                        ${business.rating}
                    </div>
                    <div style="color: var(--text-secondary);">
                        <div>⭐⭐⭐⭐⭐</div>
                        <div>${business.reviews} reviews</div>
                    </div>
                </div>
            </div>
            
            ${!business.website ? `
            <div style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(240, 147, 251, 0.1)); padding: 1.5rem; border-radius: var(--radius-md); border: 1px solid var(--glass-border);">
                <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.75rem; color: var(--accent-tertiary);">
                    💡 Opportunity Identified
                </h3>
                <p style="color: var(--text-secondary); margin-bottom: 1rem;">
                    This business doesn't have a website. This is a perfect opportunity to offer web development or digital marketing services!
                </p>
                <button onclick="createProposal('${business.id}')" style="background: var(--primary-gradient); color: white; padding: 0.75rem 1.5rem; border-radius: var(--radius-sm); border: none; font-weight: 600; cursor: pointer; width: 100%;">
                    Create Proposal
                </button>
            </div>
            ` : ''}
        </div>
    `;

    elements.modal.classList.add('active');
};

window.createProposal = function (businessId) {
    const business = state.filteredBusinesses.find(b => b.id === businessId);
    if (!business) return;

    const emailSubject = `Website Development Opportunity for ${business.name}`;
    const emailBody = `Dear ${business.name} Team,

I hope this email finds you well. My name is [Your Name], and I specialize in helping local businesses establish and grow their online presence.

I came across ${business.name} while researching ${formatCategory(business.category)} businesses in the area, and I noticed that you currently don't have a website. In today's digital age, having a professional online presence is crucial for reaching new customers and growing your business.

I would love to discuss how we can help ${business.name} with:

✓ Professional Website Development
✓ Search Engine Optimization (SEO)
✓ Social Media Marketing
✓ Online Reputation Management

Our services are specifically tailored for local businesses like yours, with packages starting at $2,500. The typical project timeline is 4-6 weeks from start to launch.

Would you be available for a brief 15-minute call this week to discuss how we can help ${business.name} reach more customers online?

You can reach me at:
📧 [Your Email]
📱 [Your Phone]

I look forward to hearing from you!

Best regards,
[Your Name]
[Your Company]`;

    elements.modalBody.innerHTML = `
        <h2 style="font-family: var(--font-display); font-size: 2rem; font-weight: 800; margin-bottom: 1.5rem; background: var(--primary-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
            📧 Outreach Proposal
        </h2>
        
        <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: var(--radius-md); margin-bottom: 1.5rem;">
            <h3 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 1rem; color: var(--accent-primary);">Business Information</h3>
            <div style="display: grid; gap: 0.75rem; color: var(--text-secondary);">
                <p><strong>Business:</strong> ${business.name}</p>
                <p><strong>Category:</strong> ${formatCategory(business.category)}</p>
                <p><strong>Address:</strong> ${business.address}</p>
                ${business.phone ? `<p><strong>Phone:</strong> ${business.phone}</p>` : ''}
                ${business.email ? `<p><strong>Email:</strong> ${business.email}</p>` : ''}
                <p><strong>Rating:</strong> ${business.rating} ⭐ (${business.reviews} reviews)</p>
                <p><strong>Website:</strong> <span style="color: #f5576c;">Not Available</span> ✅ Opportunity!</p>
            </div>
        </div>

        <div style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(240, 147, 251, 0.1)); padding: 1.5rem; border-radius: var(--radius-md); border: 1px solid var(--glass-border); margin-bottom: 1.5rem;">
            <h3 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 1rem; color: var(--accent-tertiary);">📨 Email Template</h3>
            
            <div style="background: var(--bg-secondary); padding: 1rem; border-radius: var(--radius-sm); margin-bottom: 1rem;">
                <p style="margin-bottom: 0.5rem;"><strong>Subject:</strong></p>
                <p style="color: var(--text-secondary); font-style: italic;">${emailSubject}</p>
            </div>

            <div style="background: var(--bg-secondary); padding: 1rem; border-radius: var(--radius-sm); margin-bottom: 1rem;">
                <p style="margin-bottom: 0.5rem;"><strong>Email Body:</strong></p>
                <div style="color: var(--text-secondary); white-space: pre-wrap; font-size: 0.9rem; line-height: 1.6; max-height: 300px; overflow-y: auto;">${emailBody}</div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <button onclick="copyEmailTemplate('${businessId}')" style="background: var(--bg-tertiary); color: var(--text-primary); padding: 0.75rem 1rem; border-radius: var(--radius-sm); border: 1px solid var(--glass-border); font-weight: 600; cursor: pointer; transition: all 0.2s;">
                    📋 Copy Email
                </button>
                <button onclick="downloadProposal('${businessId}')" style="background: var(--primary-gradient); color: white; padding: 0.75rem 1rem; border-radius: var(--radius-sm); border: none; font-weight: 600; cursor: pointer;">
                    💾 Download
                </button>
            </div>
        </div>

        <div style="background: var(--bg-secondary); padding: 1rem; border-radius: var(--radius-md); border-left: 3px solid var(--accent-primary);">
            <p style="color: var(--text-secondary); font-size: 0.9rem;">
                💡 <strong>Tip:</strong> Personalize the email template with your name, contact info, and specific details about how you can help this business.
            </p>
        </div>
    `;

    elements.modal.classList.add('active');
};

window.copyEmailTemplate = function (businessId) {
    const business = state.filteredBusinesses.find(b => b.id === businessId);
    if (!business) return;

    const emailSubject = `Website Development Opportunity for ${business.name}`;
    const emailBody = `Dear ${business.name} Team,

I hope this email finds you well. My name is [Your Name], and I specialize in helping local businesses establish and grow their online presence.

I came across ${business.name} while researching ${formatCategory(business.category)} businesses in the area, and I noticed that you currently don't have a website. In today's digital age, having a professional online presence is crucial for reaching new customers and growing your business.

I would love to discuss how we can help ${business.name} with:

✓ Professional Website Development
✓ Search Engine Optimization (SEO)
✓ Social Media Marketing
✓ Online Reputation Management

Our services are specifically tailored for local businesses like yours, with packages starting at $2,500. The typical project timeline is 4-6 weeks from start to launch.

Would you be available for a brief 15-minute call this week to discuss how we can help ${business.name} reach more customers online?

You can reach me at:
📧 [Your Email]
📱 [Your Phone]

I look forward to hearing from you!

Best regards,
[Your Name]
[Your Company]`;

    const fullEmail = `Subject: ${emailSubject}\n\n${emailBody}`;

    navigator.clipboard.writeText(fullEmail).then(() => {
        showNotification('Email template copied to clipboard!', 'success');
    }).catch(() => {
        showNotification('Failed to copy. Please copy manually.', 'error');
    });
};

window.downloadProposal = function (businessId) {
    const business = state.filteredBusinesses.find(b => b.id === businessId);
    if (!business) return;

    const proposalText = `BUSINESS OUTREACH PROPOSAL
========================================

BUSINESS INFORMATION
--------------------
Business Name: ${business.name}
Category: ${formatCategory(business.category)}
Address: ${business.address}
Phone: ${business.phone || 'N/A'}
Email: ${business.email || 'N/A'}
Rating: ${business.rating} stars (${business.reviews} reviews)
Website: Not Available ✅ OPPORTUNITY

EMAIL TEMPLATE
--------------------
Subject: Website Development Opportunity for ${business.name}

Dear ${business.name} Team,

I hope this email finds you well. My name is [Your Name], and I specialize in helping local businesses establish and grow their online presence.

I came across ${business.name} while researching ${formatCategory(business.category)} businesses in the area, and I noticed that you currently don't have a website. In today's digital age, having a professional online presence is crucial for reaching new customers and growing your business.

I would love to discuss how we can help ${business.name} with:

✓ Professional Website Development
✓ Search Engine Optimization (SEO)
✓ Social Media Marketing
✓ Online Reputation Management

Our services are specifically tailored for local businesses like yours, with packages starting at $2,500. The typical project timeline is 4-6 weeks from start to launch.

Would you be available for a brief 15-minute call this week to discuss how we can help ${business.name} reach more customers online?

You can reach me at:
📧 [Your Email]
📱 [Your Phone]

I look forward to hearing from you!

Best regards,
[Your Name]
[Your Company]

========================================
Generated by BizMapper - ${new Date().toLocaleDateString()}
`;

    const blob = new Blob([proposalText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proposal-${business.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification('Proposal downloaded successfully!', 'success');
};

function closeModal() {
    elements.modal.classList.remove('active');
}

// ===================================
// EXPORT FUNCTIONALITY
// ===================================
function exportResults() {
    if (state.filteredBusinesses.length === 0) {
        showNotification('No data to export', 'error');
        return;
    }

    const csvContent = generateCSV();
    downloadFile(csvContent, `business-search-${Date.now()}.csv`, 'text/csv');
    showNotification('CSV exported successfully!', 'success');
}

function generateCSV() {
    const headers = ['Name', 'Category', 'Address', 'Phone', 'Email', 'Website', 'Rating', 'Reviews'];
    const rows = state.filteredBusinesses.map(b => [
        b.name,
        formatCategory(b.category),
        b.address,
        b.phone || '',
        b.email || '',
        b.website || 'No Website',
        b.rating,
        b.reviews
    ]);

    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ===================================
// SAVED SEARCHES
// ===================================
function saveSearch() {
    const searches = JSON.parse(localStorage.getItem('savedSearches') || '[]');
    const newSearch = {
        id: Date.now(),
        ...state.searchParams,
        date: new Date().toLocaleDateString(),
        resultsCount: state.filteredBusinesses.length
    };

    searches.unshift(newSearch);
    if (searches.length > 10) searches.pop();

    localStorage.setItem('savedSearches', JSON.stringify(searches));
}

function loadSavedSearches() {
    // Just load from localStorage, no UI update needed here
}

function showSavedSearches() {
    const searches = JSON.parse(localStorage.getItem('savedSearches') || '[]');

    if (searches.length === 0) {
        showNotification('No saved searches yet', 'info');
        return;
    }

    elements.modalBody.innerHTML = `
        <h2 style="font-family: var(--font-display); font-size: 2rem; font-weight: 800; margin-bottom: 1.5rem;">
            Saved Searches
        </h2>
        <div style="display: grid; gap: 1rem;">
            ${searches.map(search => `
                <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: var(--radius-md); cursor: pointer;" onclick="loadSearch(${search.id})">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
                        <div>
                            <div style="font-weight: 600; font-size: 1.1rem;">${search.location}</div>
                            <div style="color: var(--text-tertiary); font-size: 0.9rem;">${search.date}</div>
                        </div>
                        <span style="background: var(--primary-gradient); color: white; padding: 0.25rem 0.75rem; border-radius: var(--radius-sm); font-size: 0.85rem;">
                            ${search.resultsCount} results
                        </span>
                    </div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem;">
                        ${formatCategory(search.niche)} • ${search.radius}km radius
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    elements.modal.classList.add('active');
}

window.loadSearch = function (searchId) {
    const searches = JSON.parse(localStorage.getItem('savedSearches') || '[]');
    const search = searches.find(s => s.id === searchId);

    if (search) {
        state.searchParams = { ...search };
        elements.locationInput.value = search.location;
        elements.nicheSelect.value = search.niche;
        elements.radiusInput.value = search.radius;
        elements.radiusValue.textContent = search.radius;
        elements.noWebsiteOnly.checked = search.noWebsiteOnly;

        closeModal();
        performSearch();
    }
};

// ===================================
// NOTIFICATIONS
// ===================================
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' : type === 'error' ? 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: var(--radius-md);
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        font-weight: 600;
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ===================================
// START APPLICATION
// ===================================
document.addEventListener('DOMContentLoaded', init);
