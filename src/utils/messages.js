const generateMessage = (username, text) => {
    return {
        username,
        text,
        createdAt: new Date().getTime()
    }
}

const generateLocationMessage = (username, {lat,long}) => {
    const url = `https://google.com/maps?q=${lat},${long}`

    return {
        username, 
        url,
        locationCreatedAt: new Date().getTime()
    }

}


module.exports = {
    generateMessage,
    generateLocationMessage
}