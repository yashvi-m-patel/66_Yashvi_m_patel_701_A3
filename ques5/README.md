# Question 5: Employee JWT site

Requires MongoDB and employee records created by Q4. Q4 and Q5 use the `erp_assignment` database by default.

```powershell
cd ques5
npm install
$env:MONGO_URL="mongodb://127.0.0.1:27017/erp_assignment"
npm start
```

In a second terminal:

```powershell
cd ques5/client
npm install
npm run dev
```

Open http://localhost:5175 and log in with the employee ID and generated password from Q4. The API runs on port 3005. The site has profile and leave pages and logout.