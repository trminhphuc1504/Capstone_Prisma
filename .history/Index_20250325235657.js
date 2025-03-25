import express from "express";
import jwt, { decode } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const app = express();
app.use(express.json());

const prisma = new PrismaClient();

//API đăng ký người dùng
app.post("/register-prisma", async (req, res) => {
    const { email, mat_khau, ho_ten, tuoi } = req.body;
    const hashedPassword = await bcrypt.hash(mat_khau, 10); // Mã hóa mật khẩu
    const user = await prisma.nguoi_dung.create({
        data: { email, mat_khau: hashedPassword, ho_ten, tuoi },
    });
    res.json(user); // trả về dữ liệu người dùng đã đăng ký
});

//API đăng nhập người dùng
app.post("/login-prisma", async (req, res) => {
    const { email, mat_khau } = req.body;
    const user = await prisma.nguoi_dung.findUnique({
        where: { email },
    });
    if (!user || !(await bcrypt.compare(mat_khau, user.mat_khau))) {
        return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign({ userId: user.nguoi_dung_id }, "secretkey", {
        // Tạo jwt
        expiresIn: "1h"

});

//Middleware để kiểm tra token Jwt
const verifyToken = (req, res, next) => {
    const token = req.headers["authorization"];
    if (!token) return res.status(403).send("Access denied.");
    jwt.verify(token, "secretkey", (err, decoded) => {
        if (err) return res.status(403).send("Invalid token.");
        req.user = decoded; // Lưu thông tin người dùng vào req.user
        next();
    });
};
