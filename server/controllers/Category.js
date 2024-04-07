const Category = require('../models/Category');
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

exports.createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            })
        }

        const CategorysDetails = await Category.create({
            name: name,
            description: description,
        });
        console.log(CategorysDetails);

        return res.status(200).json({
            success: true,
            message: "Category created successfully",
            category:CategorysDetails,
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message:'An error occured while create category',
            error: error.message,
        })
    }
}

exports.showAllCategories = async (req, res) => {
    try {
        const allCategories = await Category.find({}, { name: true, description: true });
        return res.status(200).json({
            success: true,
            data: allCategories,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

//category page details

exports.categoryPageDetails = async (req, res) => {
    try {
        const { categoryId } = req.body;

        const selectedCategory = await Category.findById(categoryId)
            .populate({
                path: "course",
                match: { status: "Published" },
                populate: "ratingAndReview",
            }).exec();

        if (!selectedCategory) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            })
        }

        if (selectedCategory.course.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No course found for selected category",
            })
        }

        //get couser find for other id
        const categoriesExceptSelected = await Category.find({
            _id: { $ne: categoryId },
        })

        const differentCategory = await Category.findOne(
            categoriesExceptSelected[getRandomInt(categoriesExceptSelected.length)]._id
        ).populate({
            path: "courses",
            match: { status: "Published" },
        }).exec();


        //find top 10 most selling course
        const allCategories = await Category.find()
            .populate({
                path: "course",
                match: { status: "Published" },
                populate: {
                    path: "instructor"
                }
            }).exec();
            // //The flatMap method then flattens this array of arrays into a single array, resulting in allCourses being an array containing all the courses from all categories.
        const allCourses = allCategories.flatMap((category) = category.courses);
        const mostSellingCourses = allCourses.sort((a, b) => b.sold - a.sold).slice(0, 10);

        res.status(200).json({
            success: true,
            data: {
                selectedCategory,
                differentCategory,
                mostSellingCourses,
            }
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "internal server error",
            error: error.message,
        })
    }
}