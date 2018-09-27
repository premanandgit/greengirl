const messenger = require('botlib').botMessenger('fb')
const Algolia = require('botlib').Algolia
const algolia = new Algolia();
const jsont = require('mustache')
const flowTemplates = require('./flow.json')

module.exports = (customer, action, intent) => {
	let { message } = intent
	let messageText = message ? message.text : null
	// console.log('messageText ', messageText)
	// console.log('action ', action)
	// console.log('customer ', customer)

	function recycle() {
		if (customer.zipcode) customer.searchText = messageText
		if (!customer.zipcode) customer.zipcode = messageText
		let search = algolia.isRecyclable(customer.searchText)
			.then(searchResult => {
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
			})
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
						recycle()
					} else {
						let zipcodeNotValid = JSON.parse(jsont.render(JSON.stringify(flowTemplates.ZIPCODE_NOT_VALID), { id: customer.id, name: customer.name }))
						customer.action = zipcodeNotValid.nextAction
						messenger.sendTextMessage(zipcodeNotValid.response)
					}
				})
			break
		case "RECYCLE":
			recycle()
			break
		default:
			let chat = JSON.parse(jsont.render(JSON.stringify(flowTemplates.CHAT), { id: customer.id, name: customer.name }))
			customer.action = chat.nextAction
			messenger.sendTextMessage(chat.response)
			messenger.handOver({ id: customer.id })
				.then(result => console.log('handover result', result))
	}
}