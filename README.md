# Full-stack assignments

Each `quesN` folder is an independent project. Install its dependencies in that folder before running it.

| Folder | Project | Run command | App URL |
| --- | --- | --- | --- |
| `ques1` | Express/EJS registration, validation, image upload and download | `cd ques1; npm install; npm start` | http://localhost:3001 |
| `ques2` | Express login with file sessions | `cd ques2; npm install; npm start` | http://localhost:3002 |
| `ques3` | Express login with Redis sessions | Start Redis, then `cd ques3; npm install; npm start` | http://localhost:3003 |
| `ques4` | MongoDB ERP admin and employee CRUD | Start MongoDB, then `cd ques4; npm install; npm start` | http://localhost:3004 |
| `ques5` | JWT employee portal | Start MongoDB; see `ques5/README.md` | http://localhost:5175 |
| `ques6` | Open-Meteo weather utility | `cd ques6/client; npm install; npm run dev` | http://localhost:5176 |
| `ques7` | MERN shop and cart | Start MongoDB; see `ques7/README.md` | http://localhost:5177 |
| `ques8` | Sequelize student CRUD | Run API and React commands in `ques8/README.md` | http://localhost:5178 |

React projects use two terminals: one for the Express API where required, and one for the Vite client. Database, Redis, email, and demo login details are documented in the individual READMEs.