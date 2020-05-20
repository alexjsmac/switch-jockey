let valence_model;
let arousal_model;

var count = 0;

var feature_data = {
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

var stats = {
  "energy": [4.429195e+01, 7.330021e+01],
  "perceptualSharpness": [5.303692e-01, 3.846662e-02],
  "perceptualSpread": [8.267519e-01, 3.857102e-02],
  "rms": [1.050252e-01, 1.029460e-01],
  "spectralCentroid": [3.705505e+02, 1.283681e+02],
  "spectralFlatness": [3.635678e-01, 2.373251e-01],
  "spectralKurtosis": [-1.565444e+01, 4.000770e+01],
  "spectralRolloff": [2.182464e+04, 7.028409e+02],
  "spectralSkewness": [6.780393e-01, 1.018544e+00],
  "spectralSlope": [2.446412e-08, 2.228043e-08],
  "spectralSpread": [3.733990e+02, 6.646544e+01],
  "zcr": [4.003220e+02, 3.702315e+02]
}

async function load() {
  valence_model = await tf.loadGraphModel('./assets/models/valence/model.json');
  arousal_model = await tf.loadGraphModel('./assets/models/arousal/model.json');
  console.log("Models loaded");
}

function valence_prediction(features) {
  for (var key in features) {
    normed_val = (features[key] - stats[key][0]) / stats[key][1];
    feature_data[key].push(normed_val);
  }
  count += 1;
  if (count > 49) {
    buffer = new Array();
    for (var key in features) {
      buffer = buffer.concat(feature_data[key]);
      feature_data[key].shift();
    }
    tensor = tf.tensor(buffer);
    input = tf.reshape(tensor, [-1, 600]);
    result = valence_model.predict(input).arraySync();
    var table = document.getElementById('valence-table');
    table.rows[0].cells[1].innerText = result[0][0].toFixed(2);
    valenceRangeElement = document.getElementById("valenceRange");
    valenceRangeElement.value = result[0][0].toFixed(2);
  }
}

function arousal_prediction(features) {
  var arousal_values = new Array();
  for (var key in features) {
    normed_val = (features[key] - stats[key][0]) / stats[key][1];
    arousal_values.push(normed_val);
  }
  tensor = tf.tensor(arousal_values);
  input = tf.reshape(tensor, [-1, 12]);
  result = arousal_model.predict(input).arraySync();
  var table = document.getElementById('arousal-table');
  table.rows[0].cells[1].innerText = result[0][0].toFixed(2);
  valenceRangeElement = document.getElementById("arousalRange");
  valenceRangeElement.value = result[0][0].toFixed(2);
}

load()
