import { Router } from 'express';
import pool from '../database.js';
import bcrypt from 'bcryptjs';

export const usersRouter = Router();

usersRouter.post("/register", async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const emailExists = await pool.query('SELECT * FROM "User" WHERE email = $1', [email]);
        if (emailExists.rows.length != 0) {
            return res.status(400).json({ error: "email already exists" });
        }

        const usernameExists = await pool.query('SELECT * FROM "User" WHERE username = $1', [username]);
        if (usernameExists.rows.length != 0) {
            return res.status(400).json({ error: "username already exists " });
        }

        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);
        await pool.query('INSERT INTO "User" (email, username, password) VALUES ($1, $2, $3)',
            [email, username, hashedPassword]
        );

        return res.status(200).json();
    } catch (error) {
        console.error(error);
        return res.status(500);
    }
})

usersRouter.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await pool.query('SELECT * FROM "User" WHERE email = $1', [email]);
        if (user.rows.length === 0) {
            return res.status(400).json({ error: "No such email" });
        };

        const hashedPassword = user.rows[0].password;
        const isSame = await bcrypt.compare(password, hashedPassword);
        if (!isSame) {
            return res.status(400).json({ error: "wrong password" });
        };

        return res.status(200).json({ id: user.rows[0].id, email: user.rows[0].email });
    } catch (error) {
        console.error(error);
        return res.status(500);
    }
});