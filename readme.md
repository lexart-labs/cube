# Cube

![ExpressJS](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white) ![Vue](https://img.shields.io/badge/Vue.js-35495E?style=for-the-badge&logo=vuedotjs&logoColor=4FC08D) ![Node](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white) ![MySQL](https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white) 

## About the software

Cube is a comprehensive platform designed to empower developers by providing them with tools to measure performance, growth, governance, and well-being through modules such as evaluations, career planning, burnout tests, governance trees, and detailed metrics. Providing developers with the tools and resources they need to thrive not only enhances individual performance but also contributes to the overall success of development teams and projects.

It provides developers with access to a personalized dashboard where they can track and improve their performance, effectively plan their careers, and assess their well-being. Additionally, Leads and Admin accounts offer extra functionalities, such as delegating tasks to Project Managers or Human Resources for smoother team governance and management. These accounts also assist with simpler tasks like password recovery or changes.

[![IMAGE ALT TEXT HERE](https://img.youtube.com/vi/lIHMHj3SYTw/0.jpg)](https://www.youtube.com/watch?v=lIHMHj3SYTw)


The complete manual you could find in this link: https://bit.ly/3ysvXem

### Steps to run locally
- clone the repository
- enter the created directory
- create the SQL tables and fill it by running: `bash run.migration.sh YOUR_MYSQL_USER_NAME YOUR_MYSQL_PASSWORD` ~ *Important*: The script will run as admin, so you'll be required to type your system admin password.
- enter the **backend** folder and then, create a file called **.env**. Insert in this file your mysql connection information. Observe the **.env-template** file to know what is required. `cd backend/ && touch .env`
- install the dependencies:`npm install`
- start the server by running:`npm start`
- now we have to start the frontend, so for this, go back to the main directory and then, go to webapp folder: `cd .. && cd webapp/`
- install the dependencies: `npm i`
- start your local server: `npm run serve`
- go to `http://localhost:8080/` in your browser.

### Steps to run in docker
- make sure that you have docker-compose in your machine or VM
- make sure that you have your `.env` is the same as your `.env.sample` with the variables filled in
- make sure that you have your `env.js` is the same as your `env.sample.js` with the variables filled in
- in the `db/` folder you can find a seed file to import inside your mysql container
- run docker-compose up to run in your machine or docker-compose up -d in your VM