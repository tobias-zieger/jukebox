function playCd(selectedCd) {
  player = document.getElementById("player");
  player.style.visibility = "visible";

  playingtitle = document.getElementById("playingtitle");
  
  playingtitle.textContent = selectedCd["longtitle"];

  playingcover = document.getElementById("playingcover");
  playingcover.src = selectedCd["cover"];

  playingcoverlink = document.getElementById("playingcoverlink");
  playingcoverlink.href = "#" + selectedCd["id"];

  audio = document.getElementById("audiocontrol");

  // Clean its content so that we know that it's empty in the following.
  audio.textContent = "";

  source = document.createElement("source");
  source.setAttribute("id", "audiosource");
  source.setAttribute("src", selectedCd["audio"]);
  audio.appendChild(source)

  // Preload the audio without playing.
  audio.load();

  // Actually start playing.
  audio.play();

  refreshHeatmapOverlayColors();

  // Remove all shadows.
  for (coverImage of htmlCollectionToArray(document.getElementsByClassName("coverImage"))) {
    coverImage.style.boxShadow = "";
  }

  // Add a shadow for the one that was chosen.
  // For the autoplay to work, we cannot derive that from the element that was clicked on but from the CD that is playing, because there is no click when autoplaying.
  // Fake a click.
  elm = document.getElementById(selectedCd.id);
  imageElement = elm.querySelector("div img");
  imageElement.style.boxShadow = "0px 0px 10px 10px deepskyblue";
  
  // mark this cd as having been played (once again)
  // remove the new mark
  elm.querySelector("a.name").classList.remove("new");
  
  // save it to local storage
  numberOfTimesPlayed = getNumberOfTimesPlayed(selectedCd.id);
  localStorage.setItem(selectedCd.id, ++numberOfTimesPlayed);
  
  // update the overlay
  elm.querySelector("span.frequency").innerHTML = numberOfTimesPlayed;
}

function continueOnAutoplay() {
  if (!autoplay) {
    // no autoplay
    return;
  }
  currentIndex = cdsInOrder.indexOf(cd);
  nextIndex = currentIndex + 1
  if (nextIndex == cdsInOrder.length) {
    nextIndex = 0;
  }
  nextCd = cdsInOrder[nextIndex];

  // This is the global variable that hold the currently played CD.
  cd = nextCd;

  playCd(nextCd);
}

function toggleAutoplay() {
  autoplay = !autoplay;
  newColor = autoplay ? "deepskyblue" : "black";
  document.getElementById("autoplay-panel").style.color = newColor;
}

function playRandomCd() {
  cdKeys = Object.keys(cdDictionary);
  randomIndex = Math.floor(Math.random() * cdKeys.length);
  randomCd = cdDictionary[cdKeys[randomIndex]];
  playCd(randomCd);
}

function refreshHeatmapOverlayColors() {
  // Recalculate and change the style of each overlay.
  // The minimum is 0. Find the maximum value to interpolate the color. Start with a maximum of 1 to avoid a division by zero below.
  maximum = 1;
  
  for (cd of cds) {
    maximum = Math.max(maximum, getNumberOfTimesPlayed(cd.id));
  }
  
  for (cd of cds) {
    // calculate the color value
    fraction = getNumberOfTimesPlayed(cd.id) / maximum;
    // We go from yellow (60) to red (0).
    colorValue = 60 - fraction * 60;
    // We misuse this field because we have no other convenient way to store the hue.
    document.getElementById(cd.id).style.animationIterationCount = colorValue;
  }
  
  updateBackgroundColor();
}

function toggleHeatmap() {
  heatmapVisible = !heatmapVisible;
  newColor = heatmapVisible ? "deepskyblue" : "black";
  document.getElementById("heatmap-panel").style.color = newColor;
  
  for (element of htmlCollectionToArray(document.getElementsByClassName("coverImage"))) {
    element.style.opacity = (heatmapVisible ? "0.5" : "1");
  }
  
  for (element of htmlCollectionToArray(document.getElementsByClassName("frequency"))) {
    element.style.visibility = (heatmapVisible ? "visible" : "hidden");
  }
  
  updateBackgroundColor();
}

function updateBackgroundColor() {
  for (element of htmlCollectionToArray(document.getElementsByClassName("CD"))) {
    colorValue = document.getElementById(element.id).style.animationIterationCount;
    element.style.backgroundColor = "hsla(" + colorValue + ", 100%, 50%, " + (heatmapVisible ? "1" : "0") + ")";
  }
}

