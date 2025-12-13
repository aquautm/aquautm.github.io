# TODO: Add Class Schedule Feature

## Database Changes
- [ ] Alter schedules table to add new columns: type ENUM('event', 'class') DEFAULT 'event', instructor VARCHAR(255), location VARCHAR(255), description TEXT.

## Backend Updates
- [ ] Update app.js GET /api/events to include new fields in SELECT and response.
- [ ] Update app.js POST /api/events to handle new fields in INSERT.
- [ ] Update app.js PUT /api/events to handle new fields in UPDATE.

## Frontend Admin Updates
- [ ] Update admin-dashboard.html: Add type select in "Add New Event" form.
- [ ] Add conditional fields for instructor, location, description when type='class'.

## Calendar JS Updates
- [ ] Update calendar.js: Add variables for new input fields.
- [ ] Handle new fields in form submission.
- [ ] Populate new fields on edit.
- [ ] Display additional details in event modal for classes.

## Testing
- [ ] Test creating a class in admin dashboard.
- [ ] Verify class appears in athlete schedule with details.
- [ ] Test editing and deleting classes.
