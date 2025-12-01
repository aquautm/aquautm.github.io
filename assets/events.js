// Load and display events for admin dashboard
function loadEvents() {
    $.ajax({
        url: '/events',
        method: 'GET',
        success: function(data) {
            displayEvents(data);
        },
        error: function() {
            console.error('Failed to load events');
        }
    });
}

// Display events in the admin dashboard
function displayEvents(events) {
    const container = $('#events-list');
    container.empty();

    if (events.length === 0) {
        container.append('<p>No events or classes found.</p>');
        return;
    }

    events.forEach(event => {
        const eventDiv = `
            <div class="event-item" style="border: 1px solid #ddd; padding: 10px; margin: 10px 0;">
                <h4>${event.title} (${event.type})</h4>
                <p><strong>Description:</strong> ${event.description || 'N/A'}</p>
                <p><strong>Date:</strong> ${event.event_date}</p>
                <p><strong>Time:</strong> ${event.event_time}</p>
                <p><strong>Location:</strong> ${event.location}</p>
                <p><strong>Target:</strong> ${event.target_role}</p>
                <button onclick="deleteEvent(${event.id})" style="background: #dc3545; color: white; border: none; padding: 5px 10px; cursor: pointer;">Delete</button>
            </div>
        `;
        container.append(eventDiv);
    });
}

// Delete an event
function deleteEvent(eventId) {
    if (confirm('Are you sure you want to delete this event/class?')) {
        $.ajax({
            url: `/events/${eventId}`,
            method: 'DELETE',
            success: function() {
                loadEvents(); // Reload the list
            },
            error: function() {
                alert('Failed to delete event');
            }
        });
    }
}

// Load events when the schedule section is shown
$(document).ready(function() {
    // Assuming there's a way to detect when the schedule section is active
    // For now, load events immediately
    if ($('#events-list').length > 0) {
        loadEvents();
    }
});
