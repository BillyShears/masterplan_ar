// scripts.js

document.addEventListener('DOMContentLoaded', function () {
    let markerData = []; // To store data from data.json
    let currentMarker = null; // To keep track of the currently active marker

    var showInfoBtn = document.getElementById('showInfoBtn');
    var overlay = document.getElementById('overlay');
    var sceneEl = document.querySelector('a-scene');

    console.log('DOM fully loaded and parsed.');

    // Fetch the JSON data
    fetch('data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            markerData = data.markers;
            console.log('Marker Data Loaded:', markerData);
            initializeMarkers();
        })
        .catch(error => {
            console.error('Error loading data:', error);
        });

    // Initialize markers with event listeners
    function initializeMarkers() {
        if (markerData.length === 0) {
            console.warn('No markers found in data.json.');
            return;
        }

        markerData.forEach(marker => {
            var aMarker = document.getElementById(marker.id);
            if (aMarker) {
                console.log(`Initializing listeners for marker: ${marker.id}`);
                aMarker.addEventListener('markerFound', () => {
                    currentMarker = marker.id;
                    console.log(`Marker Found: ${marker.id}`);
                    showInfoBtn.classList.add('visible');
                    showInfoBtn.style.display = 'block';
                });

                aMarker.addEventListener('markerLost', () => {
                    console.log(`Marker Lost: ${marker.id}`);
                    currentMarker = null;
                    showInfoBtn.classList.remove('visible');
                    showInfoBtn.style.display = 'none';
                });
            } else {
                console.warn(`Marker element with id "${marker.id}" not found in DOM`);
            }
        });
    }

    // Handle "Show Info" button click
    showInfoBtn.addEventListener('click', function () {
        console.log('Show Info button clicked.');
        if (currentMarker) {
            console.log(`Show Info clicked for marker: ${currentMarker}`);
            sceneEl.pause(); // Pause the AR scene
            overlay.style.display = 'block'; // Show the overlay
            loadContent(currentMarker); // Load content based on current marker
        } else {
            console.warn('Show Info clicked, but no marker is currently active.');
        }
    });

    // Function to load content based on marker ID
    function loadContent(markerId) {
        console.log(`Loading content for marker ID: ${markerId}`);
        // Find the data for the current marker
        let data = markerData.find(m => m.id === markerId);
        if (data) {
            console.log(`Marker Data Found for "${markerId}":`, data);
            // Load the main menu with marker-specific title
            fetch('templates/first-view.html')
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.text();
                })
                .then(template => {
                    // Use Mustache to render the template with data
                    // Ensure that the template expects only the necessary data
                    let rendered = Mustache.render(template, { title: data.title });
                    overlay.innerHTML = rendered;
                    console.log('First-view template loaded and rendered with Mustache.');

                    // Add event listeners for the buttons
                    var storyBtn = document.getElementById('storyBtn');
                    var projectBtn = document.getElementById('projectBtn');
                    var closeBtn = document.getElementById('closeBtn');

                    if (storyBtn && projectBtn && closeBtn) {
                        storyBtn.addEventListener('click', () => loadStoryView(data));
                        projectBtn.addEventListener('click', () => loadProjectView(data));
                        closeBtn.addEventListener('click', closeOverlay);
                        console.log('Event listeners added to buttons.');
                    } else {
                        console.warn('One or more buttons (storyBtn, projectBtn, closeBtn) not found in the template.');
                    }
                })
                .catch(err => {
                    console.warn('Failed to load first-view template:', err);
                    overlay.innerHTML = `
                        <div class="container mt-5">
                            <h1 class="text-center">Error Loading Content</h1>
                            <p>There was an error loading the content for this marker.</p>
                            <div class="mt-4 text-center">
                                <button id="closeBtn" class="btn btn-danger close-btn">Close</button>
                            </div>
                        </div>
                    `;
                    document.getElementById('closeBtn').addEventListener('click', closeOverlay);
                });
        } else {
            console.warn(`No data found for marker ID: "${markerId}"`);
            overlay.innerHTML = `
                <div class="container mt-5">
                    <h1 class="text-center">Content Not Found</h1>
                    <p>No data available for this marker.</p>
                    <div class="mt-4 text-center">
                        <button id="closeBtn" class="btn btn-danger close-btn">Close</button>
                    </div>
                </div>
            `;
            document.getElementById('closeBtn').addEventListener('click', closeOverlay);
        }
    }

    // Function to load the Story view
    function loadStoryView(data) {
        console.log(`Loading Story View for marker: ${currentMarker}`);
        fetch('templates/story-view.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(template => {
                // Use Mustache to render the template with data
                let rendered = Mustache.render(template, data);
                overlay.innerHTML = rendered;
                console.log('Story-view template loaded and rendered with Mustache.');

                // Initialize the carousel
                var carouselElement = document.querySelector('#storyCarousel');
                if (carouselElement) {
                    var storyCarousel = new bootstrap.Carousel(carouselElement);
                    console.log('Story Carousel Initialized.');
                } else {
                    console.warn('Story Carousel element (#storyCarousel) not found.');
                }

                // Add event listener for the back button
                var backBtn = document.getElementById('backBtn');
                if (backBtn) {
                    backBtn.addEventListener('click', () => loadContent(currentMarker));
                } else {
                    console.warn('Back button (#backBtn) not found in story-view template.');
                }

                // Add click event to images to enlarge
                var images = overlay.querySelectorAll('img');
                images.forEach(function (img) {
                    img.addEventListener('click', function () {
                        showImageModal(img.src);
                    });
                });
            })
            .catch(err => {
                console.warn('Failed to load story-view template:', err);
                overlay.innerHTML = `
                    <div class="container mt-5">
                        <h1 class="text-center">Error Loading Story</h1>
                        <p>There was an error loading the story for this marker.</p>
                        <div class="mt-4 text-center">
                            <button id="backBtn" class="btn btn-secondary back-btn">Back</button>
                        </div>
                    </div>
                `;
                document.getElementById('backBtn').addEventListener('click', () => loadContent(currentMarker));
            });
    }

    // Function to load the Project view
    function loadProjectView(data) {
        console.log(`Loading Project View for marker: ${currentMarker}`);
        fetch('templates/project-view.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(template => {
                // Use Mustache to render the template with data
                let rendered = Mustache.render(template, data);
                overlay.innerHTML = rendered;
                console.log('Project-view template loaded and rendered with Mustache.');

                // Initialize the carousel
                var carouselElement = document.querySelector('#projectCarousel');
                if (carouselElement) {
                    var projectCarousel = new bootstrap.Carousel(carouselElement);
                    console.log('Project Carousel Initialized.');
                } else {
                    console.warn('Project Carousel element (#projectCarousel) not found.');
                }

                // Add event listener for the back button
                var backBtn = document.getElementById('backBtn');
                if (backBtn) {
                    backBtn.addEventListener('click', () => loadContent(currentMarker));
                } else {
                    console.warn('Back button (#backBtn) not found in project-view template.');
                }

                // Add event listeners to timeline years
                var years = overlay.querySelectorAll('.timeline-year');
                years.forEach(function (yearBtn) {
                    yearBtn.addEventListener('click', function () {
                        var year = yearBtn.getAttribute('data-year');
                        showYearOverlay(data, year);
                    });
                });
            })
            .catch(err => {
                console.warn('Failed to load project-view template:', err);
                overlay.innerHTML = `
                    <div class="container mt-5">
                        <h1 class="text-center">Error Loading Project</h1>
                        <p>There was an error loading the project details for this marker.</p>
                        <div class="mt-4 text-center">
                            <button id="backBtn" class="btn btn-secondary back-btn">Back</button>
                        </div>
                    </div>
                `;
                document.getElementById('backBtn').addEventListener('click', () => loadContent(currentMarker));
            });
    }

    // Function to show year details
    function showYearOverlay(data, year) {
        console.log(`Showing details for year: ${year}`);
        // Find the timeline item for the selected year
        let yearData = data.project.timeline.find(item => item.year === year);
        if (yearData) {
            fetch('templates/year-overlay.html')
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.text();
                })
                .then(template => {
                    // Use Mustache to render the template with yearData
                    let rendered = Mustache.render(template, yearData);
                    overlay.innerHTML += rendered;
                    console.log('Year-overlay template loaded and rendered with Mustache.');

                    // Add event listener for the close button
                    var closeYearBtn = document.getElementById('closeYearBtn');
                    if (closeYearBtn) {
                        closeYearBtn.addEventListener('click', function () {
                            var yearOverlay = document.getElementById('yearOverlay');
                            if (yearOverlay) {
                                yearOverlay.parentNode.removeChild(yearOverlay);
                                console.log(`Closed year overlay for year: ${year}`);
                            }
                        });
                    } else {
                        console.warn('Close Year button (#closeYearBtn) not found in year-overlay template.');
                    }

                    // Add click event to image to enlarge
                    var img = document.getElementById('yearImage');
                    if (img) {
                        img.addEventListener('click', function () {
                            showImageModal(img.src);
                        });
                    } else {
                        console.warn('Year image (#yearImage) not found in year-overlay template.');
                    }
                })
                .catch(err => {
                    console.warn('Failed to load year-overlay template:', err);
                    overlay.innerHTML += `
                        <div class="container mt-5">
                            <h1 class="text-center">Error Loading Year Details</h1>
                            <p>There was an error loading the details for the year ${year}.</p>
                            <div class="mt-4 text-center">
                                <button id="closeYearBtn" class="btn btn-danger close-btn">Close</button>
                            </div>
                        </div>
                    `;
                    document.getElementById('closeYearBtn').addEventListener('click', function () {
                        var yearOverlay = document.getElementById('yearOverlay');
                        if (yearOverlay) {
                            yearOverlay.parentNode.removeChild(yearOverlay);
                        }
                    });
                });
        } else {
            console.warn(`No data found for year: "${year}"`);
        }
    }

    // Function to show enlarged images
    function showImageModal(src) {
        console.log(`Showing image modal for src: ${src}`);
        fetch('templates/image-modal.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(template => {
                // Use Mustache to render the template with src
                let rendered = Mustache.render(template, { src: src });
                overlay.innerHTML += rendered;
                console.log('Image-modal template loaded and rendered with Mustache.');

                // Initialize the modal
                var modalElement = document.getElementById('imageModal');
                if (modalElement) {
                    var imageModal = new bootstrap.Modal(modalElement, {});
                    imageModal.show();
                    console.log('Image Modal Initialized.');

                    // Remove the modal from DOM after it's closed
                    modalElement.addEventListener('hidden.bs.modal', function () {
                        modalElement.parentNode.removeChild(modalElement);
                        console.log('Image modal closed and removed from DOM.');
                    });
                } else {
                    console.warn('Image Modal element (#imageModal) not found in image-modal template.');
                }
            })
            .catch(err => {
                console.warn('Failed to load image-modal template:', err);
            });
    }

    // Function to close the overlay and resume AR scene
    function closeOverlay() {
        console.log('Closing overlay and resuming AR scene.');
        overlay.innerHTML = ''; // Clear overlay content
        overlay.style.display = 'none';
        sceneEl.play(); // Resume the AR scene
    }
});
