function switchWeek(dayWeek) {
    switch (dayWeek) {
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
        return 1;
        break;
      default:
        return 0;
    }

}

module.exports = function workingDays(lastDay, currentYear, currentMouth) {
  // console.log("workingDay | lastDay: ", lastDay);
  let businessDaysCounted = 0;
  let loops = 5;

  for (; loops < lastDay; loops++) {
      // console.log("======================================================");
      let day = loops + 1;
      // console.log("day: ",day);
      let manipulatedWeek = new Date(currentYear, currentMouth, day);
      // console.log("manipulatedWeek: ",manipulatedWeek);
      let dayWeek = manipulatedWeek.getDay();
      // console.log("manipulatedWeek | getDay: ", dayWeek);

      let value = switchWeek(dayWeek);
      businessDaysCounted += value;
      // console.log("businessDaysCounted: ",businessDaysCounted);
  }

  // console.log("workingDay | businessDaysCounted: ", businessDaysCounted);
  return businessDaysCounted;

}