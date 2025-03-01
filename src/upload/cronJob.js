const cron = require("node-cron");
// const AdminModel = require("./src/models/AdminModel");
const EarningModel = require("../model/earningModel");
const UserModel = require("../model/UserModel");

// Schedule the cron job to run every Sunday at midnight
cron.schedule("* * * * *", async () => {
    console.log("✅ Running weekly earnings transfer:", new Date().toLocaleString());
    try {
        await transferEarningsToAdmin();
    } catch (error) {
        console.error("❌ Error transferring earnings:", error);
    }
});

async function transferEarningsToAdmin() {
   

    try {
       const currentDate = new Date();
        const startOfWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay());
        const endOfWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay() + 6);

        const earnings = await EarningModel.find({
            date: { $gte: startOfWeek, $lte: endOfWeek },
        });
        console.log(earnings , "earnings")
        if (earnings.length === 0) {
            console.log("No earnings found for the week.");
            return;
        }

        if(earnings.type === "tutor"){
            console.log("earnings tutor")
            const admin = await UserModel.findOne({ role: "admin" });
            if (!admin) {
                console.log("Admin not found.");
                return;
            }

            const totalAmount = earnings.reduce((total, earning) => total + earning.amount, 0);
            const adminAmount = Math.floor(totalAmount * 0.6);
            const tutorAmount = Math.floor(totalAmount * 0.4);

            admin.earnings += adminAmount;
            await admin.save();
            earnings.forEach(async (earning) => {
                const tutor = await UserModel.findById(earning.teacher);
                if (tutor) {
                    tutor.earnings += tutorAmount;
                    await tutor.save();
                }
            });
         
            console.log("Total earnings for the week tutor:", totalAmount);
            // admin.earnings += earnings.reduce((total, earning) => total + earning.amount, 0);
            // await admin.save();
        }if(earnings.type === "course"){
            console.log("earnings course")
            const admin = await UserModel.findOne({ role: "admin" });
            if (!admin) {
                console.log("Admin not found.");
                return;
            }

            const totalAmount = earnings.reduce((total, earning) => total + earning.amount, 0);
            const adminAmount = Math.floor(totalAmount * 0.4);
            const courseAmount = Math.floor(totalAmount * 0.6);

            admin.earnings += adminAmount;
            await admin.save();
            earnings.forEach(async (earning) => {
                const course = await UserModel.findById(earning.course);
                if (course) {
                    course.earnings += courseAmount;
                    await course.save();
                }
            });
        }

        const totalAmount = earnings.reduce((total, earning) => total + earning.amount, 0);
        console.log("Total earnings for the week course:", totalAmount);
        
    } catch (error) {
        console.error("❌ Error transferring earnings:", error);
    } finally {
        console.log("✅ Weekly earnings transfer completed:", new Date().toLocaleString());
    }
}
