import User from '../models/user.js';
import UserImage from '../models/userImage.js';
import Address from '../models/address.js'
import { validationResult } from "express-validator";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { encodeFileName } from "../configs/crypto.js";
import { uploadPathCheck } from "../configs/fs.js";

export const updateUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const userId = req.user._id;
  const {
    name,
    phoneNumber,
  } = req.body;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Invalid User" });
    }

    user.name = name || user.name;
    user.phoneNumber = phoneNumber || user.phoneNumber;

    await user.save();

    res.status(200).json({ message: "User updated successfully", user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const uploadUserImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No image uploaded" });
  }

  const userId = req.user._id;

  try {
    const user = await User.findById(userId);

    const filename = encodeFileName(req.file.originalname, "user");
    const uploadPath = path.join(process.env.USER_UPLOAD_PATH);
    uploadPathCheck(uploadPath);

    const outputPath = path.join(uploadPath, filename);

    await sharp(req.file.buffer).toFormat("webp").toFile(outputPath);

    const userImage = new UserImage({
      name: req.file.originalname,
      path: outputPath,
      url: `${process.env.USER_UPLOAD_URL}/${filename}`,
      userId,
    });
    await userImage.save();

    res.status(200).json({ message: "Image uploaded successfully", userImage });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const updateUserImage = async (req, res) => {

  const userId = req.user._id

  if (!req.file) {
    return res.status(400).json({ message: "No image uploaded" });
  }

  try {
    const user = await User.findById(userId);

    const userImage = await UserImage.findOne(userId);
    if (!userImage)
      return res.status(404).json({ message: "User image not found." });

    if (fs.existsSync(userImage.path)) {
      fs.unlinkSync(userImage.path);
    }

    const filename = encodeFileName(req.file.originalname, "user");
    const uploadPath = path.join(process.env.USER_UPLOAD_PATH);
    uploadPathCheck(uploadPath);

    const outputPath = path.join(uploadPath, filename);

    await sharp(req.file.buffer).toFormat("webp").toFile(outputPath);

    userImage.name = req.file.originalname;
    userImage.path = outputPath;
    userImage.url = `${process.env.USER_UPLOAD_URL}/${filename}`;
    await userImage.save();

    res
      .status(200)
      .json({ message: "User image updated successfully", userImage });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const deleteUserImage = async (req, res) => {

  const userId = req.user._id

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const userImage = await UserImage.findOne({ userId });
    if (!userImage)
      return res.status(404).json({ message: "User image not found." });

    if (fs.existsSync(userImage.path)) {
      fs.unlinkSync(userImage.path);
    }

    await UserImage.deleteOne({ _id: userImage._id });

    res.status(200).json({ message: "User image deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getUser = async (req, res) => {
  
  const userId = req.user._id;

  try {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: "Invalid Token." });
    }

    const userImage = await UserImage.find({ userId: userId });

    res.status(200).json({
      user,
      image: userImage ? userImage.url : null,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getUserById = async (req, res) => {
  
  const { userId } = req.params;

  try {
    const user = await User.findById(userId).select('-password -email -_id -updatedAt');
    if (!user) {
      return res.status(404).json({ message: "User not Found" });
    }

    const userImage = await UserImage.find({ userId: userId });

    res.status(200).json({
      user,
      image: userImage ? userImage.url : null,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const addAddress = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const userId = req.user._id;
  const { name, province, city, district, subdistrict, postalCode } = req.body;

  try {
    const newAddress = new Address({ name, userId, province, city, district, subdistrict, postalCode })
    await newAddress.save();

    res.status(200).json({ message: "Address successfully added."});
  } catch (error) {
    res.status(500).json({ message: "Server error", error: err.message});
  }
};

export const updateAddress = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const userId = req.user._id;
  const { addressId } = req.params;
  const { name, province, city, district, subdistrict, postalCode } = req.body;

  try {
    const address = await Address.findOne({ _id: addressId, userId });

    if (!address) {
      return res.status(404).json({ message: "Address not found." });
    }

    address.name = name || address.name;
    address.province = province || address.province;
    address.city = city || address.city;
    address.district = district || address.district;
    address.subdistrict = subdistrict || address.subdistrict;
    address.postalCode = postalCode || address.postalCode;

    await address.save();

    res.status(200).json({ message: "Address successfully updated."});
  } catch (error) {
    res.status(500).json({ message: "Server error", error: err.message});
  }
};

export const deleteAddress = async (req, res) => {
  const userId = req.user._id;
  const { addressId } = req.params;

  try {
    const address = await Address.findOne({ _id: addressId, userId });

    if (!address) {
      return res.status(404).json({ message: "Address not found." });
    }

    await Address.deleteOne({ _id: addressId });

    res.status(200).json({ message: "Address deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};