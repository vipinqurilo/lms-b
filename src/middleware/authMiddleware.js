const jwt = require("jsonwebtoken");
exports.authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers["authorization"].split(" ")[1];
        const decord = jwt.verify(token, process.env.JWT_SECRET);
        if(!decord){
            return res.json({
                status: "failed",
                message: "unauthorized user",
            });
        }else{
            req.user = decord;
            next();
        }
    } catch (error) {
        res.json({
            status: "error",
            message: "unauthorized user",
        })
    }
}