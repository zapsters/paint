var databaseDirectory = "paintProject";

//Objects
var border_identity = document.getElementById("border");
var canvas_identity = document.getElementById("canvas");
var canvas_object = canvas_identity.getContext("2d");
var selectedPixel = document.getElementById("selectedPixel");
var colorContainerDiv = document.getElementById("colorContainer");

//Canvas / Color Data
var activeColorID = null;
var activeColorHex = null;
var activeColorBox = null;
var colorCodesArray = [
  "6D001A",
  "BE0039",
  "FF4500",
  "FFA800",
  "FFD635",
  "FFF8B8",
  "00A368",
  "00CC78",
  "7EED56",
  "00756F",
  "009EAA",
  "00CCC0",
  "2450A4",
  "3690EA",
  "51E9F4",
  "493AC1",
  "6A5CFF",
  "94B3FF",
  "811E9F",
  "B44AC0",
  "E4ABFF",
  "DE107F",
  "FF3881",
  "FF99AA",
  "6D482F",
  "9C6926",
  "FFB470",
  "000000",
  "515252",
  "898D90",
  "D4D7D9",
  "FFFFFF",
];
var canvasDefaultColor = "#FFFFFF";

var mobileDevice = false;
var hideCursor = true;
var hideOnLeave = true;
var isHolding = false;

var cursorLeftCanvas = false;
var canvasX = null;
var canvasY = null;

var canvasSize = [100, 100]; //Width, Height
var pixelSize = 10;
var scale = 0.8;
selectedPixel.style.width = pixelSize * scale + "px";
selectedPixel.style.height = pixelSize * scale + "px";

border_identity.style.width = canvasSize[0] * pixelSize * scale + "px";
border_identity.style.height = canvasSize[1] * pixelSize * scale + "px";

canvas_identity.style.width = canvasSize[0] * pixelSize * scale + "px";
canvas_identity.style.height = canvasSize[1] * pixelSize * scale + "px";
canvas_identity.style.backgroundSize =
  pixelSize * scale + "px " + pixelSize * scale + "px";
canvas_identity.width = canvasSize[0] * pixelSize * scale;
canvas_identity.height = canvasSize[1] * pixelSize * scale;
canvas_object.filter = "blur(-60px)";

//Tool switch function, unused until the toolBar is actually needed.
function setActiveTool(toolNumber) {
  document.getElementById("brushTool").setAttribute("value", "NOTselected");
  document.getElementById("paletteTool").setAttribute("value", "NOTselected");
  switch (toolNumber) {
    case 0:
      document.getElementById("brushTool").setAttribute("value", "selected");
      break;
    case 1:
      document.getElementById("paletteTool").setAttribute("value", "selected");
      break;
  }
}
setActiveTool(0);

//Database pixel data, this initializes the canvas on load.
var InitializedFully = false;
var pixelDataUpdate = firebase.database().ref(databaseDirectory + "/pixels/");
pixelDataUpdate.once("value", function (doc) {
  pixel_data = doc.val();
  doc.forEach((pixel) => {
    pixelCords = pixel.val().position;
    pixelColor = pixel.val().color;
    setPixelColor(pixelCords, pixelColor);
  });
  InitializedFully = true;
  console.log(" ================================================ ");
  console.log(" == Thanks for visiting my site! I hope you enjoy! :D == ");
  console.log(" == Created with love by Erin == ");
});

pixelDataUpdate.on("child_added", function (doc) {
  if (InitializedFully == false) return;
  pixelUpdate(doc);
});
pixelDataUpdate.on("child_changed", function (doc) {
  if (InitializedFully == false) return;
  pixelUpdate(doc);
});
pixelDataUpdate.on("child_removed", function (doc) {
  if (InitializedFully == false) return;
  pixel_data = doc.val();
  pixelCords = pixel_data.position;
  pixelColor = pixel_data.color;
  setPixelColor(pixelCords, canvasDefaultColor);
});

function pixelUpdate(doc) {
  pixel_data = doc.val();
  pixelCords = pixel_data.position;
  pixelColor = pixel_data.color;
  //console.log("PIXEL UPDATED: \n" + "  [" + pixelCords[0] + ", " + pixelCords[1] + "] \n  " + pixelColor);
  folderName = pixelCords[0] + ", " + pixelCords[1];
  setPixelColor(pixelCords, pixelColor);
}

function getPixelID(pixelCords) {
  pixelID = "Pixel[" + pixelCords + "]";
  return pixelID;
}

//Called when database pixel is updated. Only reads the pixel that changed!!! Reads Database.
function setPixelColor(pixelCordinates, pixelHexColor) {
  if (pixelCordinates == undefined) return;
  //console.log(pixelCordinates, pixelHexColor);
  canvas = canvas_identity.getContext("2d");
  canvas.beginPath();
  canvas.rect(
    pixelCordinates[0] * pixelSize * scale,
    pixelCordinates[1] * pixelSize * scale,
    pixelSize * scale,
    pixelSize * scale
  );
  canvas.fillStyle = pixelHexColor;
  canvas.fill();
}

//Called when user wants to paint pixel(s). Updates TO database.
function drawPixels() {
  //Use the main CANVASX and CANVASY variables to paint. They are defined in updateCanvasLocation();
  debugTextUpdate("painted", "Painted: " + canvasX + ", " + canvasY);

  folderName = canvasX + ", " + canvasY;
  canvasLocation = [canvasX, canvasY];
  if (canvasX == undefined || canvasY == undefined) {
    console.error(
      "Case Caught! Tried to draw pixel, but no canvasPosition found."
    );
    return;
  }

  if (activeColorHex == canvasDefaultColor || keys.includes("ShiftLeft")) {
    firebase
      .database()
      .ref(databaseDirectory + "/pixels/" + folderName)
      .set({});
  } else {
    firebase
      .database()
      .ref(databaseDirectory + "/pixels/" + folderName)
      .set({
        color: activeColorHex,
        position: canvasLocation,
      });
  }
}

//Database Canvas Snapshot Saving & Reading!
function uploadCanvasSnapshot() {
  var newSnapshot = canvas_identity.toDataURL();
  var date = new Date();
  var dd = String(date.getDate()).padStart(2, "0");
  var mm = String(date.getMonth() + 1).padStart(2, "0"); //January is 0!
  var yyyy = date.getFullYear();
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  if (minutes < 10) minutes = "0" + minutes;
  title =
    mm +
    "/" +
    dd +
    "/" +
    yyyy +
    " - " +
    hours +
    ":" +
    minutes.toString() +
    " " +
    ampm;
  firebase
    .database()
    .ref(databaseDirectory + "/snapshots/" + date.getTime())
    .set({
      title: title,
      snapshot: newSnapshot,
    });
  return newSnapshot;
}

var snapshotDataUpdate = firebase
  .database()
  .ref(databaseDirectory + "/snapshots/");
snapshotDataUpdate.on("child_added", function (doc) {
  snapshotData = doc.val();

  var snapshotConDIV = document.getElementById("snapshotContainer");

  var newSnapshotContainer = document.createElement("div");
  newSnapshotContainer.setAttribute("class", "snapshotContainer");
  var newSnapshot = document.createElement("img");
  newSnapshot.setAttribute("class", "snapshot");
  newSnapshot.setAttribute("src", snapshotData.snapshot);
  var newtext = document.createElement("h1");
  newtext.innerHTML = snapshotData.title;
  newSnapshotContainer.appendChild(newtext);
  newSnapshotContainer.appendChild(newSnapshot);
  document
    .getElementById("snapshotContainer")
    .appendChild(newSnapshotContainer);
  if (snapshotConDIV.children[1]) {
    //console.log(snapshotConDIV.children[1]);
    snapshotConDIV.insertBefore(
      newSnapshotContainer,
      snapshotConDIV.children[1]
    );
  }
});

//User input functions
function getCursorPosition(clientX, clientY) {
  var canvasIdentity = canvas_identity.getBoundingClientRect();
  var cursorX = Math.floor((clientX - canvasIdentity.left) / pixelSize / scale);
  var cursorY = Math.floor((clientY - canvasIdentity.top) / pixelSize / scale);
  return [cursorX, cursorY];
}

function updateCanvasLocation(cursorX, cursorY) {
  if (cursorX == canvasX && cursorY == canvasY) return;
  if (
    cursorX < 0 ||
    cursorY < 0 ||
    cursorX >= canvasSize[0] ||
    cursorY >= canvasSize[1]
  ) {
    //Cursor has left the painting zone, hide the selectedPixel.
    if (hideOnLeave) selectedPixel.style.opacity = "0";
    if (mobileDevice == false) {
      cursorLeftCanvas = true;
    }
  } else {
    cursorLeftCanvas = false;
    selectedPixel.style.opacity = "1";
    selectedPixel.style.left = cursorX * pixelSize * scale + "px";
    selectedPixel.style.top = cursorY * pixelSize * scale + "px";

    canvasX = cursorX;
    canvasY = cursorY;
  }
  debugTextUpdate("cursorleftVar", "cursorLeftCanvas: " + cursorLeftCanvas);
  debugTextUpdate("canvasPos", "canvasX/Y: [" + canvasX + ", " + canvasY + "]");
}

function onMouseDown(e) {
  if (mobileDevice == true) {
    return;
  } //Mobile users use the "PAINT" button instead of just clicking.
  if (cursorLeftCanvas == true) return; //If cursor is not in the canvas
  if (e.button != 0) return;
  isHolding = true;
  debugTextUpdate("isHolding", "isHolding: " + isHolding);
  drawPixels();
}

function onMouseUp(e) {
  isHolding = false;
  debugTextUpdate("isHolding", "isHolding: " + isHolding);
}

function onMouseMove(e) {
  var [cursorX, cursorY] = getCursorPosition(e.clientX, e.clientY);
  if (cursorX == canvasX && cursorY == canvasY) return; //if cursor hasn't gone to a new pixel, return
  var position = "[" + cursorX + "," + cursorY + "]";
  debugTextUpdate("position", "POS: " + position);
  updateCanvasLocation(cursorX, cursorY);
  if (isHolding) {
    drawPixels();
  }
}

function mobileMove(e) {
  var [cursorX, cursorY] = getCursorPosition(
    e.touches[0].clientX,
    e.touches[0].clientY
  );
  var position = "[" + cursorX + "," + cursorY + "]";
  debugTextUpdate("position", "POS: " + position);
  updateCanvasLocation(cursorX, cursorY);

  //make the PAINT button visible for mobile users.
  if (mobileDevice == false) {
    mobileDevice = true;
    mobilePaintDiv.style.display = "block";
    hideOnLeave = false; //Leaves SelectedPixel visible even if the user clicks outside of canvas.
    hOLButton.checked = false;
  }
}

//Website initialize Function to create color options.
function createColorOptions() {
  for (let i = 0; i < colorCodesArray.length; i++) {
    var colorHTMLID = "color-" + i;
    var colorhex = colorCodesArray[i];
    var newColorDiv = document.createElement("div");

    newColorDiv.setAttribute("class", "colorBox ");
    newColorDiv.style.background = "#" + colorhex;
    newColorDiv.setAttribute("id", colorHTMLID); //Set HTML id.
    newColorDiv.setAttribute("colorid", i); //Set colorid variable to keep track of active color #.
    newColorDiv.setAttribute("colorhex", colorhex); //Save color hex code to box.
    newColorDiv.setAttribute("value", "NOTselected"); //Make sure it does not have the selected CSS value for styling.
    colorContainerDiv.appendChild(newColorDiv);

    newColorDiv.addEventListener("click", function () {
      selectNewColor(this, this.getAttribute("colorid"));
    });
  }
}

createColorOptions();

//Called when clicking on a colorBox in the colorContainer. Sets active colorBox and active colorID (ID is to be used in the database for coloring)
function selectNewColor(colorBox, colorID) {
  if (activeColorBox != null) {
    activeColorBox.setAttribute("value", "NOTselected");
    activeColorBox == null;
  }
  colorBox.setAttribute("value", "selected");
  var colorHEX = colorBox.getAttribute("colorhex");

  activeColorBox = colorBox;
  activeColorID = colorID;
  activeColorHex = "#" + colorHEX;

  debugTextUpdate("colorDebug", activeColorHex + " [" + activeColorID + "]");

  //Update the cursor's color.
  selectedPixel.style.backgroundColor = activeColorHex;
}
selectNewColor(document.getElementById("color-27"), 31);

var holdingAlt = false;
var keys = [];

function debugTextUpdate(child, value) {
  if (typeof value === "object") {
    value = JSON.stringify(value);
  }
  document.getElementById("debugText").children[child].innerHTML =
    value.toString();
}

// KEY LISTENER LOGIC ====
window.addEventListener(
  "keydown",
  function (e) {
    const index = keys.indexOf(e.code);
    if (index == -1) {
      keys.push(e.code);
      debugTextUpdate("Keys", keys);
    }

    switch (e.code) {
      case "Backquote":
        showDebug(!debugEnabled);
        break;

      case "ShiftLeft":
        //Update the cursor's color.
        selectedPixel.style.backgroundColor = canvasDefaultColor;
        break;
    }
  },
  false
);
window.addEventListener(
  "keyup",
  function (e) {
    const index = keys.indexOf(e.code);
    if (index > -1) {
      // only splice array when item is found
      keys.splice(index, 1); // 2nd parameter means remove one item only
      debugTextUpdate("Keys", keys);

      switch (e.code) {
        case "ShiftLeft":
          //Update the cursor's color.
          selectedPixel.style.backgroundColor = activeColorHex;
          break;
      }
    }
  },
  false
);

window.onblur = function () {
  isHolding = false;
  debugTextUpdate("isHolding", "isHolding: " + isHolding);
};

var debugEnabled = false;
function showDebug(state) {
  if (state) {
    debugText.style.display = "block";
    debugEnabled = true;
  } else {
    debugText.style.display = "none";
    debugEnabled = false;
  }
}
