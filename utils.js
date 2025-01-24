const { parseISO, getDate } = require('date-fns')

const isAlphanumeric = (char) => {
    return /^[a-zA-Z0-9]$/.test(char)
}

const calculatePoints = (receipt) => {
    const { retailer } = receipt
    let points = 0

    //  Rule 1
    for (const char of retailer) {
        if (isAlphanumeric(char)) points += 1
    }

    // Rule 2
    const intTotal = parseFloat(receipt.total)
    if (Number.isInteger(intTotal)) points += 50

    // Rule 3
    if (intTotal % 0.25 === 0) points += 25
    

    // Rule 4
    const itemsLength = receipt.items.length
    points += Math.floor(itemsLength / 2) * 5

    // Rule 5
    for (let eachItem of receipt.items) {
        const { shortDescription, price } = eachItem
        if (shortDescription.trim().length % 3 === 0)
            points += Math.ceil(0.2 * parseFloat(price))
    }

    // Rule 6
    // NA

    // Rule 7
    const date = parseISO(receipt.purchaseDate) // Parse date string correctly
    const day = getDate(date)

    if (day % 2 !== 0) points += 6


    // Rule 8
    const [hours, minutes] = receipt.purchaseTime
        .split(':')
        .map((num) => parseInt(num, 10))
    const totalMinutes = hours * 60 + minutes

    const start = 14 * 60
    const end = 16 * 60

    if (totalMinutes >= start && totalMinutes < end) points += 10
    
    return points
}

module.exports = { calculatePoints, isAlphanumeric }
