// Simple video duration getter without ffmpeg dependency
const getVideoDuration = async (videoPath) => {
  try {
    // Return a default duration or handle it in your frontend
    return 0;
  } catch (error) {
    console.error('Error:', error);
    return 0;
  }
};

module.exports = {
  getVideoDuration
};