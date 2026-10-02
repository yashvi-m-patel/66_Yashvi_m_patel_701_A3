# Question 4: ERP employee admin

Requirements: Node.js and MongoDB. Configure SMTP to send real employee emails; without SMTP the generated credentials are printed in the terminal and displayed once after insertion.

```powershell
cd ques4
npm install
$env:MONGO_URL="mongodb://127.0.0.1:27017/erp_assignment"
$env:ADMIN_USER="admin"
$env:ADMIN_PASSWORD="admin123"
npm start
```

Open http://localhost:3004. Default admin login is `admin` / `admin123`. For email, set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and optionally `SMTP_FROM` and `SMTP_SECURE`. Employee passwords are bcrypt-hashed. Salary is calculated as basic + allowance - deduction.