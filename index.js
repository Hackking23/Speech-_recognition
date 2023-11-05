let isRecording = false;
let mediaRecorder; // Declare mediaRecorder in a higher scope
function toggleRecording() {
    if (!isRecording) {
        isRecording = true;
        document.getElementById('microphone').style.backgroundColor = '#e74c3c';
        document.getElementById('recording-text').style.display = 'block';
        startRecording();
    } else {
        isRecording = false;
        document.getElementById('microphone').style.backgroundColor = '#3498db';
        document.getElementById('recording-text').style.display = 'none';
        stopRecording();
        // sendAudioToSpeechToTextAPI();
    }
}

function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            let audioChunks = [];

            mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { 'type': 'audio/wav' });

                // Play back the recorded audio
                const audioPlayer = document.getElementById('audio-player');
                audioPlayer.src = URL.createObjectURL(audioBlob);
                audioPlayer.style.display = 'block';

                // Send the audio data to the backend
                console.log('request sent');
                fetch('http://127.0.0.1:5000/speech-to-text', {
                    method: 'POST',
                    body: audioBlob
                })
                .then(response => response.json())
                .then(data => {
                    console.log('Transcription:', data.text);
                    document.getElementById('box').textContent = data.text;
                })
                .catch(error => {
                    console.error('Error sending audio to the API:', error);
                });
            };

            mediaRecorder.start();
        })
        .catch(error => {
            console.error('Error accessing microphone:', error);
        });
}

function stopRecording() {
    if (mediaRecorder) {
        mediaRecorder.stop();
    }
}