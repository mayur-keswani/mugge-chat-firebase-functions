import { Request, Response } from "firebase-functions";
import axios from "axios";
import * as crypto from "node:crypto";
import * as jwt from "jsonwebtoken";

const CREATE_USER_MUTATION = `mutation createUser($email: String!, $password_hash: String, $username: String) {
  insert_users_one(object: {email: $email, role_type: user, password_hash: $password_hash, username: $username}) {
    id
    email
    role_type
    username
  }
}`;

function hashPassword(password: string) {
  const hash = crypto.createHash("sha256");
  hash.update(password);
  return hash.digest("hex");
}

export const registerHandler = async (request: Request, response: Response) => {
  try {
    const { email, password, username } = request.body?.input?.credentials;;

    // Hash the password
    const password_hash = hashPassword(password); //hashPassword(password)//crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");

    const HASURA_URL = process.env.HASURA_URL!; //`http://localhost:8080/v1/graphql`;

    const { data } = await axios.post(
      HASURA_URL,
      {
        query: CREATE_USER_MUTATION,
        variables: { email, password_hash, username },
      },
      {
        headers: {
          "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET,
        },
      }
    );
    if (data?.errors) {
      console.log({ error: data.errors });
      throw new Error("Something went wrong!");
    }

    let user = data?.data?.insert_users_one ?? {};
    const secret = process.env.AUTH_JWT_SECRET!;
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        username: user.username,
        "https://hasura.io/jwt/claims": {
          "x-hasura-default-role": user.role_type,
          "x-hasura-allowed-roles": ["user", "superuser"],
          "x-hasura-user-id": user.id,
        },
      },
      secret,
      { algorithm: "HS256" }
    );

    response.status(200).send({
      accessToken,
      userId: user.id,
      email: user.email,
      username: user.username,
      roleType:user.role_type
    });
  } catch (error: any) {
    console.log({error})
    response.status(500).send({ message: `Message: ${error.message}` });
  }
};
