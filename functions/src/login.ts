import { Request, Response } from "firebase-functions";
import axios from "axios";
import * as crypto from "node:crypto";
import * as jwt from "jsonwebtoken";
// require('dotenv').config()



const GET_USER_QUERY = `query getUser($email: String!) {
  users(where: {email: {_eq: $email}}) {
    email
    id
    role_type
    username
    password_hash
  }
}`;

function hashPassword(password: string) {
  const hash = crypto.createHash("sha256");
  hash.update(password);
  return hash.digest("hex");
}

export const loginHandler = async (request: Request, response: Response) => {
  try {
    const { email, password } = request.body?.input?.credentials;
    const HASURA_URL = process.env.HASURA_URL!;
  
    const { data } = await axios.post(
      HASURA_URL,
      {
        query: GET_USER_QUERY,
        variables: { email },
      },
      {
        headers: {
          "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET,
        },
      }
    );

    if (data?.errors) {
      console.log(data.errors);
      throw new Error("Something went wrong!");
    }

    if (data?.data?.users.length === 0) {
      response.status(401).send({ message: `Invalid email or password` });
    }
    const user = data.data.users[0];

    // Compare the provided password with the hashed password
    const hash = hashPassword(password);

    if (hash !== user.password_hash) {
      response.status(401).send({ message: "Invalid email or password" });
    }
    
    const secret= process.env.JWT_SECRET!;
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        username: user.username,
        "https://hasura.io/jwt/claims": {
          "x-hasura-default-role": user.role_type,
          "x-hasura-allowed-roles": ["user", "superuser"],
          "x-hasura-user-id": user.id,
        }
      },
      secret,
      { algorithm: "HS256" }
    );

    response.status(200).send({
      accessToken,
      userId:user.id,
      email:user.email,
      roleType:user.role_type,
      username: user.username
    });
  } catch (error: any) {
    // console.log(error)
    response.status(500).send({ message: error.message });
  }
};
