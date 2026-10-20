export function validate(schema, property = 'body') {
  return (request, _response, next) => {
    const { error, value } = schema.validate(request[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      error.statusCode = 400;
      return next(error);
    }

    if (property === 'query') request.validatedQuery = value;
    else request[property] = value;
    return next();
  };
}
