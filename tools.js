// These sort functions are required to work in Mobile Safari 9.
// We need them to reference a function as this lambda stuff to do it inline and some other functions (e.g., padstart) do not work in that environment.
function padSingleNumberWithZeros(strnum) {
  desiredLength = 8;
  paddingChar = "0";
  // return strnum.padStart(desiredLength, paddingChar); // This does not work in that old browser.
  while (strnum.length < desiredLength) {
    strnum = paddingChar + strnum;
  }
  return strnum;
}

function padStringWithZeros(str) {
  return str.replace(/\d+/g, padSingleNumberWithZeros);
}

function isort(a, b) {
  // The numeric: true hash is ignored by Mobile Safari 9.
  return padStringWithZeros(a.toLowerCase()).localeCompare(padStringWithZeros(b.toLowerCase(), undefined, {numeric: true}));
}

function objectsort(a, b) {
  return isort(a["name"], b["name"]);
}

function calculateId(cd) {
  // replaceAll() does not work in Mobile Safari 9, but this is even as good
  const regex = /[^a-z0-9]/g;
  return cd.longtitle.toLowerCase().replace(regex, "");
}

function getNumberOfTimesPlayed(key) {
  return parseInt(localStorage.getItem(key) || 0);
}

function htmlCollectionToArray(collection) {
  result = [];
  for (i = 0; i < collection.length; i++) {
    result.push(collection[i]);
  }
  return result;
}

