
exports.generateUsername = (firstName, minNum = 1000, maxNum = 9999) => {
  if (!firstName) return null;
  
  const randomNumber = Math.floor(minNum + Math.random() * (maxNum - minNum + 1));
  
  return `${firstName.toLowerCase()}${randomNumber}`;
}; 