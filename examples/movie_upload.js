import { Light, Frame, Movie, Led } from "../dist/index.js";

async function run() {
  // instantiate the device
  console.log("Creating device...");
  const device = new Light(addresses[0]);

  // must login before sending commands
  console.log("Logging in...");
  await device.login();

  const details = await device.getDeviceDetails();
  const nLeds = await device.getNLeds();
  // get the device name
  console.log(`This device is called ${await device.getName()}`);

  // Create a movie
  let movie = makeMovie({
    nLeds,
    nFrames: nLeds + 20,
    tailLength: 20,
    type: details.led_profile?.toLowerCase() || 'rgb',
  });

  // adjust brightness
  console.log("Set device to full brightness");
  await device.setBrightness(100);
  // turn off lights
  console.log("Set device to off mode");
  await device.setMode("off");
  // get list of movies
  let listOfMovies = await device.getListOfMovies();
  console.log(`List of movies: ${listOfMovies.length}`);
  console.log(listOfMovies.map((m) => m.name));
  // console.log(listOfMovies[0]);
  // console.log("Get playlist");
  // console.log(await device.getPlaylist());
  // return;
  console.log("Uploading movie...");

  // return;
  // add movie to device (better way to do this)
  console.log("File size", `${movie.size() / 1000} kb`);

  await device.addMovie(movie);
  // set device to movie mode
  console.log("Set device to movie mode");
  await device.setMode("movie");
  console.log("DONE!!");
}

run();

function makeMovie({
  nLeds = 600,
  nFrames = 250,
  tailLength = 15,
  type = "rgb",
  fps = 15,
} = {}) {
  const rgbw = type === "rgbw";
  const black = rgbw
    ? new Led(0, 0, 0, 0)
    : new Led(0, 0, 0);
  const frames = [];
  const saturationFactor = 0.5;
  const step = 5; // skip frames to make movie shorter
  const nBufferFrames = 3 * fps; // add some blank frames at the end

  for (let i = 0; i < nFrames; i += step) {
    // Faster way to make a frame of LEDs of single color
    let leds = Array(nLeds).fill(black);

    for (let j = 0; j < tailLength; j++) {
      let fade = (tailLength - j) / tailLength; // fade as j increases towards tail end
      let desaturation = (saturationFactor * j) / (tailLength - 1); // desaturate as j increases
      let sparkle = Math.min(0, Math.random() - 0.3); // add some random sparkle
      if (j === 0) {
        sparkle = 1;
      }
      if (leds[i - j] !== undefined) {
        const r = 0;
        const g = 0;
        const b = 255;
        const w = rgbw ? 0 : undefined;
        leds[i - j] = new Led(r, g, b, w)
          // .desaturate(1)
          .desaturate(desaturation)
          // .brighten(sparkle)
          .brighten(fade);
        // .brighten(i ** 1 / nFrames ** 1);
      }
    }
    let frame = new Frame(leds);
    frames.push(frame);
  }

  for (let i = 0; i < nBufferFrames; i++) {
    frames.push(new Frame(Array(nLeds).fill(black)));
  }

  const duration = Math.round(frames.length / fps);

  let movie = new Movie({
    frames,
    fps,
    name: `fairy_${fps}fps_${duration}s`,
    descriptor_type: type + '_raw'
  });

  return movie;
}

function reorderArray(array) {
  // Ensure the array has an even length
  if (array.length % 2 !== 0) {
    throw new Error("Array length must be even");
  }

  // Calculate the middle index
  let middleIndex = array.length / 2;

  // Split and reverse the first half of the array
  let firstHalf = array.slice(0, middleIndex).reverse();

  // Extract the second half of the array
  let secondHalf = array.slice(middleIndex);

  // Concatenate the two halves
  return firstHalf.concat(secondHalf);
}
