// scripts.js

document.addEventListener('DOMContentLoaded', function () {
    let markerData = []; // To store data from data.json
    let currentMarker = null; // To keep track of the currently active marker
    let currentAugmentedContent = null; // Store the augmented content for the current marker
    let currentPlane = null; // The plane element for the current marker
    let currentModel = null; // The model element for the current marker
    let currentBuildings = null; // Store the list of buildings for the current marker
    let currentBuilding = null; // To keep track of the currently selected building
    let currentARLayer = 'img0'; // Default AR layer
    let interval = null; // For the animation interval
    let availableARLayers = []; // To store available layers for the current marker
    let currentARLayerIndex = 0; // To keep track of the current layer index

    const overlay = document.getElementById('overlay');
    const sceneEl = document.querySelector('a-scene');
    const assetsContainer = document.getElementById('assetsContainer');
    const changeLayerBtn = document.getElementById('changeLayerBtn');

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

        // Add model asset (OBJ)
        if (augmentedContent.model) {
            const modelName = augmentedContent.model;
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

                    // Load augmented content for this marker
                    currentAugmentedContent = marker.augmentedContent;

                    // Generate dynamic buttons
                    generateBuildingButtons(currentBuildings);

                    // Generate AR Layer buttons
                    // generateARLayerButtons();

                    // Show the Change Layer button
                    const arLayerChangeButton = document.getElementById('arLayerChangeButton');
                    arLayerChangeButton.style.display = 'block';

                    // Initialize the AR layers for the current marker
                    initializeARLayers();

                    // Get the plane and model specific to this marker
                    currentPlane = aMarker.querySelector(`#plane-${marker.id}`);
                    currentModel = aMarker.querySelector(`#model-${marker.id}`);

                    // Set the current AR layer
                    setImageSet(currentARLayer);
                });

                aMarker.addEventListener('markerLost', () => {
                    console.log(`Marker Lost: ${marker.id}`);
                    currentMarker = null;

                    // Hide the button container
                    // const buttonContainer = document.getElementById('buttonContainer');
                    // buttonContainer.style.display = 'none';

                    // Hide AR Layer buttons
                    // const arLayerButtonsContainer = document.getElementById('arLayerButtons');
                    // arLayerButtonsContainer.style.display = 'none';

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
                });
            } else {
                console.warn(`Marker element with id "${marker.id}" not found in DOM`);
            }
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
            btn.innerText = "Show Info"; // Or building.title if more than one
            btn.addEventListener('click', () => {
                showBuildingInfo(building);
            });
            buttonContainer.appendChild(btn);
        });

        // Show the button container
        buttonContainer.style.display = 'flex';
        buttonContainer.style.flexDirection = 'column';
    }

    // // Generate AR Layer Buttons
    // function generateARLayerButtons() {
    //     const arLayers = ['img0', 'img1', 'img2', 'animation', 'model'];
    //     const arLayerButtonsContainer = document.getElementById('arLayerButtons');
    //     // Clear existing buttons
    //     arLayerButtonsContainer.innerHTML = '';

    //     arLayers.forEach((layer) => {
    //         // Check if the current layer's data is available in markerData
    //         if (
    //             currentAugmentedContent &&
    //             (
    //                 !currentAugmentedContent[layer] ||
    //                 currentAugmentedContent[layer].length === 0
    //             )
    //         ) {
    //             console.warn(`Skipping layer ${layer} as it is empty or not available.`);
    //             return; // Skip this iteration if the layer is empty
    //         }

    //         const btn = document.createElement('button');
    //         btn.className = 'btn ar-layer-btn';
    //         btn.style.marginBottom = '5px';

    //         // Button label
    //         labels = {
    //             'animation': 'Usi di TOExpo',
    //             'img0': 'Area',
    //             'img1': 'Dati',
    //             'img2': 'Accessi',
    //             'model': 'Fasi del cantiere',
    //         }
    //         label = labels[layer]
    //         btn.innerText = label;

    //         // Add 'btn-primary' class if this is the current layer, else 'btn-secondary'
    //         if (layer === currentARLayer) {
    //             btn.classList.add('btn-primary');
    //         } else {
    //             btn.classList.add('btn-secondary');
    //         }

    //         btn.addEventListener('click', () => {
    //             setImageSet(layer);
    //             updateARLayerButtons(layer);
    //         });

    //         btn.setAttribute('data-layer', layer); // Set data attribute for later reference

    //         arLayerButtonsContainer.appendChild(btn);
    //     });

    //     // Show the container
    //     arLayerButtonsContainer.style.display = 'flex';
    //     arLayerButtonsContainer.style.flexDirection = 'column';
    // }

    // // Update AR Layer Buttons
    // function updateARLayerButtons(selectedLayer) {
    //     const arLayerButtonsContainer = document.getElementById('arLayerButtons');
    //     const buttons = arLayerButtonsContainer.querySelectorAll('.ar-layer-btn');
    //     buttons.forEach((btn) => {
    //         const layer = btn.getAttribute('data-layer');
    //         if (layer === selectedLayer) {
    //             btn.classList.remove('btn-secondary');
    //             btn.classList.add('btn-primary');
    //         } else {
    //             btn.classList.remove('btn-primary');
    //             btn.classList.add('btn-secondary');
    //         }
    //     });
    // }

    // Change layer button

    changeLayerBtn.addEventListener('click', () => {
        if (availableARLayers.length > 0) {
            // Move to the next layer
            currentARLayerIndex = (currentARLayerIndex + 1) % availableARLayers.length;
            setImageSet(availableARLayers[currentARLayerIndex]);
        } else {
            console.warn('No available AR layers to cycle through.');
        }
    });

    // Initialize AR layers
    
    function initializeARLayers() {
        const arLayers = ['img0', 'img1', 'img2', 'animation', 'model'];

        availableARLayers = arLayers.filter(layer => {
            const content = currentAugmentedContent[layer];
            return content && content.length > 0;
        });

        if (availableARLayers.length > 0) {
            currentARLayerIndex = 0;
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

        currentARLayer = set; // Update the current AR layer
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
            interval = setInterval(changeImage, 1000); // Adjust the interval as needed
        } else if (set === 'img0' || set === 'img1' || set === 'img2') {
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
                const modelName = currentAugmentedContent.model;
                const modelObjSrc = `media/${currentMarker}/${modelName}`;
                const modelObjId = `#${getAssetId(modelObjSrc)}`;

                const modelMtlName = modelName.replace('.obj', '.mtl');
                const modelMtlSrc = `media/${currentMarker}/${modelMtlName}`;
                const modelMtlId = `#${getAssetId(modelMtlSrc)}`;


                currentModel.setAttribute('visible', 'true');
                currentModel.setAttribute('obj-model', `obj: ${modelObjId}; mtl: ${modelMtlId}`);

                console.log(`OBJ ID: ${modelObjId}, MTL ID: ${modelMtlId}`);

                // Set the model position based on the JSON data
                const modelPosition = currentAugmentedContent.model_position || '0 0 0';
                currentModel.setAttribute('position', modelPosition);
            } else {
                console.warn('No model found for this marker.');
            }
        }

        // Update the AR Layer buttons to reflect the current selection
        // updateARLayerButtons(set);

        // Update the button label to show the current layer
        changeLayerBtn.innerText = getLayerLabel(set);
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

    function getLayerLabel(layer) {
        const labels = {
            'animation': 'Usi di TOExpo',
            'img0': 'Area',
            'img1': 'Dati',
            'img2': 'Accessi',
            'model': 'Fasi del cantiere',
        };
        return labels[layer] || 'Change Layer';
    }
});
