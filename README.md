# Weather Service API


## Quick Start

```bash
npm install

npm run start:dev

npm run build

npm test
```



## Database & Docker

```bash
docker-compose up -d

docker-compose down
```


## Test Scripts

### PowerShell Test Script (Windows Only)
You can test the API with this PowerShell script:

```bash
./scripts/test-batch-requests.ps1
```

## Known Issues & Notes

### Memory Leak Warning
There might be a memory leak in the batch system when the app is under heavy load. You can see a TODO comment in the code about this.

### Test Quality
The tests are not perfect. There wasn't much time, so test coverage and quality are limited.

