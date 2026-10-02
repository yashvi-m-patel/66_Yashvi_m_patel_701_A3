# Question 2: File-backed sessions

```powershell
cd ques2
npm install
npm start
```

Open http://localhost:3002. Demo login: `student` / `pass123`. Login protects `/profile` and `/courses`; logout destroys the session. Session files are saved in `sessions/`.