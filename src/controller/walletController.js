const walletModel = require("../model/walletModel");
const mongoose = require("mongoose");

exports.getWalletForUser=async(req,res)=>{
    const userId=req.user.id;
    const wallet=await walletModel.findOne({userId}).select("balance _id");
    if(!wallet){
        const newWallet=await walletModel.create({userId});
        res.json({success:true,message:"Wallet Fetch Succesfully",data:newWallet})
    }
    res.json({success:true,message:"Wallet Fetch Succesfully",data:wallet})

}

exports.getWalletTransactions = async (req, res) => {
    try {
        const userId = req.user.id;
        const { startDate, endDate, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        // Build date conditions for $filter
        let dateConditions = [];
        if (startDate) {
            dateConditions.push({ $gte: ["$$transaction.createdAt", new Date(startDate)] });
        }
        if (endDate) {
            const endDateTime = new Date(endDate);
            endDateTime.setDate(endDateTime.getDate() + 1);
            dateConditions.push({ $lt: ["$$transaction.createdAt", endDateTime] });
        }

        const pipeline = [
            // Match the user's wallet
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            
            // Filter and transform transactions
            {
                $project: {
                    balance: 1,
                    transactions: {
                        $filter: {
                            input: "$transactions",
                            as: "transaction",
                            cond: dateConditions.length > 0 ? { $and: dateConditions } : true
                        }
                    }
                }
            },
            
            // Add total count before pagination
            {
                $addFields: {
                    totalTransactions: { $size: "$transactions" }
                }
            },
            
            // Sort transactions by date (newest first)
            {
                $addFields: {
                    transactions: {
                        $sortArray: {
                            input: "$transactions",
                            sortBy: { createdAt: -1 }
                        }
                    }
                }
            },

            // Apply pagination to transactions
            {
                $project: {
                    balance: 1,
                    totalTransactions: 1,
                    transactions: {
                        $slice: ["$transactions", skip, parseInt(limit)]
                    }
                }
            }
        ];

        const [result] = await walletModel.aggregate(pipeline);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Wallet not found"
            });
        }

        res.json({
            success: true,
            message: "Transactions fetched successfully",
            data: {
                transactions: result.transactions,
                total: result.totalTransactions,
                currentBalance: result.balance,
                currentPage: parseInt(page),
                totalPages: Math.ceil(result.totalTransactions / limit),
                dateRange: {
                    startDate: startDate || "Not specified",
                    endDate: endDate || "Not specified"
                }
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.message
        });
    }
};

exports.addTransaction = async (req, res) => {
    try {
        const userId = req.user.id;
        const { type, amount, description } = req.body;

        // Validate transaction type
        if (!['deposit', 'withdrawal'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Invalid transaction type. Must be 'deposit' or 'withdrawal'"
            });
        }

        // Validate amount
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Amount must be greater than 0"
            });
        }

        // Validate description
        if (!description || description.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Description is required"
            });
        }

        const wallet = await walletModel.findOne({ userId });
        
        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: "Wallet not found"
            });
        }

        // Check if sufficient balance for withdrawal
        if (type === 'withdrawal' && wallet.balance < amount) {
            return res.status(400).json({
                success: false,
                message: "Insufficient balance"
            });
        }

        // Update balance
        const newBalance = type === 'deposit' 
            ? wallet.balance + amount 
            : wallet.balance - amount;

        // Add transaction and update balance
        const updatedWallet = await walletModel.findOneAndUpdate(
            { userId },
            {
                $push: {
                    transactions: {
                        type,
                        amount,
                        description,
                        createdAt: new Date()
                    }
                },
                balance: newBalance
            },
            { new: true }
        );

        res.json({
            success: true,
            message: "Transaction added successfully",
            data: {
                transaction: updatedWallet.transactions[updatedWallet.transactions.length - 1],
                currentBalance: updatedWallet.balance
            }
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.message
        });
    }
};
