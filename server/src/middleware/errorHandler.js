export function errorHandler(error, _request, response, next) {
  if (response.headersSent) {
    next(error);
    return;
  }

  const candidateStatus = error.statusCode ?? error.status;
  const statusCode = Number.isInteger(candidateStatus)
    && candidateStatus >= 400
    && candidateStatus <= 599
    ? candidateStatus
    : 500;
  const message = statusCode === 413
    ? "Request body exceeds the allowed size."
    : statusCode === 502
      ? "The AI service is temporarily unavailable."
      : statusCode >= 500
        ? "Internal server error."
        : error.message;

  const body = {
    error: { message },
  };
  if (error.requestId) body.requestId = error.requestId;

  response.status(statusCode).json(body);
}
