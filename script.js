window.onload = function () {
    // Check if the browser supports Speech Synthesis
    if (!window.speechSynthesis) {
        alert("Your browser does not support Speech Synthesis.");
        return;
    }

    // DOM elements for input and controls
    const inputTxt = document.querySelector('#input-text');
    const voiceSelect = document.querySelector('#voice-select');
    const pitch = document.querySelector('#pitch');
    const rate = document.querySelector('#rate');
    const playBtn = document.querySelector('#speak-btn');
    const pauseBtn = document.querySelector('#pause-btn');
    const resumeBtn = document.querySelector('#resume-btn');
    const recordButton = document.querySelector('#record-button');
    const stopButton = document.querySelector('#stop-btn');
    const audioPlayer = document.getElementById("audio-player");
    const audioContainer = document.getElementById('audio-container');

    let mediaRecorder; // MediaRecorder instance for audio recording
    let audioChunks = []; // Array to store recorded audio data

    // Populate the voice selection dropdown
    function populateVoices() {
        const voices = speechSynthesis.getVoices();
        voiceSelect.innerHTML = ""; // Clear existing options
        voices.forEach(voice => {
            // Set a default selected voice
            const selected = voice.name === "Microsoft David - English (United States)" ? "selected" : "";
            const option = `<option value="${voice.name}" ${selected}>${voice.name} (${voice.lang})</option>`;
            voiceSelect.insertAdjacentHTML("beforeend", option);
        });
    }

    // Listen for voice list updates (browser-specific behavior)
    if ("onvoiceschanged" in speechSynthesis) {
        speechSynthesis.addEventListener("voiceschanged", populateVoices);
    }
    populateVoices(); // Initial population of voices

    // Convert text to speech using the selected voice and settings
    function textToSpeech(tts) {
        if (speechSynthesis.speaking) {
            console.error("SpeechSynthesis is already speaking.");
            return;
        }

        if (tts.trim() !== "") { // Ensure text is not empty or whitespace
            const voices = speechSynthesis.getVoices();
            const speech = new SpeechSynthesisUtterance(tts);
            const selectedVoiceName = voiceSelect.value;

            // Match the selected voice
            speech.voice = voices.find(voice => voice.name === selectedVoiceName) || null;
            speech.pitch = parseFloat(pitch.value);
            speech.rate = parseFloat(rate.value);

            // Reset UI and stop recording on speech end
            speech.onend = function () {
                stopButton.disabled = true;
                pauseBtn.disabled = true;
                pauseBtn.classList.add("hide");
                playBtn.disabled = false;
                playBtn.classList.remove("hide");

                if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                    mediaRecorder.stop();
                }
            };

            speechSynthesis.speak(speech);
        }
    }

    // Event listener for play button
    playBtn.addEventListener("click", () => {
        if (inputTxt.value.trim() !== "") {
            textToSpeech(inputTxt.value);
            playBtn.disabled = true;
            playBtn.classList.add("hide");
            pauseBtn.disabled = false;
            pauseBtn.classList.remove("hide");
            stopButton.disabled = false;
        }
    });

    // Pause the speech
    pauseBtn.addEventListener("click", () => {
        if (speechSynthesis.speaking && !speechSynthesis.paused) {
            speechSynthesis.pause();
            pauseBtn.disabled = true;
            pauseBtn.classList.add("hide");
            resumeBtn.disabled = false;
            resumeBtn.classList.remove("hide");
        }
    });

    // Resume the speech
    resumeBtn.addEventListener("click", () => {
        if (speechSynthesis.paused) {
            speechSynthesis.resume();
            resumeBtn.disabled = true;
            resumeBtn.classList.add("hide");
            pauseBtn.disabled = false;
            pauseBtn.classList.remove("hide");
        }
    });

    // Check if MediaRecorder API is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Your browser does not support audio recording.");
    } else {
        // Start recording audio
        recordButton.addEventListener("click", async () => {
            recordButton.disabled = true;
            stopButton.disabled = false;

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);

                // Collect audio data chunks
                mediaRecorder.ondataavailable = event => {
                    if (event.data.size > 0) {
                        audioChunks.push(event.data);
                    }
                };

                // Handle the end of recording
                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
                    audioChunks = []; // Clear the chunks for a new recording

                    const audioUrl = URL.createObjectURL(audioBlob);
                    audioPlayer.src = audioUrl;
                    audioPlayer.controls = true;

                    // Create a download link for the recorded audio
                    const downloadLink = document.createElement('a');
                    downloadLink.href = audioUrl;
                    downloadLink.download = 'recording.mp3';
                    downloadLink.textContent = 'Download Recording';

                    // Update the audio container
                    audioContainer.innerHTML = ''; // Clear previous recordings
                    audioContainer.appendChild(audioPlayer);
                    audioContainer.appendChild(downloadLink);

                    recordButton.disabled = false;
                    stopButton.disabled = true;
                };

                mediaRecorder.start();
                textToSpeech(inputTxt.value); // Start text-to-speech while recording

            } catch (err) {
                console.error("Error accessing the microphone:", err);
                alert("Unable to access the microphone. Please check your permissions.");
                recordButton.disabled = false;
                stopButton.disabled = true;
            }
        });

        // Stop the recording and speech synthesis
        stopButton.addEventListener("click", () => {
            speechSynthesis.cancel();
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
            }
            pauseBtn.disabled = true;
            pauseBtn.classList.add("hide");
            resumeBtn.disabled = true;
            resumeBtn.classList.add("hide");
            playBtn.disabled = false;
            playBtn.classList.remove("hide");
        });
    }
};
