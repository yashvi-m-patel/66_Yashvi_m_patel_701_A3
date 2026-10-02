# Question 7: MERN shopping cart

Requires MongoDB.

```powershell
cd ques7
npm install
$env:MONGO_URL="mongodb://127.0.0.1:27017/shop_assignment"
npm start
```

In a second terminal:

```powershell
cd ques7/client
npm install
npm run dev
```

Open http://localhost:5177. The admin default is `admin` / `admin123`; change `ADMIN_USER`, `ADMIN_PASSWORD`, and `JWT_SECRET` for your own setup. Admin can manage parent and child categories and products. Customers can add products to a cart and place a demo order; the server calculates the total and reduces stock.