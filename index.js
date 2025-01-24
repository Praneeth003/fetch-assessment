const express = require('express');
const { calculatePoints } = require('./utils');
const { v4: uuidv4 } = require('uuid');
const { parseISO, getDate } = require('date-fns');


const app = express();

// Middleware to parse JSON 
app.use(express.json());

const PORT = 3000;
let idMap = {};

// Middleware function to validate the receipt before processing.
const validateReceipt = (req, res, next) => {
    try {
        const { retailer, purchaseDate, purchaseTime, items, total } = req.body
        let isValid = true
        if (
            !retailer ||
            !purchaseDate ||
            !purchaseTime ||
            !items ||
            !Array.isArray(items) ||
            items.length === 0 ||
            !total
        )
        {
            isValid = false
        }
        
        let cumilativePrices = 0
        if (isValid) {
            const retailerPattern = /^[\w\s\-\&]+$/
            const datePattern = /^\d{4}-\d{2}-\d{2}$/
            const timePattern = /^([01][0-9]|2[0-3]):([0-5][0-9])$/
            const totalPattern = /^\d+\.\d{2}$/
            const shortDescriptionPattern = /^[\w\s\-]+$/
            const pricePattern = /^\d+\.\d{2}$/

            if (!retailerPattern.test(retailer)) isValid = false

            if (!datePattern.test(purchaseDate)) isValid = false

            if (parseISO(purchaseDate).toString() === 'Invalid Date') isValid = false

            if (!timePattern.test(purchaseTime)) isValid = false
            if (!totalPattern.test(total)) isValid = false
            
            for (let eachItem of items) {
                if (!isValid) break
                const { shortDescription, price } = eachItem
                if (!shortDescription || !price) isValid = false
                
                if (!shortDescriptionPattern.test(shortDescription))
                    isValid = false
                if (!pricePattern.test(price)) isValid = false
                cumilativePrices += parseFloat(price)
            }
        }
        
        if (cumilativePrices.toFixed(2) !== parseFloat(total).toFixed(2)) isValid = false

        if (!isValid)
            return res.status(400).json({
                error: 'The receipt is invalid.',
            })
        next()
    } catch (err) {
        return res.status(400).json({
            error: 'The receipt is invalid.',
        })
    }
}

app.post('/receipts/process', validateReceipt, (req, res) => {
    const points = calculatePoints(req.body)
    if(points < 0){
        res.status(400).send("The receipt is invalid.")
    }
    const uniqueId = uuidv4()
    idMap[uniqueId] = points
    res.send({id: uniqueId})
})

app.get('/receipts/:id/points', (req, res) => {
    const id = req.params.id
    if(idMap[id] === undefined)res.status(404).send("No receipt found for that ID.")
    else res.send(JSON.stringify(idMap[id]))
})

app.all('*', (req, res) => { 
    res.status(404).send("Invalid API Endpoint.")
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


