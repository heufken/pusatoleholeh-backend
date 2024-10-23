import Product from '../models/product.js';
import ProductImage from '../models/productImage.js';
import ProductCover from '../models/productCover.js';
import Shop from '../models/shop.js';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { validationResult } from 'express-validator';
import { encodeFileName } from '../configs/crypto.js';
import { uploadPathCheck } from '../configs/fs.js';

export const createProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, description, price, stock, category } = req.body;
    const shop = await Shop.findOne({ ownerId: req.user._id });

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    const product = new Product({
      name,
      description,
      price,
      stock,
      category,
      shopId: shop._id,
    });

    await product.save();
    res.status(201).json({ message: 'Product created successfully', product });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const updateProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { productId } = req.params;
    const { name, description, price, stock, category } = req.body;
    const shop = await Shop.findOne({ ownerId: req.user._id });

    const product = await Product.findOne({ _id: productId, shopId: shop._id });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.stock = stock || product.stock;
    product.category = category || product.category;

    await product.save();
    res.status(200).json({ message: 'Product updated successfully', product });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const shop = await Shop.findOne({ ownerId: req.user._id });

    const product = await Product.findOne({ _id: productId, shopId: shop._id });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await Product.deleteOne({ _id: productId });
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const uploadProductImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image uploaded' });
  }

  try {
    const { productId } = req.params;
    const shop = await Shop.findOne({ ownerId: req.user._id });
    const product = await Product.findOne({ _id: productId, shopId: shop._id });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const existingImages = await ProductImage.find({ productId: product._id });
    const totalImages = existingImages.length + req.files.length;

    if (totalImages > 5) {
      return res.status(400).json({ message: 'Cannot upload more than 5 images for a product' });
    }

    const filename = encodeFileName(req.file.originalname, 'product');
    const uploadPath = path.join(process.env.PRODUCT_UPLOAD_PATH);
    uploadPathCheck(uploadPath);

    const outputPath = path.join(uploadPath, filename);

    await sharp(req.file.buffer).toFormat('webp').toFile(outputPath);

    const productImage = new ProductImage({
      name: req.file.originalname,
      path: outputPath,
      url: `${process.env.PRODUCT_UPLOAD_URL}/${filename}`,
      productId: product._id,
    });

    await productImage.save();
    res.status(200).json({ message: 'Product image uploaded successfully', productImage });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const deleteProductImage = async (req, res) => {
  try {
    const { productId } = req.params;
    const shop = await Shop.findOne({ ownerId: req.user._id });
    const product = await Product.findOne({ _id: productId, shopId: shop._id });

    const productImage = await ProductImage.findOne({ productId: product._id });
    if (!productImage) {
      return res.status(404).json({ message: 'Product image not found' });
    }

    if (fs.existsSync(productImage.path)) {
      fs.unlinkSync(productImage.path);
    }

    await ProductImage.deleteOne({ _id: productImage._id });
    res.status(200).json({ message: 'Product image deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const uploadProductCover = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No cover uploaded' });
  }

  try {
    const { productId } = req.params;
    const shop = await Shop.findOne({ ownerId: req.user._id });
    const product = await Product.findOne({ _id: productId, shopId: shop._id });

    const filename = encodeFileName(req.file.originalname, 'cover');
    const uploadPath = path.join(process.env.PRODUCT_UPLOAD_PATH);
    uploadPathCheck(uploadPath);

    const outputPath = path.join(uploadPath, filename);

    await sharp(req.file.buffer).toFormat('webp').toFile(outputPath);

    const productCover = new ProductCover({
      name: req.file.originalname,
      path: outputPath,
      url: `${process.env.PRODUCT_UPLOAD_URL}/${filename}`,
      productId: product._id,
    });

    await productCover.save();
    res.status(200).json({ message: 'Product cover uploaded successfully', productCover });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const updateProductCover = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No cover uploaded' });
  }

  try {
    const { productId } = req.params;
    const shop = await Shop.findOne({ ownerId: req.user._id });
    const product = await Product.findOne({ _id: productId, shopId: shop._id });

    const productCover = await ProductCover.findOne({ productId: product._id });
    if (!productCover) {
      return res.status(404).json({ message: 'Product cover not found' });
    }

    if (fs.existsSync(productCover.path)) {
      fs.unlinkSync(productCover.path);
    }

    const filename = encodeFileName(req.file.originalname, 'cover');
    const uploadPath = path.join(process.env.PRODUCT_UPLOAD_PATH);
    uploadPathCheck(uploadPath);

    const outputPath = path.join(uploadPath, filename);

    await sharp(req.file.buffer).toFormat('webp').toFile(outputPath);

    productCover.name = req.file.originalname;
    productCover.path = outputPath;
    productCover.url = `${process.env.PRODUCT_UPLOAD_URL}/${filename}`;
    await productCover.save();

    res.status(200).json({ message: 'Product cover updated successfully', productCover });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const deleteProductCover = async (req, res) => {
  try {
    const { productId } = req.params;
    const shop = await Shop.findOne({ ownerId: req.user._id });
    const product = await Product.findOne({ _id: productId, shopId: shop._id });

    const productCover = await ProductCover.findOne({ productId: product._id });
    if (!productCover) {
      return res.status(404).json({ message: 'Product cover not found' });
    }

    if (fs.existsSync(productCover.path)) {
      fs.unlinkSync(productCover.path);
    }

    await ProductCover.deleteOne({ _id: productCover._id });
    res.status(200).json({ message: 'Product cover deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
