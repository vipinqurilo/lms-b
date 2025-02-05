const bcrypt = require('bcryptjs')
exports.getPasswordHash = (password)=>{
    const salt = bcrypt.genSaltSync(10)
    return bcrypt.hashSync(password,salt)
}


exports.isValidPassword = (localpass,dbpass)=>{
    console.log(localpass,dbpass);
    console.log( bcrypt.compareSync(localpass,dbpass))
    return bcrypt.compareSync(localpass,dbpass);
}
