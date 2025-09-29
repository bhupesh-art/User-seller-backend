import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

router.get("/item/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const product = await prisma.product.findUnique({
            where: { pId: id },
            include: { productCategories: { include: { category: true } } }
        });

        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        const cleanData = {
            pId: product.pId,
            name: product.name,
            description: product.description,
            price: product.price,
            image: product.image,
            categories: product.productCategories.map(pc => ({
                cId: pc.category.cId,
                name: pc.category.name,
                parentId: pc.category.parentId
            })
            )
        }

        res.status(200).json({ product: cleanData });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Internal server error" });
    }
})

// TODO  : if one fails , second should not happen !    
// //?done

router.post("/create", async (req, res) => {
    try {
        const { name, description, price, image, categoryIds } = req.body;

        if (!name || !price || !categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
            return res.status(400).json({ message: "Missing product information" });
        }

        const result = await prisma.$transaction(async (prisma) => {
            const created = await prisma.product.create({
                data: {
                    name,
                    description: description ?? "",
                    price,
                    image: image ?? null,
                },
            });

            const CategoryEntries = categoryIds.map((categoryId) => (
                {
                    productId: created.pId,
                    categoryId
                }
            ))

            const productCategoryEntry = await prisma.productCategory.createMany({
                data: CategoryEntries
            });

            return created;
        })

        res.status(201).json({ message: "Product created successfully", createdProduct: result });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/all", async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            include: {
                productCategories: {
                    include: { category: true }
                }
            }
        });
        const cleanProducts = products.map(product => ({
            pId: product.pId,
            name: product.name,
            description: product.description,
            price: product.price,
            image: product.image,
            categories: product.productCategories.map(pc => ({
                cId: pc.category.cId,
                name: pc.category.name,
                parentId: pc.category.parentId
            }))
        }));
        res.json({ products: cleanProducts });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Internal server error" });
    }
})

router.get("/getCategories/:id", async (req, res) => {
    try {

        const { id } = req.params;

        const results = await prisma.productCategory.findMany({
            where: { productId: id },
            include: { category: true }
        });

        const categoriesForProduct = results.map((prodCategory) => (prodCategory.category.name));

        res.json({ categoriesForProduct });

    } catch (err) {

    }
})

router.delete("/delete/:id", async (req, res) => {
    try {
        const { id } = req.params;

        //check whether it exists
        const product = await prisma.product.findUnique({
            where: { pId: id }
        });

        if (!product) {
            return res.status(404).json({ message: "product not found" });
        }

        const deleted = await prisma.product.delete({
            where: { pId: id }
        })

        res.json({
            message: "Product deleted successfully",
            deleted,
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Internal server error" });
    }
})


router.patch("/update/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // if (Number.isNaN(parseInt(id))) {
        //     return res.status(400).json({ error: "Invalid product id" });
        // };

        const product = await prisma.product.findUnique({
            where: { pId: id }
        });

        if (!product) {
            return res.status(404).json({ error: "Product not found to update" });
        }

        const { name, description, price, image, removeCategoryIds = [], addCategoryIds = [] } = req.body;
        const updatesToMake = {};


        //! validation 
        if (name !== undefined) {
            updatesToMake.name = name;
        }
        if (description != undefined) {
            updatesToMake.description = description;
        }
        if (price !== undefined) {

            if (price < 0) {
                return res.status(400).json({ error: " Invalid Price : item price cannot be less than 0" });
            }

            if (Number.isNaN(parseFloat(price))) {
                return res.status(400).json({ error: " Invalid Price : item price must be a number" });
            }

            updatesToMake.price = price;
        }

        if (image) {
            updatesToMake.image = image;
        }

        await prisma.$transaction(async (atomicTransaction) => {

            if (Object.keys(updatesToMake).length > 0) {
                const updated = await atomicTransaction.product.update({
                    where: { pId: id },
                    data: updatesToMake,
                });
            }

            if (removeCategoryIds.length > 0) {
                await atomicTransaction.productCategory.deleteMany({
                    where: { categoryId: { in: removeCategoryIds }, productId: id }
                })
            }

            if (addCategoryIds.length > 0) {
                const addCategory = addCategoryIds.map((cid) => (
                    {
                        productId: id,
                        categoryId: cid
                    }
                ))

                const created = await atomicTransaction.productCategory.createMany({
                    data: addCategory,
                    skipDuplicates: true
                })
            }
        })

        const productWithCategories = await prisma.product.findMany({
            where: { pId: id },
            include: { productCategories: { include: { category: true } } }
        })

        res.status(200).json(productWithCategories);


    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
