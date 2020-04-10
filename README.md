# Bttr Server

![GitHub issue](https://img.shields.io/github/issues/NYDino/bttr-server)
![GitHub forks](https://img.shields.io/github/forks/NYDino/bttr-server)
![GitHub stars](https://img.shields.io/github/stars/NYDino/bttr-server)
![GitHub license](https://img.shields.io/github/license/NYDino/bttr-server)
![Twitter](https://img.shields.io/twitter/url?style=social&url=https%3A%2F%2Ftwitter.com%2FiNYD5)

Back-end of the bttr project with Node.js, Express and MongoDB.

## Installation

Use the [docker](https://www.docker.com/get-started) to install MongoDB.

```bash
docker pull mongo
```
```bash
docker run --name bttrdb -p 27017:27017 -d mongo
```

Use the package manager [yarn](https://yarnpkg.com/en/) to install the necessary libs and run the project.

```bash
yarn install
```
```bash
yarn dev
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[MIT](https://choosealicense.com/licenses/mit/)