let source, analyzer, audioData;

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const levelRangeElement = document.getElementById("levelRange");

// One-liner to resume playback when user interacted with the page.
document.querySelector('button').addEventListener('click', function() {
  audioContext.resume().then(() => {
    startMic();
    console.log('Playback resumed successfully');
  });
});

function main() {
  if (typeof Meyda === "undefined") {
    console.log("Meyda could not be found! Have you included it?");
  }
  else {
    // Create the Meyda Analyzer
    const analyzer = Meyda.createMeydaAnalyzer({
      // Pass in the AudioContext so that Meyda knows which AudioContext Box to work with
      "audioContext": audioContext,
      // Source is the audio node that is playing your audio. It could be any node,
      // but in this case, it's the MediaElementSourceNode corresponding to your
      // HTML 5 Audio Element with your audio in it.
      "source": source,
      // Buffer Size tells Meyda how often to check the audio feature, and is
      // measured in Audio Samples. Usually there are 44100 Audio Samples in 1
      // second, which means in this case Meyda will calculate the level about 86
      // (44100/512) times per second.
      "bufferSize": 2048,
      // Here we're telling Meyda which audio features to calculate. While Meyda can
      // calculate a variety of audio features, in this case we only want to know
      // the "rms" (root mean square) of the audio signal, which corresponds to its
      // level
      "featureExtractors": ["energy", "perceptualSharpness", "perceptualSpread",
                            "rms", "spectralCentroid", "spectralFlatness",
                            "spectralKurtosis", "spectralRolloff", "spectralSkewness",
                            "spectralSlope", "spectralSpread", "zcr"],
      // Finally, we provide a function which Meyda will call every time it
      // calculates a new level. This function will be called around 86 times per
      // second.
      "callback": features => {
        if (features.rms > 0) {
          prediction(features);
        }
        levelRangeElement.value = features.rms;
      }
    });
    analyzer.start();
  }
}

navigator.getUserMedia  = navigator.getUserMedia ||
                        navigator.webkitGetUserMedia ||
                        navigator.mozGetUserMedia ||
                        navigator.msGetUserMedia;

function startMic(){
  if (navigator.getUserMedia) {
    navigator.getUserMedia({ audio: true, video: false }, function( stream ) {

      analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;

      source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      audioData = new Uint8Array(analyser.frequencyBinCount);

      startShaders();
      main();
    }, function(){});
  } else {
    // fallback
  }
}
