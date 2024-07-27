

// The Firebase Admin SDK to access Firestore.
const { initializeApp } = require("firebase-admin/app");
require('dotenv').config();
initializeApp();

import { onRequest } from "firebase-functions/v1/https";
import { registerHandler } from "./register";
import { healthcheckHandler } from "./healthcheck";
import { loginHandler } from "./login";
import { uploadHandler } from "./upload";


export const healthcheck = onRequest(healthcheckHandler);
export const register = onRequest(registerHandler);
export const login = onRequest(loginHandler)
export const upload = onRequest(uploadHandler)