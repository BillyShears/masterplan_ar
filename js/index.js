// index.js

// Intro modal
let showInstructions = true;
const openIntroModalButton = document.getElementById('openIntroModalButton');
const openInstructionsModalButton = document.getElementById('openInstructionsModalButton');
const introModalElement = document.getElementById('introModal');
const instructionsModalElement = document.getElementById('instructionsModal');

const introModal = new bootstrap.Modal(introModalElement, {
    keyboard: false
});

const instructionsModal = new bootstrap.Modal(instructionsModalElement, {
    keyboard: false
});

document.addEventListener('DOMContentLoaded', () => {
    // Check if the URL parameter 'noIntro' is defined
    const urlParams = new URLSearchParams(window.location.search);
    const noIntro = urlParams.has('noIntro'); // true if 'noIntro' exists in the URL

    // Show the intro modal if 'noIntro' is NOT defined
    if (!noIntro) {
        introModal.show();
    } else {
        showInstructions = false;
    }
});

openIntroModalButton.addEventListener('click', () => {
    introModal.show();
});

openInstructionsModalButton.addEventListener('click', () => {
    instructionsModal.show();
});

introModalElement.addEventListener('hidden.bs.modal', () => {
    // Show instructions only once, if allowed
    if (showInstructions) {
        instructionsModal.show();
    }
    showInstructions = false;
});

// Tooltips

document.addEventListener('DOMContentLoaded', () => {
    const tooltips = document.querySelectorAll('[data-toggle="tooltip"]');
    tooltips.forEach(tooltipElement => {
        new bootstrap.Tooltip(tooltipElement);
    });
});