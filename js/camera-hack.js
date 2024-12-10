// camera-hack.js

class ARCameraHandler {
    constructor() {
        // Initialize parameters with default values or values from configuration
        this.parameters = {
            sourceWidth: 1280, // Set your desired default width
            sourceHeight: 720  // Set your desired default height
        };

        // Optionally, you can override these with actual configuration
        // this.parameters = { ...defaultParams, ...configParams };

        this.setupCamera();
    }

    setupCamera() {
        const backCameraKeywords = [
            "rear", "back", "rück", "arrière", "trasera", "trás", "traseira",
            "posteriore", "后面", "後面", "背面", "后置", "後置", "背置",
            "задней", "الخلفية", "후", "arka", "achterzijde", "หลัง",
            "baksidan", "bagside", "sau", "bak", "tylny", "takakamera",
            "belakang", "אחורית", "πίσω", "spate", "hátsó", "zadní",
            "darrere", "zadná", "задня", "stražnja", "belakang", "बैक"
        ];

        navigator.mediaDevices.enumerateDevices().then((devices) => {
            const mainBackCamera = devices
                .filter(device => device.kind === "videoinput")
                .filter(camera => {
                    const label = camera.label.toLowerCase();
                    return backCameraKeywords.some(keyword => label.includes(keyword));
                })
                .sort((a, b) => a.label.localeCompare(b.label))[0];

            if (mainBackCamera) {
                var userMediaConstraints = {
                    audio: false,
                    video: {
                        deviceId: { exact: mainBackCamera.deviceId },
                        facingMode: 'environment',
                        focusMode: "continuous",
                        width: {
                            ideal: this.parameters.sourceWidth,
                            // min: 1024,
                            // max: 1920
                        },
                        height: {
                            ideal: this.parameters.sourceHeight,
                            // min: 776,
                            // max: 1080
                        }
                    }
                };
            } else {
                // Fallback if no back camera is found
                var userMediaConstraints = {
                    audio: false,
                    video: {
                        facingMode: 'environment',
                        focusMode: "continuous",
                        width: {
                            ideal: this.parameters.sourceWidth,
                        },
                        height: {
                            ideal: this.parameters.sourceHeight,
                        }
                    }
                };
            }

            navigator.mediaDevices.getUserMedia(userMediaConstraints)
                .then(stream => {
                    // Use the stream in AR.js
                })
                .catch(error => {
                    console.error("Error accessing media devices.", error);
                });
        }).catch(error => {
            console.error("Error enumerating devices.", error);
        });
    }
}

// Instantiate the handler
const cameraHandler = new ARCameraHandler();