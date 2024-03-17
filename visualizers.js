panningValue: {
    leftCanvasRotation: '0deg',
    rightCanvasRotation: '0deg',
    leftCanvasWidth: 1024,
    leftCanvasHeight: 1024,
    rightCanvasWidth: 1024,
    rightCanvasHeight: 1024,
    leftCanvasTransform: '',
    rightCanvasTransform: '',
},
stereoGradient: {
    leftCanvasRotation: '0deg',
    rightCanvasRotation: '0deg',
    leftCanvasWidth: 1024,
    leftCanvasHeight: 1024,
    rightCanvasWidth: 1024,
    rightCanvasHeight: 1024,
    leftCanvasTransform: '',
    rightCanvasTransform: '',
},
panningMeter: {
    leftCanvasRotation: '0deg',
    rightCanvasRotation: '0deg',
    leftCanvasWidth: 1024,
    leftCanvasHeight: 1024,
    rightCanvasWidth: 1024,
    rightCanvasHeight: 1024,
    leftCanvasTransform: '',
    rightCanvasTransform: '',
},

 // Displays a panning meter that moves horizontally based on the panning value
 function panningMeter(panningValue) {
    // Clear the canvases
    audioVisualizationApp.leftCtx.clearRect(0, 0, audioVisualizationApp.leftChannelCanvas.width, audioVisualizationApp.leftChannelCanvas.height);
    audioVisualizationApp.rightCtx.clearRect(0, 0, audioVisualizationApp.rightChannelCanvas.width, audioVisualizationApp.rightChannelCanvas.height);

     // Map the panning value to the canvas width
     const xPos = mapRange(panningValue, -1, 1, 0, leftCanvas.width);

     // Draw a vertical line representing the panning position
     leftCtx.beginPath();
     leftCtx.moveTo(xPos, 0);
     leftCtx.lineTo(xPos, leftCanvas.height);
     leftCtx.strokeStyle = 'white';
     leftCtx.lineWidth = 3;
     leftCtx.stroke();

     // Optionally, add text to display the numeric panning value
     leftCtx.fillStyle = 'white';
     leftCtx.font = '16px Arial';
     leftCtx.fillText(`Panning: ${panningValue.toFixed(2)}`, 10, 20);
 }

// Visualizes the stereo field as a gradient field, where the color intensity changes with amplitude
function stereoGradient(leftData, rightData) {
    // Clear the canvases
    audioVisualizationApp.leftCtx.clearRect(0, 0, audioVisualizationApp.leftChannelCanvas.width, audioVisualizationApp.leftChannelCanvas.height);
    audioVisualizationApp.rightCtx.clearRect(0, 0, audioVisualizationApp.rightChannelCanvas.width, audioVisualizationApp.rightChannelCanvas.height);


    // Calculate the gradient based on the amplitude of left and right channel data
    const gradient = leftCtx.createLinearGradient(0, 0, leftCanvas.width, 0);
    gradient.addColorStop(0, `rgba(255, 0, 0, ${calculateAmplitude(leftData)})`); // Red for left
    gradient.addColorStop(1, `rgba(0, 0, 255, ${calculateAmplitude(rightData)})`); // Blue for right

    // Fill the canvas with the gradient
    leftCtx.fillStyle = gradient;
    leftCtx.fillRect(0, 0, leftCanvas.width, leftCanvas.height);
}


    // Function to draw the panning value on the canvas
    function drawPanningValue(panning) {
        // Clear the canvases
        audioVisualizationApp.leftCtx.clearRect(0, 0, audioVisualizationApp.leftChannelCanvas.width, audioVisualizationApp.leftChannelCanvas.height);
        audioVisualizationApp.rightCtx.clearRect(0, 0, audioVisualizationApp.rightChannelCanvas.width, audioVisualizationApp.rightChannelCanvas.height);

        // Draw the panning value on the canvas
        const canvasWidth = audioVisualizationApp.leftChannelCanvas.width;
        const canvasHeight = audioVisualizationApp.leftChannelCanvas.height;

        // Map the panning value (-1 to 1) to the canvas width (0 to canvasWidth)
        const xPos = ((panning + 1) / 2) * canvasWidth;

        // Draw a vertical line at the panning position
        [audioVisualizationApp.leftCtx, audioVisualizationApp.rightCtx].forEach(function(ctx) {
            ctx.beginPath();
            ctx.moveTo(xPos, 0);
            ctx.lineTo(xPos, canvasHeight);
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 5;
            ctx.colorMap = 'rainbow';
            ctx.stroke();
        });

        // Draw the panning value text
        const panningText = `Panning: ${panning.toFixed(2)}`;
        const textX = 10;
        const textY = canvasHeight - 10;

        [audioVisualizationApp.leftCtx, audioVisualizationApp.rightCtx].forEach(function(ctx) {
            ctx.fillStyle = 'white';
            ctx.font = '30px Arial';
            ctx.fillText(panningText, textX, textY);
        });
    }

    
const panningValueOption = document.createElement('option');
panningValueOption.value = 'panningValue';
panningValueOption.textContent = 'Panning Value';
visualizationTypeSelect.appendChild(panningValueOption);

const stereoGradientOption = document.createElement('option');
stereoGradientOption.value = 'stereoGradient';
stereoGradientOption.textContent = 'Stereo Gradient';
visualizationTypeSelect.appendChild(stereoGradientOption);

const panningMeterOption = document.createElement('option');
panningMeterOption.value = 'panningMeter';
panningMeterOption.textContent = 'Panning Meter';
visualizationTypeSelect.appendChild(panningMeterOption);
