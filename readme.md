# Welcome to lexart_cube repository!

![ExpressJS](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white) ![Vue](https://img.shields.io/badge/Vue.js-35495E?style=for-the-badge&logo=vuedotjs&logoColor=4FC08D) ![Node](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white) ![MySQL](https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white) 

## Setting up the environment

This is a simple application to manage performances and give developers feedbacks about their progress.

### Requirements:

In order for you to be able to run it locally, you need to have installed:
- NodeJS;
- MySQL command line interface;

### Set up:
1. Clone the repository:

` git clone git@bitbucket.org:lexart/lexart-cube.git`

2. Enter the created directory:

`cd lexart_cube`

3. Create the SQL tables and fill it by running: 

`bash run.migration.sh YOUR_MYSQL_USER_NAME YOUR_MYSQL_PASSWORD`

*Important*: The script will run as admin, so you'll be required to type your system admin password.

4. Enter the **backend** folder and then, create a file called **.env**. Insert in this file your mysql connection information. Observe the **.env-template** file to know what is required.

`cd backend/ && touch .env`

5. Install the dependencies:

`npm install`

6. Start the server by running:

`npm start`

If you see a message at your console saying 'ATLAS EDUCATION - BACKEND :: 3001', it means all went well, congrats :)

7. Now we have to start the frontend, so for this, go back to the main directory and then, go to webapp folder:

`cd .. && cd webapp/`

8. Install the dependencies:

`npm i`

9. Start your local server:

`npm run serve`

10. Go to 'http://localhost:8080/' in your browser.
