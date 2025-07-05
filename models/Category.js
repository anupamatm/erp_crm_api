const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        trim: true,
        unique: true,
        maxlength: [50, 'Category name cannot exceed 50 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    parentCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for subcategories
categorySchema.virtual('subcategories', {
    ref: 'Category',
    localField: '_id',
    foreignField: 'parentCategory'
});

// Indexes
categorySchema.index({ name: 1 }, { unique: true });
categorySchema.index({ parentCategory: 1 });

// Pre-save hook to ensure name is unique
categorySchema.pre('save', async function(next) {
    const category = this;
    if (category.isModified('name')) {
        const existingCategory = await Category.findOne({ 
            name: { $regex: new RegExp(`^${category.name}$`, 'i') },
            _id: { $ne: category._id }
        });
        if (existingCategory) {
            throw new Error('Category name already exists');
        }
    }
    next();
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
