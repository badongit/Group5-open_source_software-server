const msgEnum = require("../enum/msg.enum");

class ResponseBuilder {
  constructor(data) {
    this.data = data;
    this.success = true;
    this.message = msgEnum.SUCCESS;
  }

  withMessage(msg) {
    this.message = msg;
    return this;
  }

  withCode(statusCode) {
    this.success = statusCode && statusCode < 400;
    return this;
  }

  withPagination({ total, next }) {
    this.total = total;
    this.next = next;
    return this;
  }

  build() {
    const response = {
      success: this.success,
      message: this.message,
      data: this.data,
    };

    if (this.total !== undefined) {
      response.pagination = {
        total: this.total,
        next: this.next,
      };
    }

    return response;
  }
}

module.exports = ResponseBuilder;
