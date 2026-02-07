# Zewed Jobs - Data Directory

This directory contains all structured data files for the Zewed Jobs platform.

## Files Overview

### Core Data Files

| File | Description | Format | Example Use |
|------|-------------|--------|-------------|
| `jobs.json` | Job listings with details, company info, and requirements | JSON | Displaying job cards, search functionality |
| `categories.json` | Job categories and subcategories | JSON | Filtering jobs, navigation |
| `partners.json` | Featured companies and employer partners | JSON | Partner showcase, company profiles |
| `courses.json` | Career development courses and certifications | JSON | Learning resources, skill development |
| `events.json` | Career events, webinars, and job fairs | JSON | Event calendar, registration |
| `testimonials.json` | User success stories and reviews | JSON | Social proof, homepage testimonials |
| `ads.json` | Advertising campaigns and featured listings | JSON | Ad placements, sponsored content |

### Optional Data Files
- `users.json` - User profiles (if not using external auth)
- `applications.json` - Job application tracking
- `countries.json` - African country/region data
- `skills.json` - Common skills and competency framework

## Data Structure

Each JSON file follows a consistent structure:

```json
{
  "metadata": {
    "version": "1.0",
    "lastUpdated": "2024-03-20T10:00:00Z",
    "totalRecords": 150
  },
  "data": [
    // Array of data objects
  ]
}
