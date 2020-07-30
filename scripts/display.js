function toggleSliders() {
  let elementsToHide = ["levelLabel", "levelRange", "valenceLabel", "valenceRange",
                        "valence-table", "arousalLabel", "arousalRange",
                        "arousal-table", "complexityLabel", "complexityRange",
                        "contrastLabel", "contrastRange", "movementLabel", "movementRange"];
  for (element = 0; element < elementsToHide.length; element++) {
    let x = document.getElementById(elementsToHide[element]);
    if (x.style.display === "none") {
      x.style.display = "inline-block";
    } else {
      x.style.display = "none";
    }
  }
}

function hideSettings() {
  let elementsToHide = ["ghLink", "labelChoose", "sets", "labelCustom", "customSet", "startButton"];
  for (element = 0; element < elementsToHide.length; element++) {
    let x = document.getElementById(elementsToHide[element]);
    x.style.display = "none";
  }
  let all = document.getElementsByClassName("setup");
  for (var i = 0; i < all.length; i++) {
    all[i].style.margin = "0";
  }
  let bg = document.getElementById("bg");
  bg.style.background = "none";
}
