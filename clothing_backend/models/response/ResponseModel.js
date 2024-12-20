// models/ResponseModel.js
class ResponseModel {
    constructor(success = false, error = null, data = null) {
        this.success = success;
        this.error = error;
        this.data = data;
    }
}

class ErrorResponseModel {
    constructor(code = null, message = null, details = []) {
        this.code = code;
        this.message = message;
        this.details = details;
    }
}

class ValidationField {
    constructor(field = null, errorMessage = null) {
        this.field = field;
        this.errorMessage = errorMessage;
    }
}

export default { ResponseModel, ErrorResponseModel, ValidationField };
