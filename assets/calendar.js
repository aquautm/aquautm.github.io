document.addEventListener('DOMContentLoaded', function() {

  var calendarEl = document.getElementById('calendar');
  
  var calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',

      events: '/api/events',

      headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,listMonth'
      },
      
      eventDidMount: function(info) {
      }
  });

  calendar.render();
  window.calendar = calendar;

  const eventForm = document.getElementById('event-form');

  if (eventForm) {
      eventForm.addEventListener('submit', function(e) {
          e.preventDefault(); 
          const formData = new FormData(eventForm);
          const data = Object.fromEntries(formData.entries());

          fetch('/api/events', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              credentials: 'include', 
              body: JSON.stringify(data)
          })
          .then(response => response.json())
          .then(result => {
              if (result.success) {
                  alert('Event added successfully!');
                  eventForm.reset();
                  window.calendar.refetchEvents();
              } else {
                  alert('Error: ' + result.message);
              }
          })
          .catch(error => {
              console.error('Error:', error);
              alert('Something went wrong contacting the server.');
          });
      });
  }
});