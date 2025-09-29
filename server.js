import express from "express";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import CategoryRouter from "./Router/CategoryRouter.js"
import ProductRouter from "./Router/ProductRouter.js"
import cors from "cors";

dotenv.config();
const app = express();

// global middlewares
app.use(cors(
));
app.use(express.json());

const PORT = process.env.PORT || 5000;
const DATABASE_URL = process.env.DATABASE_URL;
const prisma = new PrismaClient();

app.get("/", (req, res) => {
    res.send('app is running');
})

app.use("/api/category", CategoryRouter);
app.use("/api/product", ProductRouter)
app.post("/api/test", (req, res) => {
    let data = req.body;
    if (data === undefined) {
        // data = JSON.stringify(data);
        console.log("no data received from telegram , data :", data);
        return res.status(400).json({ message: "no data found" });
    }
    console.log(`data recieved from telegram :`, JSON.stringify(data));
    res.status(200).json({ message: "data received", data: data });
})

process.on("SIGINT", async () => {
    await prisma.$disconnect();
    process.exit(0);
});

// app.listen(PORT, () => {
//     console.log(`server is running at port ${PORT}`);
// });
