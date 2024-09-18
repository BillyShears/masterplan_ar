document.addEventListener('DOMContentLoaded', function () {
    var marker = document.querySelector('a-marker');
    var showInfoBtn = document.getElementById('showInfoBtn');
    var overlay = document.getElementById('overlay');
    var sceneEl = document.querySelector('a-scene');

    // Show the "Show Info" button when the marker is found
    marker.addEventListener('markerFound', function () {
        showInfoBtn.style.display = 'block';
    });

    // Hide the "Show Info" button when the marker is lost
    marker.addEventListener('markerLost', function () {
        showInfoBtn.style.display = 'none';
    });

    // Handle "Show Info" button click
    showInfoBtn.addEventListener('click', function () {
        sceneEl.pause(); // Pause the AR scene
        overlay.style.display = 'block'; // Show the overlay
        loadFirstView(); // Load the first view content
    });


    // Function to load the first view (Main Menu)
    function loadFirstView() {
        overlay.innerHTML = `
                    <div class="container mt-5">
                        <h1 class="text-center">Welcome to the AR Experience</h1>
                        <div class="d-flex justify-content-center mt-4">
                            <button id="storyBtn" class="btn btn-primary mx-2">Story</button>
                            <button id="projectBtn" class="btn btn-secondary mx-2">Project</button>
                        </div>
                        <div class="mt-4 text-center">
                            <button id="closeBtn" class="btn btn-danger">Close</button>
                        </div>
                    </div>
                `;

        // Event listeners for the buttons
        document.getElementById('storyBtn').addEventListener('click', loadStoryView);
        document.getElementById('projectBtn').addEventListener('click', loadProjectView);
        document.getElementById('closeBtn').addEventListener('click', function () {
            overlay.style.display = 'none';
            sceneEl.play(); // Resume the AR scene
        });
    }

    // Function to load the Story view
    function loadStoryView() {
        overlay.innerHTML = `
                    <div class="container mt-5">
                        <h1 class="text-center">Story</h1>
                        <!-- Carousel -->
                        <div id="storyCarousel" class="carousel slide" data-bs-ride="carousel">
                            <div class="carousel-inner">
                                <!-- Slide 1 -->
                                <div class="carousel-item active">
                                    <h2>Page 1 Title</h2>
                                    <p>Page 1 text body.</p>
                                    <img src="media/story1.jpg" class="d-block w-100" alt="Image 1">
                                </div>
                                <!-- Slide 2 -->
                                <div class="carousel-item">
                                    <h2>Page 2 Title</h2>
                                    <p>Page 2 text body.</p>
                                    <img src="media/story2.jpg" class="d-block w-100" alt="Image 2">
                                </div>
                                <!-- Add more slides as needed -->
                            </div>
                            <button class="carousel-control-prev" type="button" data-bs-target="#storyCarousel" data-bs-slide="prev">
                                <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                            </button>
                            <button class="carousel-control-next" type="button" data-bs-target="#storyCarousel" data-bs-slide="next">
                                <span class="carousel-control-next-icon" aria-hidden="true"></span>
                            </button>
                        </div>
                        <div class="mt-4 text-center">
                            <button id="backBtn" class="btn btn-secondary">Back to Main Menu</button>
                        </div>
                    </div>
                `;

        // Event listener for the back button
        document.getElementById('backBtn').addEventListener('click', loadFirstView);

        // Add click event to images to enlarge
        var images = overlay.querySelectorAll('img');
        images.forEach(function (img) {
            img.addEventListener('click', function () {
                showImageModal(img.src);
            });
        });
    }

    // Function to load the Project view
    function loadProjectView() {
        overlay.innerHTML = `
                    <div class="container mt-5">
                        <h1 class="text-center">Project</h1>
                        <!-- Carousel -->
                        <div id="projectCarousel" class="carousel slide" data-bs-ride="carousel">
                            <div class="carousel-inner">
                                <!-- Page 1 -->
                                <div class="carousel-item active">
                                    <h2>Project Introduction</h2>
                                    <p>Some introductory text about the project.</p>
                                </div>
                                <!-- Page 2: Timeline -->
                                <div class="carousel-item">
                                    <h2>Timeline</h2>
                                    <ul class="list-group">
                                        <li class="list-group-item">
                                            <button class="btn btn-link timeline-year" data-year="2020">2020</button>
                                        </li>
                                        <li class="list-group-item">
                                            <button class="btn btn-link timeline-year" data-year="2021">2021</button>
                                        </li>
                                        <li class="list-group-item">
                                            <button class="btn btn-link timeline-year" data-year="2022">2022</button>
                                        </li>
                                        <!-- Add more years as needed -->
                                    </ul>
                                </div>
                                <!-- Add more pages as needed -->
                            </div>
                            <button class="carousel-control-prev" type="button" data-bs-target="#projectCarousel" data-bs-slide="prev">
                                <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                            </button>
                            <button class="carousel-control-next" type="button" data-bs-target="#projectCarousel" data-bs-slide="next">
                                <span class="carousel-control-next-icon" aria-hidden="true"></span>
                            </button>
                        </div>
                        <div class="mt-4 text-center">
                            <button id="backBtn" class="btn btn-secondary">Back to Main Menu</button>
                        </div>
                    </div>
                `;

        // Event listener for the back button
        document.getElementById('backBtn').addEventListener('click', loadFirstView);

        // Add event listeners to timeline years
        var years = overlay.querySelectorAll('.timeline-year');
        years.forEach(function (yearBtn) {
            yearBtn.addEventListener('click', function () {
                var year = yearBtn.getAttribute('data-year');
                showYearOverlay(year);
            });
        });
    }

    // Function to show year details
    function showYearOverlay(year) {
        // Show an overlay with date as title, text, and image
        overlay.innerHTML += `
                    <div id="yearOverlay" class="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75">
                        <div class="container mt-5 text-white">
                            <h1>${year}</h1>
                            <p>Details about the year ${year}.</p>
                            <img src="media/year${year}.jpg" class="d-block w-100" alt="Year ${year}">
                            <div class="mt-4 text-center">
                                <button id="closeYearBtn" class="btn btn-danger">Close</button>
                            </div>
                        </div>
                    </div>
                `;

        document.getElementById('closeYearBtn').addEventListener('click', function () {
            var yearOverlay = document.getElementById('yearOverlay');
            yearOverlay.parentNode.removeChild(yearOverlay);
        });

        // Add click event to image to enlarge
        var img = document.querySelector('#yearOverlay img');
        img.addEventListener('click', function () {
            showImageModal(img.src);
        });
    }

    // Function to show enlarged images
    function showImageModal(src) {
        // Create a modal to show the enlarged image
        overlay.innerHTML += `
                    <div id="imageModal" class="modal" tabindex="-1">
                      <div class="modal-dialog modal-fullscreen">
                        <div class="modal-content">
                          <div class="modal-body">
                            <img src="${src}" class="img-fluid" alt="Enlarged Image">
                          </div>
                          <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                          </div>
                        </div>
                      </div>
                    </div>
                `;
        var imageModal = new bootstrap.Modal(document.getElementById('imageModal'), {});
        imageModal.show();

        document.getElementById('imageModal').addEventListener('hidden.bs.modal', function () {
            var modalEl = document.getElementById('imageModal');
            modalEl.parentNode.removeChild(modalEl);
        });
    }
    
});