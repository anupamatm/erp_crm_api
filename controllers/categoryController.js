const Category = require('../models/Category');
const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/ApiError');

// @desc    Create a new category
// @route   POST /api/categories
// @access  Private/Admin
exports.createCategory = asyncHandler(async (req, res, next) => {
    const { name, description, parentCategory, isActive = true } = req.body;
    
    const category = await Category.create({
        name,
        description,
        parentCategory: parentCategory || null,
        isActive,
        createdBy: req.user.id
    });

    res.status(201).json({
        success: true,
        data: category
    });
});

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = asyncHandler(async (req, res, next) => {
    const { isActive, parent } = req.query;
    
    const filter = {};
    if (isActive) filter.isActive = isActive === 'true';
    if (parent === 'null') {
        filter.parentCategory = null;
    } else if (parent) {
        filter.parentCategory = parent;
    }

    const categories = await Category.find(filter)
        .populate('parentCategory', 'name')
        .populate('createdBy', 'name')
        .populate('updatedBy', 'name')
        .sort({ name: 1 });

    res.status(200).json({
        success: true,
        count: categories.length,
        data: categories
    });
});

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
exports.getCategory = asyncHandler(async (req, res, next) => {
    const category = await Category.findById(req.params.id)
        .populate('parentCategory', 'name')
        .populate('createdBy', 'name')
        .populate('updatedBy', 'name');

    if (!category) {
        return next(new ApiError(`Category not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
        success: true,
        data: category
    });
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
exports.updateCategory = asyncHandler(async (req, res, next) => {
    const { name, description, parentCategory, isActive } = req.body;
    
    try {
        // Find the category
        const category = await Category.findById(req.params.id);
        if (!category) {
            return next(new ApiError(`Category not found with id of ${req.params.id}`, 404));
        }

        // Update fields
        if (name) category.name = name;
        if (description !== undefined) category.description = description;
        if (parentCategory !== undefined) {
            // Prevent setting self as parent
            if (parentCategory && parentCategory.toString() === req.params.id) {
                return next(new ApiError('A category cannot be its own parent', 400));
            }
            category.parentCategory = parentCategory || null;
        }
        if (isActive !== undefined) category.isActive = isActive;
        
        // Set updatedBy with the current user
        if (req.user && req.user.id) {
            category.updatedBy = req.user.id;
        }

        // Save the updated category
        const updatedCategory = await category.save();

        res.status(200).json({
            success: true,
            data: updatedCategory
        });

    } catch (error) {
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return next(new ApiError(`Validation error: ${messages.join(', ')}`, 400));
        }
        // Handle duplicate key error
        if (error.code === 11000) {
            return next(new ApiError('Category name already exists', 400));
        }
        // Pass other errors to the error handler
        return next(error);
    }
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
// In categoryController.js, update the deleteCategory function:
// In categoryController.js, update the deleteCategory function:
exports.deleteCategory = asyncHandler(async (req, res, next) => {
    // Find the category first
    const category = await Category.findById(req.params.id);
    
    if (!category) {
        return next(new ApiError(`Category not found with id of ${req.params.id}`, 404));
    }

    // Check if category has subcategories
    const hasSubcategories = await Category.exists({ parentCategory: req.params.id });
    if (hasSubcategories) {
        return next(new ApiError('Cannot delete category with subcategories. Please remove or reassign subcategories first.', 400));
    }

    // Check if category is used in products
    const Product = require('../models/Product');
    const usedInProducts = await Product.exists({ category: req.params.id });
    if (usedInProducts) {
        return next(new ApiError('Cannot delete category that is assigned to products. Please reassign or delete the products first.', 400));
    }

    // Use deleteOne() instead of remove()
    await Category.deleteOne({ _id: req.params.id });

    res.status(200).json({
        success: true,
        data: {}
    });
});

// @desc    Get category tree
// @route   GET /api/categories/tree
// @access  Public
exports.getCategoryTree = asyncHandler(async (req, res, next) => {
    const categories = await Category.find({ isActive: true })
        .select('name parentCategory')
        .sort({ name: 1 });

    const buildTree = (parentId = null) => {
        const tree = [];
        const filteredCategories = categories.filter(cat => 
            (cat.parentCategory ? cat.parentCategory.toString() : null) === (parentId ? parentId.toString() : null)
        );
        
        for (const category of filteredCategories) {
            const children = buildTree(category._id);
            tree.push({
                _id: category._id,
                name: category.name,
                children: children.length > 0 ? children : undefined
            });
        }
        
        return tree;
    };

    const categoryTree = buildTree();
    
    res.status(200).json({
        success: true,
        data: categoryTree
    });
});
