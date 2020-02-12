module.exports = function formatMoney(amount, decimalCount = 2, decimal = ",", thousands = ".") {
    try {
      decimalCount = Math.abs(decimalCount);
      decimalCount = isNaN(decimalCount) ? 2 : decimalCount;
  
      const negativeSign = amount < 0 ? "-" : "";
  
      let amountInteger = parseInt(amount = Math.abs(Number(amount) || 0).toFixed(decimalCount)).toString();
      let amountLength = (amountInteger.length > 3) ? amountInteger.length % 3 : 0;
  
      return "R$ "+ negativeSign + (amountLength ? amountInteger.substr(0, amountLength) + thousands : '') + amountInteger.substr(amountLength).replace(/(\d{3})(?=\d)/g, "$1" + thousands) + (decimalCount ? decimal + Math.abs(amount - amountInteger).toFixed(decimalCount).slice(2) : "");
    } catch (error) {
      console.log(error)
    }
  };
  