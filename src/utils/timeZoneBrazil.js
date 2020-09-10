module.exports = function timeZoneBrazil(time) {
    const date = time ? new Date(time) : new Date();
    // console.log(date)

    const dateBrazil = new Date(date.setHours(date.getHours() - 3));
    // console.log(timeZoneBrazil)

    return dateBrazil;
}