const Product = require("../models/productModel");
const ErrorHander = require("../utils/errorHander");
const ApiFeatures = require("../utils/apifeatures");

//Create Product --> Admin 
exports.createProduct = async (req,res,next) =>{
    
    req.body.user = req.user.id;
    
    const product = await Product.create(req.body);

    res.status(201).json({
        success: true,
        product
    })
}

// Get All Products
exports.getAllProducts = async (req,res) =>{
    
    const productCount = await Product.countDocuments();

    //For searching items using their name and showing all products in a fixed amount of items on each page using pagination()
    const resultPerPage = 2;
    const apiFeature = new ApiFeatures(Product.find(), req.query).search().pagination(resultPerPage);


    // const products = await Product.find()
    const products = await apiFeature.query;
    res.status(200).json({
        success: true,
        products,
        productCount
    })
}

// Get Product Details
exports.getProductDetails = async (req,res,next) => {
    const product = await Product.findById(req.params.id);
    
    if(!product){
        return res.status(500).json({
            success: false,
            message: "Product not found"
        })
    }

    //Another method using middleware
    // if(!product){
    //     return next(ErrorHander("Product not found",404))
    // }

    res.status(200).json({
        success: true,
        product
    })
}


// Update Product --> Admin

exports.updateProduct = async (req,res, next) => {
    let product = await Product.findById(req.params.id);

    if(!product){
        return res.status(500).json({
            success: false,
            message: "Product not found"
        })
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {new:true, runValidators:true,useFindAndModify: false}) 
    res.status(200).json({
        success: true,
        product
    })

}


// Delete a product --> Admin
exports.deleteProduct = async (req,res,next) => {
    const product = await Product.findById(req.params.id);

    if(!product){
        return res.status(500).json({
            success: false,
            message: "Product not found"
        })
    }

    await product.remove();
    
    res.status(200).json({
        success: true,
        message: "Product deleted successfully"
    })
}

