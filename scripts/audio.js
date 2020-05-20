const audioContext = new AudioContext();

// Select the Audio Element from the DOM
const htmlAudioElement = document.getElementById("audio");

// Create an "Audio Node" from the Audio Element
const source = audioContext.createMediaElementSource(htmlAudioElement);

// Connect the Audio Node to your speakers. Now that the audio lives in the
// Audio Context, you have to explicitly connect it to the speakers in order to
// hear it
source.connect(audioContext.destination);

const levelRangeElement = document.getElementById("levelRange");

// One-liner to resume playback when user interacted with the page.
document.querySelector('button').addEventListener('click', function() {
  audioContext.resume().then(() => {
    console.log('Playback resumed successfully');
  });
});

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
      //console.log(features);
      valence_prediction(features);
      arousal_prediction(features);
      levelRangeElement.value = features.rms;
    }
  });
  analyzer.start();
}
