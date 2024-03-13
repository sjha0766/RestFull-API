import multer from "multer";
import CustomErrorHandler from "../services/CustomErrorHandler";
import path from "path";
import { Product } from "../models";
import fs from "fs/promises";
import productSchema from "../validators/productSchema";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads");
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const handleMultipartData = multer({
  storage,
  limits: { fileSize: 1000000 * 5 },
}).single("image");

const productController = {
  async store(req, res, next) {
    handleMultipartData(req, res, async (err) => {
      if (err) {
        return next(CustomErrorHandler.serverError(err.message));
      }
      const filePath = req.file.path;

      const { error } = productSchema.validate(req.body);
      if (error) {
        // Delete the file if validation fails
        await fs.unlink(filePath);
        return next(error);
      }

      const { name, price, size } = req.body;
      let document;
      try {
        document = await Product.create({
          name,
          price,
          size,
          image: filePath,
        });
      } catch (err) {
        return next(err);
      }
      res.status(201).json(document);
    });
  },

  async update(req, res, next) {
    handleMultipartData(req, res, async (err) => {
      if (err) {
        return next(CustomErrorHandler.serverError(err.message));
      }

      let filePath;
      if (req.file) {
        filePath = req.file.path;
      }

      const { error } = productSchema.validate(req.body);
      if (error) {
        // Delete the file if validation fails and a new file was uploaded
        if (req.file) {
          await fs.unlink(filePath);
        }
        return next(error);
      }

      const { name, price, size } = req.body;
      let document;
      try {
        document = await Product.findOneAndUpdate(
          { _id: req.params.id },
          { name, price, size, ...(req.file && { image: filePath }) },
          { new: true }
        );
      } catch (err) {
        // Delete the file if an error occurs during update
        if (req.file) {
          await fs.unlink(filePath);
        }
        return next(err);
      }
      res.status(201).json(document);
    });
  },
  async destroy(req, res, next) {
    try {
      const product = await Product.findOneAndRemove({ _id: req.params.id });
      if (!product) {
        return next(CustomErrorHandler.notFound("Product not found"));
      }

      const imagePath = product.image;
      // Delete the associated image file
      await fs.unlink(imagePath);

      res.json({ message: "Product deleted successfully" });
    } catch (err) {
      return next(err);
    }
  },
  async index(req, res, next) {
    try {
      const products = await Product.find()
        .select("-updatedAt -__v")
        .sort({ createdAt: -1 });
      const productsWithCompleteImageUrl = products.map((product) => ({
        ...product.toObject(),
        image: "http" + "://" + req.get("host") + "/" + product.image,
      }));
      res.json(productsWithCompleteImageUrl);
    } catch (err) {
      return next(err);
    }
  },
 async singleProduct(req,res,next){
   let singleProduct;
    try {
    singleProduct=await Product.findOne({_id:req.params.id});
   } catch (error) {
    return next(CustomErrorHandler.serverError(error));
   }
   res.json({singleProduct}); 
  }
};

export default productController;
