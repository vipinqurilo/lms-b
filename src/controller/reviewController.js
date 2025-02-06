exports.addReview = async (req, res) => {
    try {
        const data = req.body;
        const id = req.user.id;
        const objData = {
            user: id,
            course: data.course,
            student: req.user.id,
            review: data.review,
            rating: data.rating,
        }

        const addReview = await ReviewModel.create(objData);
        if (addReview) {
            res.json({
                status: "success",
                message: "Review Added Successfully",
                data: addReview
            })
        }else{
            res.json({
                status: "failed",
                message: "Review Not Added",
            })
        }
    } catch (error) {
        res.json({
            status: "failed",
            message: "something went wrong",
            error: error.message
        })
    }
}
