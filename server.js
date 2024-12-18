const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const WebSocket = require('ws');
const ICAL = require('ical')


const app = express();
const server = http.createServer(app); // Create an HTTP server using Express


app.use(cors({
  origin: '*',
}));




app.get('/events', async (req, res) => {
  const URL = "https://achieverooms.skedda.com/ical?k=eB-6EIgw0y8kUatcEd793SMsgYayCgku&i=574591"
  const response = await fetch(URL)
  const events = ICAL.parseICS( await response.text())
  const startDate = new Date(req.query.start)
  const end = new Date(req.query.end)
  end.setHours(23)
  end.setMinutes(59)
  end.setSeconds(59)
  const entries = Object.values(events)
  const filtered = entries.filter((entry) => {
    if (entry.type === "VEVENT") {
      return startDate <= (new Date(entry.start)) && end >= (new Date(entry.start))
    }
  })
  res.status(200).json(filtered)

});


const PORT = process.env.PORT || 4000; // Use the correct port from Azure or fallback to 4000
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
