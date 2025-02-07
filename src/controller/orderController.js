const OrderModel = require("../model/orderModel");

exports.addOrder = async(req,res)=>{
    try {
        const {course} = req.body
        const id = req.user.id
        const findOrder = await OrderModel.find({studentId:id,course:course})
        if(!findOrder)return res.json({status:"fail",message:"Order Alredy Buy"})
        function generateRandomCode() {
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            let code = "";
            for (let i = 0; i < 6; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return code;
        }
       const objData = {
        orderId:generateRandomCode(),
        studentId:id,
        course:course
       }
       const dataCreate = await OrderModel.create(objData)
       if(dataCreate){
        res.json({
            status: "success",
            message:"Order Add Success"
        })
       }else{
        res.json({
            status: "Fail",
            message:"Order Not Add"
        })
       }
    } catch (error) {
        console.log(error)
        res.json({
            status: "Fail",
            message:"Internal error"
        })
    }
}

exports.getOrder = async (req,res)=>{
    try {
        const id = req.user.id
        const allOrder = await OrderModel.find({studentId:id}).populate('course')
        res.json({
            status:"success",
            data:allOrder
        })
    } catch (error) {
        res.json({
            status:"fail",
            error:error.message
        })
    }
}