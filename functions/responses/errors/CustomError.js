class CustomError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }

  serializeResponse() {
    return { status: this.statusCode, error: this.message };
  }
}

module.exports = CustomError;
