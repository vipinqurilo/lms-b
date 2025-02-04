const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadMediaToCloudinary = async (fileBuffer, fileType = "image") => {
  try {
  
    const resourceType = fileType === "video" ? "video" : "image"; // Set resource type

    const uploadFromBuffer = (buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "luxe",
            resource_type: resourceType, 
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
        streamifier.createReadStream(buffer).pipe(stream);
      });
    };

    const result = await uploadFromBuffer(fileBuffer.buffer);
    return result.url;
  } catch (error) {
    console.error("Error uploading media to Cloudinary:", error);
    throw new Error("Failed to upload media to Cloudinary");
  }
};

module.exports = { uploadMediaToCloudinary };
