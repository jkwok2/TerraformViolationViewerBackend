class CustomResponse {
  constructor(statusCode, data) {
    this.statusCode = statusCode;
    this.data = data;
  }

  serializeResponse() {
    return { status: this.statusCode, data: this.data };
  }
}

module.exports = CustomResponse;
