// coudinary pe final upload krny k jo production industry methond ha us ma hm multer k through phaly file ko apny local server pe rakhty hn us k bad vo local file hum cloudinary k pe upoad krva lety hn
// ya ka utlity function ha is ma hum local file ko jo k hmary server pe upload ho gi us ko len gy or us ko hm cloundiary pe upload krva den gy
import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  // CLOUDINARY_API_SECRECT is retained temporarily for compatibility with the
  // existing .env file. Rename it to CLOUDINARY_API_SECRET when convenient.
  api_secret:
    process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRECT,
};

cloudinary.config({
  ...cloudinaryConfig,
});

const uploadOnCloudinary = async (localFilePath) => { // local file jo k hmary local server pe upload ho gi
  if (!localFilePath) return null;

  try {
    const missingConfig = Object.entries(cloudinaryConfig)
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missingConfig.length) {
      throw new Error(`Cloudinary configuration is missing: ${missingConfig.join(", ")}`);
    }

    const response = await cloudinary.uploader.upload(localFilePath , { resource_type : "auto"  // mean kiya ara ha image , video , auto autmatecally detect

     })
    // console.log('file is Uploaded on cloudinary ' ,  response.url ); // log the URL of the uploaded file

    return response
   
  } catch (error) {
    console.error("Cloudinary upload failed:", {
      message: error.message,
      httpCode: error.http_code,
      cloudinaryMessage: error.error?.message,
    });
    throw error;
  } finally {
    if (fs.existsSync(localFilePath)) {
      await fs.promises.unlink(localFilePath);
    }
  }
}  

// this is used to upload file on cloudinary


export {uploadOnCloudinary}



