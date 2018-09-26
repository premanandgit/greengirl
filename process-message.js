const CustomerSession = require('botlib').customerSession
const customerSession = new CustomerSession()
const createCustomer = require('./customer')
const YaliNLP = require('botlib').YaliNLP
const yaliNLP = new YaliNLP()
const action = require('./action')

module.exports = (intent) => {
  try {
    console.log('Sender ', intent.sender.id)
    return customerSession.create(intent.sender.id, createCustomer)
    .then(customer => {
      if(!customer) {
        console.log("Error: Customer session is null", customer)
        return;
      } 
      let message = intent.message;
      let messageText = message.text;

      if (messageText) {
        if (yaliNLP.hasGreet(messageText)) {
          action(customer, "START", intent)
        } else {
          action(customer, customer.action, intent)
        }
      }
    })
  } catch (error) {
    console.log("Error while processing message ", error)
    return null
  }

}