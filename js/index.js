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
    introModal.show();
});

openIntroModalButton.addEventListener('click', () => {
    introModal.show();
});

openInstructionsModalButton.addEventListener('click', () => {
    instructionsModal.show();
});

introModalElement.addEventListener('hidden.bs.modal', () => {
    // Show instructions, only once
    if (showInstructions) {
        instructionsModal.show();
    };
    showInstructions = false;
});