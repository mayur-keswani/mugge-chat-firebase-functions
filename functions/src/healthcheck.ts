import { Request, Response } from "firebase-functions";

export const healthcheckHandler = async (request: Request, response: Response) => {
  response.send("Hello from Firebase!");
};
