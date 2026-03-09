// sketch.js - purpose and description here
// Author: Your Name
// Date:


// Here is how you might set up an OOP p5.js project
// Note that p5.js looks for a file called sketch.js

// Constants - User-servicable parts
const containerId = "#canvas-container";

// Globals
let myInstance;
let canvasContainer;
var centerHorz, centerVert;

function resizeScreen() {
  centerHorz = canvasContainer.width() / 2; // Adjusted for drawing logic
  centerVert = canvasContainer.height() / 2; // Adjusted for drawing logic
  console.log("Resizing...");
  resizeCanvas(canvasContainer.width(), canvasContainer.height());
  shootLayer = createGraphics(canvasContainer.width(), canvasContainer.height());
  shootLayer.clear();
  // redrawCanvas(); // Redraw everything based on new size
}

let tile_width_step_main; // A width step is half a tile's width
let tile_height_step_main; // A height step is half a tile's height

// Global variables. These will mostly be overwritten in setup().
let tile_rows, tile_columns;
let camera_offset;
let camera_velocity;

let stars = [];
let starCount = 30;

let planetaryRotation = true;

let shootingStar = null;
let lastShoot = 0;
let shootInterval = 10000;
let shootLayer;

let moonImages = [];
let moon;
let moons = [];

// SHOOTING STAR (trying to put in)

class ShootingStar {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = random(width * 0.2, width * 0.5);
    this.y = random(height * 0.05, height * 0.25);
    this.length = random(80, 150);
    this.speed = random(6, 10);
    this.alpha = 255;
  }

  update() {
    this.x += this.speed;
    this.y += this.speed;
    this.alpha -= 5;
  }

  draw() {
    shootLayer.stroke(255, 255, 0, this.alpha); // yellow
    shootLayer.strokeWeight(2); // between 2-4
    shootLayer.line(this.x, this.y, this.x - this.length, this.y - this.length);
  }

  isDead() {
    return this.alpha <= 0;
  }
}

class Moon {
  constructor(image,x,y) {
    this.x = x;
    this.y = y;
    this.image = image;
    this.size = random(20, 200);
  }

  draw() {
    image(this.image, this.x, this.y, this.size, this.size); 
  }

  update() {
    if (planetaryRotation) {
      this.x += starSpeed / 2; // Adjust speed as needed
      if (this.x > width) {
        // If the moon goes off the right side, reset it to the left side
        this.x = -this.size; // Reset position to the left side
      }
      if (this.x < -this.size) {
        // If the moon goes off the left side, reset it to the right side
        this.x = width; // Reset position to the right side
      }
    }
  }
}


/////////////////////////////
// Transforms between coordinate systems
// These are actually slightly weirder than in full 3d...
/////////////////////////////



function preload() {
  for (let i = 1; i <= 7; i++) {
    moonImages.push(loadImage(`Assets/Moon${i}.png`));
  }
  
  if (window.p3_preload) {
    window.p3_preload();
  }
}

// setup() function is called once when the program starts
function setup() {
  console.log("Setup Running")
  // place our canvas, making it fit our container
  canvasContainer = $(containerId);
  let canvas = createCanvas(canvasContainer.width(), canvasContainer.height());
  canvas.parent(containerId);
  // resize canvas is the page is resized

  shootLayer = createGraphics(width, height);
  shootLayer.clear();
  
  seedButton = $('#generate-button');
  seedButton.click(() => {
    generateNewSeed();
  });

  if (window.p3_setup) {
    window.p3_setup();
  }

  let inputKey = $("#world-seed");
  // event handler if the input key changes
  inputKey.change(() => {
    rebuildWorld(inputKey.val());
  });

  let starInput = $("#starSlider");
  let starText = $("#starCountText");
  starInput.change(() => {
    starCount = starInput.val();
    starText.text(starCount);
    adjustStarCount(starCount);
  });
  starInput.val(starCount);
  starText.text(starCount);

  let rotationCheckbox = $("#planetaryRotationCheckbox");
  rotationCheckbox.change(() => {
    planetaryRotation = rotationCheckbox.is(":checked");
  });

  let saveCanvasButton = $('#saveButton');
  saveCanvasButton.click(() => {
    saveImage();
  });

  setupSpeedSlider();

  let moonSlider = $("#moonSlider");
  moonSlider.change(() => {
    let moonCount = moonSlider.val();
    if (moonCount > moons.length) {
      for (let i = moons.length; i < moonCount; i++) {
        moons.push(new Moon(moon, random(canvasContainer.width()), random(canvasContainer.height()/4)));
      }
    }
    else if (moonCount < moons.length) {
      moons.splice(moonCount); // Remove excess moons
    }
    $('#moonCountText').text(moonCount);
  });

  rebuildWorld(inputKey.val());

  $(window).resize(function() {
    resizeScreen();
  });
  resizeScreen();
}

function rebuildWorld(key) {
  //Update stars when the world key changes
  randomSeed(calculateSeedFromKey(key));
  starCount = floor(random(20,40));
  $("#starSlider").val(starCount);
  $("#starCountText").text(starCount);
  generateStars();

  setSpeedSlider(0.05);
  moon = random(moonImages);
  moons = [];
  moons.push(new Moon(moon, random(canvasContainer.width()), random(canvasContainer.height()/4)));
  $('#moonSlider').val(moons.length);
  $('#moonCountText').text(moons.length);

  reset_sidebar_colors();

  $('#grassColorPicker').val('#969900') //reset grass color

  if (window.p3_worldKeyChanged) {
    window.p3_worldKeyChanged(key);
  }
  
}

// draw() function is called repeatedly, it's the main animation loop
function draw() {

  background("cyan")
  if (window.p3_drawBefore) {
    window.p3_drawBefore();
  }

  if(window.p3_draw_gradient){
    window.p3_draw_gradient()
  }

  if (window.draw_grass) {
    window.draw_grass();
  }


  
if ($("#starsCheckbox").is(":checked")) {
  for (let i = stars.length - 1; i >= 0; i--) {
    const star = stars[i];
    if (planetaryRotation) star.update();
    star.draw();
    star.checkMouseHover();
    
    if (star.x - star.radius > width) {
      star.removePopup();
      star.x = 0 + star.radius; // Reset position to the left side
    }
    else if (star.x - star.radius < 0) {
      star.removePopup();
      star.x = width + star.radius; // Reset position to the right side
    }
  }

  while (stars.length < starCount) {
    const newStar = new Star(
      random(-50, 0),
      random(height / 1.5, 0),
      random(2, 4),
      color('white')
    );
    stars.push(newStar);
  }
}

    shootLayer.clear();

  if (millis() - lastShoot > shootInterval) {
    shootingStar = new ShootingStar();
    lastShoot = millis()
  }
  if (moon) {
    for (let m of moons) {
      m.draw();
      m.update();
    }
  }
  if (shootingStar) { // 
    shootingStar.update(); 
    shootingStar.draw(); 

    if (shootingStar.isDead()) { 
      shootingStar = null; 
    } 
  } 

  image(shootLayer, 0, 0); 

  if (window.p3_drawAfter) {
    window.p3_drawAfter();
  }

}

function saveImage() {
  saveCanvas('myNightSky', 'png');
}

function mouseClicked() {
  // Check if any star is clicked
  for (let star of stars) {
    if (star.isHovered) {
      if (star.popup) {
        continue;
      }
      star.createPopup(canvas);
    }
    else if (star.popup) {
      // If the star is not hovered and has a popup, remove it
      star.removePopup();
    }
  }
}

function generateStars() {
  stars = [];
  for (let i = 0; i < starCount; i++) {
    let x = random(width);
    let y = random(height / 1.5, 0);
    let radius = random(2, 4); // Random radius between 2 and 4. Change later, they are big for testing

    let c = color('white');
    stars.push(new Star(x, y, radius, c));
  }
}

function adjustStarCount(newCount) {
  if (stars.length > newCount) {
    stars.splice(newCount); // Remove excess stars
  }
  else if (stars.length < newCount) {
    for (let i = stars.length; i < newCount; i++) {
      let x = random(width);
      let y = random(height / 2, 0);
      let radius = random(2, 4); // Random radius between 2 and 4. Change later, they are big for testing

      let c = color('white');
      stars.push(new Star(x, y, radius, c));
    }
  }
}

function calculateSeedFromKey(key) {
  let seed = 0;
  for (let i = 0; i < key.length; i++) {
    seed += key.charCodeAt(i) * (i + 1);
  }
  return seed;
}

function generateNewSeed() {
  const newSeed = Math.floor(Math.random() * 1000000); // Generates a new random seed
  console.log(`New seed generated: ${newSeed}`);
  console.log("Generated seed using Math.random():", newSeed);
  $('#world-seed').val(newSeed).change();
}