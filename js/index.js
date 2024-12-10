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

// Orientation alert

const resetButton = document.getElementById('resetButton');

function checkOrientation() {
    const alertElement = document.getElementById("orientation-alert");

    if (window.matchMedia("(orientation: landscape)").matches) {
        alertElement.classList.remove("hidden"); // Show alert
    } else {
        alertElement.classList.add("hidden"); // Hide alert
        resetScene(scene);
    }
}

checkOrientation();
window.addEventListener("resize", checkOrientation);

function resetScene(scene) {
    while (scene.children.length > 0) {
        scene.remove(scene.children[0]); // Remove all objects
    }
}

resetButton.addEventListener('click', () => {
    console.log("RESET BUTTON");
    if (typeof scene !== "undefined" && scene instanceof THREE.Scene) {
        resetScene(scene);
    } else {
        console.warn("Scene object is not defined or not a THREE.Scene.");
    }
});