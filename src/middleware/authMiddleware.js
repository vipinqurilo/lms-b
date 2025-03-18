const jwt = require("jsonwebtoken");
exports.authMiddleware = async (req, res, next) => {
    try {
        // console.log(req.cookies, 'token');
        console.log(req.headers["authorization"].split(" ")[1], 'token');

        const token =  req.headers["authorization"].split(" ")[1];
        const decord = jwt.verify(token, process.env.JWT_SECRET);
        if(!decord){
            return res.json({
                status: "failed",
                message: "unauthorized user",
            });
        }else{
            req.user = decord;
            console.log(req.user.id)
            next();
        }
    } catch (error) {
        res.json({
            status: "error",
            message: "unauthorized user",
        })
    }
}