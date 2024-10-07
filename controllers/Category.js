const Category = require('../model/Category')

function getRandomInt(max) {
    return Math.floor(Math.random() * max)
}

//create CategoryDetails handler function
exports.createCategory = async (req, res) => {
    try {
        //fetch data
        const { name, description } = req.body

        //validate
        if (!name) {
            return res.json(401).json({
                success: false,
                message: "Enter valid details while creating CategoryDetails"
            })
        }

        const CategoryDetails = await Category.findOne({ name })
        if (CategoryDetails) {
            return res.status(401).json({
                success: false,
                message: "CategoryDetails already exits"
            })
        }

        //entry in db
        const newCategoryDetails = await Category.create({ name, description })
        console.log(newCategoryDetails)
        return res.status(200).json({
            success: true,
            message: "CategoryDetails creation successfull"
        })



    } catch (err) {
        console.log("Error in CategoryDetails creation ", err)
        res.status(500).json({
            success: false,
            message: "Error in CategoryDetails creation"
        })
    }
}

exports.showAllCategories = async (req, res) => {
    try {
        const allCategoryDetails = await Category.find({}, { name: true, description: true, courses:true })

        console.log(allCategoryDetails)

        res.status(200).json({
            success: true,
            data: allCategoryDetails,
            message: "All CategoryDetails fetched successfully",

        })

    } catch (err) {
        console.log("Error in fetching CategoryDetails ", err)
        return res.status(500).json({
            success: false,
            message: `Error while fetching all CategoryDetails, ${err.message}`
        })
    }
}

exports.categoryPageDetails = async (req, res) => {
    try {
      const { categoryId } = req.body
      console.log("PRINTING CATEGORY ID: ", categoryId);
      // Get courses for the specified category
      const selectedCategory = await Category.findById(categoryId)
        .populate({
          path: "courses",
          match: { status: "Published" },
          populate: "ratingAndReviews",
        })
        .exec()
  
      //console.log("SELECTED COURSE", selectedCategory)
      // Handle the case when the category is not found
      if (!selectedCategory) {
        console.log("Category not found.")
        return res
          .status(404)
          .json({ success: false, message: "Category not found" })
      }
      // Handle the case when there are no courses
      if (selectedCategory.courses.length === 0) {
        console.log("No courses found for the selected category.")
        return res.status(404).json({
          success: false,
          message: "No courses found for the selected category.",
        })
      }
  
      // Get courses for other categories
      const categoriesExceptSelected = await Category.find({
        _id: { $ne: categoryId },
      })
      let differentCategory = await Category.findOne(
        categoriesExceptSelected[getRandomInt(categoriesExceptSelected.length)]
          ._id
      )
        .populate({
          path: "courses",
          match: { status: "Published" },
        })
        .exec()
        //console.log("Different COURSE", differentCategory)
      // Get top-selling courses across all categories
      const allCategories = await Category.find()
        .populate({
          path: "courses",
          match: { status: "Published" },
          populate: {
            path: "instructor",
        },
        })
        .exec()
      const allCourses = allCategories.flatMap((category) => category.courses)
      const mostSellingCourses = allCourses
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 10)
       // console.log("mostSellingCourses COURSE", mostSellingCourses)
      res.status(200).json({
        success: true,
        data: {
          selectedCategory,
          differentCategory,
          mostSellingCourses,
        },
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      })
    }
  }