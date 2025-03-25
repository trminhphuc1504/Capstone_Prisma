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

    // Tách "Bearer " ra khỏi token
    const tokenWithoutBearer = token.split(" ")[1];

    jwt.verify(tokenWithoutBearer, "secretkey", (err, decoded) => {
        if (err) return res.status(403).send("Invalid token.");
        req.user = decoded;
        next();
    });
};

// API lấy danh sách ảnh
app.get("/images", async (req, res) => {
    const images = await prisma.hinh_anh.findMany(); // Lấy tất cả hình ảnh
    res.json(images);
});

// API tìm kiếm ảnh theo tên
app.get("/images/search", async (req, res) => {
    const { ten_hinh } = req.query; // Lấy tên hình ảnh từ query string
    const images = await prisma.hinh_anh.findMany({
        where: { ten_hinh: { contains: ten_hinh } }, // Tìm kiếm ảnh theo tên
    });
    res.json(images);
});

// API chi tiết ảnh theo ID
app.get("/image/:id", async (req, res) => {
    const { id } = req.params;
    const image = await prisma.hinh_anh.findUnique({
        where: { hinh_id: parseInt(id) }, // Tìm ảnh theo ID
        include: { nguoi_dung: true }, // Lấy thông tin người tạo ảnh
    });
    res.json(image);
});

// API chi tiết ảnh theo ID và thông tin người tạo ảnh
app.get("/image/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const image = await prisma.hinh_anh.findUnique({
            where: { hinh_id: parseInt(id) }, // Tìm ảnh theo ID
            include: { nguoi_dung: true }, // Lấy thông tin người tạo ảnh
        });
        if (!image) return res.status(404).json({ message: "Image not found" });
        res.json(image);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// API lấy thông tin bình luận theo ID ảnh
app.get("/image/:id/comments", async (req, res) => {
    const { id } = req.params;
    try {
        const comments = await prisma.binh_luan.findMany({
            where: { hinh_id: parseInt(id) }, // Lấy bình luận theo ID ảnh
            include: { nguoi_dung: true }, // Lấy thông tin người bình luận
        });
        res.json(comments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// API thêm bình luận
app.post("/comment/:id", verifyToken, async (req, res) => {
    const { id } = req.params;
    const { noi_dung } = req.body;
    const comment = await prisma.binh_luan.create({
        data: {
            nguoi_dung_id: req.user.userId, // Lấy ID người dùng từ token
            hinh_id: parseInt(id),
            ngay_binh_luan: new Date(),
            noi_dung,
        },
    });
    res.json(comment);
});

// API lưu ảnh
app.post("/save-image/:id", verifyToken, async (req, res) => {
    const { id } = req.params;
    const savedImage = await prisma.luu_anh.create({
        data: {
            nguoi_dung_id: req.user.userId,
            hinh_id: parseInt(id),
            ngay_luu: new Date(),
        },
    });
    res.json(savedImage);
});

// API kiểm tra xem người dùng đã lưu ảnh này chưa
app.get("/image/:id/saved", verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        const savedImage = await prisma.luu_anh.findUnique({
            where: {
                nguoi_dung_id_hinh_id: {
                    nguoi_dung_id: req.user.userId, // Lấy ID người dùng từ token
                    hinh_id: parseInt(id),
                },
            },
        });

        if (savedImage) {
            res.json({ saved: true });
        } else {
            res.json({ saved: false });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// API lấy thông tin người dùng
app.get("/user", verifyToken, async (req, res) => {
    const user = await prisma.nguoi_dung.findUnique({
        where: { nguoi_dung_id: req.user.userId },
    });
    res.json(user);
});

// API lấy danh sách ảnh đã lưu của người dùng
app.get("/user/saved-images", verifyToken, async (req, res) => {
    const savedImages = await prisma.luu_anh.findMany({
        where: { nguoi_dung_id: req.user.userId },
        include: { hinh_anh: true },
    });
    res.json(savedImages);
});

// API xóa ảnh đã tạo
app.delete("/image/:id", verifyToken, async (req, res) => {
    const { id } = req.params;
    const image = await prisma.hinh_anh.delete({
        where: { hinh_id: parseInt(id) },
    });
    res.json(image);
});

// API thêm ảnh mới
app.post("/add-image", verifyToken, async (req, res) => {
    const { ten_hinh, duong_dan, mo_ta } = req.body;
    const image = await prisma.hinh_anh.create({
        data: {
            ten_hinh,
            duong_dan,
            mo_ta,
            nguoi_dung_id: req.user.userId,
        },
    });
    res.json(image);
});

// API cập nhật thông tin cá nhân
app.put("/user", verifyToken, async (req, res) => {
    const { ho_ten, tuoi, anh_dai_dien } = req.body;
    const user = await prisma.nguoi_dung.update({
        where: { nguoi_dung_id: req.user.userId },
        data: { ho_ten, tuoi, anh_dai_dien },
    });
    res.json(user);
});

//Khởi chạy server
app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
