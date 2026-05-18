import type { StaticProfile } from "./types";

export const STATIC_PROFILE: StaticProfile = {
  name: "Ayham Huq",
  contact: {
    email: "ayham.huq@gmail.com",
    location: "Chicago, IL",
    phone: "817-937-9331",
    linkedin: "linkedin.com/in/ayham-huq",
    website: "ayhamhuq.com"
  },
  education: [
    {
      school: "Ohio State University",
      location: "Columbus, OH",
      degree: "Bachelor of Science in Computer Science and Engineering",
      graduation: "May 2025",
      gpa: "3.95",
      coursework: [
        "Data Structures and Algorithms",
        "Software Engineering",
        "Object-Oriented Programming"
      ]
    }
  ],
  certifications: [
    "AWS Certified Solutions Architect - Associate",
    "AWS Certified AI Practitioner - Associate"
  ],
  role_modes: ["auto", "backend", "cloud", "full_stack", "ai", "consulting"],
  employers: [
    {
      job_id: "captech",
      employer: "CapTech Ventures",
      title: "Associate Software Consultant",
      location: "Chicago, Illinois",
      dates: "07/2025 - Present"
    },
    {
      job_id: "publicis_sapient",
      employer: "Publicis Sapient",
      title: "Software Engineer Intern",
      location: "Chicago, Illinois",
      dates: "06/2024 - 08/2024"
    },
    {
      job_id: "sallie_mae",
      employer: "Sallie Mae",
      title: "Cloud Engineer Intern",
      location: "Indianapolis, Indiana",
      dates: "05/2023 - 08/2023"
    }
  ],
  allowed_projects: [
    {
      project_id: "aep_ai_safety",
      display_name: "AEP Hackathon - AI Safety Classification Tool"
    },
    {
      project_id: "mario_monogame",
      display_name: "MonoGame Mario Game"
    },
    {
      project_id: "coffee_dashboard",
      display_name: "Coffee Shop Analytics Dashboard"
    },
    {
      project_id: "travel_budgeting_app",
      display_name: "Travel Budgeting App - Kotlin / Plaid API"
    }
  ]
};

export function formatContact(profile: StaticProfile): string {
  return [
    profile.contact.location,
    profile.contact.email,
    profile.contact.phone,
    profile.contact.linkedin,
    profile.contact.website
  ].filter(Boolean).join(" | ");
}

export function formatEducation(education: StaticProfile["education"][number]): string {
  const base = [
    education.degree,
    education.school,
    education.location,
    education.graduation,
    education.gpa ? `GPA ${education.gpa}` : ""
  ].filter(Boolean).join(" | ");
  const coursework = education.coursework?.length
    ? `Coursework: ${education.coursework.join(", ")}`
    : "";
  return [base, coursework].filter(Boolean).join(" | ");
}
