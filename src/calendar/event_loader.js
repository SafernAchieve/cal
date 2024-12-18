import ICAL from "ical";
import axios from "axios";
import { DayPilot, DayPilotCalendar } from "daypilot-pro-react";

const URL = "http://localhost:4000/events"




  
export const getEvents = async (start, end) => {
    const startDate = new DayPilot.Date(start)
    const endDate = new DayPilot.Date(end)
    const response = await axios.get(`${URL}?start=${startDate}&end=${endDate}`)
    return response.data
}

