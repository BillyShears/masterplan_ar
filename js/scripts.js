// scripts.js

document.addEventListener('DOMContentLoaded', function () {
    let markerData = []; // To store data from data.json
    let currentMarker = null; // To keep track of the currently active marker
    let currentTrackedMarker = null; // Store the actual <a-marker> element
    let currentAugmentedContent = null; // Store the augmented content for the current marker
    let currentPlane = null; // The plane element for the current marker
    let currentModel = null; // The model element for the current marker
    let currentBuildings = null; // Store the list of buildings for the current marker
    let currentBuilding = null; // To keep track of the currently selected building
    let currentARLayer = 'model0'; // Default AR layer
    let currentARLayerIndex = 0; // To keep track of the current layer index
    let interval = null; // For the animation interval
    let availableARLayers = []; // To store available layers for the current marker
    let arInitialized = false; // To track if AR.js is initialized
    let wasLandscape = null;
    let resetClickedOnce = false;

    const overlay = document.getElementById('overlay');
    const sceneEl = document.querySelector('a-scene');
    const assetsContainer = document.getElementById('assetsContainer');
    const changeLayerBtn = document.getElementById('changeLayerBtn');
    const changeLayerContainer = document.getElementById('arLayerChangeButton');
    const currentLayerIcon = document.getElementById('currentLayerIcon');
    const resetButton = document.getElementById('resetButton');

    console.log('DOM fully loaded and parsed.');

    // Fetch the JSON data
    function initializeScene() {

        fetch('data.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                markerData = data.markers;
                initializeData()
                console.log('Marker Data Loaded:', markerData);
            })
            .catch(error => {
                console.error('Error loading data:', error);
            });
    }

    function initializeData() {

        markerData.forEach(marker => {
            addAssets(marker);
            addMarker(marker);

            arInitialized = true; // Mark AR.js as initialized
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
        ['img0', 'img1', 'img2'].forEach(key => {
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

        // Add model assets (OBJ)
        ['model0', 'model1', 'model2', 'model3'].forEach(key => {
            if (augmentedContent[key]) {
                const modelName = augmentedContent[key];
                const modelSrc = `media/${marker.id}/${modelName}`;
                const modelId = getAssetId(modelSrc);
                
                const assetItemObj = document.createElement('a-asset-item');
                assetItemObj.setAttribute('id', modelId);
                assetItemObj.setAttribute('src', modelSrc);
                assetItemObj.setAttribute('crossorigin', 'anonymous');
                assetsContainer.appendChild(assetItemObj);
                
                // Add MTL file if it exists
                const modelMtlName = modelName.replace('.obj', '.mtl');
                const modelMtlSrc = `media/${marker.id}/${modelMtlName}`;
                const modelMtlId = getAssetId(modelMtlSrc);
                
                const assetItemMtl = document.createElement('a-asset-item');
                assetItemMtl.setAttribute('id', modelMtlId);
                assetItemMtl.setAttribute('src', modelMtlSrc);
                assetItemMtl.setAttribute('crossorigin', 'anonymous');
                assetsContainer.appendChild(assetItemMtl);
            }
        });
    }

    function addMarker(marker) {
        const aMarker = document.createElement('a-marker');
        aMarker.setAttribute('preset', 'custom');
        aMarker.setAttribute('smooth', 'false');
        aMarker.setAttribute('size', '0.15')
        aMarker.setAttribute('type', 'pattern');
        aMarker.setAttribute('url', `media/${marker.id}/pattern.patt`); // Assuming pattern files are named accordingly
        aMarker.setAttribute('id', marker.id);

        // Create a plane for images
        const plane = document.createElement('a-plane');
        plane.setAttribute('id', `plane-${marker.id}`);
        plane.setAttribute('position', '0 0.5 0');
        plane.setAttribute('rotation', '-90 0 0');
        plane.setAttribute('width', '1');
        plane.setAttribute('height', '1');
        plane.setAttribute('visible', 'false'); // Initially hidden
        aMarker.appendChild(plane);

        // Create an entity for the model
        const model = document.createElement('a-entity');
        model.setAttribute('id', `model-${marker.id}`);
        model.setAttribute('position', '0 0 0');
        model.setAttribute('rotation', '0 0 0');
        model.setAttribute('scale', '1 1 1');
        model.setAttribute('visible', 'false'); // Initially hidden
        aMarker.appendChild(model);

        // Append the marker to the scene
        sceneEl.appendChild(aMarker);
    }

    // Initialize markers with event listeners
    function initializeMarkers() {
        document.querySelectorAll('a-marker').forEach((aMarker) => {
            const markerId = aMarker.id; // Marker ID for easy reference

            // Remove existing listeners to prevent duplicates
            aMarker.removeEventListener('markerFound', handleMarkerFound);
            aMarker.removeEventListener('markerLost', handleMarkerLost);

            // Define event handlers as named functions to enable removal
            function handleMarkerFound() {
                console.log(`Marker Found: ${markerId}`);

                // Deactivate previous marker if another is currently tracked
                if (currentTrackedMarker && currentTrackedMarker !== aMarker) {
                    console.log(`Deactivating previous marker: ${currentTrackedMarker.id}`);
                    // Manually trigger 'markerLost' for the old marker
                    currentTrackedMarker.dispatchEvent(new Event('manualMarkerLost'));
                }

                // Set the newly found marker as the current one
                currentTrackedMarker = aMarker;

                // Custom Logic for Marker Found
                const thisMarkerData = markerData.find((marker) => marker.id === markerId); // Find marker data
                if (!thisMarkerData) {
                    console.warn(`Marker data not found for ID: ${markerId}`);
                    return;
                }

                // Set global variables for the new marker
                currentMarker = markerId;
                currentBuildings = thisMarkerData.buildings;
                currentAugmentedContent = thisMarkerData.augmentedContent;

                // Generate dynamic buttons and AR layers
                generateBuildingButtons(currentBuildings);
                initializeARLayers();

                // Show the Change Layer button
                const arLayerChangeButton = document.getElementById('arLayerChangeButton');
                arLayerChangeButton.style.display = 'block';

                // Set the plane and model specific to this marker
                currentPlane = aMarker.querySelector(`#plane-${markerId}`);
                currentModel = aMarker.querySelector(`#model-${markerId}`);

                // Initialize the current AR layer
                setImageSet(currentARLayer);

                console.log(`Marker ${markerId} is now active.`);
            }

            // Listen for when a marker is lost
            function handleMarkerLost() {
                console.log(`Marker Lost: ${markerId}`);

                // Ignore markerLost if another marker has already been found
                if (currentTrackedMarker !== aMarker) {
                    console.log(`Ignoring markerLost for ${markerId} because a new marker is already active.`);
                    return;
                }

                // Clear the current marker tracking
                console.log(`Stopping tracking for marker: ${markerId}`);
                currentTrackedMarker = null;

                // Custom Logic for Marker Lost
                currentMarker = null;

                // Hide the button container
                const buttonContainer = document.getElementById('buttonContainer');
                buttonContainer.style.display = 'none';

                // Hide the Change Layer button
                const arLayerChangeButton = document.getElementById('arLayerChangeButton');
                arLayerChangeButton.style.display = 'none';

                // Clear interval and hide elements
                clearInterval(interval);
                if (currentPlane) {
                    currentPlane.setAttribute('visible', 'false');
                }
                if (currentModel) {
                    currentModel.setAttribute('visible', 'false');
                }

                console.log(`Marker ${markerId} deactivated.`);
            }

            // Add event listeners
            aMarker.addEventListener('markerFound', handleMarkerFound);
            aMarker.addEventListener('markerLost', handleMarkerLost);

        });
    }

    // Generate Building Buttons
    function generateBuildingButtons(buildings) {
        // Get the button container
        const buttonContainer = document.getElementById('buttonContainer');
        // Clear any existing buttons
        buttonContainer.innerHTML = '';

        buildings.forEach((building) => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-primary';
            btn.style.marginBottom = '5px'; // Add spacing between buttons
            btn.innerHTML = '<i class="bi bi-info-circle"></i>'; // Or building.title if more than one
            btn.addEventListener('click', () => {
                showBuildingInfo(building);
            });
            buttonContainer.appendChild(btn);
        });

        // Show the button container
        buttonContainer.style.display = 'flex';
        buttonContainer.style.flexDirection = 'column';
    }

    // Change layer button

    changeLayerContainer.addEventListener('click', () => {
        if (availableARLayers.length > 0) {
            // Move to the next layer
            currentARLayerIndex = (currentARLayerIndex + 1) % availableARLayers.length;
            const newLayer = availableARLayers[currentARLayerIndex]
            currentARLayer = newLayer
            setImageSet(newLayer);
        } else {
            console.warn('No available AR layers to cycle through.');
        }
    });

    // Initialize AR layers
    
    function initializeARLayers() {
        const arLayers = ['img0', 'img1', 'img2', 'animation', 'model0', 'model1', 'model2', 'model3'];

        availableARLayers = arLayers.filter(layer => {
            const content = currentAugmentedContent[layer];
            return content && content.length > 0;
        });

        if (availableARLayers.length > 0) {
            console.log(`Available AR layers: ${availableARLayers.length}`);
            setImageSet(availableARLayers[currentARLayerIndex]);
        } else {
            console.warn('No available AR layers for this marker.');
        }
    }

    // Set Image Set (AR Layer)
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

                // Fix scale and position based on the JSON data
                const position = currentAugmentedContent.position[set] || '0 0 0';
                const scale = currentAugmentedContent.scale[set] || '1 1 1';
                currentPlane.setAttribute('position', position);
                currentPlane.setAttribute('scale', scale);
            }

            changeImage(); // Show the first image immediately
            interval = setInterval(changeImage, 1000); // Adjust the interval as needed
        } else if (set === 'img0' || set === 'img1' || set === 'img2') {
            console.log(`Switching to ${set}`);
            const imgName = currentAugmentedContent[set];
            const imgSrc = `media/${currentMarker}/${imgName}`;
            if (imgSrc) {
                currentPlane.setAttribute('visible', 'true');
                currentPlane.setAttribute('src', `#${getAssetId(imgSrc)}`);

                // Fix scale and position based on the JSON data
                const position = currentAugmentedContent.position[set] || '0 0 0';
                const scale = currentAugmentedContent.scale[set] || '1 1 1';
                currentPlane.setAttribute('position', position);
                currentPlane.setAttribute('scale', scale);
            } else {
                console.warn(`No image found for ${set}`);
            }
        } else if (set === 'model0' || set === 'model1' || set === 'model2' || set === 'model3') {
            console.log('Switching to model');
            if (currentAugmentedContent[set]) {
                const modelName = currentAugmentedContent[set];
                const modelObjSrc = `media/${currentMarker}/${modelName}`;
                const modelObjId = `#${getAssetId(modelObjSrc)}`;

                const modelMtlName = modelName.replace('.obj', '.mtl');
                const modelMtlSrc = `media/${currentMarker}/${modelMtlName}`;
                const modelMtlId = `#${getAssetId(modelMtlSrc)}`;

                currentModel.setAttribute('visible', 'true');
                currentModel.setAttribute('obj-model', `obj: ${modelObjId}; mtl: ${modelMtlId}`);

                console.log(`OBJ ID: ${modelObjId}, MTL ID: ${modelMtlId}`);

                // Fix scale and position based on the JSON data
                let position = currentAugmentedContent.position[set] || '0 0 0';
                const scale = currentAugmentedContent.scale[set] || '1 1 1';
                currentModel.setAttribute('position', position);
                currentModel.setAttribute('scale', scale);
                console.log(`SCALE: ${scale}`);

                // iPad alignment patch
                
                if (isIPad()) {
                    console.log("This device is an iPad");
                    position = {
                        x: position.x || 0,
                        y: (position.y || 0) + 0.6, // Add to the y-axis
                        z: position.z || 0,
                    };
                    currentModel.setAttribute('position', position);

                    // Debug display
                    resetButton.style.backgroundColor = '#002b49';
                    resetButton.style.borderColor = '#002b49';
                }
                

            } else {
                console.warn('No model found for this marker.');
            }
        }

        // Update the button label and icon using getLayerLabel
        const layerInfo = getLayerLabel(set);
        currentLayerIcon.innerHTML = `<i class="${layerInfo.icon} me-2"></i> &nbsp;&nbsp;${layerInfo.text}`;
    }


    function getAssetId(src) {
        const parts = src.split('/');
        if (parts.length < 3) {
            console.warn(`Unexpected media path format: ${src}`);
            return src; // Fallback to the full path if format is unexpected
        }
        const markerId = parts[1]; // e.g., 'marker1'
        const filename = parts[2]; // e.g., 'model.obj' or 'model.mtl'
        const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.')); // e.g., 'model'
        const ext = filename.substring(filename.lastIndexOf('.') + 1); // e.g., 'obj' or 'mtl'
        return `${markerId}_${nameWithoutExt}_${ext}`; // e.g., 'marker1_model_obj' or 'marker1_model_mtl'
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
                document.getElementById('beforeBtn').addEventListener('click', () => loadBeforeView(building));
                document.getElementById('closeBtn').addEventListener('click', closeOverlay);

                // FIXME: not working if building.project is not set in data.json
                let button = document.getElementById('projectBtn');
                if (building.project) {
                    button.style.display = 'block';
                    button.addEventListener('click', () => loadProjectView(building));
                } else {
                    button.style.display = 'none';
                }
            })
            .catch(err => {
                console.warn('Failed to load first-view template:', err);
                displayError('There was an error loading the content for this building.');
            });
    }

    function loadStoryView(building) {
        if (building.story) {
            window.open(building.story, '_blank');
        } else {
            console.warn('No story URL found for this building.');
            displayError('There is no story URL available for this building.');
        }
    }

    // function loadStoryView(building) {
    //     fetch('templates/story-view.html')
    //         .then(response => response.text())
    //         .then(template => {
    //             const storiesWithFlags = building.story.map((storyItem, index) => {
    //                 return {
    //                     ...storyItem,
    //                     isFirst: index === 0
    //                 };
    //             });

    //             const rendered = Mustache.render(template, { story: storiesWithFlags });
    //             overlay.innerHTML = rendered;

    //             const carouselElement = document.querySelector('#storyCarousel');
    //             if (carouselElement) {
    //                 new bootstrap.Carousel(carouselElement);
    //             }

    //             overlay.querySelectorAll('img').forEach(img => {
    //                 img.addEventListener('click', function () {
    //                     showImageModal(img.src);
    //                 });
    //             });
    //         })
    //         .catch(err => {
    //             console.warn('Failed to load story-view template:', err);
    //             displayError('There was an error loading the story pages for this building.');
    //         });
    // }

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
                displayError('There was an error loading the project pages for this building.');
            });
    }

    function loadBeforeView(building) {
        fetch('templates/before-view.html')
            .then(response => response.text())
            .then(template => {
                const storiesWithFlags = building.before.map((deforeItem, index) => {
                    return {
                        ...deforeItem,
                        isFirst: index === 0
                    };
                });

                const rendered = Mustache.render(template, { before: storiesWithFlags });
                overlay.innerHTML = rendered;

                const carouselElement = document.querySelector('#beforeCarousel');
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
                console.warn('Failed to load before-view template:', err);
                displayError('There was an error loading the before/after pages for this building.');
            });
    }

    function showYearOverlay(building, year) {
        const yearData = building.project.timeline.find(item => item.year === year);
        if (yearData) {
            fetch('templates/year-overlay.html')
                .then(response => response.text())
                .then(template => {
                    const rendered = Mustache.render(template, yearData);
                    // Use insertAdjacentHTML instead of innerHTML +=
                    overlay.insertAdjacentHTML('beforeend', rendered);

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
            // Append the modal to the overlay without overwriting existing content
            overlay.insertAdjacentHTML('beforeend', rendered);

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
                    <button id="closeBtn" class="btn btn-secondary close-btn"><i class="bi bi-x"></i></button>
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
        const backButton = document.getElementById('backBtn');
        if (event.target === backButton || backButton.contains(event.target)) {
            console.log('Back to Main Menu button clicked.');
            loadBuildingContent(currentBuilding);
        }
    });

    function getLayerLabel(layer) {
        const layerInfo = {
            'animation': { text: 'anim', icon: 'bi bi-bug' },
            'img0': { text: '', icon: 'bi bi-bug' },
            'img1': { text: 'Accessi', icon: 'bi bi-box-arrow-in-right' },
            'img2': { text: 'Flussi', icon: 'bi bi-shuffle' },
            'model0': { text: 'Dati', icon: 'bi bi-bar-chart' },
            'model1': { text: 'Accessi', icon: 'bi bi-box-arrow-in-right' },
            'model2': { text: 'Flussi', icon: 'bi bi-shuffle' },
            'model3': { text: 'Debug', icon: 'bi bi-bug' },
        };
        // Return the corresponding layer info or default values
        return layerInfo[layer] || { text: 'Change Layer', icon: 'bi bi-layers' };
    }

    // ORIENTATION ALERT

    // Track the previous orientation state
    function checkOrientation() {
        const alertElement = document.getElementById("orientation-alert");

        // Get the current orientation
        const isLandscape = window.matchMedia("(orientation: landscape)").matches;

        // Only proceed if the orientation has changed
        if (wasLandscape === isLandscape) {
            return; // No changes; skip the logic
        }

        wasLandscape = isLandscape; // Update the tracked orientation state

        if (isLandscape) {
            console.log("Orientation changed to landscape.");
            alertElement.classList.remove("hidden"); // Show alert
        } else {
            console.log("Orientation changed to portrait.");
            alertElement.classList.add("hidden"); // Hide alert

            // Initialize AR.js if not already initialized
            if (!arInitialized) {
                console.log("Initializing AR.js for portrait mode...");
                initializeScene();
            }
        }
    }

    // Add event listener for orientation changes
    window.addEventListener("resize", () => {
        checkOrientation();

        // Handle resize corrections (iPad issues)
        const sceneEl = document.querySelector("a-scene");
        if (sceneEl && sceneEl.camera) {
            sceneEl.camera.aspect = window.innerWidth / window.innerHeight;
            sceneEl.camera.updateProjectionMatrix();
        }

    });

    // Reload the page without intro
    function reset() {
        const url = new URL(window.location.href);
        url.searchParams.set('noIntro', '');
        window.location.href = url.toString();
    }

    // Tooltip

    // Initialize tooltip
    const tooltipInstance = new bootstrap.Tooltip(resetButton);

    resetButton.addEventListener('click', () => {
        if (!resetClickedOnce) {
            tooltipInstance.show(); // Show the tooltip
            resetClickedOnce = true;

            // Automatically hide tooltip after 2 seconds (optional)
            setTimeout(() => {
                tooltipInstance.hide();
            }, 2000);
        } else {
            tooltipInstance.hide(); // Hide the tooltip on the second click
            reset();
        }
    });

    // Other helper functions
    function isIPad() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;

        // Detect via User Agent for older and newer iPads
        const isOldIPad = /iPad/.test(userAgent);

        // Detect iPadOS devices (modern devices, including Apple Silicon)
        const isModernIPad = (
            navigator.platform === 'MacIntel' || navigator.platform === 'iPad') &&
            navigator.maxTouchPoints > 1;

        // Fallback for non-Intel iPads using `userAgentData` if available
        const isUserAgentDataIPad = navigator.userAgentData?.platform === 'iPad';

        return isOldIPad || isModernIPad || isUserAgentDataIPad;
    }

});
