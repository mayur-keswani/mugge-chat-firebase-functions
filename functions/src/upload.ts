import { Request, Response } from "firebase-functions";
const admin = require("firebase-admin");


export const uploadHandler = async (request: Request, response: Response) => {
  if (request.method !== "POST") {
    response.status(405).send("Method Not Allowed");
  }
  try {
    const { base64, filename,filetype } = request.body.input.attachment;
    const bucket = admin.storage().bucket();
    const base64EncodedImageString = base64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64EncodedImageString, "base64");
    const file = bucket.file(filename);
    
    await file.save(buffer, {
      metadata: {
        contentType: filetype, // Adjust this based on your image type
      },
    });
     // Make the file public
     await file.makePublic();

    // Generate the public URL
    const url = `https://storage.googleapis.com/${bucket.name}/${filename}`;
    
    response.status(200).send({
      filename,
      filetype,
      url
    });
  } catch (error: any) {
    console.log({ error });
    response.status(500).send({ message: `Message: ${error.message}` });
  }
};
