const express = require("express");
const { getAllProducts,createProduct, updateProduct, deleteProduct, getProductDetails } = require("../controllers/productController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const router = express.Router();


router.route("/products").get(isAuthenticatedUser, getAllProducts);

router.route("/admin/product/new").post(isAuthenticatedUser, authorizeRoles("admin"), createProduct);

router.route("/admin/product/:id").put(isAuthenticatedUser, authorizeRoles("admin"), updateProduct);

router.route("/admin/product/:id").delete(isAuthenticatedUser, authorizeRoles("admin"), deleteProduct);

router.route("/product/:id").get(isAuthenticatedUser, getProductDetails);

module.exports = router;