module.exports = class config {
    static getBotName() {
        return process.env.BOT_NAME || 'Green Girl'
    }
    static getPageToken() {
        return process.env.PAGE_ACCESS_TOKEN || 'EAAKEQtmMzfUBAJlGceESdRoYOX0MWjLMfSCXbhYQ3zvP27aNuDhyYYRnLLnHpc7FonAMajASZAXhhvwipVGvnPRJrHZCVJ1CgwLMRbBPAES7czfpwK5cruSgo4qDs54J0X7akReKzMj5sPD0mtiFJbuckO1zZAX0dd5kvjhVyeQwL0LZAx70'
    }
    static getPort() {
        return process.env.PORT || 3000
    }
    static getHubVerifyToken() {
        return process.env.HUB_VERIFY_TOKEN || 'yali_food_bot'
    }
}