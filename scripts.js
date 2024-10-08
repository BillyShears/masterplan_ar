document.addEventListener('DOMContentLoaded', function () {
    let markerData = []; // To store data from data.json
    let currentMarker = null; // To keep track of the currently active marker
    let currentAugmentedContent = null; // Store the augmented content for the current marker
    let currentPlane = null; // The plane element for the current marker
    let currentModel = null; // The model element for the current marker
    let currentBuildings = null; // Store the list of buildings for the current marker
    let currentBuilding = null; // To keep track of the currently selected building
    let interval = null; // For the animation interval
    let currentSetIndex = 0; // To keep track of the current image set
    const imageSets = ['animation', 'single1', 'single2', 'model'];
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
                const imgSrc = `media/${marker.id}/${imgName}`;
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
                const imgSrc = `media/${marker.id}/${imgName}`;
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
            const modelSrc = `media/${marker.id}/${modelName}`;
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
        model.setAttribute('scale', '0.01 0.01 0.01'); // Adjust scale as needed
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
                    currentBuildings = marker.buildings; // Store buildings array
                    console.log(`Marker Found: ${marker.id}`);

                    // Generate dynamic buttons
                    generateBuildingButtons(currentBuildings);

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

                    // Hide the button container
                    const buttonContainer = document.getElementById('buttonContainer');
                    buttonContainer.style.display = 'none';

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

    function generateBuildingButtons(buildings) {
        // Get the button container
        const buttonContainer = document.getElementById('buttonContainer');
        // Clear any existing buttons
        buttonContainer.innerHTML = '';

        buildings.forEach((building) => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-primary';
            btn.style.marginBottom = '5px'; // Add spacing between buttons
            btn.innerText = building.title;
            btn.addEventListener('click', () => {
                showBuildingInfo(building);
            });
            buttonContainer.appendChild(btn);
        });

        // Show the button container
        buttonContainer.style.display = 'flex';
        buttonContainer.style.flexDirection = 'column';
    }

    function showBuildingInfo(building) {
        console.log(`Showing info for building: ${building.title}`);
        currentBuilding = building; // Set the current building
        sceneEl.pause(); // Pause the AR scene
        overlay.style.display = 'block'; // Show the overlay
        loadBuildingContent(building); // Load content based on the selected building
    }

    function loadBuildingContent(building) {
        console.log(`Loading content for building: ${building.title}`);
        fetch('templates/first-view.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(template => {
                const rendered = Mustache.render(template, { title: building.title });
                overlay.innerHTML = rendered;

                document.getElementById('storyBtn').addEventListener('click', () => loadStoryView(building));
                document.getElementById('projectBtn').addEventListener('click', () => loadProjectView(building));
                document.getElementById('closeBtn').addEventListener('click', closeOverlay);
            })
            .catch(err => {
                console.warn('Failed to load first-view template:', err);
                displayError('There was an error loading the content for this building.');
            });
    }

    function loadStoryView(building) {
        fetch('templates/story-view.html')
            .then(response => response.text())
            .then(template => {
                const storiesWithFlags = building.story.map((storyItem, index) => {
                    return {
                        ...storyItem,
                        isFirst: index === 0
                    };
                });

                const rendered = Mustache.render(template, { story: storiesWithFlags });
                overlay.innerHTML = rendered;

                const carouselElement = document.querySelector('#storyCarousel');
                if (carouselElement) {
                    new bootstrap.Carousel(carouselElement);
                }

                overlay.querySelectorAll('img').forEach(img => {
                    img.addEventListener('click', function () {
                        showImageModal(img.src);
                    });
                });
            })
            .catch(err => {
                console.warn('Failed to load story-view template:', err);
                displayError('There was an error loading the story for this building.');
            });
    }

    function loadProjectView(building) {
        fetch('templates/project-view.html')
            .then(response => response.text())
            .then(template => {
                const rendered = Mustache.render(template, building);
                overlay.innerHTML = rendered;

                const carouselElement = document.querySelector('#projectCarousel');
                if (carouselElement) {
                    new bootstrap.Carousel(carouselElement);
                }

                const years = overlay.querySelectorAll('.timeline-year');
                years.forEach(yearBtn => {
                    yearBtn.addEventListener('click', function () {
                        const year = yearBtn.getAttribute('data-year');
                        showYearOverlay(building, year);
                    });
                });
            })
            .catch(err => {
                console.warn('Failed to load project-view template:', err);
                displayError('There was an error loading the project details for this building.');
            });
    }

    function showYearOverlay(building, year) {
        const yearData = building.project.timeline.find(item => item.year === year);
        if (yearData) {
            fetch('templates/year-overlay.html')
                .then(response => response.text())
                .then(template => {
                    const rendered = Mustache.render(template, yearData);
                    overlay.innerHTML += rendered;

                    document.getElementById('closeYearBtn').addEventListener('click', function () {
                        const yearOverlay = document.getElementById('yearOverlay');
                        if (yearOverlay) {
                            yearOverlay.parentNode.removeChild(yearOverlay);
                        }
                    });

                    const img = document.getElementById('yearImage');
                    if (img) {
                        img.addEventListener('click', function () {
                            showImageModal(img.src);
                        });
                    }
                })
                .catch(err => {
                    console.warn('Failed to load year-overlay template:', err);
                    displayError(`There was an error loading the details for the year ${year}.`);
                });
        }
    }

    function showImageModal(src) {
        fetch('templates/image-modal.html')
            .then(response => response.text())
            .then(template => {
                const rendered = Mustache.render(template, { src });
                overlay.innerHTML = rendered;

                const modalElement = document.getElementById('imageModal');
                if (modalElement) {
                    const imageModal = new bootstrap.Modal(modalElement, {});
                    imageModal.show();

                    modalElement.querySelector('[data-bs-dismiss="modal"]').addEventListener('click', function () {
                        imageModal.hide();
                    });

                    modalElement.addEventListener('hidden.bs.modal', function () {
                        modalElement.parentNode.removeChild(modalElement);
                    });
                }
            })
            .catch(err => {
                console.warn('Failed to load image-modal template:', err);
                displayError('There was an error displaying the image.');
            });
    }

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
        document.getElementById('closeBtn').addEventListener('click', closeOverlay);
    }

    function closeOverlay() {
        overlay.innerHTML = '';
        overlay.style.display = 'none';
        sceneEl.play();
    }

    // Event Delegation: Handle clicks on dynamically added backBtn
    overlay.addEventListener('click', function (event) {
        if (event.target && event.target.id === 'backBtn') {
            console.log('Back to Main Menu button clicked.');
            loadBuildingContent(currentBuilding);
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
});
