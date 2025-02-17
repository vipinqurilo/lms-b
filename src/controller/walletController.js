const walletModel = require("../model/walletModel");

exports.getWalletForUser=async(req,res)=>{
    const userId=req.user.id;
    const wallet=await walletModel.findOne({userId}).select("balance _id");
    if(!wallet){
        const newWallet=await walletModel.create({userId});
        res.json({success:true,message:"Wallet Fetch Succesfully",data:newWallet})
    }
    res.json({success:true,message:"Wallet Fetch Succesfully",data:wallet})

}