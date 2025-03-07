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

const uploadPDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Convert buffer to base64 string for Cloudinary upload
    const fileStr = `data:application/pdf;base64,${req.file.buffer.toString('base64')}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(fileStr, {
      resource_type: 'raw', // Ensure it's handled as a file, not an image
      folder: 'luxe',
    });

    res.status(200).json({
      message: 'File uploaded successfully',
      url: result.secure_url, // Cloudinary file URL
      public_id: result.public_id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}



module.exports = { uploadMediaToCloudinary,uploadPDF };
