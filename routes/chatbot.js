const express = require("express");
const router = express.Router();

// Knowledge base about the AquaUTM system
const systemKnowledge = {
  general: {
    name: "AquaUTM Swimming Pool Management System",
    purpose: "A comprehensive system for managing swimming pool activities, events, tournaments, and user accounts for UTM's swimming community.",
    features: [
      "User registration and authentication with 2FA",
      "Role-based access (Admin, Athlete, Member)",
      "Event scheduling and management",
      "Tournament registration and management",
      "Profile management",
      "Announcements system",
      "Dashboard with statistics and activity tracking"
    ]
  },
  roles: {
    admin: {
      description: "Full system access including user management, event creation, and system statistics.",
      capabilities: [
        "Create and manage events",
        "Create athlete accounts",
        "View and manage all users",
        "Access system statistics and logs",
        "Manage announcements"
      ]
    },
    athlete: {
      description: "Access to training schedules, tournament registration, and personal profile.",
      capabilities: [
        "View training schedules and events",
        "Register for tournaments",
        "Update personal profile",
        "View announcements"
      ]
    },
    member: {
      description: "Basic access to events and announcements.",
      capabilities: [
        "View public events",
        "Access member dashboard",
        "View announcements"
      ]
    }
  },
  features: {
    authentication: {
      description: "Secure login system with optional 2FA",
      steps: [
        "Go to login page",
        "Enter email and password",
        "If 2FA is enabled, enter verification code from email",
        "Access your role-specific dashboard"
      ]
    },
    events: {
      description: "View and manage training schedules and events",
      admin_steps: [
        "Navigate to admin dashboard",
        "Use calendar to view events",
        "Click 'Add Event' to create new events",
        "Fill in event details (title, date, time, type, instructor, location)",
        "Save the event"
      ],
      user_steps: [
        "Go to your dashboard",
        "View upcoming events in the dashboard widget",
        "Click on events to see details",
        "Events are filtered based on your role"
      ]
    },
    tournaments: {
      description: "Register and manage swimming tournament participation",
      registration_steps: [
        "Navigate to tournaments section",
        "View active tournaments",
        "Click 'Register' for desired tournament",
        "Fill in personal details and event preferences",
        "Submit registration"
      ]
    },
    profile: {
      description: "Manage personal account settings",
      steps: [
        "Go to profile section",
        "Update personal information (name, email)",
        "Change password if needed",
        "Upload profile picture",
        "Toggle 2FA and notification settings"
      ]
    }
  }
};

// Simple chatbot responses based on keywords
function generateResponse(message) {
  const lowerMessage = message.toLowerCase();

  // Greeting responses
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return "Hello! I'm the AquaUTM assistant. I can help you learn about our swimming pool management system. What would you like to know?";
  }

  // System overview
  if (lowerMessage.includes('what is') || lowerMessage.includes('about') || lowerMessage.includes('system')) {
    return `${systemKnowledge.general.name} is ${systemKnowledge.general.purpose}. Key features include: ${systemKnowledge.general.features.join(', ')}.`;
  }

  // Roles and permissions
  if (lowerMessage.includes('role') || lowerMessage.includes('admin') || lowerMessage.includes('athlete') || lowerMessage.includes('member')) {
    if (lowerMessage.includes('admin')) {
      return `Admin role: ${systemKnowledge.roles.admin.description} Capabilities: ${systemKnowledge.roles.admin.capabilities.join(', ')}.`;
    }
    if (lowerMessage.includes('athlete')) {
      return `Athlete role: ${systemKnowledge.roles.athlete.description} Capabilities: ${systemKnowledge.roles.athlete.capabilities.join(', ')}.`;
    }
    if (lowerMessage.includes('member')) {
      return `Member role: ${systemKnowledge.roles.member.description} Capabilities: ${systemKnowledge.roles.member.capabilities.join(', ')}.`;
    }
    return "There are three user roles: Admin (full access), Athlete (training and tournaments), and Member (basic access). Which role would you like to learn more about?";
  }

  // Authentication/Login
  if (lowerMessage.includes('login') || lowerMessage.includes('sign in') || lowerMessage.includes('2fa') || lowerMessage.includes('authentication')) {
    return `Authentication: ${systemKnowledge.features.authentication.description}. Steps: ${systemKnowledge.features.authentication.steps.join('. ')}.`;
  }

  // Events
  if (lowerMessage.includes('event') || lowerMessage.includes('schedule') || lowerMessage.includes('training')) {
    if (lowerMessage.includes('create') || lowerMessage.includes('add')) {
      return `Creating events (Admin only): ${systemKnowledge.features.events.admin_steps.join('. ')}.`;
    }
    return `Viewing events: ${systemKnowledge.features.events.user_steps.join('. ')}.`;
  }

  // Tournaments
  if (lowerMessage.includes('tournament') || lowerMessage.includes('register') || lowerMessage.includes('competition')) {
    return `Tournament registration: ${systemKnowledge.features.tournaments.registration_steps.join('. ')}.`;
  }

  // Profile
  if (lowerMessage.includes('profile') || lowerMessage.includes('account') || lowerMessage.includes('settings')) {
    return `Profile management: ${systemKnowledge.features.profile.steps.join('. ')}.`;
  }

  // Announcements
  if (lowerMessage.includes('announcement') || lowerMessage.includes('news') || lowerMessage.includes('update')) {
    return "Announcements are displayed on your dashboard. Admins can create announcements to communicate important information to users.";
  }

  // Dashboard
  if (lowerMessage.includes('dashboard')) {
    return "Your dashboard shows personalized information based on your role: upcoming events, recent announcements, and role-specific statistics or management tools.";
  }

  // Help/Unknown
  if (lowerMessage.includes('help') || lowerMessage.includes('?')) {
    return "I can help you with: system overview, user roles, login process, events, tournaments, profile management, announcements, and dashboard features. What specific topic interests you?";
  }

  // Default response
  return "I'm not sure about that specific question. I can help with information about AquaUTM's features, user roles, login process, events, tournaments, and profile management. Try asking about one of these topics!";
}

// Chatbot endpoint
router.post('/message', (req, res) => {
  const { message } = req.body;

  if (!message || message.trim() === '') {
    return res.json({ response: "Please ask me something about the AquaUTM system!" });
  }

  const response = generateResponse(message.trim());

  // Add a delay of 2-3 seconds before responding
  const delay = Math.random() * 1000 + 2000; // Random delay between 2000ms and 3000ms
  setTimeout(() => {
    res.json({ response });
  }, delay);
});

module.exports = router;
