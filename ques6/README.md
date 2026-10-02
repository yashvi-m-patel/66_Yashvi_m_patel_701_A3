# Question 6: Weather API utility

Uses the free Open-Meteo geocoding and forecast APIs; no API key is needed.

```powershell
cd ques6/client
npm install
npm run dev
```

Open the Vite URL shown in the terminal (usually http://localhost:5176). The frontend has separate controls for calling Open-Meteo directly and calling the Express endpoint. To serve a production build with Express:

```powershell
cd ques6/client
npm run build
cd ..
npm install
npm start
```

Express runs on http://localhost:3006. Node.js 18 or newer is required for built-in `fetch`.