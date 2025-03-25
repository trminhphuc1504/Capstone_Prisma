import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const app = express();
app.use(express.json());

const prisma = new PrismaClient();

//API đăng ký người dùng
app.post("/register", async (req, res) => {
    const { email, mat_khau, ho_ten, tuoi } = req.body;
    const hashedPassword = await bcrypt.hash(mat_khau, 10); // Mã hóa mật khẩu
    const user = await prisma.nguoi_dung.create({
        data: { email, mat_khau: hashedPassword, ho_ten, tuoi },
    });
    res.json(user); // trả về dữ liệu người dùng đã đăng ký
});

//Middleware để kiểm tra token Jwt
const verifyToken = (req, res, next) => {
    const token = req.headers["authorization"];
    if (!token) return res.status(403).send("Access denied.");
};
