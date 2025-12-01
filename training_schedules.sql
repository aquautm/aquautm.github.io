

use aquautm;


--create schedules table
CREATE TABLE schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    start_date DATETIME NOT NULL, 
    target_role ENUM('all', 'member', 'athlete') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);