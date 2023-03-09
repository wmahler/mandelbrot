// TODO Start/Stop Zusammenfassen + Resolution Slider + Refresh first generate with new resolution + Exploration
const w = 800;
const h = 600;
const mrIncrease = 28;
let resolution = 50;
let zoomSpeed = 0.15;

let maxZoomLevel = 1;
let palette;
let xmin = -2.5;
let ymin = -2.5;
let xmax = 2.5;
let ymax = 2.5;
let zoomLevel = 0;
let targetXmin, targetYmin, targetXmax, targetYmax;
let allSets = new Array();
let runGenerator = false;
let counterPlayer = 0;
let runPlayer = false;
let brotShown = false;
let infoDiv;
let zoomSpeedSlider, maxIterationSlider;
let savedBrightestX = 0;
let savedBrightestY = 0;

function setup() {
	createCanvas(w, h);
	pixelDensity(1);
	colorMode(HSB, 360, 100, 100, 255);
	palette = [color(12, 219, 191), color(208, 255, 12), color(255, 66, 66), color(255, 147, 41), color(232, 0, 255), color(179, 0, 255), color(12, 255, 235), color(255, 0, 221), color(255, 255, 255), color(38, 38, 38)];
	let context = canvas.getContext('2d');
	context.imageSmoothingEnabled = true;
	context.imageSmoothingQuality = 'high';
	context.canvas.willReadFrequently = true;
	button1 = createButton('generate mandelbrot');
	button1.position(30, 250);
	button1.mousePressed(() => {
		runGenerator = true;
		button1.hide();
		maxIterationSlider.show();
		zoomSpeedSlider.show();
		button2.show();
		button3.show();
	});
	button2 = createButton('start zoom');
	button2.position(w + 50, 250);
	button2.hide();
	button2.mousePressed(() => { maxZoomLevel = maxIterationSlider.value(); runGenerator = true; });
	button3 = createButton('stop zoom');
	button3.hide();
	button3.position(w + 50, 300);
	button3.mousePressed(() => { runGenerator = false; });
	zoomSpeedSlider = createSlider(0, 1, zoomSpeed, 0.01);
	zoomSpeedSlider.position(w + 175, 85);
	zoomSpeedSlider.hide();
	maxIterationSlider = createSlider(1, 200, maxZoomLevel);
	maxIterationSlider.position(w + 175, 50);
	maxIterationSlider.hide();
	infoDiv = createDiv('Dimensions: ' + w + 'x' + h + '<br>Iteration: ' + zoomLevel + '/' + maxZoomLevel + '<br>Resolution: ' + resolution + '<br>ZoomSpeed: ' + zoomSpeed);
	infoDiv.position(w + 20, 30);
}

function draw() {
	if (runGenerator) {
		// return if maxZoomLevel is reached
		if (zoomLevel >= maxZoomLevel) {
			runGenerator = false;
			return;
		}
		// get pixels array
		loadPixels();
		//search brightest pixel an zoom in by setting new target xmin/xmax/ymin/ymax
		let brightestX = 0;
		let brightestY = 0;
		let brightest = 0;
		if (zoomLevel % 3 == 0 || zoomLevel < 5) {
			for (let i = 0; i < pixels.length; i += 4) {
				let x = (i / 4) % width;
				let y = Math.floor((i / 4) / width);
				let b = pixels[i + 2];
				if (b > brightest) {
					brightest = b;
					brightestX = x;
					brightestY = y;
				}
			}
			savedBrightestX = brightestX;
			savedBrightestY = brightestY;
		} else {
			brightestX = savedBrightestX;
			brightestY = savedBrightestY;
		}
		let cx = map(brightestX, 0, width, xmin, xmax);
		let cy = map(brightestY, 0, height, ymin, ymax);
		newWidth = (xmax - xmin) / 2;
		newHeight = (ymax - ymin) / 2;
		targetXmin = cx - newWidth / 2;
		targetYmin = cy - newHeight / 2;
		targetXmax = cx + newWidth / 2;
		targetYmax = cy + newHeight / 2;
		// create Arrays for next Mandelbrot
		let ca = new Array(w);
		let cb = new Array(h);
		let data = new Array(w * h);
		// map x and y to the new min and max
		for (let x = 0; x < width; x++) {
			ca[x] = map(x, 0, width, xmin, xmax);
		}
		for (let y = 0; y < height; y++) {
			cb[y] = map(y, 0, height, ymin, ymax);
		}
		// loop through all pixels and write new pixel value in array "data"
		for (let x = 0; x < width; x++) {
			for (let y = 0; y < height; y++) {
				let a = ca[x];
				let b = cb[y];
				let n = 0;
				while (n < resolution && zoomLevel < maxZoomLevel) {
					let aa = a * a - b * b;
					let bb = 2 * a * b;
					a = aa + ca[x];
					b = bb + cb[y];
					if (abs(a + b) > 16) {
						break;
					}
					n++;
				}
				data[x + y * width] = n;
			}
		}
		// get brightness values of all pixels
		let brightnessValues = [];
		for (let i = 0; i < pixels.length; i += 4) {
			let [r, g, b] = pixels.slice(i, i + 3);
			let brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b;
			brightnessValues.push(brightness);
		}
		// calculate minimum and maximum brightness values
		let minBrightnessCC = brightnessValues[0];
		let maxBrightnessCC = brightnessValues[0];
		for (let i = 1; i < brightnessValues.length; i++) {
			if (brightnessValues[i] < minBrightnessCC) {
				minBrightnessCC = brightnessValues[i];
			}
			if (brightnessValues[i] > maxBrightnessCC) {
				maxBrightnessCC = brightnessValues[i];
			}
		}
		// apply contrast stretching to pixels
		for (let i = 0; i < pixels.length; i += 4) {
			let r = pixels[i];
			let g = pixels[i + 1];
			let b = pixels[i + 2];
			let brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b;
			brightness = map(brightness, minBrightnessCC, maxBrightnessCC, 0, 255);
			pixels[i] = brightness;
			pixels[i + 1] = brightness;
			pixels[i + 2] = brightness;
		}
		// update the pixels array 
		for (let i = 0; i < pixels.length; i += 4) {
			let x = (i / 4) % width;
			let y = Math.floor((i / 4) / width);
			let c = data[x + y * width];
			if (c === resolution) {
				pixels[i] = 0;
				pixels[i + 1] = 0;
				pixels[i + 2] = 0;
				pixels[i + 3] = 255;
			} else {
				let hue = map(c, 0, resolution, 0, 1);
				let colorIndex = Math.floor(hue * (palette.length - 2));
				let c1 = palette[colorIndex];
				let c2 = palette[colorIndex + 1];
				let n = map(hue, colorIndex / (palette.length - 1), (colorIndex + 1) / (palette.length - 1), 0, 1);
				let c3 = lerpColor(c1, c2, n);
				pixels[i] = red(c3);
				pixels[i + 1] = green(c3);
				pixels[i + 2] = blue(c3);
				pixels[i + 3] = 190;
			}
		}
		// increase zoomLevel Counter
		zoomLevel++;
		// push this set to the allSets array
		allSets.push(pixels);
		// write updated pixels array to screen
		updatePixels();
		// animate with linear interpolation
		xmin = lerp(xmin, targetXmin, zoomSpeed);
		ymin = lerp(ymin, targetYmin, zoomSpeed);
		xmax = lerp(xmax, targetXmax, zoomSpeed);
		ymax = lerp(ymax, targetYmax, zoomSpeed);
		// Multiscale Rendering resolution increase, modulo 1 = every iteration
		if (zoomLevel % 1 == 0) {
			resolution += mrIncrease;
		}
	} else if (runPlayer) {
		loadPixels();
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				let i = (x + y * width) * 4;
				pixels[i + 0] = allSets[counterPlayer][i + 0];
				pixels[i + 1] = allSets[counterPlayer][i + 1];
				pixels[i + 2] = allSets[counterPlayer][i + 2];
				pixels[i + 3] = allSets[counterPlayer][i + 3];
			}
		}
		updatePixels();
		counterPlayer++;
		if (counterPlayer == Object.keys(allSets).length) {
			runPlayer = false;
			brotShown = false;
		}
	}
	// set slider values
	maxZoomLevel = maxIterationSlider.value();
	zoomSpeed = zoomSpeedSlider.value();
	// display info
	infoDiv.html('Dimensions: ' + w + 'x' + h + '<br>Iteration: ' + zoomLevel + '/' + maxZoomLevel + '<br>Resolution: ' + resolution + '<br>ZoomSpeed: ' + zoomSpeed);
	// Switch to playmode
	if (zoomLevel == maxZoomLevel && zoomLevel != 1) {
		if (!brotShown) {
			button = createButton('play the animation!');
			button.position(w+50, 350);
			button.mousePressed(() => {
				brotShown = true;
				counterPlayer = 0;
				runPlayer = true
				frameRate(24);
			});
		}
	}
}