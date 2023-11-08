// Initialize variables for recording
let isRecording = false;
let mediaRecorder;
let audioChunks = [];
let recognition;
const fs = require('fs');

// Function to toggle audio recording
function toggleRecording() {
  if (!isRecording) {
    isRecording = true;
    document.getElementById('microphone').style.backgroundColor = '#e74c3c';
    document.getElementById('recording-text').style.display = 'block';
    startDictation();
    // startRecording();
  } else {
    isRecording = false;
    recognition.stop();
    document.getElementById('microphone').style.backgroundColor = '#3498db';
    document.getElementById('recording-text').style.display = 'none';
  }
}

// Function to start recording
function startRecording() {
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        sendAudioToSpeechToTextAPI(audioBlob);
      };

      mediaRecorder.start();
    })
    .catch((error) => {
      console.error('Error accessing microphone:', error);
    });
}

// Function to stop recording
function stopRecording() {
  if (mediaRecorder) {
    mediaRecorder.stop();
  }
}

// Function to write a string to the DataView
function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
  
  // Function to convert Float32Array audio data to a WAV blob
  function audioBufferToWav(audioArray) {
    const wavView = new DataView(new ArrayBuffer(44 + audioArray.length * 2));
  
    // Create the WAV header
    writeString(wavView, 0, 'RIFF');
    wavView.setUint32(4, 32 + audioArray.length * 2, true);
    writeString(wavView, 8, 'WAVE');
    writeString(wavView, 12, 'fmt ');
    wavView.setUint32(16, 16, true);
    wavView.setUint16(20, 1, true);
    wavView.setUint16(22, 1, true);
    wavView.setUint32(24, 44100, true);
    wavView.setUint32(28, 44100 * 2, true);
    wavView.setUint16(32, 2, true);
    wavView.setUint16(34, 16, true);
    writeString(wavView, 36, 'data');
    wavView.setUint32(40, audioArray.length * 2, true);
  
    // Convert audio data to 16-bit PCM and write to the WAV file
    let wavIdx = 44;
    for (const audioValue of audioArray) {
      wavView.setInt16(wavIdx, audioValue * 0x7FFF, true);
      wavIdx += 2;
    }
  
    return new Blob([wavView], { type: 'audio/wav' });
  }
  
  // Function to convert audio data to WAV format
  function convertToWav(audioBlob) {
    return new Promise((resolve, reject) => {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const reader = new FileReader();
  
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target.result;
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          const audioData = audioBuffer.getChannelData(0);
  
          // Convert audio data to a Float32Array
          const audioArray = new Float32Array(audioData);
  
          // Create a WAV file from the audio data
          const wavBlob = audioBufferToWav(audioArray);
  
          resolve(wavBlob);
        } catch (error) {
          reject(error);
        }
      };
  
      reader.onerror = (error) => {
        reject(error);
      };
  
      reader.readAsArrayBuffer(audioBlob);
    });
  }
  
  // Function to send audio to the Speech-to-Text API
async function sendAudioToSpeechToTextAPI(audioBlob) {
    if (!audioBlob) {
      console.log('No audio data to send.');
      return;
    }
  
    try {
      const wavBlob = await convertToWav(audioBlob);
  
      // Create a FormData object
      const formData = new FormData();
  
      // Append the WAV audioBlob as a file
      formData.append('audio', wavBlob, 'audio.wav');
  
      // Use the correct Ngrok URL for your Flask app
      const apiUrl = 'http://2987-34-73-154-161.ngrok-free.app/speech-to-text';
  
      // Make the API request
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });
  
      const data = await response.json();
  
      // Check if 'text' exists in the response
      if (data.hasOwnProperty('text')) {
        console.log('Transcription:', data.text);
        // Update the 'box' element or any other part of your HTML to display the transcribed text
        document.getElementById('box').innerText = data.text;
      } else {
        console.error('Transcription not found in response.');
      }
    } catch (error) {
      console.error('Error sending audio to the API:', error);
    }
  }
  
  // Rest of your code, including toggleRecording function, goes here
  
  // Sample usage:
  // Call sendAudioToSpeechToTextAPI(audioBlob) with your recorded audio blob when needed
  

  function startDictation() {
    if (window.hasOwnProperty('webkitSpeechRecognition')) {
        recognition = new webkitSpeechRecognition();

        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.lang = "en-US";
        recognition.start();

        recognition.onresult = function(e) {
          document.getElementById('box').innerHTML = e.results[0][0].transcript;
          fs.writeFile("result.txt", e.results[0][0].transcript, (err) => {
            if (err) {
              console.error('Error saving transcript:', err);
            } else {
              console.log('Transcript saved to', "result.txt");
            }
          });
        recognition.onerror = function(e) {
            console.log(e);
        }
    }
}
  }

