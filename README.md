# Automate scanner

**A small project to get and store all the data from the [automate community](https://llamalab.com/automate/community/)** 

### Requirements

- Node.js
- Yarn
- Mysql or Mongodb


### How to install

- Clone this repository
- Install the dependencies by running the `yarn` command in the project main directory
- Configure the DB access and the options in the `config.js` file
    - The DB must exist in Mysql
    - If the tables "flows" and "reviews" already exist, they will be deleted and recreated during the setup, each time the script starts
        - This means that the data is lost each time you launch the app
- Start with `node app.js`


### TODO

- Make the request in `query-flow.js`
- Save the queried data in the DB
- Make a backup file of the DB when finished
- Split the DB management in a separated node

_Made by cefadrom, [https://cefadrom.com/](https://cefadrom.com/)_
