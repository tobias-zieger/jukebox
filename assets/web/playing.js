'use strict';

function playCd() {
  var player = document.getElementById("player");
  player.style.visibility = "visible";

  var playingtitle = document.getElementById("playingtitle");
  
  var title = currentlyPlayingCd["longtitle"];

  playingtitle.textContent = title;
  document.title = title;

  var playingcover = document.getElementById("playingcover");
  playingcover.src = currentlyPlayingCd["cover"];
  
  var favicon = document.querySelector("link[rel~='icon']");
  favicon.href = currentlyPlayingCd['cover'];

  var appleTouchIcon = document.querySelector("link[rel~='apple-touch-icon']");
  appleTouchIcon.href = currentlyPlayingCd['cover'];

  var playingcoverlink = document.getElementById("playingcoverlink");
  playingcoverlink.href = "#" + currentlyPlayingCd["id"];

  var audio = document.getElementById("audiocontrol");

  // Clean its content so that we know that it's empty in the following.
  audio.textContent = "";

  var source = document.createElement("source");
  source.setAttribute("id", "audiosource");
  source.setAttribute("src", currentlyPlayingCd["audio"]);
  audio.appendChild(source)

  // Preload the audio without playing.
  audio.load();

  // Actually start playing.
  audio.play();

  refreshHeatmapOverlayColors();

  // Remove all shadows.
  for (var coverImage of htmlCollectionToArray(document.getElementsByClassName("coverImage"))) {
    coverImage.style.boxShadow = "";
  }

  // Add a shadow for the one that was chosen.
  // For the autoplay to work, we cannot derive that from the element that was clicked on but from the CD that is playing, because there is no click when autoplaying.
  // Fake a click.
  var elm = document.getElementById(currentlyPlayingCd.id);
  var imageElement = elm.querySelector("div img");
  imageElement.style.boxShadow = "0px 0px 10px 10px deepskyblue";
  
  // mark this cd as having been played (once again)
  // remove the new mark
  elm.querySelector("span.cdTitle").classList.remove("new");
  
  // save it to local storage
  var numberOfTimesPlayed = getNumberOfTimesPlayed(currentlyPlayingCd.id);
  localStorage.setItem(currentlyPlayingCd.id, ++numberOfTimesPlayed);
  
  // update the overlay
  elm.querySelector("span.frequency").innerHTML = numberOfTimesPlayed;
}

function continueOnAutoplay() {
  if (!autoplay) {
    // no autoplay
    return;
  }
  var currentIndex = cdsInOrder.indexOf(currentlyPlayingCd);
  var nextIndex = currentIndex + 1;
  if (nextIndex == cdsInOrder.length) {
    nextIndex = 0;
  }
  var nextCd = cdsInOrder[nextIndex];

  // This is the global variable that holds the currently played CD.
  currentlyPlayingCd = nextCd;

  playCd();
}

function toggleAutoplay() {
  autoplay = !autoplay;
  var newColor = autoplay ? "deepskyblue" : "black";
  document.getElementById("autoplay-panel").style.color = newColor;
}

function playRandomCd(hashOfCds) {
  var cdKeys = Object.keys(hashOfCds);
  var randomIndex = Math.floor(Math.random() * cdKeys.length);
  var randomCd = hashOfCds[cdKeys[randomIndex]];
  currentlyPlayingCd = randomCd;
  playCd();
}

function playRandomCdFromWholeJukebox() {
  // make a deep copy
  var cds = JSON.parse(JSON.stringify(cdDictionary));

  // remove the currently selected CD to not repeat it
  if (currentlyPlayingCd) {
    delete cds[currentlyPlayingCd.id];
  }

  playRandomCd(cds);
}

function playRandomCdFromCategory(category) {
  var cds = {};
  // Create an object for the CDs in this category.
  for (var cd of groupedCds[category]) {
    cds[cd.id] = cd;
  }

  // Remove the currently selected CD to not repeat it (doesn't fail if this CD is not in the selected category).
  if (currentlyPlayingCd) {
    delete cds[currentlyPlayingCd.id]
  }

  playRandomCd(cds);
}

function refreshHeatmapOverlayColors() {
  // Recalculate and change the style of each overlay.
  // The minimum is 0. Find the maximum value to interpolate the color. Start with a maximum of 1 to avoid a division by zero below.
  var maximum = 1;
  
  for (var cd of cds) {
    maximum = Math.max(maximum, getNumberOfTimesPlayed(cd.id));
  }
  
  for (cd of cds) {
    // calculate the color value
    var fraction = getNumberOfTimesPlayed(cd.id) / maximum;
    // We go from yellow (60) to red (0).
    var colorValue = 60 - fraction * 60;
    // We misuse this field because we have no other convenient way to store the hue.
    document.getElementById(cd.id).style.animationIterationCount = colorValue;
  }
  
  updateBackgroundColor();
}

function toggleHeatmap() {
  heatmapVisible = !heatmapVisible;
  var newColor = heatmapVisible ? "deepskyblue" : "black";
  document.getElementById("heatmap-panel").style.color = newColor;
  
  for (var element of htmlCollectionToArray(document.getElementsByClassName("coverImage"))) {
    element.style.opacity = (heatmapVisible ? "0.5" : "1");
  }
  
  for (element of htmlCollectionToArray(document.getElementsByClassName("frequency"))) {
    element.style.visibility = (heatmapVisible ? "visible" : "hidden");
  }
  
  updateBackgroundColor();
}

function updateBackgroundColor() {
  for (var element of htmlCollectionToArray(document.getElementsByClassName("CD"))) {
    var colorValue = document.getElementById(element.id).style.animationIterationCount;
    element.style.backgroundColor = "hsla(" + colorValue + ", 100%, 50%, " + (heatmapVisible ? "1" : "0") + ")";
  }
}

