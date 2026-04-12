import { addDiscount, addItemsToProduct, createProduct, deleteProduct, getProductByName, getProducts, removeDiscount, removeItemFromProduct, updateItemInProduct, updateProduct } from '@/Controller/product.controller';
import { adminProtect } from '@/Middleware/adminProtect';
import express, { Express } from 'express';

const ProductRouter = express.Router();

ProductRouter.get('/', getProducts);
ProductRouter.get('/:name', getProductByName);

// Admin routes
ProductRouter.post('/add', adminProtect, createProduct);
ProductRouter.patch('/update/:id', adminProtect, updateProduct);
ProductRouter.patch('/add/discount/:id', adminProtect, addDiscount);
ProductRouter.patch('/remove/discount/:id', adminProtect, removeDiscount);
ProductRouter.post('/add/item/:productId', adminProtect, addItemsToProduct);
ProductRouter.patch('/update/item/:itemId', adminProtect, updateItemInProduct);
ProductRouter.delete('/delete/item/:itemId', adminProtect, removeItemFromProduct);
ProductRouter.delete('/delete/:id', adminProtect, deleteProduct);


export default ProductRouter;