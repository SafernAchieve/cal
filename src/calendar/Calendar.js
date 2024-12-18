import React, { useState, useEffect, useRef } from "react";
import { DayPilot, DayPilotCalendar } from "daypilot-pro-react";
import { getEvents } from "./event_loader";
import resources_obj from "./resources";

const Calendar = () => {
  const [selectedPurpose, setSelectedPurpose] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [startDate, setStartDate] = useState("2024-12-16");
  const [endDate, setEndDate] = useState("2024-12-25");
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(1); 
  const [config, setConfig] = useState({
    locale: "en-us",
    columnWidthSpec: "Auto",
    viewType: "Resources",
    headerLevels: 1,
    headerHeight: 30,
    cellHeight: 30,
    crosshairType: "Header",
    showCurrentTime: false,
    // eventArrangement: "Cascade",
    allowEventOverlap: true,
    timeRangeSelectedHandling: "Enabled",
    onTimeRangeSelected: async (args) => {
      const modal = await DayPilot.Modal.prompt(
        "Create a new event:",
        "Event 1"
      );
      const dp = args.control;
      dp.clearSelection();
      if (modal.canceled) {
        return;
      }

      const newEvent = {
        id: DayPilot.guid(),
        start: args.start,
        end: args.end,
        text: modal.result,
        resource: args.resource,
      };
      setEvents((prevEvents) => [...prevEvents, newEvent]);
    },
    eventDeleteHandling: "Disabled",
    eventMoveHandling: "Update",

    onEventMoved: (args) => {
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === args.e.id()
            ? {
                ...event,
                start: args.newStart,
                end: args.newEnd,
                resource: args.newResource,
              }
            : event
        )
      );
    },
    eventResizeHandling: "Update",
    onEventResized: (args) => {
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === args.e.id()
            ? { ...event, start: args.newStart, end: args.newEnd }
            : event
        )
      );
    },
    eventClickHandling: "Disabled",
    eventHoverHandling: "Disabled",
  });

  const calendarRef = useRef(null);
  const loadEvents = async () => {
    const events = await getEvents(startDate, endDate);
    console.log(
      events
        .map((e) => e.resources)
        .filter((value, index, self) => self.indexOf(value) === index)
    );
    const e = events.map((event) => ({
      start: new DayPilot.Date(event.start),
      end: new DayPilot.Date(event.end),
      text: event.summary,
      id: event.uid,
      resource: event.resources,
    }));
    setEvents(e);
    setSelectedEvents(
      e)
  };

  useEffect(() => {
    daysResources();
  }, []);

  useEffect(() => {
    loadEvents();
  }, []);

  const initializeResources = (date, purpose = "All", location = "All") => {
    const resources = resources_obj.map((resource) => ({
      ...resource,
      start: date,
    }));

    return resources.filter((resource) => {
      return (
        (purpose === "All" || resource.purpose === purpose) &&
        (location === "All" || resource.location === location)
      );
    });
  };

  const handlePurposeChange = (e) => {
    setSelectedPurpose(e.target.value);
  };

  const handleLocationChange = (e) => {
    setSelectedLocation(e.target.value);
  };

  const applyResourceFilter = () => {
    const date = new Date();
    const filteredResources = initializeResources(
      date,
      selectedPurpose,
      selectedLocation
    );

    // setConfig((prevConfig) => ({
    //   ...prevConfig,
    //   columns: filteredResources.map((resource) => ({
    //     name: resource.name,
    //     id: resource.id,
    //   })),
    // }));
    loadEvents();
    daysResources();

    // const mondays = getMondaysInRange("2024-11-29", "2025-06-01");
    // console.log(mondays);
  };

  function getMondaysInRange(startDate, endDate) {
    const mondays = [];
    let currentDate = new DayPilot.Date(startDate);
    const end = new DayPilot.Date(endDate);

    // Adjust 'currentDate' to the first Monday in the range
    const dayOfWeek = currentDate.getDayOfWeek();
    const daysToAdd = (1 - dayOfWeek + 7) % 7; // Calculate days to add to reach Monday
    currentDate = currentDate.addDays(daysToAdd);

    // Collect all Mondays within the range
    while (currentDate <= end) {
      mondays.push(currentDate.toString());
      currentDate = currentDate.addDays(7); // Move to the next Monday
    }

    return mondays;
  }

  

  const daysResources = () => {
    const columns = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23,59,59)
    const daysDifference =
      Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

    // Get all events that fall within the date range
    const allEvents = events/*.filter((event) => {
      const eventDate = new Date(event.start);
      return eventDate >= start && eventDate <= end;
    });*/

    for (let i = 0; i < daysDifference; i++) {
      const currentDay = new Date(start);
      currentDay.setDate(start.getDate() + i);
      const dayResources = initializeResources(
        currentDay,
        selectedPurpose,
        selectedLocation
      );

      columns.push({
        id: i,
        name: currentDay.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        children: dayResources,
      });
    }

    setConfig({
      ...config,
      columnWidthSpec: "Fixed",
      columnWidth: 120,
      columns,
      headerLevels: 2,
      events: allEvents,
    });
  };
  const endDateTillMidnight = new Date(endDate)
  endDateTillMidnight.setHours(23,59,59)

const adjustZoom = (delta) => {
  setZoomLevel((prev) => {
    const newZoom = Math.min(Math.max(prev + delta, 0.2), 2); // Zoom between 0.5x and 2x
    return newZoom;
  });
};

useEffect(() => {
  // Update column and cell sizes when zoom changes
  setConfig((prevConfig) => ({
    ...prevConfig,
    columnWidth: 140 * zoomLevel,
    cellHeight: 30 * zoomLevel,
  }));
}, [zoomLevel]);


  return (
    <div>
          <button onClick={() => adjustZoom(0.1)}>Zoom In</button>
      <button onClick={() => adjustZoom(-0.1)}>Zoom Out</button>
      <p>Current Zoom: {zoomLevel.toFixed(1)}x</p>
      <div className={"space"}>
        Resources view:
        <label>
          <input name="view" type={"radio"} checked onClick={daysResources} />{" "}
          Days/resources
        </label>
        <div>
          <label>
            Start Date:{" "}
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
        </div>
        <div>
          <label>
            End Date:{" "}
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>
        </div>
        <label>
          Purpose:
          <select onChange={handlePurposeChange} value={selectedPurpose}>
            <option value="All">All</option>
            <option value="Play">Play</option>
            <option value="Couple">Couple</option>
            <option value="Individual">Individual</option>
            <option value="Conference Room">Conference Room</option>
          </select>
        </label>
        <label>
          Location:
          <select onChange={handleLocationChange} value={selectedLocation}>
            <option value="All">All</option>
            <option value="RP">RP</option>
            <option value="CC">CC</option>
            <option value="Airmont">Airmont</option>
            <option value="SRR">SRR</option>
            <option value="WC">WC</option>
          </select>
        </label>
        <input
          name="view"
          type="button"
          onClick={applyResourceFilter}
          value="Search"
        />
      </div>
      <DayPilotCalendar
        {...config}
        ref={calendarRef}
        events={selectedEvents}
        startDate={startDate}
        endDate={endDateTillMidnight}
        idField="id"
        startField="start"
        endField="end"
        resourceField="resource"
      />
    </div>
  );
};

export default Calendar;
