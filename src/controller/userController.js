const UserModel = require("../model/UserModel");

exports.getUsers = async (req, res) => {
  try {
      let { search, role, userStatus, page = 1, limit = 10 } = req.query;
      console.log(search);

      page = Math.max(parseInt(page), 1);
      limit = Math.max(parseInt(limit), 1);
      const skip = (page - 1) * limit;

      let query = {};
      if (search && search !== "") {
          query.$or = [
              { firstName: { $regex: search, $options: "i" } },
              { lastName: { $regex: search, $options: "i" } },
          ];
      }
      if (role && role !== "") query.role = role;
      if (userStatus && userStatus !== "") query.userStatus = userStatus;

      console.log(query);

      const users = await UserModel.aggregate([
          { $match: query },
          {
              $project: {
                  _id: 1,
                  email: 1,
                  firstName: 1,
                  lastName: 1,
                  gender: 1,
                  profilePhoto: 1,
                  country: 1,
                  phone: 1,
                  role: 1,
                  userStatus: 1,
                  createdAt: 1,
              }
          },
          { $sort: { createdAt: -1 } }, // Sort by most recent users first
          { $skip: skip },
          { $limit: limit }
      ]);

      const totalUsers = await UserModel.aggregate([
          { $match: query },
          { $count: "total" }
      ]);

      const total = totalUsers.length > 0 ? totalUsers[0].total : 0;

      res.json({
          success: true,
          data: users,
          total: total,
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          message: "Users retrieved successfully"
      });

  } catch (error) {
      console.log(error);
      res.json({ success: false, message: "Something went wrong", error: error.message });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { userStatus } = req.body;
    const user = await UserModel.findOneAndUpdate(
      { _id: userId },
      { userStatus: userStatus },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, message: "User status updated successfully",data:{userStatus:user.userStatus,_id:user._id} });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Something went wrong", error: error.message });
  }
};