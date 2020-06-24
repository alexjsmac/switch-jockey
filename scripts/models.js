let features_dict = {
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
  console.log("Loading models...");
  models = {
    'valence': await tf.loadGraphModel('./assets/models/web_big_valence/model.json'),
    'arousal': await tf.loadGraphModel('./assets/models/web_big_arousal/model.json')
  }
  console.log("Models loaded");
}

function prediction(current_features) {
  for (let key in current_features) {
    features_dict[key].push(current_features[key]);
  }

  // Wait until each feature array has 50 values
  if (features_dict[Object.keys(features_dict)[0]].length > 49) {
    let buffer = new Array();
    for (let key in features_dict) {

      // Normalize feature values in current window
      let normed_values = new Array();
      const mean = math.mean(features_dict[key]);
      const std = math.std(features_dict[key]);
      for (let i = 0; i < features_dict[key].length; i++) {
        normed_values.push((features_dict[key][i] - mean) / std);
      }

      // Add each normalized feature array to the current buffer
      buffer = buffer.concat(normed_values);

      // Remove oldest value from each feature array
      features_dict[key].shift();
    }
    const tensor = tf.tensor(buffer);
    const input = tf.reshape(tensor, [-1, 600]);
    for (let model in models) {
      const result = models[model].predict(input).arraySync();
      const table = document.getElementById(`${model}-table`);
      table.rows[0].cells[1].innerText = result[0][0].toFixed(2);
      const targetRangeElement = document.getElementById(`${model}Range`);
      targetRangeElement.value = result[0][0].toFixed(2);
    }
  }
}

load()
