module.exports = function timeZoneBrazil() {
    const date = new Date();
    // console.log(date)

    const dateBrazil = new Date(date.setHours(date.getHours() - 3));
    // console.log(timeZoneBrazil)

    return dateBrazil;
}