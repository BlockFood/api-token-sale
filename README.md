# api-token-sale

This API is meant for the pre-sale and token sale process. Its goal is to securely store applications for the whitelisting process.

**It is not meant to be used as a public API.** The API is published here for transparency only.

All applications done through [https://blockfood.io/pre-sale](https://blockfood.io/pre-sale) will generate a new entry in the server, with the following format:

```
{
  "publicId": String,
  "privateId": String,
  
  "email": String,
  "firstName": String,
  "lastName": String,
  "country": String,
  
  "isLocked": Boolean
}
```

- ```publicId``` is used on the [pre-sale smart contract](https://github.com/BlockFood/smart-contract-pre-sale) and is visible to anyone as it is stored on the Ethereum blockchain
- ```privateId``` is sent only to the applicant through an email and is the only way to retrieve applicant's data

## Public routes

### GET /pre-sale/new

This route is the first step of the process. It must be called with an URL encoded query with an email parameter.

Example: ```GET /pre-sale/new?email=foo@bar```

Response: ```200 - OK```

After receiving this request, the API generates the skeleton for the new application and sends a mail to the provided address with a private link to the next step of the process.

### POST /pre-sale/edit/:privateId

This route is the second step of the process. It must be called with the privateId in the URL and with the following fields :

- firstName: String
- lastName: String
- country: String

The identity document should be attached to the query:

- idCard: Image

Example:
```
POST /pre-sale/edit/foo
    .field('firstName', 'what')
    .field('lastName', 'what')
    .field('country', 'what')
```

Response: ```200 - OK```

### GET /pre-sale/lock/:privateId

This route locks the application and is mandatory before calling the pre-sale smart contract.

Example: ```GET /pre-sale/lock/foo```

Response: ```200 - OK```

### GET /pre-sale/review/:privateId

This route returns the data stored for the corresponding applicant.

Example: ```GET /pre-sale/review/foo```

Response: 
```
200 - {
    "publicId" : "publicFoo",
    "privateId" : "foo",
    "email" : "foo@bar",
    "firstName" : "foo",
    "lastName" : "foo",
    "country" : "foo",
    "isLocked" : true
}
```

## Private routes

Private routes are not declared on the public API endpoint. A separate process is launched on the server and an SSH tunnel is mandatory to access those routes.

### GET /admin/pre-sale/review/:publicId

This route is used by BlockFood to retrieve the data related to an application.

Example: ```GET /admin/pre-sale/review/publicFoo```

Response:
```
200 - {
    "publicId" : "publicFoo",
    "privateId" : "foo",
    "email" : "foo@bar",
    "firstName" : "foo",
    "lastName" : "foo",
    "country" : "foo",
    "isLocked" : true
}
```

## Dev

### Prerequisite

1. Install Node.js 8+

2. At the root of the project, run:

```bash
npm install
```

### Test

1. Run:

```bash
npm test
```

### Launch

1. Make sure you have a running instance of mongoDB accessible at mongodb://127.0.0.1:27017/

2. In dev environment, run:
```bash
# public API
npm start -- --debug

# private API
npm run start:private
```

3. In production environment, run:
```bash
# public API
npm start

# private API
npm run start:private
```
