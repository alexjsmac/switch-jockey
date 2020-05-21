var models;
var normed_stats;
var count = 0;

var features_dict = {
  "energy": new Array(),
  "perceptualSharpness": new Array(),
  "perceptualSpread": new Array(),
  "rms": new Array(),
  "spectralCentroid": new Array(),
  "spectralFlatness": new Array(),
  "spectralKurtosis": new Array(),
  "spectralRolloff": new Array(),
  "spectralSkewness": new Array(),
  "spectralSlope": new Array(),
  "spectralSpread": new Array(),
  "zcr": new Array()
}

async function load() {
  models = {
    'valence': await tf.loadGraphModel('./assets/models/valence/model.json'),
    'arousal': await tf.loadGraphModel('./assets/models/arousal/model.json')
  }
  console.log("Models loaded");
}

function prediction(target, current_features) {
  for (var key in current_features) {
    features_dict[key].push(current_features[key]);
  }
  count += 1;

  // Wait until each feature array has 50 values
  if (count > 49) {
    buffer = new Array();
    for (var key in features_dict) {

      // Normalize feature values in current window
      normed_values = new Array();
      mean = math.mean(features_dict[key]);
      std = math.std(features_dict[key]);
      for (i = 0; i < features_dict[key].length; i++) {
        normed_values.push((features_dict[key][i] - mean) / std);
      }

      // Add each normalized feature array to the current buffer
      buffer = buffer.concat(normed_values);

      // Remove oldest value from each feature array
      features_dict[key].shift();
    }
    tensor = tf.tensor(buffer);
    input = tf.reshape(tensor, [-1, 600]);
    result = models[target].predict(input).arraySync();
    table = document.getElementById(`${target}-table`);
    table.rows[0].cells[1].innerText = result[0][0].toFixed(2);
    targetRangeElement = document.getElementById(`${target}Range`);
    targetRangeElement.value = result[0][0].toFixed(2);
  }
}

load()
