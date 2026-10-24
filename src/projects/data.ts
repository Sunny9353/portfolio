import type { ArtKind } from './art'

/** A visual is either a photo/screenshot (src) or a drawn figure (art). */
export interface CaseImage {
  src?: string
  art?: ArtKind
  alt: string
  caption: string
}

export interface Project {
  slug: string
  title: string
  /** shown in the case-study pills */
  tags: string[]
  role: string
  timeline: string
  year: string
  team: string
  /** thumbnail for the Selected Projects list and the case-study cover: a screenshot or a drawn figure */
  cover: { src?: string; art?: ArtKind; alt: string }
  intro: string
  myRole: string[]
  approach: Array<{ title: string; text: string }>
  scope: Array<{ n: string; label: string }>
  images: CaseImage[]
  /** honest limits and current status: what is finished, what is not */
  status: string[]
  links?: Array<{ label: string; href: string }>
}

export const PROJECTS: Project[] = [
  {
    slug: 'shadow-falcons',
    title: 'Shadow Falcons',
    tags: ['Computer Vision', 'Object Detection', 'Drone Control', 'Research'],
    role: 'Detection model · Drone flight software',
    timeline: 'Feb 2026 – Present',
    year: '2026',
    team: '4-member student team',
    cover: {
      art: 'falcons-pipeline',
      alt: 'Diagram: the drone streams video to a ground station running three models, three filters turn detections into a threat level, and a human operator decides',
    },
    intro:
      'Shadow Falcons is a layered public-safety system: smart CCTV detects and tags a threat, a palm-sized drone flies to the zone to check blind spots and stream evidence, and an authorised human operator decides what happens next. I built the weapon detector and the flight software, and the project won first prize at three consecutive expos, including INSPIRA ’26 at IIT Hyderabad.',
    myRole: [
      'Trained the custom YOLOv8 weapon detector on a dataset of roughly 137,000 labelled firearm and knife images.',
      'Built the real-time pipeline: three YOLO models on a Wi-Fi video stream, run off-board so full-size models can work against a palm-sized drone.',
      'Designed the three-filter false-alarm logic and the tactical HUD that grades every frame HIGH, MEDIUM or LOW.',
      'Wrote the take-off, hover and landing sequence for a LiteWing ESP32-S3 airframe over the Crazyflie CRTP protocol, with a watchdog that cuts the motors if the link drops.',
      'Co-authored the IEEE-format research paper.',
    ],
    approach: [
      {
        title: 'Frame the problem',
        text: 'CCTV is passive: it records incidents after they escalate. The system had to detect early, verify quickly, keep evidence, and escalate only through an authorised human.',
      },
      {
        title: 'Detect',
        text: 'A YOLOv8 detector for guns and knives, a segmentation model that outlines every person, and a third model that finds screens, all running on the live stream.',
      },
      {
        title: 'Reject false alarms',
        text: 'A weapon on a TV, a poster or a phone is not a threat. Three filters sit between detection and alert: screen-overlap rejection, weapon-to-person association and a three-frame confirmation.',
      },
      {
        title: 'Fly and stream',
        text: 'The drone only flies and streams. All intelligence runs on the ground station, which is what lets full-size models work against an aircraft that weighs almost nothing.',
      },
    ],
    scope: [
      { n: '~137K', label: 'labelled images behind the weapon detector' },
      { n: '~82%', label: 'mAP@50 reported in the project paper' },
      { n: '~74%', label: 'recall on the weapon detector' },
      { n: '3–5', label: 'frames per second live on CPU, three models per frame' },
    ],
    images: [
      {
        art: 'falcons-pipeline',
        alt: 'Diagram of the Shadow Falcons detection pipeline',
        caption:
          'How a frame becomes a decision: drone video to the ground station, three models, three false-alarm filters, a threat level on the HUD, and a human operator at the end.',
      },
    ],
    status: [
      'Detects and reports visible weapons only. It takes no action on what it finds, and escalation is human-in-the-loop by design. Concealed weapons are not claimed.',
      'Recall is about 74%, so roughly one in four true weapons is missed. The stated pilot targets are mAP@50 of at least 0.85 and at least 15 FPS on edge hardware.',
      'Flight is a timed open-loop sequence with no altitude hold or obstacle avoidance. The airframe is the open-hardware LiteWing; my work is the flight software on top of it and the detection side.',
    ],
  },
  {
    slug: 'swach-mysuru-abhyan',
    title: 'Swach Mysuru Abhyan',
    tags: ['Computer Vision', 'Semantic Segmentation', 'FastAPI', 'Flutter'],
    role: 'Model · API · Flutter client · Data pipeline',
    timeline: '2026 – Present',
    year: '2026',
    team: 'Internship project team',
    cover: {
      src: '/projects/swach-mysuru-abhyan/test-3.jpg',
      alt: 'Dashcam frame on a country road with two roadside waste regions outlined and a cleanliness score of 0 out of 100',
    },
    intro:
      'An offline dashcam-video platform that finds visible roadside waste, stabilises detections over time, and turns them into an explainable cleanliness score with a recommended action. A FastAPI service does the analysis and one Flutter client runs on Windows and Android. A second domain, footpath encroachment, has its data pipeline built and is waiting on annotation.',
    myRole: [
      'Trained a DeepLabV3-MobileNetV3 waste segmentation model and added temporal stabilisation so detections do not flicker frame to frame.',
      'Built the scoring and reasoning layer: a 0–100 cleanliness score, the worst scene, the main driver and an urgent-or-routine recommended action.',
      'Shipped a FastAPI service with an async job queue and upload validation, and a responsive Flutter client for Windows and Android with a one-click launcher.',
      'Wrote 26 automated test modules covering scoring, stabilisation, dataset conversion and the API workflow.',
      'Built the footpath data pipeline: a frozen 9-class YOLO11-seg label scheme, deterministic frame extraction, machine-proposal seeding behind a four-gate filter, and annotation kits for a three-person team.',
    ],
    approach: [
      {
        title: 'Pick the right model',
        text: 'Waste is one amorphous region, not a set of countable objects. YOLO instance segmentation was unstable and kept collapsing in training, so the decision log moved to binary semantic segmentation.',
      },
      {
        title: 'Make detections trustworthy',
        text: 'Raw frame-by-frame output flickers. A temporal stabiliser holds and confirms events, and every result carries a confidence grade and its scope.',
      },
      {
        title: 'Explain the score',
        text: 'The cleanliness score is built from waste coverage and location, and the report says what drove it, where the worst scene was and what to do about it.',
      },
      {
        title: 'Ship it',
        text: 'One launcher starts the API, checks the model, and opens the packaged desktop client. No separate backend terminal, no Flutter SDK needed to run it.',
      },
    ],
    scope: [
      { n: '1,456', label: 'frames analysed, taken from about an hour of dashcam video' },
      { n: '4', label: 'further test videos scored end to end, about 30 seconds each' },
      { n: '0/11', label: 'false positives on reviewed clean frames' },
      { n: '26', label: 'automated test modules' },
    ],
    images: [
      {
        src: '/projects/swach-mysuru-abhyan/test-3.jpg',
        alt: 'Test video 3: two roadside waste regions outlined on a country road',
        caption: 'Test video 3: two waste regions outlined, coverage 10.3%, score 0 out of 100 and the action to clean up the traffic-exposed waste first.',
      },
      {
        src: '/projects/swach-mysuru-abhyan/test-1.jpg',
        alt: 'Test video 1: a small waste region on a village lane',
        caption: 'Test video 1: a smaller case on a village lane. Coverage 2.6%, score 40.3, action: dispatch a cleanup team and verify after removal.',
      },
      {
        src: '/projects/swach-mysuru-abhyan/test-2.jpg',
        alt: 'Test video 2: a large waste region beside the road',
        caption: 'Test video 2: a large region beside a tarred road, coverage 26%, with the outline following the dump rather than a box.',
      },
      {
        src: '/projects/swach-mysuru-abhyan/test-4.jpg',
        alt: 'Test video 4: waste spread along a roadside',
        caption: 'Test video 4: waste spread along the verge, coverage 23%. The overlay always states its scope: a route-fit demo, not a generalisation claim.',
      },
    ],
    status: [
      'Waste domain: complete. The model is fit to the routes it was built on and makes no claim about unseen scenes. On the review set it found 13 of 13 waste frames with 0 of 11 false positives.',
      'Footpath encroachment: data pipeline and annotation kits are done. There is no trained model, API route or app screen yet; it is waiting on the annotation team.',
      'Road-damage scoring is deferred because the supplied footage had no labelled road damage.',
    ],
  },
  {
    slug: 'arc-labs',
    title: 'ARC Labs',
    tags: ['Full-Stack', 'Payments', 'SEO', 'Desktop App'],
    role: 'Full-stack developer',
    timeline: 'Jun 2026 – Present',
    year: '2026',
    team: 'Solo developer · client project',
    cover: {
      src: '/projects/arc-labs/home.jpg',
      alt: 'ARC Labs home page with a dark robot hero and the headline India’s Practical System for AI + IIoT Lab Institutions',
    },
    intro:
      'arclabs.in is the website and business system for a Hyderabad company that sets up AI and industrial-IoT labs in institutions across India. I delivered it end to end: the public site, a booking and checkout flow, an admin CRM, and an internal operations portal that ships as an auto-updating desktop app.',
    myRole: [
      'Built the site and admin CRM dashboard on React, Express and Firebase (Auth, Firestore, Cloud Functions), deployed with Git-based continuous delivery on Vercel.',
      'Integrated Razorpay payments, email notifications and QR and PDF generation for a self-serve booking and checkout flow.',
      'Implemented the SEO and social-sharing layer: canonical URLs, Open Graph, Twitter Cards and structured data, on a hub-and-spoke page structure.',
      'Built a mobile-first 3D interface, including the 3D robot hero.',
      'Built the internal ops portal, 22 pages covering payroll, P&L, sales CRM and invoicing, as an auto-updating Tauri desktop app.',
    ],
    approach: [
      {
        title: 'Understand the business',
        text: 'Programs, internships, lab packages and industrial-IoT solutions sell differently. The site is organised into hubs with deep pages under each, so every offering has a clear route.',
      },
      {
        title: 'Build it as a system',
        text: 'A React front end, an Express API and Firebase services behind it, with Git-based deploys so every change ships the same way.',
      },
      {
        title: 'Make it sell',
        text: 'A visitor can book and pay without a phone call: Razorpay checkout, confirmation emails, and QR codes and PDFs generated for the order.',
      },
      {
        title: 'Make it findable',
        text: 'Per-page titles and descriptions, structured data for courses, FAQs, services and the local business, and consistent business details across the site.',
      },
    ],
    scope: [
      { n: '52', label: 'indexable pages in a hub-and-spoke structure' },
      { n: '22', label: 'pages in the internal operations portal' },
      { n: '1', label: 'checkout flow: booking, payment, email, QR and PDF' },
    ],
    images: [
      {
        src: '/projects/arc-labs/home.jpg',
        alt: 'ARC Labs home page',
        caption: 'The live home page at arclabs.in, with the 3D robot hero.',
      },
    ],
    status: [
      'Live in production at arclabs.in. The admin CRM and the operations portal are private to the client, so they are not shown.',
    ],
    links: [{ label: 'Visit arclabs.in', href: 'https://arclabs.in' }],
  },
  {
    slug: 'ai-ml-learning-platform',
    title: 'AI/ML Learning Platform',
    tags: ['Full-Stack', 'Supabase', 'Gamification', 'Education'],
    role: 'Full-stack developer',
    timeline: 'Sep – Oct 2026',
    year: '2026',
    team: 'Solo developer',
    cover: {
      src: '/projects/ai-ml-learning-platform/dashboard.jpg',
      alt: 'AI/ML Roadmap student dashboard with points, streak, an up-next card and the 30-day calendar grouped by phase',
    },
    intro:
      'A gamified, day-by-day platform built around a 30-day AI/ML mentorship roadmap. Each day unlocks a class, a quiz and either an in-browser Python challenge or a timed test, with points, streaks, badges and a mentor dashboard that tracks real activity. It is live on Vercel.',
    myRole: [
      'Built the React, TypeScript and Tailwind front end: article reader, quiz flow, code editor, points shop and mentor dashboard.',
      'Designed the Supabase backend: PostgreSQL schema with nine migrations and eight Edge Functions that verify every score, timer and point on the server.',
      'Added in-browser Python challenges with Pyodide (numpy, pandas, scikit-learn), graded against hidden assertions with no server-side code execution.',
      'Built the mentor view: time studied, scores, completion and points over time, plus a login and logout activity log.',
    ],
    approach: [
      {
        title: 'Design the day',
        text: 'An article with a live reading timer, then a one-question-at-a-time quiz, then a coding challenge or a timed test, then an optional bonus. Finishing a day unlocks the next.',
      },
      {
        title: 'Never trust the browser',
        text: 'All grading, timing and point math happens in Edge Functions using the service role. The client only ever sees results, so scores cannot be forged.',
      },
      {
        title: 'Run code safely',
        text: 'Python runs in the learner’s browser through Pyodide and is checked against hidden assertions, so there is nothing to install and nothing executing on a server.',
      },
      {
        title: 'Keep learners coming back',
        text: 'Streaks, badges, streak-freeze tokens and a points shop, with a nightly rollover that decays points on missed days while leaving the day open to finish late.',
      },
    ],
    scope: [
      { n: '30', label: 'days of structured curriculum' },
      { n: '8', label: 'Edge Functions verifying every score and point' },
      { n: '9', label: 'SQL migrations' },
      { n: '4', label: 'stages per day: article, quiz, challenge or test, bonus' },
    ],
    images: [
      {
        src: '/projects/ai-ml-learning-platform/dashboard.jpg',
        alt: 'Student dashboard',
        caption: 'Student dashboard: points, streak, the next day and the 30-day roadmap in phases, with boss days marked by a crown.',
      },
      {
        src: '/projects/ai-ml-learning-platform/lesson.jpg',
        alt: 'A lesson page with a class progress bar and a runnable code cell',
        caption: 'A lesson: a fun intro, a class-time bar that fills as the student reads, and a code cell that runs in the browser.',
      },
      {
        src: '/projects/ai-ml-learning-platform/trophies.jpg',
        alt: 'Trophy room with unlocked and locked badges',
        caption: 'The trophy room: bronze, silver and gold badges earned by streaks, perfect quizzes and finished phases. Screens use demo data.',
      },
    ],
    status: [
      'Live on Vercel at ai-ml-learning-platform.vercel.app. Real student and mentor screens sit behind a login, so the screenshots here were taken from a demo build with sample data.',
    ],
    links: [{ label: 'Visit the live site', href: 'https://ai-ml-learning-platform.vercel.app' }],
  },
]

export const findProject = (slug: string) => PROJECTS.find((p) => p.slug === slug)
