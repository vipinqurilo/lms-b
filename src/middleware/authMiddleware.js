const jwt = require("jsonwebtoken");

exports.authMiddleware = async (req, res, next) => {
    try {
        // Ensure req.cookies exists and access token properly
        const token = req.cookies?.token || (req.headers["authorization"]?.split(" ")[1] ?? null);

        console.log(token, "token");

        if (!token) {
            return res.status(401).json({
                status: "failed",
                message: "Unauthorized user",
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(401).json({
                status: "failed",
                message: "Unauthorized user",
            });
        }

        req.user = decoded;
        console.log(req.user.id);
        next();
    } catch (error) {
        console.error(error);
        return res.status(401).json({
            status: "error",
            message: "Unauthorized user",
        });
    }
};
