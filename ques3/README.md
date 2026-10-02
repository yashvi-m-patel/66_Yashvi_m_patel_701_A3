# Question 3: Redis-backed sessions

Start Redis first, then run:

```powershell
cd ques3
npm install
$env:REDIS_URL="redis://localhost:6379"
npm start
```

Open http://localhost:3003. Demo login: `student` / `pass123`. Login protects `/profile` and `/courses`; logout destroys the Redis session. A local Redis server or Redis-compatible service is required.