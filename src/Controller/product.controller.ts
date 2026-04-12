import { Request, Response, NextFunction } from "express";
import { prisma } from "../Lib/PrismaClient";
import { z } from "zod";

// Define Zod schema for product creation
const itemSchema = z.object({
    name: z.string().min(1, "Product name is required"),
    price: z.number().positive("Price must be a positive number"),
})

const createProductSchema = z.object({
    name: z.string().min(1, "Product name is required"),
    description: z.string().optional(),
    items: z.array(itemSchema).optional(),
    imageUrl: z.string().optional(),
});

// Get all products (public)
export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const products = await prisma.product.findMany({
            include: {
                items: true,
            },
        });
        res.json(products);
    } catch (error) {
       return res.status(500).json({ message: "Failed to fetch products", error: (error as Error).message });
    }
};

// Get a single product by name (public)
export const getProductByName = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name } = req.params;
        const product = await prisma.product.findFirst({
            where: { name: name as string },
            include: {
                items: true,
            },
        });
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.json(product);
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch product", error: (error as Error).message });
    }
};

// Create a new product (admin only)
export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Validate request body
        const { name, description, items, imageUrl } = createProductSchema.parse(req.body);

        // check if product with the same name already exists
        const existingProduct = await prisma.product.findFirst({
            where: { name: name as string },
        });
        if (existingProduct) {
            return res.status(400).json({ message: "Product with this name already exists" });
        };

        // Create product
        const product = await prisma.product.create({
            data: {
                name,
                description: description || "",
                imageUrl: imageUrl || "",
                userId: (req as any).user?.id,
                items: items ? {
                    create: items.map(item => ({
                        name: item.name,
                        price: item.price,
                    })),
                } : undefined,
            },
            include: {
                items: true,
            },
        });

        res.status(201).json(product);
    } catch (error) {
        return res.status(500).json({ message: "Failed to create product", error: (error as Error).message });
    }
};

// Update a product (admin only)
export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { name, description, items, imageUrl } = createProductSchema.parse(req.body);

        // check if product exists
        const existingProduct = await prisma.product.findUnique({
            where: { id: id as string },
        });
        if (!existingProduct) {
            return res.status(404).json({ message: "Product not found" });
        };

        // Update product
        const updatedProduct = await prisma.product.update({
            where: { id: id as string },
            data: {
                name,
                description: description || existingProduct.description,
                imageUrl: imageUrl || existingProduct.imageUrl,
                items: items ? {
                    deleteMany: {}, // delete existing items
                    create: items.map(item => ({
                        name: item.name,
                        price: item.price,
                    })),
                } : undefined,
            },
            include: {
                items: true,
            },
        });

        res.json({ message: "Product updated successfully", product: updatedProduct });
    } catch (error) {
        return res.status(500).json({ message: "Failed to update product", error: (error as Error).message });
    }
};

// Add discount to a product or items (admin only)
export const addDiscount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { discountPercentage } = z.object({ discountPercentage: z.number().positive().max(100) }).parse(req.body);
        
        // check if product exists
        const existingProduct = await prisma.product.findUnique({
            where: { id: id as string },
            include: {
                items: true,
            },
        });
        if (!existingProduct) {
            return res.status(404).json({ message: "Product not found" });
        };

        // Calculate discounted price for product
        const discountedProductPrice = existingProduct.price ? existingProduct.price * (1 - discountPercentage / 100) : null;

        // Save original price if not already saved
        if (existingProduct.items.length >= 0) {
            await prisma.product.update({
                where: { id: id as string },
                data: {
                    ogPrice: existingProduct.ogPrice || existingProduct.price,
                    price: discountedProductPrice,
                },
            });
        } else {
            await Promise.all(existingProduct.items.map(item =>
                prisma.item.update({
                    where: { id: item.id },
                    data: {
                        ogPrice: item.ogPrice || item.price,
                        price: item.price * (1 - discountPercentage / 100),
                    },
                })
            ));
        };

        res.json({ message: "Discount applied successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Failed to add discount", error: (error as Error).message });
    }
};

// Remove discount from a product or items (admin only)
export const removeDiscount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        // check if product exists
        const existingProduct = await prisma.product.findUnique({
            where: { id: id as string },
            include: {
                items: true,
            },
        });
        if (!existingProduct) {
            return res.status(404).json({ message: "Product not found" });
        };

        // Remove discount by restoring original price
        if (existingProduct.items.length >= 0) {
            await prisma.product.update({
                where: { id: id as string },
                data: {
                    price: existingProduct.ogPrice,
                    ogPrice: null,
                },
            });
        } else {
            await Promise.all(existingProduct.items.map(item =>
                prisma.item.update({
                    where: { id: item.id },
                    data: {
                        price: item.ogPrice || item.price,
                        ogPrice: null,
                    },
                })
            ));
        };

        res.json({ message: "Discount removed successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Failed to remove discount", error: (error as Error).message });
    }
};

// Add more items to a product (admin only)
export const addItemsToProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { items } = z.object({ items: z.array(itemSchema) }).parse(req.body);

        // check if product exists
        const existingProduct = await prisma.product.findUnique({
            where: { id: id as string },
        });
        if (!existingProduct) {
            return res.status(404).json({ message: "Product not found" });
        };

        // Add new items to product
        const updatedProduct = await prisma.product.update({
            where: { id: id as string },
            data: {
                items: {
                    create: items.map(item => ({
                        name: item.name,
                        price: item.price,
                    })),
                },
            },
            include: {
                items: true,
            },
        });

        res.json({ message: "Items added successfully", product: updatedProduct });
    } catch (error) {
        return res.status(500).json({ message: "Failed to add items", error: (error as Error).message });
    }
};

// Update an item in a product (admin only)
export const updateItemInProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { productId, itemId } = req.params;
        const { name, price } = itemSchema.parse(req.body);

        // check if product exists
        const existingProduct = await prisma.product.findUnique({
            where: { id: productId as string },
        });
        if (!existingProduct) {
            return res.status(404).json({ message: "Product not found" });
        };

        // check if item exists
        const existingItem = await prisma.item.findUnique({
            where: { id: itemId as string },
        });
        if (!existingItem) {
            return res.status(404).json({ message: "Item not found" });
        };
        
        // Update item
        const updatedItem = await prisma.item.update({
            where: { id: itemId as string },
            data: {
                name,
                price,
            },
        });

        res.json({ message: "Item updated successfully", item: updatedItem });
    } catch (error) {
        return res.status(500).json({ message: "Failed to update item", error: (error as Error).message });
    }
};

// Remove an item from a product (admin only)
export const removeItemFromProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { productId, itemId } = req.params;

        // check if product exists
        const existingProduct = await prisma.product.findUnique({
            where: { id: productId as string },
        });
        if (!existingProduct) {
            return res.status(404).json({ message: "Product not found" });
        };

        // check if item exists
        const existingItem = await prisma.item.findUnique({
            where: { id: itemId as string },
        });
        if (!existingItem) {
            return res.status(404).json({ message: "Item not found" });
        };

        // Remove item from product
        await prisma.item.delete({
            where: { id: itemId as string },
        });

        res.json({ message: "Item removed successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Failed to remove item", error: (error as Error).message });
    }
};

// Delete a product (admin only)
export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        // check if product exists
        const existingProduct = await prisma.product.findUnique({
            where: { id: id as string },
        });
        if (!existingProduct) {
            return res.status(404).json({ message: "Product not found" });
        };

        await prisma.product.delete({
            where: { id: id as string },
        });

        res.json({ message: "Product deleted successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Failed to delete product", error: (error as Error).message });
    }
};
