// Define an object to store canvas attributes for each visualization
const visualizationCanvasAttributes = {
    bars: {
        leftCanvasRotation: Math.PI , //  degrees in radians
        rightCanvasRotation: Math.PI , // degrees in radians
        leftCanvasScaleX: 1, // No scaling for the left canvas
        rightCanvasScaleX: 1, // Flip the X-axis for the right canvas
        leftCanvasScaleY: 1, // No scaling for the left canvas
        rightCanvasScaleY: 1, // No scaling for the right canvas
        leftCanvasWidth: 720,
        leftCanvasHeight: 720,
        rightCanvasWidth: 720,
        rightCanvasHeight: 720,
    },
    stereoField: {
        leftCanvasRotation:  0, //  degrees in radians
        rightCanvasRotation: 0,
        leftCanvasScaleX: 1,
        rightCanvasScaleX: 1,
        leftCanvasWidth: 1024,
        leftCanvasHeight: 1024,
        rightCanvasWidth: 1024,
        rightCanvasHeight: 1024,
    },
 
    volumeLevelIndicators: {
        leftCanvasRotation: '0deg',
        rightCanvasRotation: '0deg',
        leftCanvasWidth: 1024,
        leftCanvasHeight: 1024,
        rightCanvasWidth: 1024,
        rightCanvasHeight: 1024,
        leftCanvasTransform: '',
        rightCanvasTransform: '',
    },
    
    faMesh: {
        leftCanvasRotation: '0deg',
        rightCanvasRotation: '0deg',
        leftCanvasWidth: 1024,
        leftCanvasHeight: 1024,
        rightCanvasWidth: 1024,
        rightCanvasHeight: 1024,
        leftCanvasTransform: '',
        rightCanvasTransform: '',
    },
};

const audioVisualizationApp = {
    audioContext: null,
    audioBuffer: null,
    audioSource: null,
    leftChannelCanvas: null,
    rightChannelCanvas: null,
    leftCtx: null,
    rightCtx: null,
    visualizationType: 'bars',
    animationFrameId: null,
    analyserNode: null,
    bufferLength: 0,
    audioData: null,
    leftChannelData: null,
    rightChannelData: null,
    isPaused: false,
    frequencyLabels: [],
    peakMarkerValues: [],
    highlightedBands: [],
    colorMap: 'rainbow',
    pausedTime: 0,
    frequencyThreshold: 0.97,
    exceededFrequencies: [],

    setupAudioContext: function() {
            // Create a new AudioContext instance
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
            // Create an AnalyserNode to analyze the audio data
            this.analyserNode = this.audioContext.createAnalyser();
            this.analyserNode.fftSize = 2048; //  samples per FFT bin
            this.bufferLength = this.analyserNode.frequencyBinCount;
            this.audioData = new Uint8Array(this.bufferLength);
        
            // Create a channel splitter to split the audio into separate channels
            const channelSplitter = this.audioContext.createChannelSplitter(2);
        
            // Resume the AudioContext after it has been suspended (for autoplay policies)
            this.audioContext.resume().then(() => {
                console.log('AudioContext resumed successfully');
                enableButtons(); // Enable buttons after AudioContext is resumed
            }).catch((error) => {
                console.error('Error resuming AudioContext:', error);
            });
        
            return channelSplitter;
        },

    createAudioSource: function() {
            // Create a channel splitter
            const channelSplitter = this.audioContext.createChannelSplitter(2);
        
            // Create two analyser nodes, one for each channel
            const leftAnalyser = this.audioContext.createAnalyser();
            const rightAnalyser = this.audioContext.createAnalyser();
        
            // Create a new audio source node from the audio buffer
            this.audioSource = this.audioContext.createBufferSource();
            this.audioSource.buffer = this.audioBuffer;
        
            // Connect the audio source to the channel splitter
            this.audioSource.connect(channelSplitter);
        
            // Connect the left output of the splitter to the left analyser
            channelSplitter.connect(leftAnalyser, 0, 0);
        
            // Connect the right output of the splitter to the right analyser
            channelSplitter.connect(rightAnalyser, 1, 0);
        
            // Save the analysers to the app object
            this.leftAnalyser = leftAnalyser;
            this.rightAnalyser = rightAnalyser;
        
            // Start the source
            this.audioSource.start();
        },

        analyzeAudio: function() {
            function drawVisualization() {
                // Get the frequency data for the left and right channels
                getFrequencyData();
            
                // Get the canvas attributes based on the selected visualization type
                const canvasAttributes = visualizationCanvasAttributes[audioVisualizationApp.visualizationType];
              
            
                // Apply the canvas dimensions
                audioVisualizationApp.leftChannelCanvas.width = canvasAttributes.leftCanvasWidth;
                audioVisualizationApp.leftChannelCanvas.height = canvasAttributes.leftCanvasHeight;
                audioVisualizationApp.rightChannelCanvas.width = canvasAttributes.rightCanvasWidth;
                audioVisualizationApp.rightChannelCanvas.height = canvasAttributes.rightCanvasHeight;
            
                // Apply the canvas rotations and transformations
                audioVisualizationApp.leftChannelCanvas.style.transform = `${canvasAttributes.leftCanvasRotation} ${canvasAttributes.leftCanvasTransform}`;
                audioVisualizationApp.rightChannelCanvas.style.transform = `${canvasAttributes.rightCanvasRotation} ${canvasAttributes.rightCanvasTransform}`;
              
                // Check the selected visualization type and call the corresponding function
                switch (audioVisualizationApp.visualizationType) {
                    case 'bars':
                        drawBars();
                        break;
                    case 'stereoField':
                        drawStereoField();
                        break;
                    case 'volumeLevelIndicators':
                        drawVolumeLevelIndicators();
                        break;
                //    case 'stereoGradient':
                //        drawStereoFradient();
                //        break;
                //    case 'panningMeter':
                //        drawPanningMeter();
                //        break;
                    case 'faMesh':
                        drawFAMesh();
                        break;
                    default:
                        drawBars();
                }
            
                // Request the next animation frame
                audioVisualizationApp.animationFrameId = requestAnimationFrame(drawVisualization);
            }
    
        // Get the frequency data for the left and right channels
        function getFrequencyData() {
            // Get the frequency data for the left and right channels
            audioVisualizationApp.leftAnalyser.getByteFrequencyData(audioVisualizationApp.leftChannelData);
            audioVisualizationApp.rightAnalyser.getByteFrequencyData(audioVisualizationApp.rightChannelData);

            // Smooth the frequency data for better visualization
            smoothFrequencyData(audioVisualizationApp.leftChannelData);
            smoothFrequencyData(audioVisualizationApp.rightChannelData);
        }

        // Function to smooth the frequency data
        function smoothFrequencyData(data) {
            // Apply smoothing to the frequency data
            const smoothingFactor = 0.1; // Adjust this value between 0 and 1 to control the amount of smoothing
            const length = data.length;
            const smoothedData = new Uint8Array(length);
        
            for (let i = 0; i < length; i++) {
                const prev = i === 0 ? 0 : smoothedData[i - 1];
                smoothedData[i] = Math.round(prev * smoothingFactor + data[i] * (1 - smoothingFactor));
            }
        
            data.set(smoothedData);
        }

        // Helper function to map a value from one range to another
        function mapRange(value, fromMin, fromMax, toMin, toMax) {
            return (value - fromMin) * (toMax - toMin) / (fromMax - fromMin) + toMin;
        }


        // Generate frequency labels for the visualization
        function generateFrequencyLabels() {
            const sampleRate = audioVisualizationApp.audioContext.sampleRate;
            const minFreq = 0;
            const maxFreq = 20000;
            const numLabels = 10;

            audioVisualizationApp.frequencyLabels = [];

            for (let i = 0; i <= numLabels; i++) {
                const freq = mapRange(i, 0, numLabels, minFreq, maxFreq, true);
                const label = Math.round(freq) + ' Hz';
                audioVisualizationApp.frequencyLabels.push(label);
            }
        }

        // Get the color for a given frequency based on the chosen color map
        function getColorForFrequency(frequency, colorMap) {
            switch (colorMap) {
                case 'default':
                    return `hsl(${(frequency / 20000) * 360}, 100%, 50%)`;
                case 'grayscale':
                    const value = (frequency / 20000) * 255;
                    return `rgb(${value}, ${value}, ${value})`;
                case 'rainbow':
                    const hue = (frequency / 20000) * 360;
                    return `hsl(${hue}, 100%, 50%)`;
                default:
                    return 'rainbow';
            }
        }

        // Function to draw the bars
        function drawBars() {
            // Clear the canvases before drawing
            audioVisualizationApp.leftCtx.clearRect(0, 0, audioVisualizationApp.leftChannelCanvas.width, audioVisualizationApp.leftChannelCanvas.height);
            audioVisualizationApp.rightCtx.clearRect(0, 0, audioVisualizationApp.rightChannelCanvas.width, audioVisualizationApp.rightChannelCanvas.height);

            // Draw the bars for the left channel
            drawLeftChannelBars(audioVisualizationApp.leftChannelData);

            // Draw the bars for the right channel
            drawRightChannelBars(audioVisualizationApp.rightChannelData);
        }

        // Function to draw the bars for the left channel
        function drawLeftChannelBars(channelData) {
            const ctx = audioVisualizationApp.leftCtx;
            const canvas = audioVisualizationApp.leftChannelCanvas;
            const canvasAttributes = visualizationCanvasAttributes[audioVisualizationApp.visualizationType];
        
            // Clear the canvas before drawing
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        
            // Apply transformations to the rendering context
            ctx.save(); // Save the current state
            ctx.translate(canvas.height / 2, canvas.width / 2); // Translate to the center of the canvas
         //   ctx.scale(canvasAttributes.leftCanvasScaleX, 1); // Apply scale
            ctx.rotate(canvasAttributes.leftCanvasRotation); // Apply rotation
            ctx.translate(-canvas.height / 2, -canvas.width / 2); // Translate back to the top-left corner
        
            const numBars =  canvas.height - 2;
            const barHeight = numBars / canvas.height;
            const maxBarWidth = audioVisualizationApp.leftChannelCanvas.width;;
            const sampleRate = audioVisualizationApp.audioContext.sampleRate;
            const minFreq = 0;
            const maxFreq = sampleRate / 2;
        
            // Initialize the peak marker values if not already done
            if (!audioVisualizationApp.leftPeakMarkerValues || audioVisualizationApp.leftPeakMarkerValues.length !== numBars) {
                audioVisualizationApp.leftPeakMarkerValues = new Array(numBars);
            }
        
            // Update the peak marker values for each bar
            for (let i = 0; i < numBars; i++) {
                audioVisualizationApp.leftPeakMarkerValues[i] = Math.max(audioVisualizationApp.leftPeakMarkerValues[i] || 0, channelData[i]);
            }
        
            // Draw each bar and peak marker
            for (let i = 0; i < numBars; i++) {
                const barWidth = 1;
                const barY = i * barHeight;
                const frequency = mapRange(i, 0, numBars - 1, minFreq, maxFreq);
                const color = getColorForFrequency(frequency, audioVisualizationApp.colorMap);
                const isHighlighted = audioVisualizationApp.highlightedBands.some(band => frequency >= band.minFreq && frequency <= band.maxFreq) * 0.5;
        
                // Set the fill style based on whether the band is highlighted or not
                if (isHighlighted) {
                    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
                } else {
                    ctx.fillStyle = color;
                }
        
                // Draw the bar
                ctx.fillRect(0, barY, barWidth, barHeight);
        
                // Draw the peak marker
                const peakMarkerWidth = audioVisualizationApp.leftPeakMarkerValues[i] / 255 * maxBarWidth;
                ctx.strokeStyle = getColorForFrequency(frequency, audioVisualizationApp.colorMap);
                ctx.lineWidth = 1;
                ctx.saturation = audioVisualizationApp.leftChannelData / 100;
                ctx.beginPath();
                ctx.moveTo(0, barY);
                ctx.lineTo(peakMarkerWidth, barY);
                ctx.stroke();
            }
        
            ctx.restore(); // Restore the previous state
        }
    
        // Function to draw the bars for the right channel
        function drawRightChannelBars(channelData) {
            const ctx = audioVisualizationApp.rightCtx;
            const canvas = audioVisualizationApp.rightChannelCanvas;
            const canvasAttributes = visualizationCanvasAttributes[audioVisualizationApp.visualizationType];
           
            ctx.save(); // Save the current state

            // Clear the canvas before drawing
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        
            // Apply transformations to the rendering context
            ctx.translate(canvas.height / 2, canvas.width / 2); // Translate to the center of the canvas
            ctx.rotate(canvasAttributes.rightCanvasRotation); // Apply rotation
            ctx.scale(canvasAttributes.rightCanvasScaleX, 1); // Apply X-axis scaling (flip)
            ctx.scale(1, canvasAttributes.rightCanvasScaleY); // Apply Y-axis scaling (flip)
            ctx.translate(-canvas.height / 2, -canvas.width / 2); // Translate back to the top-left corner
        
            const numBars = canvas.height - 2;
            const barHeight = numBars / canvas.height ;
            const maxBarWidth = audioVisualizationApp.rightChannelCanvas.width;
            const sampleRate = audioVisualizationApp.audioContext.sampleRate;
            const minFreq = 0;
            const maxFreq = sampleRate / 2;
        
            // Initialize the peak marker values if not already done
            if (!audioVisualizationApp.rightPeakMarkerValues || audioVisualizationApp.rightPeakMarkerValues.length !== numBars) {
                audioVisualizationApp.rightPeakMarkerValues = new Array(numBars);
            }
        
            // Update the peak marker values for each bar
            for (let i = 0; i < numBars; i++) {
                audioVisualizationApp.rightPeakMarkerValues[i] = Math.max(audioVisualizationApp.rightPeakMarkerValues[i] || 0, channelData[i]);
            }
        
            // Draw each bar and peak marker
            for (let i = 0; i < numBars; i++) {
                const barWidth = 1
                const barY = i * barHeight;
                const frequency = mapRange(i, 0, numBars - 1, minFreq, maxFreq);
                const color = getColorForFrequency(frequency, audioVisualizationApp.colorMap);
                const isHighlighted = audioVisualizationApp.highlightedBands.some(band => frequency >= band.minFreq && frequency <= band.maxFreq) * 0.5;
        
                // Set the fill style based on whether the band is highlighted or not
                if (isHighlighted) {
                    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
                } else {
                    ctx.fillStyle = color;
                }
        
                // Draw the bar
                ctx.fillRect(maxBarWidth - barWidth, barY, barWidth, barHeight);
        
                // Draw the peak marker
                const peakMarkerWidth = audioVisualizationApp.rightPeakMarkerValues[i] / 255 * maxBarWidth;
                ctx.strokeStyle = getColorForFrequency(frequency, audioVisualizationApp.colorMap);
                ctx.lineWidth = 1;
                ctx.saturation = audioVisualizationApp.rightChannelData / 100;
                ctx.transparency = 0.5;
                ctx.beginPath();
                ctx.moveTo(maxBarWidth, barY);
                ctx.lineTo(maxBarWidth - peakMarkerWidth, barY);
                ctx.stroke();
            }
        
          ctx.restore(); // Restore the previous state
        }

       
        // Function to calculate the panning value
        function calculatePanning() {
            // Get the frequency data from the analysers
            const leftData = new Uint8Array(audioVisualizationApp.leftAnalyser.frequencyBinCount);
            const rightData = new Uint8Array(audioVisualizationApp.rightAnalyser.frequencyBinCount);
            audioVisualizationApp.leftAnalyser.getByteFrequencyData(leftData);
            audioVisualizationApp.rightAnalyser.getByteFrequencyData(rightData);

            // Calculate the total volume for each channel
            const leftTotal = leftData.reduce((a, b) => a + b);
            const rightTotal = rightData.reduce((a, b) => a + b);

            // Calculate the panning value (-1 = full left, 1 = full right)
            const panning = (rightTotal - leftTotal) / (rightTotal + leftTotal);

            return panning;
        }

        // Array to store past panning values
        const pastPanningValues = [];

        // Function to draw the stereo field visualization
        function drawStereoField() {
            const ctx = audioVisualizationApp.leftCtx;
            const canvas = audioVisualizationApp.leftChannelCanvas;
            const canvasAttributes = visualizationCanvasAttributes[audioVisualizationApp.visualizationType];
        
            // Clear the canvas before drawing
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        

          // Get the frequency data from the analysers
            const leftData = new Uint8Array(audioVisualizationApp.leftAnalyser.frequencyBinCount);
            const rightData = new Uint8Array(audioVisualizationApp.rightAnalyser.frequencyBinCount);
            audioVisualizationApp.leftAnalyser.getByteFrequencyData(leftData);
            audioVisualizationApp.rightAnalyser.getByteFrequencyData(rightData);

            // Calculate the total volume for each channel
            const leftTotal = leftData.reduce((a, b) => a + b);
            const rightTotal = rightData.reduce((a, b) => a + b);

            // Calculate the x position of the line for each channel
            const leftXPos = leftTotal / (leftTotal + rightTotal) * audioVisualizationApp.leftChannelCanvas.width;
            const rightXPos = rightTotal / (leftTotal + rightTotal) * audioVisualizationApp.rightChannelCanvas.width;

            // Calculate the y position of the line for each channel    
            const leftYPos = audioVisualizationApp.leftChannelCanvas.height / 2;
            const rightYPos = audioVisualizationApp.rightChannelCanvas.height / 2;

            // Calculate the panning value (-1 = full left, 1 = full right)
            const panning = calculatePanning();

            // Set the line width based on the respective channel volume
            const leftLineWidth = leftTotal / 1000;  // Dynamic line width based on left channel volume
            const rightLineWidth = rightTotal / 1000;  // Dynamic line width based on right channel volume
            
            // Draw the line for the left channel
            audioVisualizationApp.leftCtx.beginPath();
            audioVisualizationApp.leftCtx.moveTo(leftXPos, leftYPos);
            audioVisualizationApp.leftCtx.lineTo(leftXPos, audioVisualizationApp.leftCtx.canvas.height);
            audioVisualizationApp.leftCtx.strokeStyle = 'red'; // Set the line color to red for the left channel
            audioVisualizationApp.leftCtx.lineWidth = leftLineWidth;
            audioVisualizationApp.leftCtx.stroke();
            audioVisualizationApp.leftCtx.translate(canvas.height / 2, canvas.width / 2); // Translate to the center of the

            // Draw the line for the right channel
            audioVisualizationApp.rightCtx.beginPath();
            audioVisualizationApp.rightCtx.moveTo(rightXPos, 0);
            audioVisualizationApp.rightCtx.lineTo(rightXPos, audioVisualizationApp.rightCtx.canvas.height);
            audioVisualizationApp.rightCtx.strokeStyle = 'blue'; // Set the line color to blue for the right channel
            audioVisualizationApp.rightCtx.lineWidth = rightLineWidth;
            audioVisualizationApp.rightCtx.stroke();
            audioVisualizationApp.rightCtx.translate(canvas.height / 2, canvas.width / 2); // Translate to the center of the canvas
            }     

        // Function to draw the volume level indicators
        function drawVolumeLevelIndicators() {
            const ctx = audioVisualizationApp.leftCtx;
            const canvas = audioVisualizationApp.leftChannelCanvas;

            // Clear the canvas before drawing
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Get the frequency data from the analysers
            const leftData = new Uint8Array(audioVisualizationApp.leftAnalyser.frequencyBinCount);
            const rightData = new Uint8Array(audioVisualizationApp.rightAnalyser.frequencyBinCount);
            audioVisualizationApp.leftAnalyser.getByteFrequencyData(leftData);
            audioVisualizationApp.rightAnalyser.getByteFrequencyData(rightData);

            // Calculate the total volume for each channel
            const leftTotal = leftData.reduce((a, b) => a + b);
            const rightTotal = rightData.reduce((a, b) => a + b);

            // Set the fill styles for the left and right channel indicators
            ctx.fillStyle = 'red'; // Left channel indicator color
            ctx.fillRect(10, canvas.height - (leftTotal / 256) * canvas.height, 20, (leftTotal / 256) * canvas.height); // Draw the left channel indicator

            ctx.fillStyle = 'blue'; // Right channel indicator color
            ctx.fillRect(canvas.width - 30, canvas.height - (rightTotal / 256) * canvas.height, 20, (rightTotal / 256) * canvas.height); // Draw the right channel indicator

            // Draw labels for the left and right channel indicators
            ctx.font = '16px Arial';
            ctx.fillStyle = 'black';
            ctx.fillText('Left', 10, canvas.height - 20);
            ctx.fillText('Right', canvas.width - 50, canvas.height - 20);
        }
 

        // Creates a mesh-like visualization where frequency and amplitude data modulate the mesh pattern
        function faMesh(leftData, rightData) {
         
            // Clear the canvases
          audioVisualizationApp.leftCtx.clearRect(0, 0, audioVisualizationApp.leftChannelCanvas.width, audioVisualizationApp.leftChannelCanvas.height);
          audioVisualizationApp.rightCtx.clearRect(0, 0, audioVisualizationApp.rightChannelCanvas.width, audioVisualizationApp.rightChannelCanvas.height);


            // Define the mesh pattern properties
            const meshSize = 10; // Size of the mesh squares
            const rows = leftCanvas.height / meshSize;
            const cols = leftCanvas.width / meshSize;

            // Loop through each mesh square and modulate based on frequency and amplitude
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    // Calculate modulation factors based on frequency and amplitude data
                    const leftModulation = leftData[row] / 256;
                    const rightModulation = rightData[col] / 256;

                    // Set the fill style based on modulation
                    leftCtx.fillStyle = `rgba(${255 * leftModulation}, ${255 * rightModulation}, 255, 0.5)`;

                    // Draw the mesh square
                    leftCtx.fillRect(col * meshSize, row * meshSize, meshSize, meshSize);
                }
            }
        }



        // Create a new audio source node from the audio buffer
        audioVisualizationApp.audioSource = audioVisualizationApp.audioContext.createBufferSource();
        audioVisualizationApp.audioSource.buffer = audioVisualizationApp.audioBuffer;

        // Connect the audio source to the analyser node and the analyser node to the audio context destination
        audioVisualizationApp.audioSource.connect(audioVisualizationApp.analyserNode);
        audioVisualizationApp.analyserNode.connect(audioVisualizationApp.audioContext.destination);

        // Start playing the audio source
        audioVisualizationApp.audioSource.start(0);

        // Generate frequency labels for the visualization
        generateFrequencyLabels();

        // Define the frequency bands to be highlighted
        const highlightedBands = [
            { minFreq: 0, maxFreq: 200 },
        ];
        audioVisualizationApp.highlightedBands = highlightedBands;

        // Initialize the channel data arrays
        audioVisualizationApp.leftChannelData = new Uint8Array(audioVisualizationApp.bufferLength);
        audioVisualizationApp.rightChannelData = new Uint8Array(audioVisualizationApp.bufferLength);

        // Start drawing the visualization
        drawVisualization();
    },
};


function handleFileSelect(event) {
    const file = event.target.files[0];

    if (file) {
        const reader = new FileReader();

        reader.onload = function(event) {
            if (audioVisualizationApp.audioContext.decodeAudioData) {
                audioVisualizationApp.audioContext.decodeAudioData(event.target.result, function(buffer) {
                    audioVisualizationApp.audioBuffer = buffer;
                    initializeCanvases();
                    document.getElementById('analyzeButton').disabled = false;
                    document.getElementById('stopButton').disabled = false;

                    // Display the audio duration
                    displayAudioDuration(buffer.duration);

                    // Create the audio source and connect it
                    audioVisualizationApp.createAudioSource();
                    
                    // Display the canvas attributes
                    console.log('Canvas Attributes:', audioVisualizationApp.canvasAttributes);
                    console.log('Left Canvas Transform:', audioVisualizationApp.leftChannelCanvas.style.transform);
                    console.log('Right Canvas Transform:', audioVisualizationApp.rightChannelCanvas.style.transform);
                

                    audioVisualizationApp.analyzeAudio();
                }, function(error) {
                    console.error('Error decoding audio data:', error);
                });
            } else {
                console.error('Web Audio API is not supported in this browser.');
            }
        };

        reader.onerror = function(event) {
            console.error('Error reading file:', event.target.error);
        };

        reader.readAsArrayBuffer(file);
    } else {
        console.error('No file selected.');
    }
}

function initializeCanvases() {
    // Get the canvas elements
    audioVisualizationApp.leftChannelCanvas = document.getElementById('leftChannelCanvas');
    audioVisualizationApp.rightChannelCanvas = document.getElementById('rightChannelCanvas');

    // Get the canvas attributes based on the selected visualization type
    const canvasAttributes = visualizationCanvasAttributes[audioVisualizationApp.visualizationType];

    // Set the canvas dimensions
    audioVisualizationApp.leftChannelCanvas.width = 2048;
    audioVisualizationApp.leftChannelCanvas.height = 1024;
    audioVisualizationApp.rightChannelCanvas.width = 2048;
    audioVisualizationApp.rightChannelCanvas.height = 1024;

    // Set the canvas rotations and transformations
    audioVisualizationApp.leftChannelCanvas.style.transform = `${canvasAttributes.leftCanvasRotation} ${canvasAttributes.leftCanvasTransform}`;
    audioVisualizationApp.rightChannelCanvas.style.transform = `${canvasAttributes.rightCanvasRotation} ${canvasAttributes.rightCanvasTransform}`;

    // Get the 2D rendering contexts for the canvases
    audioVisualizationApp.leftCtx = audioVisualizationApp.leftChannelCanvas.getContext('2d');
    audioVisualizationApp.rightCtx = audioVisualizationApp.rightChannelCanvas.getContext('2d');
}

function startAudioContext() {
    // Set up the Web Audio API context
    audioVisualizationApp.setupAudioContext();
}

function pauseAudio() {
    if (audioVisualizationApp.audioSource && audioVisualizationApp.audioSource.buffer) {
        if (audioVisualizationApp.isPaused) {
            // Resume the audio if it was paused
            audioVisualizationApp.audioSource.start(0, audioVisualizationApp.pausedTime);
            audioVisualizationApp.isPaused = false;
            document.getElementById('pauseButton').textContent = 'Pause';
            document.getElementById('pauseIndicator').style.display = 'none'; // Hide the pause indicator
        } else {
            // Pause the audio if it was playing
            audioVisualizationApp.pausedTime = audioVisualizationApp.audioContext.currentTime;
            audioVisualizationApp.audioSource.stop(0);
            audioVisualizationApp.isPaused = true;
            document.getElementById('pauseButton').textContent = 'Resume';
            document.getElementById('pauseIndicator').style.display = 'block'; // Show the pause indicator
            document.getElementById('pauseIndicator').style.color = 'red'; // Show the pause indicator in red
        }
    } else {
        // If the audio source is not available or has finished playing
        createNewAudioSource();

        // Start playing the audio from the beginning
        audioVisualizationApp.audioSource.start(0);
        audioVisualizationApp.isPaused = false;
        document.getElementById('pauseButton').textContent = 'Pause';
    }
}

function createNewAudioSource() {
    // Stop the previous audio source if it exists
    if (audioVisualizationApp.audioSource) {
        audioVisualizationApp.audioSource.stop(0);
    }

    // Create a new audio source node
    audioVisualizationApp.audioSource = audioVisualizationApp.audioContext.createBufferSource();
    audioVisualizationApp.audioSource.buffer = audioVisualizationApp.audioBuffer;
    audioVisualizationApp.audioSource.connect(audioVisualizationApp.analyserNode);
    audioVisualizationApp.analyserNode.connect(audioVisualizationApp.audioContext.destination);
    audioVisualizationApp.pausedTime = 0; // Reset pausedTime when creating a new audio source

    // Start playing the audio from the beginning
    audioVisualizationApp.audioSource.start(0);
    audioVisualizationApp.isPaused = false;
    document.getElementById('pauseButton').textContent = 'Pause';
}

// Function to clear the canvases
function clearCanvases() {
    // Clear the left channel canvas
    audioVisualizationApp.leftCtx.clearRect(0, 0, audioVisualizationApp.leftChannelCanvas.width, audioVisualizationApp.leftChannelCanvas.height);

    // Clear the right channel canvas
    audioVisualizationApp.rightCtx.clearRect(0, 0, audioVisualizationApp.rightChannelCanvas.width, audioVisualizationApp.rightChannelCanvas.height);
}

// Function to display the audio duration
function displayAudioDuration(duration) {
    const audioDurationDisplay = document.getElementById('audioDurationDisplay');
    const durationInMinutes = (duration / 60).toFixed(2); // Convert to minutes and round to 2 decimal places
    audioDurationDisplay.textContent = `Song Length: ${durationInMinutes} minutes`;
}

// Function to check for frequencies exceeding the threshold
function checkFrequencyThreshold(audioData, threshold, sampleRate, numBars) {
    const maxBarHeight = audioVisualizationApp.leftChannelCanvas.height; // Use the height of the left channel canvas
    const minFreq = 0;
    const maxFreq = sampleRate / 2;
    const newExceededFrequencies = [];

    for (let i = 0; i < numBars; i++) {
        const barHeight = audioData[i] / 256 * maxBarHeight;
        const frequency = mapRange(i, 0, numBars - 1, minFreq, maxFreq);

        if (barHeight >= threshold * maxBarHeight) {
            newExceededFrequencies.push(Math.round(frequency));
        }
    }

    return newExceededFrequencies;
}

// Function to update the exceededFrequencies array
function updateExceededFrequencies(newExceededFrequencies) {
    for (const freq of newExceededFrequencies) {
        if (!audioVisualizationApp.exceededFrequencies.includes(freq)) {
            audioVisualizationApp.exceededFrequencies.push(freq);
        }
    }
}

// Function to display the exceeded frequencies
function displayExceededFrequencies(exceededFrequencies) {
    const frequencyThresholdDisplay = document.getElementById('frequencyThresholdDisplay');
    frequencyThresholdDisplay.textContent = `Frequencies over (${audioVisualizationApp.frequencyThreshold * 100}%): ${exceededFrequencies.join(', ')} Hz`;
}

// Helper function to map a value from one range to another
function mapRange(value, fromMin, fromMax, toMin, toMax) {
    return (value - fromMin) * (toMax - toMin) / (fromMax - fromMin) + toMin;
}

// New function to enable buttons
function enableButtons() {
    document.getElementById('analyzeButton').disabled = false;
    document.getElementById('pauseButton').disabled = false;
    document.getElementById('stopButton').disabled = false;
    document.getElementById('clearButton').disabled = false;
}

// Initialize the audio context and set up event listeners
audioVisualizationApp.setupAudioContext();
document.getElementById('audioFileInput').addEventListener('change', handleFileSelect);
document.getElementById('analyzeButton').addEventListener('click', audioVisualizationApp.analyzeAudio);
document.getElementById('pauseButton').addEventListener('click', pauseAudio);
document.getElementById('stopButton').addEventListener('click', function() {
    if (audioVisualizationApp.audioSource) {
        audioVisualizationApp.audioSource.stop();
        cancelAnimationFrame(audioVisualizationApp.animationFrameId);
        document.getElementById('pauseIndicator').style.display = 'none';
        audioVisualizationApp.exceededFrequencies = [];
        document.getElementById('frequencyThresholdDisplay').textContent = '';
    }
});
document.getElementById('clearButton').addEventListener('click', clearCanvases);

// Add the visualization type select button and event listener
const visualizationTypeSelect = document.createElement('select');
visualizationTypeSelect.id = 'visualizationTypeSelect';

const barsOption                    = document.createElement('option');
barsOption.value                    = 'bars';
barsOption.textContent              = 'Bars';
visualizationTypeSelect.appendChild(barsOption);

const stereoFieldOption             = document.createElement('option');
stereoFieldOption.value             = 'stereoField';
stereoFieldOption.textContent       = 'Stereo Field';
visualizationTypeSelect.appendChild(stereoFieldOption);

const volumeLevelIndicatorsOption = document.createElement('option');
volumeLevelIndicatorsOption.value = 'volumeLevelIndicators';
volumeLevelIndicatorsOption.textContent = 'Channel Levels';
visualizationTypeSelect.appendChild(volumeLevelIndicatorsOption);

const faMeshOption                  = document.createElement('option');
faMeshOption.value                  = 'faMesh';
faMeshOption.textContent            = 'F.A. Mesh';
visualizationTypeSelect.appendChild(faMeshOption);


// Append the select element to your HTML
document.body.appendChild(visualizationTypeSelect);

// Add the event listener to the select element
visualizationTypeSelect.addEventListener('change', function() {
    const selectedValue = this.value;
    audioVisualizationApp.visualizationType = selectedValue;

    // Cancel the current animation frame and restart the visualization
    cancelAnimationFrame(audioVisualizationApp.animationFrameId);
    
   // audioVisualizationApp.analyzeAudio();
});