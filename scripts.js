// scripts.js

document.addEventListener('DOMContentLoaded', function () {
    let markerData = []; // To store data from data.json
    let currentMarker = null; // To keep track of the currently active marker
    let currentAugmentedContent = null; // Store the augmented content for the current marker
    let currentPlane = null; // The plane element for the current marker
    let currentModel = null; // The model element for the current marker
    let interval = null; // For the animation interval
    let currentSetIndex = 0; // To keep track of the current image set
    const imageSets = ['animation', 'single1', 'single2', 'model'];

    const showInfoBtn = document.getElementById('showInfoBtn');
    const changeViewBtn = document.getElementById('changeViewBtn');
    const overlay = document.getElementById('overlay');
    const sceneEl = document.querySelector('a-scene');
    const assetsContainer = document.getElementById('assetsContainer');

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
            initializeScene();
        })
        .catch(error => {
            console.error('Error loading data:', error);
        });

    function initializeScene() {
        markerData.forEach(marker => {
            // Add assets
            addAssets(marker);

            // Add marker to the scene
            addMarker(marker);
        });

        // Initialize markers with event listeners
        initializeMarkers();
    }

    function addAssets(marker) {
        const augmentedContent = marker.augmentedContent;

        // Add animation images
        if (augmentedContent.animation) {
            augmentedContent.animation.forEach(imgName => {
                const imgSrc = `media/${marker.id}/${imgName}`
                const imgId = getAssetId(imgSrc);
                const imgElement = document.createElement('img');
                imgElement.setAttribute('id', imgId);
                imgElement.setAttribute('src', imgSrc);
                imgElement.setAttribute('crossorigin', 'anonymous');
                assetsContainer.appendChild(imgElement);
            });
        }

        // Add single images
        ['single1', 'single2'].forEach(key => {
            if (augmentedContent[key]) {
                const imgName = augmentedContent[key];
                const imgSrc = `media/${marker.id}/${imgName}`
                const imgId = getAssetId(imgSrc);
                const imgElement = document.createElement('img');
                imgElement.setAttribute('id', imgId);
                imgElement.setAttribute('src', imgSrc);
                imgElement.setAttribute('crossorigin', 'anonymous');
                assetsContainer.appendChild(imgElement);
            }
        });

        // Add model asset (OBJ)
        if (augmentedContent.model) {
            const modelName = augmentedContent.model;
            const modelSrc = `media/${marker.id}/${modelName}`
            const modelId = getAssetId(modelSrc);
            const assetItem = document.createElement('a-asset-item');
            assetItem.setAttribute('id', modelId);
            assetItem.setAttribute('src', modelSrc);
            assetsContainer.appendChild(assetItem);
        }
    }

    function addMarker(marker) {
        const aMarker = document.createElement('a-marker');
        aMarker.setAttribute('preset', 'custom');
        aMarker.setAttribute('type', 'pattern');
        aMarker.setAttribute('url', `media/${marker.id}/pattern.patt`); // Assuming pattern files are named accordingly
        aMarker.setAttribute('id', marker.id);

        // Create a plane for images
        const plane = document.createElement('a-plane');
        plane.setAttribute('id', `plane-${marker.id}`);
        plane.setAttribute('position', '0 0.5 0');
        plane.setAttribute('rotation', '-90 0 0');
        plane.setAttribute('width', '2');
        plane.setAttribute('height', '2');
        plane.setAttribute('visible', 'false'); // Initially hidden
        aMarker.appendChild(plane);

        // Create an entity for the model
        const model = document.createElement('a-entity');
        model.setAttribute('id', `model-${marker.id}`);
        model.setAttribute('position', '0 0 0');
        model.setAttribute('rotation', '0 0 0');
        model.setAttribute('scale', '0.5 0.5 0.5'); // Adjust scale as needed
        model.setAttribute('visible', 'false'); // Initially hidden
        aMarker.appendChild(model);

        // Append the marker to the scene
        sceneEl.appendChild(aMarker);
    }

    // Initialize markers with event listeners
    function initializeMarkers() {
        markerData.forEach(marker => {
            const aMarker = document.getElementById(marker.id);
            if (aMarker) {
                console.log(`Initializing listeners for marker: ${marker.id}`);
                aMarker.addEventListener('markerFound', () => {
                    currentMarker = marker.id;
                    console.log(`Marker Found: ${marker.id}`);
                    showInfoBtn.style.display = 'block';
                    changeViewBtn.style.display = 'block';

                    // Load augmented content for this marker
                    currentAugmentedContent = marker.augmentedContent;
                    currentSetIndex = 0; // Reset the image set index

                    // Get the plane and model specific to this marker
                    currentPlane = aMarker.querySelector(`#plane-${marker.id}`);
                    currentModel = aMarker.querySelector(`#model-${marker.id}`);

                    // Start with the first image set
                    setImageSet(imageSets[currentSetIndex]);
                });

                aMarker.addEventListener('markerLost', () => {
                    console.log(`Marker Lost: ${marker.id}`);
                    currentMarker = null;
                    showInfoBtn.style.display = 'none';
                    changeViewBtn.style.display = 'none';

                    // Clear interval and hide elements
                    clearInterval(interval);
                    if (currentPlane) {
                        currentPlane.setAttribute('visible', 'false');
                    }
                    if (currentModel) {
                        currentModel.setAttribute('visible', 'false');
                    }
                });
            } else {
                console.warn(`Marker element with id "${marker.id}" not found in DOM`);
            }
        });
    }

    function setImageSet(set) {
        if (!currentAugmentedContent || (!currentPlane && !currentModel)) {
            console.warn('No augmented content or elements available for the current marker.');
            return;
        }

        console.log('Current set:', set);
        clearInterval(interval);

        // Hide plane and model initially
        if (currentPlane) {
            currentPlane.setAttribute('visible', 'false');
        }
        if (currentModel) {
            currentModel.setAttribute('visible', 'false');
            // Remove previous model components to avoid conflicts
            currentModel.removeAttribute('obj-model');
        }

        if (set === 'animation') {
            console.log('Switching to animation');
            let animationImages = currentAugmentedContent.animation.map(
                imgName => `#${getAssetId(`media/${currentMarker}/${imgName}`)}`
            );
            let index = 0;

            function changeImage() {
                currentPlane.setAttribute('visible', 'true');
                currentPlane.setAttribute('src', animationImages[index]);
                index = (index + 1) % animationImages.length;
            }

            changeImage(); // Show the first image immediately
            interval = setInterval(changeImage, 100); // Adjust the interval as needed
        } else if (set === 'single1' || set === 'single2') {
            console.log(`Switching to ${set}`);
            const imgName = currentAugmentedContent[set];
            const imgSrc = `media/${currentMarker}/${imgName}`;
            if (imgSrc) {
                currentPlane.setAttribute('visible', 'true');
                currentPlane.setAttribute('src', `#${getAssetId(imgSrc)}`);
            } else {
                console.warn(`No image found for ${set}`);
            }
        } else if (set === 'model') {
            console.log('Switching to model');
            if (currentAugmentedContent.model) {
                const modelName = currentAugmentedContent.model; // e.g., 'model.obj'
                const modelObjSrc = `media/${currentMarker}/${modelName}`;
                const modelObjId = `#${getAssetId(modelObjSrc)}`;

                // Derive MTL filename
                const modelMtlName = modelName.replace('.obj', '.mtl');
                const modelMtlSrc = `media/${currentMarker}/${modelMtlName}`;
                const modelMtlId = `#${getAssetId(modelMtlSrc)}`;

                console.log(`OBJ ID: ${modelObjId}, MTL ID: ${modelMtlId}`);

                currentModel.setAttribute('visible', 'true');
                currentModel.setAttribute('obj-model', `obj: ${modelObjId}; mtl: ${modelMtlId}`);
            } else {
                console.warn('No model found for this marker.');
            }
        }
    }

    function getAssetId(src) {
        const parts = src.split('/');
        if (parts.length < 3) {
            console.warn(`Unexpected media path format: ${src}`);
            return src; // Fallback to the full path if format is unexpected
        }
        const markerId = parts[1]; // 'marker1'
        const filename = parts[2]; // 'model.obj'
        const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.')); // 'model'
        return `${markerId}_${nameWithoutExt}`; // 'marker1_model'
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

    // Event listener for the Change View button
    changeViewBtn.addEventListener('click', function () {
        if (!currentAugmentedContent) {
            console.warn('No augmented content available for the current marker.');
            return;
        }
        console.log('Change View button clicked.');
        // Cycle to the next image set
        currentSetIndex = (currentSetIndex + 1) % imageSets.length;
        const newSet = imageSets[currentSetIndex];
        setImageSet(newSet);
    });

    // Event Delegation: Handle clicks on dynamically added backBtn
    overlay.addEventListener('click', function (event) {
        if (event.target && event.target.id === 'backBtn') {
            console.log('Back to Main Menu button clicked.');
            loadContent(currentMarker);
        }
    });

    // Function to load content based on marker ID
    function loadContent(markerId) {
        console.log(`Loading content for marker ID: ${markerId}`);
        const data = markerData.find(m => m.id === markerId);
        if (data) {
            console.log(`Marker Data Found for "${markerId}":`, data);

            // Assign default values if necessary
            if (!data.project.introduction) {
                data.project.introduction = "No introduction available for this project.";
                console.warn(`project.introduction is missing for marker "${markerId}". Assigned default value.`);
            }

            if (!data.project.images || !Array.isArray(data.project.images) || data.project.images.length === 0) {
                data.project.images = ["media/default-project.png"];
                console.warn(`project.images is missing or invalid for marker "${markerId}". Assigned default image.`);
            }

            if (!data.story || !Array.isArray(data.story) || data.story.length === 0) {
                data.story = [{
                    title: "No Story Available",
                    text: "There is no story data available for this marker.",
                    image: "media/default-story.png"
                }];
                console.warn(`story is missing or invalid for marker "${markerId}". Assigned default story.`);
            }

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
                    const rendered = Mustache.render(template, { title: data.title });
                    overlay.innerHTML = rendered;
                    console.log('First-view template loaded and rendered with Mustache.');

                    // Attach event listeners to the buttons (except backBtn due to event delegation)
                    const storyBtn = document.getElementById('storyBtn');
                    const projectBtn = document.getElementById('projectBtn');
                    const closeBtn = document.getElementById('closeBtn');

                    if (storyBtn && projectBtn && closeBtn) {
                        storyBtn.addEventListener('click', () => loadStoryView(data));
                        projectBtn.addEventListener('click', () => loadProjectView(data));
                        closeBtn.addEventListener('click', closeOverlay);
                        console.log('Event listeners added to Story, Project, and Close buttons.');
                    } else {
                        console.warn('One or more buttons (storyBtn, projectBtn, closeBtn) not found in the template.');
                    }
                })
                .catch(err => {
                    console.warn('Failed to load first-view template:', err);
                    displayError('There was an error loading the content for this marker.');
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
                // Add isFirst flag to the first story item
                const storiesWithFlags = data.story.map((storyItem, index) => {
                    return {
                        ...storyItem,
                        isFirst: index === 0
                    };
                });

                // Render the story-view template with updated story data
                const rendered = Mustache.render(template, { story: storiesWithFlags });
                overlay.innerHTML = rendered;
                console.log('Story-view template loaded and rendered with Mustache.');

                // Initialize the carousel
                const carouselElement = document.querySelector('#storyCarousel');
                if (carouselElement) {
                    const storyCarousel = new bootstrap.Carousel(carouselElement);
                    console.log('Story Carousel Initialized.');
                } else {
                    console.warn('Story Carousel element (#storyCarousel) not found.');
                }

                // No need to attach event listener to backBtn due to event delegation

                // Add click event to images to enlarge
                const images = overlay.querySelectorAll('img');
                images.forEach(function (img) {
                    img.addEventListener('click', function () {
                        showImageModal(img.src);
                    });
                });
            })
            .catch(err => {
                console.warn('Failed to load story-view template:', err);
                displayError('There was an error loading the story for this marker.');
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
                // Render the project-view template with project data
                const rendered = Mustache.render(template, data);
                overlay.innerHTML = rendered;
                console.log('Project-view template loaded and rendered with Mustache.');

                // Initialize the carousel
                const carouselElement = document.querySelector('#projectCarousel');
                if (carouselElement) {
                    const projectCarousel = new bootstrap.Carousel(carouselElement);
                    console.log('Project Carousel Initialized.');
                } else {
                    console.warn('Project Carousel element (#projectCarousel) not found.');
                }

                // Attach event listeners to the timeline year buttons
                const years = overlay.querySelectorAll('.timeline-year');
                years.forEach(function (yearBtn) {
                    yearBtn.addEventListener('click', function () {
                        const year = yearBtn.getAttribute('data-year');
                        showYearOverlay(data, year);
                    });
                });

                // No need to attach event listener to backBtn due to event delegation
            })
            .catch(err => {
                console.warn('Failed to load project-view template:', err);
                displayError('There was an error loading the project details for this marker.');
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
                    overlay.innerHTML += rendered; // Append to existing overlay content
                    console.log('Year-overlay template loaded and rendered with Mustache.');

                    // Attach event listener to "Close" button
                    const closeYearBtn = document.getElementById('closeYearBtn');
                    if (closeYearBtn) {
                        closeYearBtn.addEventListener('click', function () {
                            console.log(`Close Year button clicked for year: ${year}`);
                            const yearOverlay = document.getElementById('yearOverlay');
                            if (yearOverlay) {
                                yearOverlay.parentNode.removeChild(yearOverlay);
                                console.log('Year overlay removed.');
                            }
                        });
                    } else {
                        console.warn('Close Year button (#closeYearBtn) not found in year-overlay template.');
                    }

                    // Add click event to image to enlarge
                    const img = document.getElementById('yearImage');
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
                    displayError(`There was an error loading the details for the year ${year}.`);
                });
        } else {
            console.warn(`No data found for year: "${year}"`);
            displayError(`No data available for the year ${year}.`);
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
                // Render the image-modal template with src
                let rendered = Mustache.render(template, { src: src });
                overlay.innerHTML = rendered; // Replace existing overlay content
                console.log('Image-modal template loaded and rendered with Mustache.');

                // Initialize the modal
                const modalElement = document.getElementById('imageModal');
                if (modalElement) {
                    const imageModal = new bootstrap.Modal(modalElement, {});
                    imageModal.show();
                    console.log('Image Modal Initialized.');

                    // Attach event listener to the Close button in the modal
                    const closeModalBtn = modalElement.querySelector('[data-bs-dismiss="modal"]');
                    if (closeModalBtn) {
                        closeModalBtn.addEventListener('click', function () {
                            imageModal.hide();
                            console.log('Image Modal closed.');
                        });
                    } else {
                        console.warn('Close button in image-modal template not found.');
                    }

                    // Attach event listener to the image for error handling
                    const modalImage = document.getElementById('modalImage');
                    if (modalImage) {
                        modalImage.addEventListener('error', function () {
                            console.warn(`Image failed to load: ${src}. Replacing with default image.`);
                            this.src = 'media/default-modal.png';
                        });
                    } else {
                        console.warn('Modal image (#modalImage) not found in image-modal template.');
                    }

                    // Remove the modal from DOM after it's hidden
                    modalElement.addEventListener('hidden.bs.modal', function () {
                        modalElement.parentNode.removeChild(modalElement);
                        console.log('Image modal removed from DOM.');
                    });
                } else {
                    console.warn('Image Modal element (#imageModal) not found in image-modal template.');
                }
            })
            .catch(err => {
                console.warn('Failed to load image-modal template:', err);
                displayError('There was an error displaying the image.');
            });
    }

    // Function to display error messages
    function displayError(message) {
        overlay.innerHTML = `
            <div class="container mt-5">
                <h1 class="text-center">Error</h1>
                <p class="text-center">${message}</p>
                <div class="mt-4 text-center">
                    <button id="closeBtn" class="btn btn-danger close-btn">Close</button>
                </div>
            </div>
        `;
        // Attach event listener to the close button
        const closeBtn = document.getElementById('closeBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeOverlay);
        } else {
            console.warn('Close button (#closeBtn) not found in error display.');
        }
    }

    // Function to close the overlay and resume AR scene
    function closeOverlay() {
        console.log('Closing overlay and resuming AR scene.');
        overlay.innerHTML = ''; // Clear overlay content
        overlay.style.display = 'none';
        sceneEl.play(); // Resume the AR scene
    }
});
