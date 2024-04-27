import { v2 as cloudinary } from "cloudinary"
import { log } from "console"

import fs from "fs"

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})

const uploadonCloudinary=async (localfilepath)=>{
    try {
        if(!localfilepath)return null
        // upload the file on cloudinary
        const response=await cloudinary.uploader.upload(localfilepath,{
            resource_type:"auto"
        })
        // file has been uploaded successsfully
        console.log('file is uploaded on cloudinary',
        response.url);
        return response;

    } catch (error) {
        fs.unlinkSync(localfilepath) // remove the locally saved temporary file has the upload operation got failed
        return null;
    }
}
export {uploadonCloudinary}