'use strict';

function prepareData() {
  // Iterate over the CDs and enrich them and fill the categories mapping with it.
  groupedCds = {};

  // Get the base audio directory because we need this for the category pictures.
  baseAudioDirectory = cds[0]["audio"].split("/");
  baseAudioDirectory.pop();
  if (cds[0]['category'] != '') {
    baseAudioDirectory.pop();
  }
  baseAudioDirectory = baseAudioDirectory.join('/');

  for (var cd of cds) {
    // Enrich the CD with its long title.
    cd.longtitle = (cd.category ? cd.category + " - " : "") + cd.name;

    // Enrich the CDs with IDs. We need that to have fixed references (for #links and to recognize them regarding their usage). Numeric IDs are bad here, because they would be unstable when a CD is added or removed.
    var id = calculateId(cd);

    // In case of an ID clash, complain about it, ignore it, and continue. The first CD wins.
    if (Object.keys(cdDictionary).includes(id)) {
      console.warn("The ID for CD \"" + cd.name + "\" (\"" + id + "\") was already generated for a different CD. The new CD will be ignored.");
      continue;
    }
    cd.id = id;
    cdDictionary[id] = cd;

    // Sort the CD into a group for that category.
    var group = (groupedCds.hasOwnProperty(cd.category) ? groupedCds[cd.category] : []);
    group.push(cd);
    groupedCds[cd.category] = group;
  }

  // Store and sort the categories.  
  categories = Array.from(Object.keys(groupedCds)).sort(isort);
}

function writePreloadFooterImages() {
  // preload the images of the footer as early as possible
  document.write("<div style=\"display:none\">");
  for (var category of categories) {
    if (category != "") {
      document.write("<img src=\"" + baseAudioDirectory + "/" + category + "/" + category + ".jpg\">");
    }
  }
  document.write("</div>");
}

function writeCDs() {
  for (var category of categories) {
    if (category != "") {
      document.write("<h1 id=\"" + category + "\">" + category + " <span class=\"randomCategoryButton\" onclick=\"playRandomCdFromCategory('" + category + "')\">⚄</span></h1>")
    }
    document.write("<ul class=\"cdlist\">");
    for (var cd of groupedCds[category].sort(objectsort)) {
      cdsInOrder.push(cd);

      var frequency = getNumberOfTimesPlayed(cd.id)
      var isNewCd = frequency < 1;

      // Add it to the page.
      document.write("<li class=\"CD\" id=\"" + cd.id + "\">");
      document.write("  <a class=\"name\" href=\"" + cd["audio"] + "\">");
      document.write("    <div class=\"coverWithDuration\">");
      document.write("      <img class=\"coverImage\" src=\"" + cd["cover"] + "\" title=\"" + cd["name"] + "\">");
      document.write("      <span class=\"duration overlaymessage\">" + cd["duration"] + "</span>");
      document.write("      <span class=\"frequency overlaymessage\">" + frequency + "</span>");
      document.write("    </div>");
      document.write("    <span class=\"cdTitle" + (isNewCd ? " new" : "") + "\">" + cd.name + "</span>");
      document.write("  </a>")
      document.write("</li>");
    }
    document.write("</ul>");
  }
}

function enableEventsForCDs() {
  for (var cdElement of htmlCollectionToArray(document.getElementsByClassName("CD"))) {
    cdElement.onclick = function(e) {
      e.preventDefault();
      var elm = e.target;

      // Bubble up to find LI from the current element.
      while (true) {
        if (elm.nodeName == "LI")
          break;
        else
          elm = elm.parentElement;
      }

      currentlyPlayingCd = cdDictionary[elm.id];
      playCd();
    };
  }
}

function writeFooter() {
  // Show the footer only if it actually contains something.
  if (categories.length <= 1) {
    return;
  }
  document.write("<div id=\"footer\">")
  document.write("<span class=\"helper\"></span>")
  for (var category of categories) {
    if (category != "") {
      document.write("<a href=\"#" + category + "\"><img class=\"categoryPicture\" title=\"" + category + "\" src=\"" + baseAudioDirectory + "/" + category + "/" + category + ".jpg\"></a>")
    }
  }
  document.write("</div>");
}

// Clear the usage history upon request.
if (location.search == "?clear") {
  alert("Clearing Local Storage…");
  localStorage.clear(); 
}

var baseAudioDirectory;

var autoplay = false;

// For each CD, make an object containing the cover image and the audio file for later access.
var cdDictionary = {};

// For autoplay, we need a structure for the CDs that we can cycle through easily.
var cdsInOrder = []

var heatmapVisible = false;

var categories;

var groupedCds;

var currentlyPlayingCd;

prepareData();
writePreloadFooterImages();
writeCDs();
enableEventsForCDs();
writeFooter();
refreshHeatmapOverlayColors();

