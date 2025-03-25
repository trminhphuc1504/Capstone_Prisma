import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const app = express();
app.use(express.json());

const prisma = new PrismaClient();


//API đăng ký người dùng
app.post("/register",async (req,res) =>{
    const {email , mat_khau,ho_ten, tuoi}
})