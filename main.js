function prepareData() {
  // Iterate over the CDs and enrich them and fill the categories mapping with it.
  groupedCds = {}

  for (cd of cds) {
    // Enrich the CD with its long title.
    cd.longtitle = (cd.category ? cd.category + " - " : "") + cd.name
    // Enrich the CDs with IDs. We need that to have fixed references (for #links and to recognize them regarding their usage). Numeric IDs are bad here, because they would be unstable when a CD is added or removed.
    id = calculateId(cd);

    // In case of an ID clash, complain about it, ignore it, and continue. The first CD wins.
    if (Object.keys(cdDictionary).includes(id)) {
      console.warn("The ID for CD \"" + cd.name + "\" (\"" + id + "\") was already generated for a different CD. The new CD will be ignored.");
      continue;
    }
    cd.id = id;
    cdDictionary[id] = cd;

    // Sort the CD into a group for that category.
    group = (groupedCds.hasOwnProperty(cd.category) ? groupedCds[cd.category] : [])
    group.push(cd)
    groupedCds[cd.category] = group
  }
  
  // Store and sort the categories.  
  categories = Array.from(Object.keys(groupedCds)).sort(isort);
}

function writePreloadFooterImages() {
  // preload the images of the footer as early as possible
  document.write("<div style=\"display:none\">");
  for (category of categories) {
    if (category != "") {
      document.write("<img src=\"category%20pictures/" + category + ".jpg\">");
    }
  }
  document.write("</div>");
}

function writeCDs() {
  for (category of categories) {
    if (category != "") {
      document.write("<h1 id=\"" + category + "\">" + category + "</h1>")
    }
    document.write("<ul class=\"cdlist\">");
    for (cd of groupedCds[category].sort(objectsort)) {
      cdsInOrder.push(cd);

      frequency = getNumberOfTimesPlayed(cd.id)
      isNewCd = frequency < 1;

      // Add it to the page.
      document.write("<li class=\"CD\" id=\"" + cd.id + "\">")
      document.write("  <div class=\"coverWithDuration\">")
      document.write("    <img class=\"coverImage\" src=\"" + cd["cover"] + "\" title=\"" + cd["name"] + "\">")
      document.write("    <span class=\"duration overlaymessage\">" + cd["duration"] + "</span>")
      document.write("    <span class=\"frequency overlaymessage\">" + frequency + "</span>")
      document.write("  </div>")
      document.write("  <a class=\"name" + (isNewCd ? " new" : "") + "\" href=\"" + cd["audio"] + "\">" + cd.name + "</a>")
      document.write("</li>");
    }
    document.write("</ul>")
  }
}

function enableEventsForCDs() {
  for (cdElement of htmlCollectionToArray(document.getElementsByClassName("CD"))) {
    cdElement.onclick = function(e) {
      e.preventDefault();
      elm = e.target;

      // Bubble up to find LI from the current element.
      while (true) {
        if (elm.nodeName == "LI")
          break;
        else
          elm = elm.parentElement;
      }

      cd = cdDictionary[elm.id];

      playCd(cd);
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
  for (category of categories) {
    if (category != "") {
      document.write("<a href=\"#" + category + "\"><img class=\"categoryPicture\" title=\"" + category + "\" src=\"category%20pictures/" + category + ".jpg\"></a>")
    }
  }
  document.write("</div>");
}

// Clear the usage history upon request.
if (location.search == "?clear") {
  alert("Clearing Local Storage…");
  localStorage.clear(); 
}

autoplay = false;

// For each CD, make an object containing the cover image and the audio file for later access.
cdDictionary = {};

// For autoplay, we need a structure for the CDs that we can cycle through easily.
cdsInOrder = []

heatmapVisible = false;

prepareData();
writePreloadFooterImages();
writeCDs();
enableEventsForCDs();
writeFooter();
refreshHeatmapOverlayColors();

