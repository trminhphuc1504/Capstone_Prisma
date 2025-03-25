import express from "express";
import jwt, { decode } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const app = express();
app.use(express.json());

const prisma = new PrismaClient();

// API đăng ký người dùng
app.post("/register-capstone", async (req, res) => {
    const { email, mat_khau, ho_ten, tuoi } = req.body;
    const hashedPassword = await bcrypt.hash(mat_khau, 10); // Mã hóa mật khẩu
    const user = await prisma.nguoi_dung.create({
        data: { email, mat_khau: hashedPassword, ho_ten, tuoi },
    });
    res.json(user); // Trả về dữ liệu người dùng đã đăng ký
});

// API đăng nhập người dùng
app.post("/login-capstone", async (req, res) => {
    const { email, mat_khau } = req.body;
    const user = await prisma.nguoi_dung.findUnique({
        where: { email },
    });
    if (!user || !(await bcrypt.compare(mat_khau, user.mat_khau))) {
        return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign({ userId: user.nguoi_dung_id }, "secretkey", {
        // Tạo JWT
        expiresIn: "1h",
    });
    res.json({ token });
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

//API lấy danh sách ảnh
app.get("/images-capstone", async (req, res) => {
    const images = await prisma.hinh_anh.findMany(); // Lấy tất cả hình ảnh
    res.json(images);
});

//API lấy danh sách ảnh
app.get("/images-capstone/search", async (req, res) => {
    const { ten_hinh } = req.query; // lấy tên hình ảnh từ query string
    const images = await prisma.hinh_anh.findMany({
        where: { ten_hinh: { contains: ten_hinh } }, // tìm kiếm ảnh theo tên
    });
    res.json(images);
});

//API chi tiết ảnh theo ID
app.get("/image-capstone/:id", async (req, res) => {
    const { id } = req.params;
    const image = await prisma.hinh_anh.findUnique({
        where: { hinh_id: parseInt(id) }, // Tìm ảnh theo ID
        include: { nguoi_dung: true }, // Lấy thông tin người tạo ảnh
    });
    res.json(image);
});

//API thêm bình luận
app.post("/comment-capstone/:id", verifyToken, async (req, res) => {
    const { id } = req.params;
    const { noi_dung } = req.body;
    const comment = await prisma.binh_luan.create({
        data: {
            nguoi_dung_id: req.user.userId, // Lấy ID người dùng từ token
            hinh_id: parseInt(id),
            ngay_binh_luan:: new Date(),
            noi_dung,
        }
    });
    res.json(comment)
});

//Khởi chạy server
app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
