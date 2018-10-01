const messenger = require('botlib').botMessenger('fb')
const Algolia = require('botlib').Algolia
const algolia = new Algolia();
const jsont = require('mustache')
const flowTemplates = require('./flow.json')
const dialogflowAction = require('./dialogflow-action')

module.exports = (customer, action, intent) => {
	let { message } = intent
	let messageText = message ? message.text : null
	console.log('messageText ', messageText)
	console.log('action ', action)
	console.log('customer ', customer)

	function recycle() {
		algolia.isRecyclable(customer.searchText)
			.then(searchResult => {
				if (searchResult) {
					let template = null

					if (searchResult.recycle === true) {
						template = flowTemplates.RECYCLE_YES
					} else if (searchResult.recycle === false) {
						template = flowTemplates.RECYCLE_NO
					} else if (searchResult.count > 1) {
						template = flowTemplates.NEED_INFO
					} else {
						template = flowTemplates.CHAT
					}

					let templateJson = JSON.parse(jsont.render(JSON.stringify(template), { id: customer.id, name: customer.name }))
					customer.action = templateJson.nextAction
					messenger.sendTextMessage(templateJson.response)
				}
			})
	}

	function callDialogFlow(shouldCheckRecycle) {
		dialogflowAction(customer, customer.searchText)
			.then(dialogResult => {
				if (dialogResult.next && shouldCheckRecycle) {
					// messenger.sendTextMessage({ id: customer.id, text: "Please wait, searching better result .." })
					recycle(customer.searchText)
				} else if(dialogResult.next) {
					chat()
				}
			})
			.catch(error => {
				console.log("Error ", error)
				chat()
			})
	}

	function chat() {
		let templateJson = JSON.parse(jsont.render(JSON.stringify(flowTemplates.CHAT), { id: customer.id }))
		messenger.sendTextMessage(templateJson.response)
	}

	switch (action) {
		case "GET_STARTED":
			let getStarted = JSON.parse(jsont.render(JSON.stringify(flowTemplates.GET_STARTED), { id: customer.id, name: customer.name }))
			customer.action = customer.zipcode ? "RECYCLE" : getStarted.nextAction
			messenger.sendTextMessage(getStarted.response)
			break
		case "START":
			let start = JSON.parse(jsont.render(JSON.stringify(flowTemplates.START), { id: customer.id, name: customer.name }))
			customer.action = customer.zipcode ? "RECYCLE" : start.nextAction
			messenger.sendTextMessage(start.response)
			break
		case "ZIPCODE":
			let zipcode = JSON.parse(jsont.render(JSON.stringify(flowTemplates.ZIPCODE), { id: customer.id, name: customer.name }))
			customer.action = zipcode.nextAction
			customer.searchText = messageText
			messenger.sendTextMessage(zipcode.response)
			break
		case "VALIDATE_ZIPCODE":
			let validZipcode = algolia.isValidZipcode(messageText)
				.then(isValid => {
					if (isValid) {
						customer.zipcode = messageText
						customer.action = ''
						callDialogFlow(true)
					} else {
						let zipcodeNotValid = JSON.parse(jsont.render(JSON.stringify(flowTemplates.ZIPCODE_NOT_VALID), { id: customer.id, name: customer.name }))
						customer.action = ''
						customer.zipcode = null
						messenger.sendTextMessage(zipcodeNotValid.response)
					}
				})
			break
		case "RECYCLE":
			customer.searchText = messageText
			if(customer.zipcode) {
				callDialogFlow(true)
			} else {
				customer.action = ''
				callDialogFlow()
			} 
			break
		default:
			customer.searchText = messageText
			if(customer.zipcode) {
				callDialogFlow(true)
			} else {
				customer.action = ''
				callDialogFlow()
			} 
			// let chat = JSON.parse(jsont.render(JSON.stringify(flowTemplates.CHAT), { id: customer.id, name: customer.name }))
			// customer.action = chat.nextAction
			// messenger.sendTextMessage(chat.response)
			// messenger.handOver({ id: customer.id })
			// 	.then(result => console.log('handover result', result))
	}
}