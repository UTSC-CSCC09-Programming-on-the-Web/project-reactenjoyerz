import crypto from "node:crypto";
import { validateString } from "./validateInput.js";
import { Token } from "../models/tokens.js";
import { User } from "../models/users.js";

const TOKEN_SIZE = 32;
const whiteList = [
  /^GET \/api\/users$/,
  /^GET \/api\/images\/[0-9]+\/image$/,
  /^POST \/api\/users\/signup$/,
  /^POST \/api\/users\/signin$/,
  /^GET \/api\/users\/[0-9]+\/images\/[?&=\-a-z0-9]+$/,
];
const tokenLifetime = 1000 * 60 * 60 * 24;

export async function createToken(userId) {
  const rawToken = new Uint8Array(TOKEN_SIZE);
  let token;

  while (true) {
    token = "";
    crypto.getRandomValues(rawToken);
    rawToken.forEach((v) => {
      v = v % 62;
      if (v < 10) v += 48;
      else if (v < 36) v += 55;
      else v += 61;

      token += String.fromCharCode(v);
    });

    // check for duplicate token
    const dup = await Token.findOne({
      where: { token },
    });

    if (dup === null) break;
  }

  const userEntry = await User.findByPk(userId);
  if (userEntry === null) return null;

  const tokenEntry = await Token.create({
    UserId: userId,
    token,
    expires: Date.now() + tokenLifetime,
  });

  userEntry.TokenId = tokenEntry.id;
  await userEntry.save();
  return token;
}

export const validateUser = async function (req, res, next) {
  if (!whiteList.some((rgx) => rgx.test(`${req.method} ${req.url}`))) {
    const header = req.get("authorization");
    if (!validateString(header))
      return res.status(401).json({ error: "Not Authenticated." });

    const token = header.split(" ")[1];
    if (!validateString(token))
      return res.status(401).json({ error: "Not Authenticated." });

    const tokenEntry = await Token.findOne({
      where: { token },
    });

    if (tokenEntry === null)
      return res.status(401).json({ error: "Not Authenticated." });
    else if (tokenEntry.expires <= Date.now()) {
      await tokenEntry.destroy();
      return res.status(401).json({ error: "Token Expired." });
    }

    req.token = tokenEntry.token;
    req.userId = tokenEntry.UserId;
  }

  next();
};
