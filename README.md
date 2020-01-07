# Automate scanner

**A small project to get and store all the data from the [automate community](https://llamalab.com/automate/community/)** 

## Requirements

- Node.js
- Mysql or Mongodb


## How to use

### Installation

- Clone this repository
- Install the dependencies by running the `npm` command in the project main directory

### Run - CLI

- Configure the DB access and the options in the `config.js` file
    - The DB must exist in Mysql
    - If the tables "flows" and "reviews" already exist, they will be deleted and recreated during the setup, each time the script starts
        - This means that the data is lost each time you launch the app
- Start with `node app.js`

### Run - web interface

- Todo


### TODO

- Optimize workers
- Web UI
- Better errors management
- Make a backup file of the DB when finished
- Support mongoDB

_Made by cefadrom, [https://cefadrom.com/](https://cefadrom.com/)_
