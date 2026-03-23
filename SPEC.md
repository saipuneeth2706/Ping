# Ping Landing Page Specification

## Project Overview
- **Project Name**: Ping Landing Page
- **Type**: Marketing Landing Page
- **Core Functionality**: High-converting landing page for Ping email client app
- **Target Users**: Busy professionals, students, anyone overwhelmed by traditional email

## UI/UX Specification

### Layout Structure
- **Sections**: 
  1. Navigation (sticky)
  2. Hero Section
  3. Features Section
  4. How It Works
  5. Testimonials
  6. Footer with Final CTA
- **Grid**: Responsive flex/grid layout
- **Breakpoints**: Mobile (<640px), Tablet (640-1024px), Desktop (>1024px)

### Visual Design

#### Color Palette
- **Background (Light)**: `#FAFBFC` (crisp white)
- **Background (Dark)**: `#0D1117` (deep dark)
- **Primary Accent**: `#10B981` (emerald green)
- **Primary Hover**: `#059669` (darker emerald)
- **Secondary**: `#6366F1` (indigo for variety)
- **Text Primary (Light)**: `#111827`
- **Text Primary (Dark)**: `#F9FAFB`
- **Text Secondary (Light)**: `#6B7280`
- **Text Secondary (Dark)**: `#9CA3AF`
- **Card Background (Light)**: `#FFFFFF`
- **Card Background (Dark)**: `#161B22`
- **Border (Light)**: `#E5E7EB`
- **Border (Dark)**: `#30363D`

#### Typography
- **Font Family**: "Outfit" (headings), "DM Sans" (body) - Google Fonts
- **Hero Headline**: 56px desktop / 36px mobile, font-weight 800
- **Section Titles**: 40px desktop / 28px mobile, font-weight 700
- **Body**: 18px, font-weight 400
- **Small Text**: 14px

#### Spacing System
- **Section Padding**: 96px vertical desktop / 64px mobile
- **Container Max Width**: 1200px
- **Component Gap**: 24px
- **Card Padding**: 32px

#### Visual Effects
- **Border Radius**: 16px (cards), 12px (buttons), 9999px (pills)
- **Shadows (Light)**: `0 4px 24px rgba(0,0,0,0.08)`
- **Shadows (Dark)**: `0 4px 24px rgba(0,0,0,0.4)`
- **Transitions**: 300ms ease for all interactive elements

### Components

#### Navigation
- Logo (Ping text + bell icon)
- Dark mode toggle (sun/moon icons)
- CTA button

#### Hero Section
- Large headline with gradient text effect
- Subheadline paragraph
- Primary CTA button with arrow icon
- Hero image placeholder showing Gmail → Ping transformation

#### Features Cards (3)
- Icon for each feature
- Title
- Description
- Hover: slight lift + shadow increase

#### How It Works Steps (3)
- Step number badge
- Icon
- Title
- Description
- Connecting line between steps

#### Testimonials (3)
- Avatar placeholder
- Quote text
- Name and title
- Star rating

#### Footer
- Final CTA section
- Social links (Twitter/X, GitHub)
- Links (Privacy Policy, Contact)
- Copyright

### Animations
- **Scroll Reveal**: Elements fade-in and slide-up on scroll
- **Hover States**: Scale 1.02 on cards, color change on buttons
- **Dark Mode Toggle**: Smooth color transitions
- **Hero Image**: Subtle float animation

## Functionality Specification

### Core Features
1. Dark/Light mode toggle with system preference detection
2. Smooth scroll to sections
3. Responsive layout for all screen sizes
4. Interactive hover states
5. Scroll-triggered animations

### User Interactions
- Click CTA → Could link to waitlist (placeholder #)
- Click nav links → Smooth scroll to sections
- Toggle dark mode → Instant theme switch with transition

### Data Handling
- Theme preference stored in localStorage

## Acceptance Criteria
- [ ] Page loads without errors
- [ ] All sections visible and properly styled
- [ ] Dark mode toggle works correctly
- [ ] Responsive on mobile, tablet, desktop
- [ ] Animations are smooth (60fps)
- [ ] All CTA buttons are visible and clickable
- [ ] Typography is readable on all backgrounds
