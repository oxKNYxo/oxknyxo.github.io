const videoElement = document.getElementById('camera');
const cameraSelect = document.getElementById('cameraSelect');
const startCameraButton = document.getElementById('startCamera');

let currentStream = null;

// 列出所有相機設備
async function listCameras() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');

    cameraSelect.innerHTML = ''; // 清空選項
    videoDevices.forEach((device, index) => {
        const option = document.createElement('option');
        option.value = device.deviceId;
        option.textContent = device.label || `Camera ${index + 1}`;
        cameraSelect.appendChild(option);
    });
}

// 啟動選定的相機
async function startCamera(deviceId) {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }

    const constraints = {
        video: {
            deviceId: deviceId ? { exact: deviceId } : undefined
        }
    };

    try {
        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        videoElement.srcObject = currentStream;
    } catch (error) {
        console.error('Error accessing camera:', error);
    }
}

// 初始化：列出相機並監聽按鈕事件
(async function init() {
    await listCameras();

    startCameraButton.addEventListener('click', () => {
        const selectedDeviceId = cameraSelect.value;
        startCamera(selectedDeviceId);
    });
})();
