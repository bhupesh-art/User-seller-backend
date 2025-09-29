import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();


//!getting all categories
router.get("/", async (req, res) => {
    try {
        const categories = await prisma.category.findMany({});
        // res.json(categories); 

        //! build a object and initilaising children array for each 
        const map = Object.create(null);
        for (const category of categories) {
            map[category.cId] = { ...category, children: [] };
        }

        //! add inside children after checking each object one by one
        const roots = [];
        for (const id of Object.keys(map)) {
            const node = map[id];
            if (node.parentId && map[node.parentId]) {
                map[node.parentId].children.push(node);
            } else {
                // either parentId is null or parent wasn't fetched => treat as root
                roots.push(node);
            }
        }

        res.json(roots);

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

//!deleting an category
router.delete("/delete/:id", async (req, res) => {
    try {
        const { id } = req.params;

        //check whether it exists
        const category = await prisma.category.findUnique({
            where: { cId: id }
        });

        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        const deleted = await prisma.category.delete({
            where: { cId: id }
        })

        res.json({
            message: "Category deleted successfully",
            deleted,
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Internal server error" });
    }
})

//!creating an category
router.post("/create", async (req, res) => {
    const { name, parentId } = req.body;

    if (!name || name.trim() === "") {
        return res.status(400).json({ message: "Name is required" });
    }

    const createdCategory = await prisma.category.create({
        data: {
            name: name.trim(),
            parentId: parentId ?? null
        }
    })

    res.status(201).json({ message: "Category created successfully", createdCategory })
})

//!updating an category
router.patch("/update/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { name, parentId } = req.body;
        const updates = {};

        if (Number.isNaN(id)) {
            return res.status(400).json({ message: "invalid category" });
        }

        const category = await prisma.category.findUnique({
            where: { cId: id }
        })

        if (!category) {
            return res.status(400).json({ message: "category doesnt exists" });
        }

        if (!name && !parentId) {
            return res.status(400).json({ message: "no fields to update" });
        }

        if (name != undefined) {
            updates.name = name;
        }
        if (parentId != undefined) {
            updates.parentId = parentId;
        }

        const updatedCategory = await prisma.category.update({
            where: { cId: id },
            data: updates
        })

        res.status(200).json({ message: "Category updated successfully", updatedCategory });


    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Internal server error" });
    }
})

export default router;
