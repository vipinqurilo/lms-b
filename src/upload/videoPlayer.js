const ffmpeg = require('fluent-ffmpeg');

// Function to get video duration
const getVideoDuration = (videoPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err); // Handle error
      } else {
        const durationInSeconds = metadata.format.duration;
        resolve(durationInSeconds);
      }
    });
  });
};

// Example Usage
const videoPath = './example.mp4'; // Replace with the actual path to your video

getVideoDuration(videoPath)
  .then((duration) => {
    console.log(`The video duration is ${duration.toFixed(2)} seconds.`);
  })
  .catch((error) => {
    console.error('Error fetching video duration:', error);
  });

module.exports = getVideoDuration